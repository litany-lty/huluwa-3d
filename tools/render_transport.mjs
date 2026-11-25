export function openCdp(ws, timeoutMs = 15000) {
  let id = 0;
  let failure;
  const pending = new Map();
  const opened = bounded('CDP socket open', timeoutMs, (finish) => {
    const ok = () => finish();
    const closed = () => finish(new Error('CDP closed before open.'));
    const failed = () => finish(new Error('CDP socket failed to open.'));
    ws.addEventListener('open', ok);
    ws.addEventListener('close', closed);
    ws.addEventListener('error', failed);
    return () => {
      ws.removeEventListener('open', ok);
      ws.removeEventListener('close', closed);
      ws.removeEventListener('error', failed);
    };
  });
  const fail = (message) => {
    failure ??= new Error(message);
    for (const finish of pending.values()) finish(failure);
  };
  ws.addEventListener('close', () => fail('CDP socket closed.'));
  ws.addEventListener('error', () => fail('CDP socket failed.'));
  ws.addEventListener('message', (msg) => {
    let d;
    try { d = JSON.parse(msg.data); }
    catch { fail('CDP sent an invalid response.'); return; }
    pending.get(d.id)?.(d.error ? new Error(JSON.stringify(d.error)) : null, d.result);
  });
  return {
    opened,
    send(method, params = {}) {
      if (failure) return Promise.reject(failure);
      const request = ++id;
      return bounded(method, timeoutMs, (finish) => {
        pending.set(request, finish);
        try { ws.send(JSON.stringify({ id: request, method, params })); }
        catch (err) { queueMicrotask(() => finish(err)); }
        return () => pending.delete(request);
      });
    },
  };
}

function bounded(label, ms, attach) {
  return new Promise((resolve, reject) => {
    const finish = (error, value) => {
      clearTimeout(timer);
      cleanup();
      if (error) reject(error);
      else resolve(value);
    };
    const timer = setTimeout(() => finish(new Error(`${label} timed out.`)), ms);
    const cleanup = attach(finish);
  });
}

export function watchChild(child, label) {
  let failure;
  let finished = false;
  const done = new Promise((resolve) => {
    child.once('error', (err) => { failure ??= err; resolve(); });
    child.once('close', (code, signal) => {
      finished = true;
      if (code !== 0) failure ??= new Error(`${label} exited (${code ?? signal}).`);
      resolve();
    });
  });
  child.stdin?.on('error', (err) => { failure ??= err; });
  return {
    async finish(timeoutMs = 120000) {
      await bounded(label, timeoutMs, (finish) => {
        let listening = true;
        done.then(() => { if (listening) finish(failure); });
        return () => { listening = false; };
      });
    },
    async write(frame, timeoutMs = 30000) {
      if (failure) throw failure;
      if (finished || child.exitCode !== null || child.signalCode !== null || !child.stdin?.writable) {
        throw new Error(`${label} closed before receiving all frames.`);
      }
      if (child.stdin.write(frame)) return;
      await bounded(label, timeoutMs, (finish) => {
        const ok = () => finish();
        const interrupted = () => finish(failure ?? new Error(`${label} closed while writing a frame.`));
        child.stdin.once('drain', ok);
        child.stdin.once('error', interrupted);
        child.stdin.once('close', interrupted);
        child.once('close', interrupted);
        child.once('error', interrupted);
        return () => {
          child.stdin.off('drain', ok);
          child.stdin.off('error', interrupted);
          child.stdin.off('close', interrupted);
          child.off('close', interrupted);
          child.off('error', interrupted);
        };
      });
    },
  };
}
