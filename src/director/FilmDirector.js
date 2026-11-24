import * as THREE from 'three';
import {
  FILM_DURATION,
  ACTS,
  CAMERA_SHOTS,
  SUBTITLES,
  SFX_CUES,
} from './StoryboardData.js';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function invLerp(a, b, v) {
  if (b === a) return v >= b ? 1 : 0;
  return clamp01((v - a) / (b - a));
}

function smoothstep(edge0, edge1, x) {
  const t = invLerp(edge0, edge1, x);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  const c = clamp01(t);
  return 1 - Math.pow(1 - c, 3);
}

function easeInOutQuad(t) {
  const c = clamp01(t);
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

function pulseBell(t, peakT, halfWidth) {
  const d = Math.abs(t - peakT);
  if (d >= halfWidth) return 0;
  const u = 1 - d / halfWidth;
  return u * u * (3 - 2 * u);
}

const CINEMA_MOODS = {
  sanctuary_dawn: { warmth: 0.18, vignette: 0.30, saturation: 1.12, bloomStr: 0.46, bloomThr: 0.78 },
  seal_storm:     { warmth: -0.06, vignette: 0.48, saturation: 1.04, bloomStr: 0.62, bloomThr: 0.70 },
  mire_miasma:    { warmth: 0.02, vignette: 0.44, saturation: 0.98, bloomStr: 0.50, bloomThr: 0.74 },
  dream_crimson:  { warmth: 0.14, vignette: 0.50, saturation: 1.18, bloomStr: 0.64, bloomThr: 0.68 },
  palace_amethyst:{ warmth: 0.02, vignette: 0.44, saturation: 1.16, bloomStr: 0.40, bloomThr: 0.78 },
  alchemy_inferno:{ warmth: 0.28, vignette: 0.46, saturation: 1.20, bloomStr: 0.68, bloomThr: 0.66 },
  apotheosis_gold:{ warmth: 0.22, vignette: 0.26, saturation: 1.16, bloomStr: 0.26, bloomThr: 0.86 },
};

export class FilmDirector {
  constructor({ camera, worldStage, cast, fx, postPipeline, audio } = {}) {
    this.camera = camera ?? null;
    this.worldStage = worldStage ?? null;
    this.cast = cast ?? null;
    this.fx = fx ?? null;
    this.postPipeline = postPipeline ?? null;
    this.audio = audio ?? null;

    this._prevT = -0.001;
    this._currentBgmKey = null;
    this._lastActId = -1;

    this._camPos = new THREE.Vector3();
    this._camLook = new THREE.Vector3();
    this._tmpVecA = new THREE.Vector3();
    this._tmpVecB = new THREE.Vector3();
  }

  _findAct(t) {
    for (let i = 0; i < ACTS.length; i++) {
      const a = ACTS[i];
      if (t >= a.start && t < a.end) return a;
    }
    return ACTS[ACTS.length - 1];
  }

  _findShot(t) {
    for (let i = 0; i < CAMERA_SHOTS.length; i++) {
      const s = CAMERA_SHOTS[i];
      if (t >= s.start && t < s.end) return s;
    }
    return CAMERA_SHOTS[CAMERA_SHOTS.length - 1];
  }

  _findSubtitleEntry(t) {
    for (let i = 0; i < SUBTITLES.length; i++) {
      const sub = SUBTITLES[i];
      if (t >= sub.start && t <= sub.end) return sub;
    }
    return null;
  }

  _findSubtitle(t) {
    const entry = this._findSubtitleEntry(t);
    return entry ? entry.text : '';
  }

  _computeActBannerAlpha(t, act) {
    const local = t - act.start;
    if (local < 0 || local > 3.5) return 0;
    const fadeIn = smoothstep(0.05, 0.55, local);
    const fadeOut = 1.0 - smoothstep(2.6, 3.45, local);
    return fadeIn * fadeOut;
  }

  _evaluateCamera(t) {
    const shot = this._findShot(t);
    const rawU = invLerp(shot.start, shot.end, t);
    // Blend gentle smoothstep with linear so cuts keep forward cinematic momentum
    const easedU = rawU * 0.35 + easeInOutQuad(rawU) * 0.65;

    this._camPos.set(
      lerp(shot.fromPos[0], shot.toPos[0], easedU),
      lerp(shot.fromPos[1], shot.toPos[1], easedU),
      lerp(shot.fromPos[2], shot.toPos[2], easedU)
    );
    this._camLook.set(
      lerp(shot.fromLook[0], shot.toLook[0], easedU),
      lerp(shot.fromLook[1], shot.toLook[1], easedU),
      lerp(shot.fromLook[2], shot.toLook[2], easedU)
    );
    const fov = lerp(shot.fovFrom ?? 42, shot.fovTo ?? 42, easedU);

    if (shot.shake && shot.shake > 0.001) {
      // Envelope peaks in mid-shot so cuts don't jump awkwardly
      const env = Math.sin(rawU * Math.PI);
      const amp = shot.shake * (0.35 + 0.65 * env);
      const sx = (Math.sin(t * 37.3) * 0.65 + Math.sin(t * 61.7) * 0.35) * amp * 0.45;
      const sy = (Math.cos(t * 43.1) * 0.65 + Math.sin(t * 71.3) * 0.35) * amp * 0.38;
      this._camPos.x += sx;
      this._camPos.y += sy;
      this._camLook.x += sx * 0.35;
      this._camLook.y += sy * 0.35;
    }

    return { pos: this._camPos, look: this._camLook, fov };
  }

  _resetWorldBaselines() {
    const ws = this.worldStage;
    if (!ws) return;

    // World 0: MountainSanctuary baseline
    if (ws.mountain) {
      ws.mountain.setSealCrack(0);
      ws.mountain.setVineGrowth(1);
      for (let i = 0; i < 7; i++) {
        ws.mountain.setGourdState(i, {
          visible: false,
          scale: 1,
          glow: 0.35,
          cracked: false,
          darkCorrupted: false,
        });
      }
    }

    // World 1: MistMireCanyon baseline
    if (ws.canyon) {
      ws.canyon.setMireActivity(0.45);
      ws.canyon.setDreamIllusion(0);
    }

    // World 2: CrystalPalace baseline
    if (ws.palace) {
      ws.palace.setDoorOpen(0);
      ws.palace.setGrandpaWeb(false);
      ws.palace.setWineBowl({ active: false, swirl: 0 });
      ws.palace.setIcePrism({ active: false, shatter: 0 });
      ws.palace.setMirror({ active: true, beam: 0, shattered: 0 });
      ws.palace.setRuyiOnCouch(true);
    }

    // World 3: AlchemyCorePeak baseline
    if (ws.alchemy) {
      ws.alchemy.setCauldron({ fire: 0.4, lidOpen: 0, shattered: 0 });
      ws.alchemy.setSealMountain(0);
    }
  }

  seek(t, { applyCamera = true } = {}) {
    const clampedT = Math.max(0, Math.min(FILM_DURATION + 90, Number(t) || 0));
    this._prevT = clampedT;
    return this.evaluate(clampedT, { applyCamera, playAudio: false });
  }

  evaluate(t, { applyCamera = true, playAudio = true } = {}) {
    const clampedT = Math.max(0, Math.min(FILM_DURATION + 90, Number(t) || 0));
    const act = this._findAct(clampedT);
    const subtitleEntry = this._findSubtitleEntry(clampedT);
    const subtitle = subtitleEntry ? subtitleEntry.text : '';
    const subtitleEn = subtitleEntry ? (subtitleEntry.en || '') : '';
    const actBannerAlpha = this._computeActBannerAlpha(clampedT, act);
    const cam = this._evaluateCamera(clampedT);

    // 1. Deterministic full reset
    this.cast?.resetAll?.();
    this.fx?.resetAll?.();
    this._resetWorldBaselines();

    // 2. Act-specific choreography (returns optional mood override & flash level)
    let activeMood = act.mood;
    let flash = 0;

    const actors = this.cast?.actors ?? {};
    const fx = this.fx;
    const ws = this.worldStage;

    switch (act.id) {
      case 1: {
        const res = this._choreographAct1(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 2: {
        const res = this._choreographAct2(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 3: {
        const res = this._choreographAct3(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 4: {
        const res = this._choreographAct4(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 5: {
        const res = this._choreographAct5(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 6: {
        const res = this._choreographAct6(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 7: {
        const res = this._choreographAct7(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 8: {
        const res = this._choreographAct8(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
      case 9:
      default: {
        const res = this._choreographAct9(clampedT, actors, fx, ws);
        if (res.mood) activeMood = res.mood;
        flash = res.flash ?? 0;
        break;
      }
    }

    // 3. Apply camera transform
    if (applyCamera && this.camera) {
      this.camera.position.copy(cam.pos);
      this.camera.lookAt(cam.look);
      if (Math.abs(this.camera.fov - cam.fov) > 0.01) {
        this.camera.fov = cam.fov;
        this.camera.updateProjectionMatrix();
      }
    }

    // 4. Advance stage, cast, FX & cinematic post-processing
    ws?.update?.(clampedT, activeMood, cam.look.x);
    this.cast?.updateAll?.(clampedT);
    fx?.update?.(clampedT);

    if (this.postPipeline) {
      const m = CINEMA_MOODS[activeMood] ?? CINEMA_MOODS.sanctuary_dawn;
      this.postPipeline.setCinemaMood({
        warmth: m.warmth,
        vignette: m.vignette,
        saturation: m.saturation,
        flash,
      });
      this.postPipeline.setBloom(m.bloomStr, m.bloomThr);
    }

    // 5. Audio BGM & SFX cues
    if (playAudio && this.audio) {
      if (act.bgm !== this._currentBgmKey || act.id !== this._lastActId) {
        this._currentBgmKey = act.bgm;
        this._lastActId = act.id;
        this.audio.setBGM(act.bgm, 1.2, act.bgmVol ?? 0.5);
      }

      const delta = clampedT - this._prevT;
      if (delta > 0 && delta < 1.2) {
        for (let i = 0; i < SFX_CUES.length; i++) {
          const cue = SFX_CUES[i];
          if (this._prevT < cue.time && cue.time <= clampedT) {
            this.audio.playSFX(cue.sfx, cue.vol ?? 0.8, cue.rate ?? 1.0);
          }
        }
      }
    }
    this._prevT = clampedT;

    return {
      time: clampedT,
      act,
      actBannerAlpha,
      subtitle,
      subtitleEn,
      cameraPos: cam.pos.clone(),
      cameraLook: cam.look.clone(),
      fov: cam.fov,
    };
  }

  // =========================================================================
  // ACT 1 (0..26s): 神峰惊变·仙藤结子 (World 0, x = 0)
  // =========================================================================
  _choreographAct1(t, actors, fx, ws) {
    const m = ws?.mountain;
    let mood = 'sanctuary_dawn';
    let flash = 0;

    if (t < 5.5) {
      // Peaceful mountain sanctuary opening
      m?.setVineGrowth(0.12);
      const u = invLerp(0, 5.5, t);
      actors.grandpa?.setVisible(true).setPosition(lerp(-4.8, -3.5, u), 0, -1.4).setFacing(1).setPose('walk');
      actors.pangolin?.setVisible(true).setPosition(lerp(3.5, 7.6, u), lerp(0, 1.8, u), -2.4).setFacing(1).setPose('run');
    } else if (t < 11.5) {
      // Pangolin drills cliff fissure -> Seal cracks -> Scorpion & Snake escape!
      mood = 'seal_storm';
      const crackP = smoothstep(5.8, 8.6, t);
      m?.setSealCrack(crackP);
      m?.setVineGrowth(0.12);

      const stormInt = smoothstep(6.0, 7.4, t) * (1.0 - smoothstep(10.6, 11.5, t));
      fx?.setSealStorm({ pos: [8.5, 3.2, -3.2], intensity: stormInt });
      flash = pulseBell(t, 6.5, 0.16) * 0.11;

      if (t < 7.2) {
        actors.pangolin?.setVisible(true).setPosition(7.8, 2.2, -2.5).setFacing(1).setPose('attack');
      } else {
        const recoil = easeOutCubic(invLerp(7.2, 10.2, t));
        actors.pangolin?.setVisible(true)
          .setPosition(lerp(7.8, 5.6, recoil), lerp(2.2, 0.2, recoil), lerp(-2.5, -1.6, recoil))
          .setFacing(-1)
          .setPose('struggle');
      }

      if (t >= 7.2) {
        const esc = easeOutCubic(invLerp(7.2, 11.5, t));
        actors.scorpion?.setVisible(true)
          .setPosition(lerp(8.5, 4.4, esc), lerp(2.6, 4.6, esc), lerp(-3.3, -1.4, esc))
          .setFacing(-1)
          .setPose('attack');
        actors.snake?.setVisible(true)
          .setPosition(lerp(8.7, 5.8, esc), lerp(2.3, 4.2, esc), lerp(-3.1, -1.2, esc))
          .setFacing(-1)
          .setPose('cast');
      }
    } else if (t < 16.0) {
      // Grandpa rescues Pangolin near cottage & plants sacred seed at pergola
      m?.setSealCrack(0.85);
      const u = invLerp(11.5, 16.0, t);
      const reach = smoothstep(12.5, 13.2, t) * (1 - smoothstep(13.45, 14, t));
      const plant = smoothstep(14.6, 15.4, t);
      m?.setVineGrowth(lerp(0.12, 0.42, smoothstep(13.8, 16.0, t)));

      actors.grandpa?.setVisible(true)
        .setPosition(lerp(-4.4, -0.8, easeInOutQuad(u)), 0, lerp(-1.5, 1.45, u))
        .setFacing(1)
        .setPose(reach > 0.25 || plant > 0.25 ? 'idle' : 'walk')
        .setPhysicalBeat({ lean: 0.22 * reach + 0.29 * plant, crouch: 0.10 * reach + 0.16 * plant, still: Math.max(reach, plant) * 0.85 });
      actors.pangolin?.setVisible(true)
        .setPosition(lerp(-3.0, -2.2, easeInOutQuad(u)), 0, lerp(-0.65, 1.9, u))
        .setFacing(1)
        .setPose(u < 0.75 ? 'walk' : 'idle');
    } else if (t < 21.5) {
      // Calabash vine bursts into bloom & 7 glowing gourds appear in cascade
      m?.setSealCrack(0.7);
      const vineP = smoothstep(16.0, 18.0, t);
      m?.setVineGrowth(lerp(0.42, 1.0, vineP));

      for (let i = 0; i < 7; i++) {
        const gStart = 17.0 + i * 0.45;
        const gp = easeOutCubic(invLerp(gStart, gStart + 0.9, t));
        m?.setGourdState(i, {
          visible: gp > 0.02,
          scale: gp,
          glow: 0.35 + gp * 0.95,
          cracked: false,
          darkCorrupted: false,
        });
      }

      actors.grandpa?.setVisible(true).setPosition(-1.3, 0, 1.45).setFacing(1).setPose('heroic');
      actors.pangolin?.setVisible(true).setPosition(-2.6, 0, 1.45).setFacing(1).setPose('idle');
    } else {
      // 21.5..26s: Scorpion swoops in with spiderweb snare abducting Grandpa!
      mood = 'seal_storm';
      m?.setSealCrack(0.9);
      m?.setVineGrowth(1.0);
      for (let i = 0; i < 7; i++) {
        m?.setGourdState(i, { visible: true, scale: 1, glow: 0.65 });
      }

      const u = invLerp(21.5, 26.0, t);
      const swoopX = lerp(5.4, 2.2, smoothstep(0, 0.45, u)) + lerp(0, 3.8, smoothstep(0.55, 1.0, u));
      const swoopY = lerp(4.8, 2.8, smoothstep(0, 0.45, u)) + lerp(0, 2.4, smoothstep(0.55, 1.0, u));
      actors.scorpion?.setVisible(true).setPosition(swoopX, swoopY, -1.0).setFacing(-1).setPose('attack');

      const webP = smoothstep(22.2, 23.8, t);
      const liftP = easeInOutQuad(invLerp(23.6, 26.0, t));
      const gx = lerp(-1.5, 3.4, liftP);
      const gy = lerp(0.0, 3.8, liftP);
      const gz = lerp(1.45, -1.2, liftP);
      actors.grandpa?.setVisible(true)
        .setPosition(gx, gy, gz)
        .setFacing(1)
        .setPose(webP > 0.4 ? 'bound' : 'struggle');

      actors.pangolin?.setVisible(true)
        .setPosition(lerp(-2.8, -0.3, u), 0, 1.45)
        .setFacing(1)
        .setPose('run');

      fx?.setSealStorm({
        pos: [swoopX, swoopY + 1.0, -1.2],
        intensity: 0.85,
        webFrom: [swoopX - 0.6, swoopY + 1.2, -0.8],
        webTo: [gx, gy + 1.3, gz],
        webProgress: webP,
      });
    }

    return { mood, flash };
  }

  // =========================================================================
  // ACT 2 (26..52s): 力拔山兮·误入泥潭【大娃】 (World 0 -> World 1)
  // =========================================================================
  _choreographAct2(t, actors, fx, ws) {
    const m = ws?.mountain;
    const c = ws?.canyon;
    let mood = t < 37.5 ? 'sanctuary_dawn' : 'mire_miasma';
    let flash = 0;

    if (t < 37.5) {
      // World 0: Red gourd cracks, Dawa grows giant 3.0x & smashes boulder into demon squad!
      m?.setVineGrowth(1.0);
      const hatched = t >= 27.6;
      m?.setGourdState(0, {
        visible: !hatched,
        scale: hatched ? 0 : 1.0 + smoothstep(26.0, 27.5, t) * 0.25,
        glow: 1.5,
        cracked: t >= 26.3,
      });
      for (let i = 1; i < 7; i++) {
        m?.setGourdState(i, { visible: true, scale: 1, glow: 0.55 });
      }

      if (t < 31.0) {
        if (hatched) {
          const drop = easeOutCubic(invLerp(27.6, 28.8, t));
          const grow = smoothstep(28.8, 30.8, t);
          const gPos = m ? m.getGourdWorldPos(0, this._tmpVecA) : this._tmpVecA.set(-0.7, 2.8, 0.5);
          actors.dawa?.setVisible(true)
            .setPosition(lerp(gPos.x, 0.8, drop), lerp(gPos.y - 0.6, 0, drop), lerp(gPos.z, 0.4, drop))
            .setFacing(1)
            .setGiantScale(lerp(1.0, 3.0, grow))
            .setPose(grow < 0.7 ? 'leap' : 'heroic');
          flash = pulseBell(t, 27.7, 0.15) * 0.09;
        }
      } else {
        // 31..37.5s: Giant Dawa in open clearing hurls boulder & sends Toad/Boar minions flying!
        const chargeU = invLerp(31.0, 33.2, t);
        const smashU = invLerp(33.2, 36.2, t);
        const dawaX = lerp(3.85, 4.65, easeOutCubic(chargeU));

        actors.dawa?.setVisible(true)
          .setPosition(dawaX, 0, 1.85)
          .setFacing(1)
          .setGiantScale(3.0)
          .setPose(t < 33.0 ? 'cast' : t < 35.0 ? 'attack' : 'heroic');

        // Boulder raised over head then smashed down onto (6.2, 0.2, 1.5)
        const throwU = invLerp(31.8, 33.2, t);
        const bX = lerp(dawaX + 0.7, 6.2, throwU);
        const bY = t < 31.8 ? 4.8 : lerp(5.4, 0.2, throwU * throwU);
        fx?.setDawaSmash({
          boulderPos: [bX, bY, 1.55],
          boulderScale: 1.32,
          boulderVisible: t < 33.6,
          shockPos: [6.2, 0.05, 1.5],
          shockProgress: smashU,
        });
        flash = pulseBell(t, 33.25, 0.15) * 0.10;

        // Toads & Boars charge then get launched sky-high on impact
        const fly = easeOutCubic(invLerp(33.2, 37.5, t));
        const enemies = [
          { a: actors.toad,  sx: 6.5, ex: 13.0, ey: 5.5, z: 1.75 },
          { a: actors.toad2, sx: 7.5, ex: 14.4, ey: 6.8, z: 1.15 },
          { a: actors.boar,  sx: 6.9, ex: 12.6, ey: 4.8, z: 1.45 },
          { a: actors.boar2, sx: 8.2, ex: 15.0, ey: 5.8, z: 1.30 },
        ];
        enemies.forEach((e, idx) => {
          const ex = t < 33.2 ? lerp(e.sx + 2.5, e.sx, chargeU) : lerp(e.sx, e.ex, fly);
          const ey = t < 33.2 ? 0 : Math.sin(fly * Math.PI) * e.ey + fly * 1.5;
          e.a?.setVisible(true)
            .setPosition(ex, ey, e.z)
            .setFacing(-1)
            .setPose(t < 33.2 ? 'run' : 'struggle');
          if (t >= 33.2 && e.a) e.a.group.rotation.z = -fly * (3.5 + idx * 0.8);
        });
      }
    } else {
      // 37.5..52s: World 1 MistMireCanyon — Snake lures Dawa into Quicksand Mire & Bats seal Dantian!
      c?.setMireActivity(0.95);
      if (t < 42.5) {
        const u = smoothstep(37.5, 42.5, t);
        const check = smoothstep(40.0, 40.75, t) * (1 - smoothstep(41.4, 42.2, t));
        actors.dawa?.setVisible(true)
          .setPosition(lerp(60.5, 65.0, u), 0, lerp(1.25, 0.4, u))
          .setFacing(1)
          .setGiantScale(lerp(2.4, 2.0, u))
          .setSinkDepth(smoothstep(0.65, 1.0, u) * 0.22)
          .setPose(u < 0.72 ? 'run' : 'struggle')
          .setPhysicalBeat({ lean: -0.27 * check, still: check * 0.6 });
        actors.snake?.setVisible(true)
          .setPosition(lerp(66.2, 68.2, u), 0.25, -0.6)
          .setFacing(-1)
          .setPose('cast');
        fx?.setDawaMireTrap({ pos: [65.0, 0.05, 0.4], mireGrip: smoothstep(0.55, 1.0, u), webSealProgress: 0 });
      } else if (t < 47.5) {
        const u = invLerp(42.5, 47.5, t);
        const pull = pulseBell(t, 44.6, 1.65);
        const brace = pulseBell(t, 46.2, 1.15);
        actors.dawa?.setVisible(true)
          .setPosition(65.0 - pull * 0.31, 0, 0.4 + pull * 0.23)
          .setFacing(1)
          .setGiantScale(lerp(2.0, 1.5, u))
          .setSinkDepth(lerp(0.22, 0.55, u) + 0.16 * brace)
          .setPose('struggle')
          .setPhysicalBeat({ lean: -0.39 * pull + 0.24 * brace, turn: -0.27 * pull, crouch: 0.06 * brace, still: pull * 0.68 });
        actors.snake?.setVisible(true)
          .setPosition(68.2, 0.2, -0.6)
          .setFacing(-1)
          .setPose('idle')
          .setPhysicalBeat({ lean: 0.14 * brace, still: 0.87 });
        fx?.setDawaMireTrap({ pos: [65.0, 0.05, 0.4], mireGrip: 1.0, webSealProgress: 0 });
      } else {
        // 47.5..52s: Bats swoop down casting 5-color toxic spiderweb sealing Dawa's Dantian!
        const u = invLerp(47.5, 52.0, t);
        const webP = smoothstep(47.8, 50.8, t);
        actors.dawa?.setVisible(true)
          .setPosition(65.0, 0, 0.4)
          .setFacing(1)
          .setGiantScale(lerp(1.5, 0.95, webP))
          .setSinkDepth(lerp(0.55, 0.42, webP))
          .setPose(webP > 0.55 ? 'bound' : 'struggle');

        const ang = t * 2.4;
        actors.bat?.setVisible(true)
          .setPosition(65.0 + Math.cos(ang) * 1.9, 2.7 + Math.sin(t * 5) * 0.25, 0.2)
          .setFacing(Math.cos(ang) > 0 ? -1 : 1)
          .setPose('attack');
        actors.bat2?.setVisible(true)
          .setPosition(65.0 - Math.cos(ang) * 1.9, 3.0 + Math.cos(t * 5) * 0.25, -0.3)
          .setFacing(Math.cos(ang) > 0 ? 1 : -1)
          .setPose('attack');

        fx?.setDawaMireTrap({ pos: [65.0, 0.05, 0.4], mireGrip: 0.9, webSealProgress: webP });
      }
    }

    return { mood, flash };
  }

  // =========================================================================
  // ACT 3 (52..76s): 慧眼识妖·梦窟伤目【二娃】 (World 1, x = 58..72)
  // =========================================================================
  _choreographAct3(t, actors, fx, ws) {
    const c = ws?.canyon;
    let mood = 'mire_miasma';
    let flash = 0;

    if (t < 62.0) {
      // Erwa on high cliff ledge firing Thousand-Mile Eye beams & Wind-Ear ripples
      const u = invLerp(52.0, 57.0, t);
      const beamInt = smoothstep(54.8, 56.5, t);
      const earInt = smoothstep(55.5, 57.2, t);
      actors.erwa?.setVisible(true)
        .setPosition(58.5, 4.6, -1.2)
        .setFacing(1)
        .setPose(beamInt > 0.2 ? 'cast' : 'heroic');

      fx?.setErwaSense({
        origin: [58.9, 6.25, -1.1],
        target: [70.2, 2.5, -1.8],
        beamIntensity: beamInt,
        earRipple: earInt,
      });

      // Distant spotted captives near grotto edge
      actors.grandpa?.setVisible(true).setPosition(69.6, 1.3, -1.9).setFacing(-1).setPose('bound');
      actors.dawa?.setVisible(true).setPosition(70.8, 1.3, -1.8).setFacing(-1).setPose('bound');
      actors.scorpion?.setVisible(true).setPosition(68.2, 1.3, -1.6).setFacing(1).setPose('idle');
      if (u < 0.2) flash = pulseBell(t, 52.4, 0.14) * 0.08;
    } else if (t < 71.0) {
      // Dream Illusion Grotto: Crimson demon eyes & poison-wind blinding rays!
      mood = 'dream_crimson';
      const illP = smoothstep(62.0, 64.5, t);
      c?.setDreamIllusion(illP);

      if (t < 66.5) {
        const sneak = invLerp(62.0, 66.5, t);
        actors.erwa?.setVisible(true)
          .setPosition(lerp(69.0, 70.6, sneak), 1.4, -1.4)
          .setFacing(1)
          .setPose(sneak < 0.7 ? 'walk' : 'idle');
        actors.snake?.setVisible(true)
          .setPosition(73.1, 2.0, -2.0)
          .setFacing(-1)
          .setPose('cast');
      } else {
        // 66.5..71s: Blinding crimson-white sword rays pierce Erwa's eyes!
        const blindP = invLerp(66.8, 69.4, t);
        const stagger = easeOutCubic(invLerp(67.6, 71.0, t));
        actors.snake?.setVisible(true).setPosition(72.8, 2.1, -2.0).setFacing(-1).setPose('attack');
        actors.erwa?.setVisible(true)
          .setPosition(lerp(70.6, 68.7, stagger), lerp(1.4, 1.1, stagger), lerp(-1.4, -0.7, stagger))
          .setPhysicalBeat({ lean: -0.34 * pulseBell(t, 67.8, 1.3), turn: 0.4 * stagger, crouch: 0.11 * stagger })
          .setFacing(1)
          .setPose(t >= 67.4 ? 'blinded' : 'struggle');
        if (t >= 67.4 && actors.erwa) actors.erwa.hurtFlash = Math.max(0, 1.0 - stagger);

        fx?.setErwaBlindTrap({
          from: [72.4, 3.6, -1.9],
          to: [lerp(70.5, 69.2, stagger), 2.9, -1.3],
          progress: blindP,
        });
        flash = pulseBell(t, 67.7, 0.15) * 0.12;
      }
    } else {
      // 71..76s: Cliff edge sacrifice — Grandpa & Pangolin shield blinded Erwa; Scorpion pushes Pangolin!
      const u = invLerp(71.0, 76.0, t);
      actors.grandpa?.setVisible(true).setPosition(57.1, 4.6, -1.5).setFacing(1).setPose('struggle');
      actors.erwa?.setVisible(true).setPosition(57.9, 4.6, -1.3).setFacing(1).setPose('blinded');
      actors.scorpion?.setVisible(true)
        .setPosition(lerp(61.2, 59.6, smoothstep(71.0, 72.4, t)), 4.6, -1.3)
        .setFacing(-1)
        .setPose(t < 73.2 ? 'attack' : 'heroic');

      if (t < 72.4) {
        actors.pangolin?.setVisible(true)
          .setPosition(lerp(58.4, 59.2, invLerp(71.0, 72.4, t)), 4.6, -1.2)
          .setFacing(1)
          .setPose('attack');
      } else {
        const fall = invLerp(72.4, 76.0, t);
        actors.pangolin?.setVisible(true)
          .setPosition(lerp(59.2, 58.6, fall), 4.6 - fall * fall * 7.8, lerp(-1.2, -0.4, fall))
          .setFacing(-1)
          .setPose('struggle');
        if (actors.pangolin) actors.pangolin.group.rotation.z = fall * 5.2;
      }
      if (u > 0.2 && u < 0.35) flash = pulseBell(t, 72.4, 0.14) * 0.09;
    }

    return { mood, flash };
  }

  // =========================================================================
  // ACT 4 (76..102s): 钢筋铁骨·柔剑缠身【三娃】 (World 2, x = 121..135)
  // =========================================================================
  _choreographAct4(t, actors, fx, ws) {
    const p = ws?.palace;
    let flash = 0;

    p?.setGrandpaWeb(true);
    p?.setRuyiOnCouch(true);

    if (t < 80.5) {
      // Sanwa smashes open Demon Cave stone gate
      const openP = smoothstep(78.2, 79.4, t);
      p?.setDoorOpen(openP);
      const runU = easeOutCubic(invLerp(76.0, 80.5, t));
      const sx = lerp(118.4, 122.6, runU);
      actors.sanwa?.setVisible(true).setPosition(sx, 0, 0.2).setFacing(1).setPose(t < 78.8 ? 'run' : 'attack');
      fx?.setSanwaIron({ pos: [sx, 0, 0.2], shieldIntensity: smoothstep(77.5, 79.0, t) * 0.85 });
      flash = pulseBell(t, 78.6, 0.14) * 0.09;
    } else if (t < 86.0) {
      // Copper head & iron arms deflecting 24 wasp poison needles + shattering Centipede's axe!
      p?.setDoorOpen(1);
      const u = invLerp(80.5, 86.0, t);
      const sx = lerp(124.2, 127.8, u);
      actors.sanwa?.setVisible(true).setPosition(sx, 0, -0.35).setFacing(1).setPose(t > 84.2 ? 'attack' : 'heroic');

      actors.wasp?.setVisible(true).setPosition(130.6, 2.7 + Math.sin(t * 7) * 0.2, -0.6).setFacing(-1).setPose('attack');
      actors.wasp2?.setVisible(true).setPosition(131.5, 3.4 + Math.cos(t * 7) * 0.2, -0.1).setFacing(-1).setPose('attack');

      const centX = t < 84.8 ? lerp(131.2, 129.0, invLerp(82.5, 84.8, t)) : lerp(129.0, 131.8, invLerp(84.8, 86.0, t));
      actors.centipede?.setVisible(true)
        .setPosition(centX, 0, -0.45)
        .setFacing(-1)
        .setPose(t < 84.8 ? 'attack' : 'struggle');

      fx?.setSanwaIron({
        pos: [sx, 0, -0.35],
        shieldIntensity: 1.0,
        needleOrigin: [130.6, 2.9, -0.4],
        needleProgress: invLerp(81.5, 84.5, t),
        axeShatterPos: [sx + 0.9, 1.7, -0.35],
        axeShatterProgress: invLerp(84.7, 86.0, t),
      });
      flash = pulseBell(t, 84.85, 0.14) * 0.10;
    } else if (t < 91.5) {
      // Sanwa leaps and shatters Crystal Magic Mirror!
      p?.setDoorOpen(1);
      const leapU = invLerp(86.0, 88.8, t);
      const landU = invLerp(88.8, 91.5, t);
      const sx = t < 88.8 ? lerp(131.2, 134.4, easeOutCubic(leapU)) : lerp(134.4, 132.4, landU);
      const sy = t < 88.8 ? Math.sin(leapU * Math.PI * 0.75) * 2.4 : lerp(2.0, 0, easeInOutQuad(landU));
      actors.sanwa?.setVisible(true).setPosition(sx, sy, -1.4).setFacing(1).setPose(t < 89.4 ? 'leap' : 'heroic');
      actors.snake?.setVisible(true).setPosition(lerp(135.8, 136.6, landU), 0.1, -2.0).setFacing(-1).setPose('struggle');

      const shatterP = invLerp(88.8, 90.8, t);
      p?.setMirror({ active: t < 88.8, beam: t < 88.8 ? 0.9 : 0, shattered: shatterP });
      flash = pulseBell(t, 88.85, 0.16) * 0.12;
    } else {
      // 91.5..102s: Snake draws Yin-Yang Silk Sword -> glowing violet-cyan cocoon binds Sanwa!
      p?.setDoorOpen(1);
      p?.setMirror({ active: false, beam: 0, shattered: 1 });

      const wrapP = smoothstep(92.4, 98.5, t);
      const thrust = pulseBell(t, 92.8, 1.25);
      const recoil = smoothstep(93.2, 95.65, t);
      const hold = smoothstep(94.5, 97.2, t);
      const sx = 131.05 + 0.34 * thrust - 0.62 * recoil;
      const sy = 0.2 - 0.12 * hold;
      const sz = -0.4 + 0.68 * recoil;
      actors.sanwa?.setVisible(true)
        .setPosition(sx, sy, sz)
        .setFacing(1)
        .setPose(wrapP > 0.35 ? 'bound' : 'attack')
        .setPhysicalBeat({ lean: 0.31 * thrust - 0.37 * recoil + 0.17 * hold, turn: -0.28 * recoil, crouch: 0.08 * hold, still: 0.38 * hold });
      actors.snake?.setVisible(true)
        .setPosition(133.8 + 0.30 * recoil, 0.25, -1.0)
        .setFacing(-1)
        .setPose(wrapP < 0.85 ? 'cast' : 'heroic')
        .setPhysicalBeat({ lean: 0.26 * thrust, turn: -0.13 * hold, still: 0.72 * hold });

      if (t >= 97.0) {
        actors.scorpion?.setVisible(true).setPosition(128.4, 0, -1.2).setFacing(1).setPose('heroic');
      }

      fx?.setSanwaSilkTrap({
        swordOrigin: [133.0 + 0.30 * recoil, 2.3, -0.8],
        targetPos: [sx, sy, sz],
        wrapProgress: wrapP,
      });
    }

    return { mood: 'palace_amethyst', flash };
  }

  // =========================================================================
  // ACT 5 (102..132s): 水火奇功·酒酣心冰【四娃 & 五娃】 (World 2, x = 127..133)
  // =========================================================================
  _choreographAct5(t, actors, fx, ws) {
    const p = ws?.palace;
    let flash = 0;

    p?.setDoorOpen(1);
    p?.setGrandpaWeb(true);
    p?.setMirror({ active: false, beam: 0, shattered: 1 });

    if (t < 113.5) {
      // Siwa fire-dragon & Wuwa high-pressure water torrent storm the palace!
      p?.setRuyiOnCouch(true);
      const enterU = easeOutCubic(invLerp(102.0, 105.5, t));
      const siwaX = lerp(125.2, 128.0, enterU);
      const wuwaX = lerp(124.8, 127.8, enterU);
      const fireInt = smoothstep(105.2, 106.5, t);
      const waterInt = smoothstep(108.2, 109.5, t);

      actors.siwa?.setVisible(true).setPosition(siwaX, 0, -0.7).setFacing(1).setPose(fireInt > 0.2 ? 'cast' : 'run');
      actors.wuwa?.setVisible(true).setPosition(wuwaX, 0, 0.45).setFacing(1).setPose(waterInt > 0.2 ? 'cast' : 'run');

      fx?.setSiwaFire({ origin: [siwaX + 0.7, 1.5, -0.6], target: [133.5, 1.4, -0.9], intensity: fireInt });
      fx?.setWuwaWater({ origin: [wuwaX + 0.7, 1.4, 0.45], target: [133.8, 1.2, 0.25], intensity: waterInt });

      const push = easeOutCubic(invLerp(108.5, 113.5, t));
      actors.toad?.setVisible(true).setPosition(lerp(132.2, 136.5, push), Math.sin(push * Math.PI) * 1.6, 0.3).setFacing(-1).setPose('struggle');
      actors.boar?.setVisible(true).setPosition(lerp(132.8, 137.2, push), Math.sin(push * Math.PI) * 1.2, -0.9).setFacing(-1).setPose('struggle');
      actors.wasp?.setVisible(true).setPosition(lerp(133.0, 136.8, push), 2.6 + push * 1.4, -0.3).setFacing(-1).setPose('struggle');
    } else if (t < 119.5) {
      // Hongmen Banquet: Wuwa drinks cold-spring enchanted wine & falls dizzy into Giant Porcelain Bowl!
      p?.setRuyiOnCouch(true);
      p?.setWineBowl({ active: true, swirl: 0.95 });

      const drunkP = smoothstep(115.2, 118.4, t);
      actors.wuwa?.setVisible(true)
        .setPosition(128.2, lerp(0.95, 0.55, drunkP), 0.5)
        .setFacing(1)
        .setPose(t < 116.2 ? 'idle' : 'drunk')
        .setPhysicalBeat({ lean: 0.33 * pulseBell(t, 116.2, 1.25), crouch: 0.11 * pulseBell(t, 116.2, 1.25) });
      const check = smoothstep(116.25, 117.55, t);
      actors.siwa?.setVisible(true).setPosition(131.6 - 0.87 * check, 0, 0.15 + 0.65 * check)
        .setFacing(-1).setPose(t > 116.25 && t < 117.55 ? 'walk' : 'idle')
        .setPhysicalBeat({ lean: 0.22 * check, still: 0.63 * check });
      actors.snake?.setVisible(true).setPosition(130.2, 0, -1.1).setFacing(-1).setPose('cast');

      fx?.setBanquetTraps({ winePos: [128.2, 1.35, 0.5], drunkSwirl: 0.35 + drunkP * 0.65 });
    } else if (t < 126.0) {
      // Snake waves Golden Ruyi summoning freezing blizzard -> Siwa frozen in Octahedral Ice Prism!
      p?.setRuyiOnCouch(false);
      p?.setWineBowl({ active: true, swirl: 0.75 });

      const blizInt = smoothstep(120.2, 121.6, t) * (1.0 - smoothstep(124.8, 126.0, t));
      const frozen = t >= 122.8;
      p?.setIcePrism({ active: frozen, shatter: 0 });

      actors.wuwa?.setVisible(true).setPosition(128.2, 0.55, 0.5).setFacing(1).setPose('drunk');
      actors.siwa?.setVisible(true)
        .setPosition(132.2, 0.65, 0.5)
        .setFacing(1)
        .setPose(frozen ? 'frozen' : 'cast');
      actors.snake?.setVisible(true).setPosition(134.8, 0.1, -0.2).setFacing(-1).setPose('cast');

      // Dying fire vs overpowering blizzard
      const dyingFire = 1.0 - smoothstep(119.8, 122.2, t);
      if (dyingFire > 0.02) {
        fx?.setSiwaFire({ origin: [132.8, 1.6, 0.5], target: [134.4, 1.6, 0.0], intensity: dyingFire });
      }
      fx?.setBanquetTraps({
        ruyiOrigin: [134.1, 2.2, -0.1],
        iceTarget: [132.2, 1.6, 0.5],
        blizzardIntensity: blizInt,
        winePos: [128.2, 1.35, 0.5],
        drunkSwirl: 0.7,
      });
      flash = pulseBell(t, 122.9, 0.14) * 0.08;
    } else {
      // 126..132s: Both brothers captured in wine & ice tableau
      p?.setRuyiOnCouch(true);
      p?.setWineBowl({ active: true, swirl: 0.7 });
      p?.setIcePrism({ active: true, shatter: 0 });

      actors.wuwa?.setVisible(true).setPosition(128.2, 0.55, 0.5).setFacing(1).setPose('drunk');
      actors.siwa?.setVisible(true).setPosition(132.2, 0.65, 0.5).setFacing(1).setPose('frozen');
      actors.snake?.setVisible(true).setPosition(130.6, 0, -1.2).setFacing(-1).setPose('heroic');
      actors.scorpion?.setVisible(true).setPosition(129.2, 0, -1.3).setFacing(1).setPose('heroic');
      fx?.setBanquetTraps({ winePos: [128.2, 1.35, 0.5], drunkSwirl: 0.8 });
    }

    return { mood: 'palace_amethyst', flash };
  }

  // =========================================================================
  // ACT 6 (132..158s): 捕风捉影·巧夺如意【六娃】 (World 2, x = 121..137)
  // =========================================================================
  _choreographAct6(t, actors, fx, ws) {
    const p = ws?.palace;
    let flash = 0;

    p?.setDoorOpen(0);
    p?.setGrandpaWeb(true);
    p?.setMirror({ active: false, beam: 0, shattered: 1 });

    if (t < 154.0) {
      p?.setWineBowl({ active: true, swirl: 0.6 });
      p?.setIcePrism({ active: true, shatter: 0 });
      actors.wuwa?.setVisible(true).setPosition(128.2, 0.55, 0.5).setFacing(1).setPose('drunk');
      actors.siwa?.setVisible(true).setPosition(132.2, 0.65, 0.5).setFacing(1).setPose('frozen');
    }

    if (t < 137.0) {
      // Liuwa phases stealthily straight through closed stone gate!
      p?.setRuyiOnCouch(true);
      const u = invLerp(132.0, 137.0, t);
      const lx = lerp(119.0, 124.2, u);
      actors.liuwa?.setVisible(true).setPosition(lx, 0.1, 0.75).setFacing(1).setStealth(0.86).setPose('walk');
      fx?.setLiuwaTrick({ ghostPos: [lx, 1.2, 0.75], ghostPulse: 1.0 });
    } else if (t < 142.5) {
      // Snake scatters golden tracking powder & tags Liuwa with yellow flower -> moved onto Scorpion's nose!
      p?.setRuyiOnCouch(true);
      const u = invLerp(137.0, 142.5, t);
      const lx = lerp(128.2, 131.5, smoothstep(0.0, 0.55, u)) - lerp(0, 1.6, smoothstep(0.6, 1.0, u));

      actors.snake?.setVisible(true).setPosition(127.6, 0, -1.2).setFacing(1).setPose('cast');
      actors.scorpion?.setVisible(true).setPosition(131.6, 0, -0.6).setFacing(-1).setPose('idle');
      actors.liuwa?.setVisible(true).setPosition(lx, 0.1, -0.35).setFacing(u < 0.6 ? 1 : -1).setStealth(0.75).setPose('run');

      const flowerOnScorpion = t >= 139.6;
      fx?.setLiuwaTrick({
        ghostPos: [lx, 1.1, -0.35],
        ghostPulse: 0.7,
        powderPos: [129.5, 1.4, -0.5],
        powderProgress: invLerp(137.3, 139.6, t),
        flowerPos: flowerOnScorpion ? [131.2, 2.55, -0.4] : [lx - 0.35, 1.25, -0.2],
        flowerVisible: t >= 138.0,
      });
    } else if (t < 148.0) {
      // Scorpion & Centipede chase the yellow flower and knock each other out!
      p?.setRuyiOnCouch(true);
      const clash = invLerp(142.5, 145.6, t);
      const ko = invLerp(145.6, 148.0, t);
      const sx = t < 145.6 ? lerp(130.6, 131.4, Math.sin(clash * Math.PI)) : lerp(131.4, 130.2, ko);
      const cx = t < 145.6 ? lerp(133.2, 132.1, Math.sin(clash * Math.PI)) : lerp(132.1, 133.6, ko);

      actors.scorpion?.setVisible(true).setPosition(sx, t < 145.6 ? 0 : -ko * 0.4, -0.6).setFacing(1).setPose(t < 145.6 ? 'attack' : 'drunk');
      actors.centipede?.setVisible(true).setPosition(cx, t < 145.6 ? 0 : -ko * 0.4, -0.6).setFacing(-1).setPose(t < 145.6 ? 'attack' : 'drunk');
      const peek = smoothstep(145.4, 146.8, t);
      actors.liuwa?.setVisible(true).setPosition(129.35 + 0.24 * peek, 0.1, 1.0).setFacing(1).setStealth(0.65).setPose('idle')
        .setPhysicalBeat({ lean: 0.22 * peek, crouch: 0.18 * (1 - peek), still: 0.81 });

      fx?.setLiuwaTrick({
        flowerPos: [sx + 0.35, 2.5 - (t < 145.6 ? 0 : ko * 0.5), -0.4],
        flowerVisible: true,
      });
      flash = pulseBell(t, 145.6, 0.14) * 0.08;
    } else if (t < 153.0) {
      // Liuwa sneaks to Demon Couch & steals Golden Ruyi!
      const u = invLerp(148.0, 153.0, t);
      const stolen = t >= 150.2;
      p?.setRuyiOnCouch(!stolen);

      const lx = stolen ? lerp(136.6, 134.8, invLerp(150.2, 153.0, t)) : lerp(135.2, 136.6, invLerp(148.0, 150.2, t));
      const lz = stolen ? lerp(-1.55, -1.2, invLerp(150.2, 153.0, t)) : lerp(-1.2, -1.55, invLerp(148.0, 150.2, t));
      actors.liuwa?.setVisible(true).setPosition(lx, 0.1, lz).setFacing(stolen ? -1 : 1).setStealth(0.82).setPose('walk');
      actors.snake?.setVisible(true).setPosition(134.5, 0.1, -1.75).setFacing(-1).setPose('drunk');

      fx?.setLiuwaTrick({
        ghostPos: [lx, 1.1, lz],
        ghostPulse: 0.75,
        ruyiPos: [lx - 0.25, 1.35, lz + 0.15],
        ruyiVisible: stolen,
      });
    } else {
      // 153..158s: Liuwa unleashes Golden Ruyi beam shattering Ice Prism & freeing brothers!
      p?.setRuyiOnCouch(false);
      const shatterP = invLerp(154.0, 156.6, t);
      const beamInt = smoothstep(153.2, 154.2, t) * (1.0 - smoothstep(156.4, 157.8, t));

      p?.setIcePrism({ active: t < 154.0, shatter: shatterP });
      p?.setWineBowl({ active: true, swirl: t < 154.5 ? 0.5 : 0.0 });

      actors.liuwa?.setVisible(true).setPosition(130.2, 0, 0.7).setFacing(1).setStealth(0.08).setPose('cast');
      actors.siwa?.setVisible(true)
        .setPosition(132.2, t < 154.2 ? 0.65 : lerp(0.65, 0, invLerp(154.2, 155.8, t)), 0.5)
        .setFacing(-1)
        .setPose(t < 154.2 ? 'frozen' : 'heroic');
      actors.wuwa?.setVisible(true)
        .setPosition(lerp(128.2, 128.8, invLerp(154.5, 157.5, t)), t < 154.5 ? 0.55 : 0, 0.5)
        .setFacing(1)
        .setPose(t < 154.5 ? 'drunk' : 'heroic');

      if (t >= 155.0) {
        actors.dawa?.setVisible(true).setPosition(127.0, 0, -0.4).setFacing(1).setPose('heroic');
        actors.erwa?.setVisible(true).setPosition(127.9, 0, -0.6).setFacing(1).setPose('heroic');
        actors.sanwa?.setVisible(true).setPosition(129.1, 0, -0.5).setFacing(1).setPose('heroic');
      }

      fx?.setLiuwaTrick({
        ruyiPos: [130.6, 1.5, 0.75],
        ruyiVisible: true,
        ruyiBeamTarget: [132.2, 1.6, 0.5],
        ruyiBeamIntensity: beamInt,
      });
      flash = pulseBell(t, 154.2, 0.15) * 0.11;
    }

    return { mood: 'palace_amethyst', flash };
  }

  // =========================================================================
  // ACT 7 (158..188s): 妖迷心窍·七子入炉【七娃黑化与全员受困】 (World 3, x = 195)
  // =========================================================================
  _choreographAct7(t, actors, fx, ws) {
    const al = ws?.alchemy;
    let flash = 0;

    al?.setSealMountain(0);

    if (t < 164.0) {
      // Corrupted Qiwa emerges beside Snake & Scorpion on altar, bows to Snake ("妈妈")
      al?.setCauldron({ fire: 0.65, lidOpen: 0, shattered: 0 });
      const rise = easeOutCubic(invLerp(158.0, 161.5, t));
      actors.qiwa?.setVisible(true)
        .setPosition(195.0, lerp(0.15, 0.52, rise), 2.15)
        .setFacing(-1)
        .setCorrupted(1.0)
        .setPose(t < 161.5 ? 'heroic' : 'cast')
        .setPhysicalBeat({ lean: 0.42 * pulseBell(t, 162.1, 1.5), crouch: 0.12 * pulseBell(t, 162.1, 1.5), still: 0.54 * pulseBell(t, 162.1, 1.5) });
      actors.snake?.setVisible(true).setPosition(192.0, 0.52, 1.55).setFacing(1).setPose('cast');
      actors.scorpion?.setVisible(true).setPosition(198.0, 0.52, 1.55).setFacing(-1).setPose('heroic');

      fx?.setQiwaGourd({
        pos: [194.05, 2.22, 2.35],
        targetPos: [192.6, 2.0, 1.65],
        visible: t >= 160.2,
        scale: lerp(0.4, 0.92, invLerp(160.2, 163.5, t)),
        corrupted: 1.0,
        vortexIntensity: smoothstep(162.0, 164.0, t) * 0.35,
      });
    } else if (t < 179.0) {
      // Qiwa raises Purple-Gold Gourd -> massive centrifugal vortex sucks ALL 6 elder brothers in!
      al?.setCauldron({ fire: 0.85, lidOpen: 0, shattered: 0 });
      const gourdPos = this._tmpVecA.set(196.0, 2.32, 2.15);
      const vortexInt = smoothstep(164.5, 166.5, t);

      actors.qiwa?.setVisible(true).setPosition(197.2, 0.52, 1.95).setFacing(-1).setCorrupted(1.0).setPose('cast');
      actors.snake?.setVisible(true).setPosition(198.6, 0.52, 1.25).setFacing(-1).setPose('heroic');

      fx?.setQiwaGourd({
        pos: gourdPos,
        targetPos: [191.8, 1.8, 1.9],
        visible: true,
        scale: 1.25,
        corrupted: 1.0,
        vortexIntensity: vortexInt,
      });

      // Six elder brothers rush in then spiral one-by-one into Qiwa's gourd (including unstealthed Liuwa!)
      const brothers = [
        { a: actors.dawa,  x: 192.8, z: 1.95, suckStart: 168.0, suckEnd: 172.2 },
        { a: actors.erwa,  x: 192.0, z: 1.60, suckStart: 169.2, suckEnd: 173.4 },
        { a: actors.sanwa, x: 191.3, z: 2.15, suckStart: 170.2, suckEnd: 174.5 },
        { a: actors.siwa,  x: 190.6, z: 1.70, suckStart: 171.2, suckEnd: 175.6 },
        { a: actors.wuwa,  x: 190.0, z: 2.05, suckStart: 172.0, suckEnd: 176.6 },
        { a: actors.liuwa, x: 193.8, z: 2.35, suckStart: 173.0, suckEnd: 178.4, isLiuwa: true },
      ];

      brothers.forEach((b, i) => {
        const sp = invLerp(b.suckStart, b.suckEnd, t);
        if (sp >= 0.995) return;
        const approach = easeOutCubic(invLerp(164.0, 167.2, t));
        b.a?.setVisible(true)
          .setPosition(lerp(b.x - 2.6, b.x, approach), 0.52, b.z + (i % 2 ? -0.38 : 0.45) * (1 - approach))
          .setFacing(1);
        if (b.isLiuwa) {
          // Stealth forced to break down as vortex grabs Liuwa!
          b.a?.setStealth(lerp(0.85, 0.0, smoothstep(171.5, 174.0, t)));
        }
        if (sp > 0.01) {
          b.a?.setPose('sucked').setSuction(gourdPos, sp);
        } else {
          b.a?.setPose(t < 167.0 ? 'run' : 'struggle');
        }
      });
    } else {
      // 179..188s: All 7 brothers cast into the blazing Three-Legged Bronze Cauldron!
      const dropU = invLerp(179.0, 182.2, t);
      const arcU = easeInOutQuad(dropU);
      const lidClose = 1.0 - smoothstep(182.0, 184.0, t);
      al?.setCauldron({ fire: 1.0, lidOpen: lidClose, shattered: 0 });

      actors.snake?.setVisible(true).setPosition(191.8, 0.52, 1.45).setFacing(1).setPose('heroic');
      actors.scorpion?.setVisible(true).setPosition(198.2, 0.52, 1.45).setFacing(-1).setPose('heroic');

      if (t < 182.4) {
        fx?.setQiwaGourd({
          pos: [lerp(195.4, 195.0, arcU), lerp(4.8, 2.85, arcU) + Math.sin(dropU * Math.PI) * 0.6, lerp(1.4, -1.65, arcU)],
          targetPos: [195.0, 2.1, -1.65],
          visible: true,
          scale: 1.0,
          corrupted: 1.0,
          vortexIntensity: 0,
        });
      }
      flash = pulseBell(t, 182.5, 0.15) * 0.09;
    }

    return { mood: 'alchemy_inferno', flash };
  }

  // =========================================================================
  // ACT 8 (188..214s): 彩莲泣血·七子连心 (World 3, x = 195)
  // =========================================================================
  _choreographAct8(t, actors, fx, ws) {
    const al = ws?.alchemy;
    let mood = 'alchemy_inferno';
    let flash = 0;

    al?.setSealMountain(0);

    if (t < 194.0) {
      // Grandpa rushes toward Bronze Cauldron holding Sacred Seven-Color Lotus
      al?.setCauldron({ fire: 1.0, lidOpen: 0.08, shattered: 0 });
      const u = invLerp(188.0, 194.0, t);
      const gx = lerp(189.4, 193.5, u);
      actors.grandpa?.setVisible(true).setPosition(gx, 0.52, 1.85).setFacing(1).setPose('run');
      actors.scorpion?.setVisible(true).setPosition(lerp(198.0, 196.4, u), 0.52, 1.80).setFacing(-1).setPose('run');
      fx?.setLotusMiracle({
        lotusPos: [gx + 0.55, 2.05, 1.90],
        lotusVisible: true,
        bloomProgress: 0.32,
      });
    } else if (t < 200.0) {
      // Scorpion strikes Grandpa down; dying Grandpa hurls Sacred Seven-Color Lotus into Cauldron!
      const throwU = invLerp(196.2, 199.6, t);
      al?.setCauldron({ fire: 1.0, lidOpen: smoothstep(196.0, 199.5, t) * 0.45, shattered: 0 });

      const hit = t >= 195.2;
      const fall = smoothstep(195.2, 195.95, t);
      const release = pulseBell(t, 197.0, 1.28);
      actors.scorpion?.setVisible(true)
        .setPosition(lerp(196.4, 194.8, smoothstep(194.0, 195.3, t)), 0.52, 1.80)
        .setFacing(-1)
        .setPose(t < 196.4 ? 'attack' : 'heroic');

      actors.grandpa?.setVisible(true)
        .setPosition(193.5 - 0.3 * fall, 0.52 - 0.27 * fall, 1.85 + 0.24 * fall)
        .setFacing(1)
        .setPose(hit ? 'idle' : 'run')
        .setPhysicalBeat({ lean: -0.44 * fall + 0.75 * release, crouch: 0.165 * fall * (1 - release), still: 0.85 * fall });
      if (hit && actors.grandpa) actors.grandpa.hurtFlash = Math.max(0, 1.0 - invLerp(195.2, 197.5, t));

      const lx = lerp(193.8, 195.0, throwU);
      const ly = lerp(1.8, 3.3, throwU) + Math.sin(throwU * Math.PI) * 1.9;
      const lz = lerp(1.85 + 0.24 * fall, -1.65, throwU);
      fx?.setLotusMiracle({
        lotusPos: [lx, ly, lz],
        lotusVisible: true,
        bloomProgress: lerp(0.35, 0.72, throwU),
      });
      flash = pulseBell(t, 195.25, 0.15) * 0.10;
    } else if (t < 207.5) {
      // Sacred Lotus blooms sky-high, purifying Qiwa & linking 7 Spirit Orbs in Seven-Heart Crest!
      const u = invLerp(200.0, 207.5, t);
      al?.setCauldron({ fire: lerp(1.0, 0.8, u), lidOpen: lerp(0.45, 0.95, u), shattered: 0 });
      actors.grandpa?.setVisible(true).setPosition(193.2, 0.25, 1.85).setFacing(1).setPose('bound');
      actors.scorpion?.setVisible(true).setPosition(197.6, 0.52, 1.80).setFacing(-1).setPose('struggle');

      fx?.setLotusMiracle({
        lotusPos: [195.0, 3.65, -1.2],
        lotusVisible: true,
        bloomProgress: lerp(0.72, 1.0, smoothstep(0.0, 0.5, u)),
        orbsCenter: [195.0, 4.2, -0.5],
        orbsProgress: smoothstep(0.15, 0.92, u),
      });
    } else {
      // 207.5..214s: GOLDEN EXPLOSION! Bronze Cauldron shatters & all 7 purified brothers burst free!
      const shP = invLerp(207.7, 210.5, t);
      const leapP = easeOutCubic(invLerp(207.8, 211.5, t));
      if (t >= 209.5) mood = 'apotheosis_gold';

      al?.setCauldron({ fire: Math.max(0, 0.9 - shP), lidOpen: 1.0, shattered: shP });
      flash = pulseBell(t, 207.9, 0.18) * 0.14;

      const seven = [
        actors.dawa,
        actors.erwa,
        actors.sanwa,
        actors.siwa,
        actors.wuwa,
        actors.liuwa,
        actors.qiwa,
      ];
      seven.forEach((a, i) => {
        const spreadX = (i - 3) * 1.45;
        const arcY = 1.6 + Math.cos(((i - 3) / 3) * Math.PI * 0.5) * 2.2;
        a?.setVisible(true)
          .setPosition(195.0 + spreadX * leapP, lerp(2.2, arcY, leapP), 1.35 + (i % 3) * 0.3)
          .setFacing(i < 3 ? 1 : -1)
          .setCorrupted(0)
          .setPose(leapP < 0.7 ? 'leap' : 'heroic');
      });

      fx?.setLotusMiracle({
        lotusPos: [195.0, 4.6, -1.2],
        lotusVisible: shP < 0.75,
        bloomProgress: 1.0,
        orbsCenter: [195.0, 4.8, -0.5],
        orbsProgress: 1.0,
      });
    }

    return { mood, flash };
  }

  // =========================================================================
  // ACT 9 (214..240s): 神威合璧·化山镇妖 (World 3 -> Peak Apotheosis)
  // =========================================================================
  _choreographAct9(t, actors, fx, ws) {
    const al = ws?.alchemy;
    let flash = 0;

    al?.setCauldron({ fire: 0, lidOpen: 1, shattered: 1 });

    if (t < 221.0) {
      // Purified Qiwa + 6 brothers petrify Snake, Scorpion & Centipede and seal them in the chasm!
      al?.setSealMountain(0);
      const advance = smoothstep(214.1, 216.6, t);
      const resolve = smoothstep(218.5, 220.4, t);
      const petrifyP = smoothstep(217.5, 220.4, t);
      const sinkY = smoothstep(218.8, 221.0, t) * 2.4;

      const heroes = [
        { a: actors.dawa,  x: 190.6, y: 0.7, z: 1.60 },
        { a: actors.erwa,  x: 191.4, y: 1.5, z: 1.30 },
        { a: actors.sanwa, x: 192.2, y: 0.7, z: 1.80 },
        { a: actors.siwa,  x: 192.8, y: 1.8, z: 1.35 },
        { a: actors.wuwa,  x: 193.4, y: 0.8, z: 1.75 },
        { a: actors.liuwa, x: 193.8, y: 2.1, z: 1.45 },
        { a: actors.qiwa,  x: 194.5, y: 1.2, z: 1.90 },
      ];
      const blocking = heroes.map((h, i) => {
        const depth = i % 2 ? -0.66 : 0.50;
        const approach = (1 - advance) * (0.65 + 0.13 * (6 - i));
        return [h.x - approach, h.y, h.z + depth];
      });
      heroes.forEach((h, i) => {
        h.a?.setVisible(true).setPosition(...blocking[i]).setFacing(1).setCorrupted(0)
          .setPose(advance < 0.58 ? 'run' : 'cast')
          .setPhysicalBeat({ lean: 0.17 * advance * (1 - resolve), still: 0.78 * resolve });
      });

      const gourdPos = [195.1, 2.5, 1.90];
      const targetPos = [197.6, 1.5 - sinkY * 0.4, 1.60];
      fx?.setQiwaGourd({
        pos: gourdPos,
        targetPos,
        visible: true,
        scale: 1.32,
        corrupted: 0,
        vortexIntensity: 0.9,
        petrifyRay: smoothstep(216.8, 218.5, t),
      });

      if (t < 217.8) {
        const [fireX, fireY, fireZ] = blocking[3];
        const [waterX, waterY, waterZ] = blocking[4];
        fx?.setSiwaFire({ origin: [fireX + 0.4, fireY + 1.0, fireZ], target: [197.5, 1.6, 1.55], intensity: 0.75 });
        fx?.setWuwaWater({ origin: [waterX + 0.4, waterY + 1.0, waterZ], target: [197.4, 1.3, 1.65], intensity: 0.75 });
      }

      const villains = [
        { a: actors.snake,     x: 197.2, z: 1.60 },
        { a: actors.scorpion,  x: 198.4, z: 1.80 },
        { a: actors.centipede, x: 196.8, z: 1.40 },
      ];
      villains.forEach((v) => {
        v.a?.setVisible(true)
          .setPosition(v.x, 0.52 - sinkY, v.z)
          .setFacing(-1)
          .setPose(petrifyP > 0.2 ? 'petrified' : 'struggle')
          .setPetrify(petrifyP);
      });
      flash = pulseBell(t, 219.4, 0.14) * 0.09;
    } else if (t < 228.0) {
      // 7 Brothers transform into 7 Rainbow Pillars diving into the rising 1986 Seven-Color Seal Mountain!
      const riseP = easeOutCubic(invLerp(221.4, 227.6, t));
      al?.setSealMountain(riseP);

      fx?.setLotusMiracle({
        rainbowCenter: [195.0, 0.0, -1.85],
        rainbowProgress: invLerp(221.0, 227.5, t),
        orbsCenter: [195.0, 5.2 + riseP * 2.2, -1.2],
        orbsProgress: smoothstep(223.5, 227.5, t),
      });
      flash = pulseBell(t, 222.2, 0.16) * 0.12;
    } else {
      // 228..240s: Golden clouds part & radiant Xiaojingang appears atop the Seven-Color Peak!
      al?.setSealMountain(1.0);
      const u = easeOutCubic(invLerp(228.0, 234.0, t));

      actors.xiaojingang?.setVisible(true)
        .setPosition(lerp(194.7, 195.0, u), lerp(5.1, 6.0, u), lerp(-0.2, 0.38, u))
        .setFacing(1)
        .setGiantScale(lerp(0.85, 1.18, u))
        .setAuraIntensity(0.48)
        .setPose('heroic')
        .setPhysicalBeat({ lean: 0.24 * (1 - u), turn: -0.39 * (1 - u), still: 0.85 * u });

      fx?.setLotusMiracle({
        orbsCenter: [195.0, lerp(6.8, 7.5, u), -0.6],
        orbsProgress: 0.92,
      });
      flash = pulseBell(t, 228.4, 0.16) * 0.10;
    }

    return { mood: 'apotheosis_gold', flash };
  }
}

export default FilmDirector;
