// Offline deterministic renderer: drives Chrome over CDP (no dependencies), pipes frames to ffmpeg.
// Requires: Chrome, ffmpeg, and a static server on :8765 (python3 -m http.server 8765)
// Usage: node tools/render_film.mjs --out exports/film.mp4 [--from 0 --to 292] [--fps 24] [--w 1280] [--h 720]
//        node tools/render_film.mjs --shots 6,270 --shotdir exports/shots     (screenshots only)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { DEFAULT_MASTER, frameRange, muxArgs, checkMaster } from './film_mux.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 24), W = +arg('w', 1280), H = +arg('h', 720);
const OUT = arg('out', 'exports/film_video.mp4');
const VIDEO_ONLY = process.argv.includes('--video-only');
const AUDIO = arg('audio', DEFAULT_MASTER);
if (VIDEO_ONLY && process.argv.includes('--audio')) throw new Error('Choose --video-only or --audio.');
const SHOTS = arg('shots', '');
const SHOTDIR = arg('shotdir', 'exports/shots');
const FROM = +arg('from', 0);
const BASE = arg('base', 'http://127.0.0.1:8765/');
const CHROME = process.env.CHROME_PATH || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'chromium');
const PORT = +arg('cdp-port', 0);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'huluwa-chrome-'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  ...(process.platform === 'darwin' ? ['--use-angle=metal'] : ['--enable-unsafe-swiftshader']), '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--hide-scrollbars',
  '--mute-audio', `--window-size=${W},${H}`, 'about:blank',
], { stdio: 'ignore' });
let chromeError;
chrome.on('error', (err) => { chromeError = err; });
async function closeBrowser() {
  if (chrome.exitCode === null && chrome.signalCode === null && !chromeError) {
    const done = once(chrome, 'close');
    chrome.kill();
    await done;
  }
  fs.rmSync(profile, { recursive: true, force: true });
}
process.on('exit', () => {
  if (chrome.exitCode === null && chrome.signalCode === null) chrome.kill();
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
});

async function waitJson() {
  for (let i = 0; i < 100; i++) {
    if (chromeError) throw chromeError;
    if (chrome.exitCode !== null || chrome.signalCode !== null) {
      throw new Error(`Chrome exited before CDP started (${chrome.exitCode ?? chrome.signalCode}).`);
    }
    try {
      const port = PORT || +fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      const r = await fetch(`http://127.0.0.1:${port}/json/list`);
      const l = await r.json();
      const p = l.find((x) => x.type === 'page');
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error('chrome did not start');
}
const ws = new WebSocket(await waitJson());
await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, (d) => (d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evalJs = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result?.value;
};

await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
await send('Page.navigate', { url: `${BASE}?export=1&v=${Date.now()}` });
for (let i = 0; i < 300; i++) {
  if (await evalJs('!!(window.__HULUWA_APP__ && window.__HULUWA_APP__.TOTAL_DUR)')) break;
  await sleep(300);
}
const TOTAL = await evalJs('window.__HULUWA_APP__.TOTAL_DUR');
if (!Number.isFinite(TOTAL)) throw new Error('Film app failed to boot.');
console.log('app ready, total', TOTAL, 's');
await sleep(1500);

const shot = async (q = 92) => Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: q })).data, 'base64');

if (SHOTS) {
  fs.mkdirSync(SHOTDIR, { recursive: true });
  for (const t of SHOTS.split(',').map(Number)) {
    // sequential warm-up so mood smoothing matches the render path
    await evalJs(`window.__HULUWA_APP__.renderAt(${Math.max(0, t - 0.5)}), 1`);
    await evalJs(`window.__HULUWA_APP__.renderAt(${t}), 1`);
    fs.writeFileSync(`${SHOTDIR}/t${t}.jpg`, await shot());
    console.log('shot', t);
  }
  ws.close();
  await closeBrowser();
  process.exit(0);
}

const bounds = frameRange(FROM, +arg('to', TOTAL), FPS, TOTAL);
const sr = VIDEO_ONLY ? null : checkMaster(AUDIO, TOTAL);
if (!OUT.endsWith('.mp4')) throw new Error('--out must use an .mp4 suffix.');
fs.mkdirSync(path.dirname(OUT), { recursive: true });
const VIDEO = VIDEO_ONLY ? OUT : OUT.replace(/\.mp4$/, '_video.mp4');
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), VIDEO], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = once(ff, 'close');
const frames = bounds.end;
const t0 = Date.now();
for (let f = bounds.start; f < frames; f++) {
  await evalJs(`window.__HULUWA_APP__.renderAt(${(f / FPS).toFixed(4)}), 1`);
  const buf = await shot();
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % 120 === 0) {
    const el = (Date.now() - t0) / 1000, done = f - bounds.start + 1;
    console.log(`frame ${f}/${frames}  ${(f / FPS).toFixed(1)}s  elapsed ${el.toFixed(0)}s  eta ${(el / done * (frames - f) / 60).toFixed(1)}min`);
  }
}
ff.stdin.end();
const [encodeStatus] = await ffDone;
if (encodeStatus !== 0) throw new Error(`Video encoding failed (${encodeStatus}).`);
if (!VIDEO_ONLY) {
  const mux = spawn('ffmpeg', muxArgs(VIDEO, AUDIO, OUT, bounds, FPS, sr), { stdio: 'inherit' });
  const [muxStatus] = await once(mux, 'close');
  if (muxStatus !== 0) throw new Error(`Audio mux failed (${muxStatus}).`);
}
console.log(VIDEO_ONLY ? 'done (video only) ->' : 'done ->', OUT);
ws.close();
await closeBrowser();
process.exit(0);
