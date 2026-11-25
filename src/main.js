import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AssetRegistry } from './core/AssetRegistry.js';
import { PostPipeline } from './core/PostPipeline.js';
import { buildFilmSoundtrack } from './core/FilmSoundtrack.js';
import { AudioMaestro } from './core/AudioMaestro.js';
import { WorldStageManager } from './worlds/WorldStageManager.js';
import { createFullCast } from './actors/CastFactory.js';
import { PowersAndTrapsFX } from './effects/PowersAndTrapsFX.js';
import { FILM_DURATION, ACTS } from './director/StoryboardData.js';
import { FilmDirector } from './director/FilmDirector.js';

const OPEN_DUR = 18;
const END_DUR = 34;
const TOTAL_DUR = OPEN_DUR + FILM_DURATION + END_DUR;
const FILM_END = OPEN_DUR + FILM_DURATION;

function ss(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function modeAt(T) {
  return T < OPEN_DUR ? 'open' : T >= FILM_END ? 'end' : 'film';
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

function toVec3(val, fallback) {
  if (!val) return fallback.clone();
  if (val.isVector3) return val.clone();
  if (Array.isArray(val) && val.length >= 3) {
    return new THREE.Vector3(val[0], val[1], val[2]);
  }
  return fallback.clone();
}

async function bootstrap() {
  const canvas = document.getElementById('webgl-canvas');
  const introCurtain = document.getElementById('intro-curtain');
  const btnStart = document.getElementById('btn-start');
  const loadProgress = document.getElementById('load-progress');
  const actCard = document.getElementById('act-card');
  const actNumeralEl = document.getElementById('act-numeral');
  const actTitleEl = document.getElementById('act-title');
  const actTitleEnEl = document.getElementById('act-title-en');
  const subtitleBar = document.getElementById('subtitle-bar');
  const subtitleZhEl = document.getElementById('subtitle-zh');
  const subtitleEnEl = document.getElementById('subtitle-en');
  const btnPlay = document.getElementById('btn-play');
  const btnCamera = document.getElementById('btn-camera');
  const btnMute = document.getElementById('btn-mute');
  const timelineTrack = document.getElementById('timeline-track');
  const timelineFill = document.getElementById('timeline-fill');
  const timelineThumb = document.getElementById('timeline-thumb');
  const chapterDotsEl = document.getElementById('chapter-dots');
  const timeReadout = document.getElementById('time-readout');

  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';
  const startPaused = params.get('paused') === '1';
  const rawT = parseFloat(params.get('t'));
  const rawG = parseFloat(params.get('g'));
  const exportMode = params.get('export') === '1';
  const initialTime = Number.isFinite(rawG)
    ? clamp(rawG, 0, TOTAL_DUR)
    : Number.isFinite(rawT) ? clamp(rawT, 0, FILM_DURATION) + OPEN_DUR : 0;
  if (exportMode) document.body.classList.add('export-mode');

  if ((autostart || startPaused || exportMode) && introCurtain) {
    introCurtain.classList.add('hidden');
  }
  if (btnStart) {
    btnStart.disabled = true;
  }

  // 1. Renderer, Scene, Camera, OrbitControls
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: exportMode,
    powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    44,
    Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight),
    0.15,
    320
  );
  camera.position.set(0, 6.0, 17.0);

  const orbitControls = new OrbitControls(camera, renderer.domElement);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.maxDistance = 42;
  orbitControls.minDistance = 3.0;
  orbitControls.maxPolarAngle = Math.PI * 0.495;
  orbitControls.enabled = false;

  // 2. Preload Assets
  const assets = new AssetRegistry();
  await assets.loadAll((a, b, c, d) => {
    let ratio = 0;
    if (typeof c === 'number' && typeof d === 'number' && d > 0) {
      ratio = c / d;
    } else if (typeof a === 'number' && typeof b === 'number' && b > 1) {
      ratio = a / b;
    } else if (typeof a === 'number') {
      ratio = a;
    }
    if (loadProgress) {
      loadProgress.style.width = `${clamp(ratio, 0, 1) * 100}%`;
    }
  });
  if (loadProgress) {
    loadProgress.style.width = '100%';
  }

  // 3. Instantiate Core Systems, Worlds, Cast, FX, Post-Processing, Director
  const postPipeline = new PostPipeline(renderer, scene, camera);
  const legacyAudio = !exportMode && params.get('audio') === 'legacy';
  const master = !exportMode && !legacyAudio
    ? buildFilmSoundtrack(TOTAL_DUR, (err) => {
      console.warn('[Huluwa3D] Soundtrack unavailable:', err);
      if (btnMute) {
        btnMute.title = '片源音频不可用 / Soundtrack unavailable';
        btnMute.setAttribute('aria-label', btnMute.title);
      }
    })
    : null;
  const audio = legacyAudio ? new AudioMaestro() : null;
  const audioControls = master ?? audio;
  const worldStage = new WorldStageManager(scene, assets);
  const cast = createFullCast(scene, assets);
  const fx = new PowersAndTrapsFX(scene, assets);
  const director = new FilmDirector({
    camera,
    worldStage,
    cast,
    fx,
    postPipeline,
    audio,
  });

  // Playback & Camera State
  let currentTime = initialTime;
  let playing = false;
  let cameraMode = 'director'; // 'director' | 'orbit'
  let currentAct = ACTS[0];
  let lastFrame = null;
  let lastSubtitleZh = null;
  let lastSubtitleEn = null;
  let lastActId = -1;
  let audioPrewarmed = false;
  let isScrubbing = false;

  if (subtitleBar) {
    subtitleBar.classList.add('hidden');
    subtitleBar.classList.remove('visible');
  }

  const totalFormatted = formatTime(TOTAL_DUR);

  function prewarmAudioLazy() {
    if (!legacyAudio || audioPrewarmed) return;
    audioPrewarmed = true;
    audio.unlock().then((ok) => {
      if (ok) {
        audio.preload(['bgm2', 'bgm3', 'bgm4', 'bgm1', 'sfx04', 'sfx07', 'sfx08']).catch(() => {});
      }
    });
  }

  // 4. Build 9 Interactive Colored Gourd Chapter Dots
  const dotButtons = [];
  if (chapterDotsEl) {
    chapterDotsEl.innerHTML = '';
    for (const act of ACTS) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'chapter-dot';
      dot.style.left = `${((act.start + OPEN_DUR) / TOTAL_DUR) * 100}%`;
      dot.style.backgroundColor = act.color;
      dot.style.color = act.color;
      const dotLabel = act.titleEn
        ? `${act.numeral} · ${act.title} — ${act.titleEn}`
        : `${act.numeral} · ${act.title}`;
      dot.title = dotLabel;
      dot.setAttribute('aria-label', dotLabel);
      dot.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
      });
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        prewarmAudioLazy();
        seek(act.start + OPEN_DUR);
      });
      chapterDotsEl.appendChild(dot);
      dotButtons.push({ act, el: dot });
    }
  }

  function syncUI(frame) {
    if (!frame) return;
    const t = clamp(currentTime, 0, TOTAL_DUR);
    const pct = (t / TOTAL_DUR) * 100;
    syncOverlays(t);

    if (timelineFill) timelineFill.style.width = `${pct}%`;
    if (timelineThumb) timelineThumb.style.left = `${pct}%`;
    if (timelineTrack) timelineTrack.setAttribute('aria-valuenow', String(Math.round(t)));
    if (timeReadout) timeReadout.textContent = `${formatTime(t)} / ${totalFormatted}`;

    const act = frame.act || ACTS.find((a) => t >= a.start && t < a.end) || ACTS[ACTS.length - 1];
    currentAct = act;

    if (act && act.id !== lastActId) {
      lastActId = act.id;
      if (actNumeralEl) actNumeralEl.textContent = act.numeral;
      if (actTitleEl) actTitleEl.textContent = act.title;
      if (actTitleEnEl) actTitleEnEl.textContent = act.titleEn || '';
      for (const item of dotButtons) {
        item.el.classList.toggle('active', item.act.id === act.id);
      }
    }

    // Poetic Act Card visibility driven by actBannerAlpha (fallback 3.2s window at act start)
    if (actCard && act) {
      let alpha = frame.actBannerAlpha;
      if (typeof alpha !== 'number' || Number.isNaN(alpha)) {
        const elapsed = t - act.start;
        if (elapsed >= 0 && elapsed <= 3.2) {
          alpha = elapsed < 0.45 ? elapsed / 0.45 : elapsed > 2.5 ? (3.2 - elapsed) / 0.7 : 1;
        } else {
          alpha = 0;
        }
      }
      alpha = clamp(alpha, 0, 1);
      actCard.classList.toggle('visible', alpha > 0.02);
      actCard.style.opacity = String(alpha);
    }

    // Bilingual Story Caption
    const subZh = frame.subtitle || '';
    const subEn = frame.subtitleEn || '';
    if (subtitleBar && (subZh !== lastSubtitleZh || subEn !== lastSubtitleEn)) {
      lastSubtitleZh = subZh;
      lastSubtitleEn = subEn;
      if (subtitleZhEl) subtitleZhEl.textContent = subZh;
      if (subtitleEnEl) subtitleEnEl.textContent = subEn;
      const hasSubtitle = subZh.length > 0 || subEn.length > 0;
      subtitleBar.classList.toggle('visible', hasSubtitle);
      subtitleBar.classList.toggle('hidden', !hasSubtitle);
    }
  }

  // ---- Global timeline: title sequence -> film -> end credits ----
  let musicMode = null;
  const veilEl = document.getElementById('veil');
  const openingEl = document.getElementById('opening');
  const endingEl = document.getElementById('ending');
  const creditsEl = document.getElementById('credits-roll');
  const endMarkEl = document.getElementById('end-mark');
  const camTmpPos = new THREE.Vector3();
  const camTmpLook = new THREE.Vector3();
  const lerp3 = (out, a, b, e) => out.set(
    a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e);

  function titleCamera(T, mode) {
    if (mode === 'open') {
      const e = ss(0, OPEN_DUR, T);
      lerp3(camTmpPos, [-10, 8.8, 23], [-4.8, 3.65, 13.5], e);
      lerp3(camTmpLook, [2.4, 4.3, -2.65], [-2.0, 1.98, -1.36], e);
      return { pos: camTmpPos, look: camTmpLook, fov: 50 + (44 - 50) * e };
    }
    const e = ss(0, END_DUR, T - FILM_END);
    lerp3(camTmpPos, [195, 7.8, 18], [194.2, 8.8, 22], e);
    lerp3(camTmpLook, [195, 7.2, -1.5], [193.3, 6.4, -1.5], e);
    return { pos: camTmpPos, look: camTmpLook, fov: 46 + (48 - 46) * e };
  }

  function evaluateGlobal(T, { applyCamera = true, playAudio = false } = {}) {
    const mode = modeAt(T);
    if (mode === 'film') {
      return director.evaluate(T - OPEN_DUR, { applyCamera, playAudio });
    }
    const filmT = mode === 'open' ? 0 : T - OPEN_DUR;
    const frame = director.evaluate(filmT, { applyCamera: false, playAudio: false });
    if (mode === 'open') {
      // Empty dawn mountain with the seven glowing gourds on the vine
      cast.resetAll();
      fx.resetAll();
      const m = worldStage.mountain;
      m.setSealCrack(0);
      m.setVineGrowth(1);
      for (let i = 0; i < 7; i++) {
        m.setGourdState(i, {
          visible: true, scale: 1,
          glow: 0.85 + 0.35 * Math.sin(T * 2.2 + i * 0.9),
          cracked: false, darkCorrupted: false,
        });
      }
      worldStage.update(T, 'sanctuary_dawn', 1.2);
      cast.updateAll(T);
      fx.update(T);
    }
    const cam = titleCamera(T, mode);
    if (applyCamera) {
      camera.position.copy(cam.pos);
      camera.lookAt(cam.look);
      if (Math.abs(camera.fov - cam.fov) > 0.01) {
        camera.fov = cam.fov;
        camera.updateProjectionMatrix();
      }
    }
    frame.cameraPos = cam.pos.clone();
    frame.cameraLook = cam.look.clone();
    frame.fov = cam.fov;
    frame.subtitle = '';
    frame.subtitleEn = '';
    frame.actBannerAlpha = 0;
    frame.act = ACTS[mode === 'open' ? 0 : ACTS.length - 1];
    return frame;
  }

  function musicSync(T) {
    const m = modeAt(T);
    if (m === musicMode) return;
    musicMode = m;
    if (m === 'film') {
      director._currentBgmKey = null;
      director._lastActId = -1;
    } else if (m === 'open') {
      audio.setBGM('bgm1', 0.6, 0.74);
    } else {
      audio.setBGM('bgm5', 1.5, 0.74);
    }
  }

  function syncOverlays(T) {
    const mode = modeAt(T);
    if (veilEl) {
      let o = 0;
      if (mode === 'open') o = 1 - ss(0.4, 2.8, T);
      else if (mode === 'end') o = ss(TOTAL_DUR - 3.4, TOTAL_DUR - 0.3, T);
      veilEl.style.background = mode === 'end' ? '#000' : '#f2e8d2';
      veilEl.style.opacity = String(o);
    }
    if (openingEl) {
      const o = mode === 'open' ? ss(1.3, 2.75, T) * (1 - ss(8.6, 10.5, T)) : 0;
      openingEl.style.opacity = String(o);
      openingEl.style.transform = `scale(${1 + 0.05 * Math.min(1, T / OPEN_DUR)})`;
    }
    if (endingEl) {
      const e = T - FILM_END;
      if (mode === 'end') {
        endingEl.style.opacity = String(ss(0.6, 2.2, e));
        endingEl.style.background = `rgba(8,6,4,${0.42 * ss(0.6, 3, e)})`;
        const vh = window.innerHeight;
        const h = creditsEl ? creditsEl.offsetHeight : 600;
        const y = vh - Math.max(0, Math.min(1, (e - 1.1) / 16.6)) * (vh + h);
        if (creditsEl) creditsEl.style.top = `${y}px`;
        if (endMarkEl) endMarkEl.style.opacity = String(ss(18.1, 20.6, e) * (1 - ss(25.8, 29.6, e)));
      } else {
        endingEl.style.opacity = '0';
      }
    }
  }

  function renderFrame() {
    if (cameraMode === 'orbit') {
      orbitControls.update();
    }
    postPipeline.render(currentTime);
  }

  function seek(t) {
    currentTime = clamp(Number(t) || 0, 0, TOTAL_DUR);
    if (master && !master.failed) master.seek(currentTime);
    const applyCamera = cameraMode === 'director';
    const frame = evaluateGlobal(currentTime, { applyCamera, playAudio: false });
    lastFrame = frame;

    // If user jumped to another world while in orbit mode, keep orbit focus sensible
    if (cameraMode === 'orbit' && frame?.cameraLook && frame?.cameraPos) {
      const look = toVec3(frame.cameraLook, orbitControls.target);
      if (orbitControls.target.distanceTo(look) > 25) {
        camera.position.copy(toVec3(frame.cameraPos, camera.position));
        orbitControls.target.copy(look);
        orbitControls.update();
      }
    }

    syncUI(frame);
    renderFrame();
    return frame;
  }

  let playbackRequest = 0;

  function resumeMaster() {
    const request = ++playbackRequest;
    master.play().then((result) => {
      if (result === 'NotAllowedError' && request === playbackRequest) pause();
    });
  }

  function play() {
    if (introCurtain) {
      introCurtain.classList.add('hidden');
    }
    if (currentTime >= TOTAL_DUR - 0.05) {
      seek(0);
    }
    musicMode = null;
    playing = true;
    if (btnPlay) btnPlay.classList.add('is-playing');
    if (master && !master.failed) {
      if (!isScrubbing) resumeMaster();
    } else if (legacyAudio) {
      audio.setPaused(false);
      prewarmAudioLazy();
      musicSync(currentTime);
      if (modeAt(currentTime) === 'film' && currentAct?.bgm) {
        audio.setBGM(currentAct.bgm, 0.8, currentAct.bgmVol ?? 0.5);
      }
    }
  }

  function pause() {
    playbackRequest++;
    playing = false;
    if (btnPlay) btnPlay.classList.remove('is-playing');
    master?.pause();
    audio?.setPaused(true);
  }

  function setCameraMode(mode) {
    const nextMode = mode === 'orbit' ? 'orbit' : 'director';
    if (nextMode === cameraMode) return cameraMode;
    cameraMode = nextMode;

    if (cameraMode === 'orbit') {
      const target = toVec3(lastFrame?.cameraLook, new THREE.Vector3(0, 2, 0));
      orbitControls.target.copy(target);
      orbitControls.enabled = true;
      orbitControls.update();
    } else {
      orbitControls.enabled = false;
      if (lastFrame) {
        const frame = evaluateGlobal(currentTime, { applyCamera: true, playAudio: false });
        lastFrame = frame;
      }
    }

    if (btnCamera) {
      btnCamera.classList.toggle('active', cameraMode === 'orbit');
    }
    renderFrame();
    return cameraMode;
  }

  function toggleMute() {
    if (!audioControls) return;
    const nextMuted = !audioControls.muted;
    audioControls.setMuted(nextMuted);
    if (btnMute) btnMute.classList.toggle('is-muted', nextMuted);
  }

  // 5. Wire UI Controls
  if (btnStart) {
    btnStart.disabled = false;
    btnStart.addEventListener('click', () => {
      play();
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (playing) pause();
      else play();
    });
  }

  if (btnCamera) {
    btnCamera.addEventListener('click', () => {
      setCameraMode(cameraMode === 'director' ? 'orbit' : 'director');
    });
  }

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      toggleMute();
    });
  }

  // Pointer drag + click scrubbing on #timeline-track
  function scrubFromClientX(clientX) {
    if (!timelineTrack) return;
    const rect = timelineTrack.getBoundingClientRect();
    if (rect.width <= 0) return;
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
    seek(ratio * TOTAL_DUR);
  }

  if (timelineTrack) {
    timelineTrack.addEventListener('pointerdown', (e) => {
      isScrubbing = true;
      master?.pause();
      timelineTrack.setPointerCapture(e.pointerId);
      prewarmAudioLazy();
      scrubFromClientX(e.clientX);
    });
    timelineTrack.addEventListener('pointermove', (e) => {
      if (!isScrubbing) return;
      scrubFromClientX(e.clientX);
    });
    const endScrub = (e) => {
      if (!isScrubbing) return;
      isScrubbing = false;
      if (playing && master && !master.failed) resumeMaster();
      try {
        timelineTrack.releasePointerCapture(e.pointerId);
      } catch (_) {
        // Ignore if pointer already released
      }
    };
    timelineTrack.addEventListener('pointerup', endScrub);
    timelineTrack.addEventListener('pointercancel', endScrub);
  }

  // Keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    const tag = e.target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (playing) pause();
      else play();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      seek(currentTime - 5);
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      seek(currentTime + 5);
    } else if (e.code === 'KeyM') {
      e.preventDefault();
      toggleMute();
    } else if (e.code === 'KeyC') {
      e.preventDefault();
      setCameraMode(cameraMode === 'director' ? 'orbit' : 'director');
    } else if (e.code.startsWith('Digit')) {
      const idx = parseInt(e.code.slice(5), 10) - 1;
      if (idx >= 0 && idx < ACTS.length) {
        e.preventDefault();
        if (introCurtain) introCurtain.classList.add('hidden');
        prewarmAudioLazy();
        seek(ACTS[idx].start + OPEN_DUR);
      }
    }
  });

  // Resize handling
  window.addEventListener('resize', () => {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    postPipeline.setSize(w, h);
    renderFrame();
  });

  // 6. Expose Automation / Inspection Handle
  window.__HULUWA_APP__ = {
    seek,
    renderAt: seek,
    TOTAL_DUR,
    OPEN_DUR,
    play,
    pause,
    setCameraMode,
    getState: () => ({
      time: currentTime,
      filmTime: currentTime - OPEN_DUR,
      playing,
      cameraMode,
      audioMode: exportMode ? 'none' : legacyAudio ? 'legacy' : master.failed ? 'silent' : 'master',
      audioTime: master?.currentTime,
      muted: audioControls?.muted,
      act: currentAct,
    }),
    director,
    worldStage,
    cast,
    fx,
    renderer,
    scene,
    camera,
  };

  // Initial deterministic frame evaluation at initialTime
  seek(initialTime);
  if (autostart && !startPaused) {
    play();
  }

  // 7. Main Cinema Loop
  let lastNow = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.1, Math.max(0, (now - lastNow) / 1000));
    lastNow = now;

    if (playing && !isScrubbing) {
      // Drive the picture from the decoded master, including after seek and rebuffer.
      // A sparse render frame can fall behind without accumulating soundtrack drift.
      if (master && !master.failed) currentTime = master.currentTime;
      else currentTime += dt;
      if (currentTime >= TOTAL_DUR) {
        currentTime = TOTAL_DUR;
        const finalFrame = evaluateGlobal(currentTime, {
          applyCamera: cameraMode === 'director',
          playAudio: false,
        });
        lastFrame = finalFrame;
        syncUI(finalFrame);
        pause();
      } else {
        if (legacyAudio) musicSync(currentTime);
        const frame = evaluateGlobal(currentTime, {
          applyCamera: cameraMode === 'director',
          playAudio: legacyAudio,
        });
        lastFrame = frame;
        syncUI(frame);
      }
    } else if (cameraMode === 'orbit') {
      // Keep world subtle shaders / water / glow gently breathing even while inspecting in orbit
      orbitControls.update();
    }

    postPipeline.render(currentTime);
  }

  if (!exportMode) requestAnimationFrame(animate);
}

bootstrap().catch((err) => {
  console.error('[Huluwa3D] Failed to initialize:', err);
});
