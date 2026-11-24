import { ASSET_PATHS } from './AssetRegistry.js';

const SFX_DEBOUNCE_MS = 140;

export class AudioMaestro {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    this.muted = false;
    this.paused = false;
    this.masterVolume = 1.0;

    this._buffers = new Map();
    this._loading = new Map();
    this._lastSfxPlayedAt = new Map();

    this._currentBgmKey = null;
    this._currentBgmSource = null;
    this._currentBgmGain = null;
    this._pendingBgm = null;
    this._bgmRequestId = 0;
  }

  _ensureContext() {
    if (this.ctx) return this.ctx;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    const bgmGain = ctx.createGain();
    const sfxGain = ctx.createGain();

    masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    bgmGain.gain.value = 1.0;
    sfxGain.gain.value = 1.0;

    bgmGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.bgmGain = bgmGain;
    this.sfxGain = sfxGain;
    return ctx;
  }

  async unlock() {
    const ctx = this._ensureContext();
    if (!ctx) return false;

    try {
      if (ctx.state === 'suspended' && !this.paused) {
        await ctx.resume();
      }
    } catch (err) {
      console.warn('[AudioMaestro] AudioContext resume deferred:', err);
      return false;
    }

    if (this._pendingBgm && !this.paused) {
      const { bgmKey, fadeSec, vol } = this._pendingBgm;
      this._pendingBgm = null;
      this.setBGM(bgmKey, fadeSec, vol);
    }

    return ctx.state === 'running';
  }

  async _loadBuffer(key) {
    if (this._buffers.has(key)) return this._buffers.get(key);
    if (this._loading.has(key)) return this._loading.get(key);

    const rawPath = ASSET_PATHS[key];
    if (!rawPath) return null;

    const ctx = this._ensureContext();
    if (!ctx) return null;

    const url = encodeURI(rawPath);
    const promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((arr) => ctx.decodeAudioData(arr))
      .then((buffer) => {
        this._buffers.set(key, buffer);
        this._loading.delete(key);
        return buffer;
      })
      .catch((err) => {
        console.warn(`[AudioMaestro] Failed to load audio "${key}" (${url}):`, err);
        this._loading.delete(key);
        return null;
      });

    this._loading.set(key, promise);
    return promise;
  }

  preload(keys = []) {
    return Promise.all(keys.map((k) => this._loadBuffer(k)));
  }

  async setBGM(bgmKey, fadeSec = 1.2, vol = 0.5) {
    const requestId = ++this._bgmRequestId;
    const safeFade = Math.max(0.05, fadeSec);
    const targetVol = Math.max(0.0001, Math.min(1.0, vol));

    if (!bgmKey) {
      this._pendingBgm = null;
      this._fadeOutCurrentBgm(safeFade);
      this._currentBgmKey = null;
      return;
    }

    // Defer until user gesture unlocks AudioContext
    if (!this.ctx || this.ctx.state !== 'running') {
      this._pendingBgm = { bgmKey, fadeSec: safeFade, vol: targetVol };
      // Start fetching in the background if context exists
      if (this.ctx) this._loadBuffer(bgmKey);
      return;
    }

    // Already playing the requested track: smoothly adjust volume if needed
    if (bgmKey === this._currentBgmKey && this._currentBgmSource && this._currentBgmGain) {
      const now = this.ctx.currentTime;
      this._currentBgmGain.gain.cancelScheduledValues(now);
      this._currentBgmGain.gain.setValueAtTime(
        Math.max(0.0001, this._currentBgmGain.gain.value),
        now
      );
      this._currentBgmGain.gain.linearRampToValueAtTime(targetVol, now + Math.min(safeFade, 0.5));
      return;
    }

    const buffer = await this._loadBuffer(bgmKey);
    // Abort if superseded by a newer setBGM call while decoding
    if (requestId !== this._bgmRequestId || !buffer || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Crossfade out previous BGM track
    this._fadeOutCurrentBgm(safeFade);

    // Start new looping BGM track
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const trackGain = this.ctx.createGain();
    trackGain.gain.setValueAtTime(0.0001, now);
    trackGain.gain.linearRampToValueAtTime(targetVol, now + safeFade);

    source.connect(trackGain);
    trackGain.connect(this.bgmGain);
    source.start(now);

    this._currentBgmKey = bgmKey;
    this._currentBgmSource = source;
    this._currentBgmGain = trackGain;
  }

  _fadeOutCurrentBgm(fadeSec) {
    if (!this.ctx || !this._currentBgmSource || !this._currentBgmGain) return;

    const oldSource = this._currentBgmSource;
    const oldGain = this._currentBgmGain;
    this._currentBgmSource = null;
    this._currentBgmGain = null;

    const now = this.ctx.currentTime;
    try {
      oldGain.gain.cancelScheduledValues(now);
      oldGain.gain.setValueAtTime(Math.max(0.0001, oldGain.gain.value), now);
      oldGain.gain.linearRampToValueAtTime(0.0001, now + fadeSec);
      oldSource.stop(now + fadeSec + 0.05);
      oldSource.onended = () => {
        try {
          oldSource.disconnect();
          oldGain.disconnect();
        } catch (_) {
          // Ignore already disconnected nodes
        }
      };
    } catch (_) {
      // Ignore already stopped sources
    }
  }

  async playSFX(sfxKey, vol = 0.8, rate = 1.0) {
    if (!sfxKey || this.muted || this.paused) return;
    if (!this.ctx || this.ctx.state !== 'running') return;

    const nowMs = performance.now();
    const lastMs = this._lastSfxPlayedAt.get(sfxKey) ?? -Infinity;
    if (nowMs - lastMs < SFX_DEBOUNCE_MS) return;
    this._lastSfxPlayedAt.set(sfxKey, nowMs);

    const buffer = await this._loadBuffer(sfxKey);
    if (!buffer || !this.ctx || this.ctx.state !== 'running' || this.muted || this.paused) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = Math.max(0.25, Math.min(4.0, rate));

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(2.0, vol));

    source.connect(gainNode);
    gainNode.connect(this.sfxGain);

    source.onended = () => {
      try {
        source.disconnect();
        gainNode.disconnect();
      } catch (_) {
        // Ignore cleanup errors
      }
    };

    source.start(this.ctx.currentTime);
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (!this.ctx) return;

    if (this.paused) {
      if (this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } else {
      if (this.ctx.state === 'suspended') {
        this.ctx
          .resume()
          .then(() => {
            if (this._pendingBgm && !this.paused) {
              const { bgmKey, fadeSec, vol } = this._pendingBgm;
              this._pendingBgm = null;
              this.setBGM(bgmKey, fadeSec, vol);
            }
          })
          .catch(() => {});
      }
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const target = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.025);
  }

  setMasterVolume(vol) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (!this.ctx || !this.masterGain || this.muted) return;

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(this.masterVolume, now, 0.025);
  }

  dispose() {
    this._bgmRequestId += 1;
    this._fadeOutCurrentBgm(0.05);
    this._pendingBgm = null;
    this._currentBgmKey = null;
    this._buffers.clear();
    this._loading.clear();
    this._lastSfxPlayedAt.clear();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
