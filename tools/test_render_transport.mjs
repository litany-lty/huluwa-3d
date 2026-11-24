import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';
import { openCdp, watchChild } from './render_transport.mjs';

class FakeSocket extends EventTarget {
  send(data) { this.request = JSON.parse(data); }
}

test('CDP settles responses and rejects pending and new requests on close', async () => {
  const ws = new FakeSocket();
  const { opened, send } = openCdp(ws);
  ws.dispatchEvent(new Event('open'));
  await opened;
  const ready = send('Runtime.evaluate', { expression: '1' });
  ws.dispatchEvent(new MessageEvent('message', { data: JSON.stringify({ id: ws.request.id, result: 1 }) }));
  assert.equal(await ready, 1);
  const screenshot = send('Page.captureScreenshot');
  ws.dispatchEvent(new Event('close'));
  await assert.rejects(screenshot, /closed/);
  await assert.rejects(send('Page.captureScreenshot'), /closed/);
});

test('CDP open and unanswered requests each have a deadline', async () => {
  await assert.rejects(openCdp(new FakeSocket(), 12).opened, /socket open timed out/);
  const ws = new FakeSocket();
  const { opened, send } = openCdp(ws, 12);
  ws.dispatchEvent(new Event('open'));
  await opened;
  await assert.rejects(send('Page.captureScreenshot'), /captureScreenshot timed out/);
});

function fakeChild() {
  const child = Object.assign(new EventEmitter(), { exitCode: null, signalCode: null });
  child.stdin = Object.assign(new EventEmitter(), { writable: true, write: () => false });
  return child;
}

test('encoder drain, timeout, and child exit while backpressured', async () => {
  const child = fakeChild();
  const encoder = watchChild(child, 'Encoder');
  const frame = encoder.write(Buffer.alloc(1));
  child.stdin.emit('drain');
  await frame;
  assert.equal(child.listenerCount('close'), 1);
  await assert.rejects(encoder.write(Buffer.alloc(1), 12), /timed out/);
  const blocked = encoder.write(Buffer.alloc(1));
  child.exitCode = 3;
  child.emit('close', 3, null);
  await assert.rejects(blocked, /exited \(3\)/);
  await assert.rejects(encoder.finish(), /exited \(3\)/);
  await assert.rejects(encoder.write(Buffer.alloc(1)), /exited \(3\)/);
});
