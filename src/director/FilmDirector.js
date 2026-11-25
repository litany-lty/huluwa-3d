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

function armGripAtRelease(out, bend) {
  const x = -0.5484 + 0.10 * Math.abs(Math.sin(bend));
  const y = 1.79 + (0.9483 - 1.79) * Math.cos(bend) - (0.2021 - 0.27) * Math.sin(bend);
  const z = 0.27 + (0.9483 - 1.79) * Math.sin(bend) + (0.2021 - 0.27) * Math.cos(bend);
  out.set(x, y, z).applyEuler(RELEASE_ROTATION);
  out.y *= 0.84;
  out.add(RELEASE_ROOT);
}
const RELEASE_ROTATION = new THREE.Euler(0, 0.41, -0.42);
const RELEASE_ROOT = new THREE.Vector3(192.78, 0.60, 1.94);

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
    if (act.id === 8 && clampedT < 197.48 && actors.grandpa) {
      const grip = actors.grandpa.getLotusGrip(this._tmpVecA);
      fx?.setLotusMiracle({
        lotusPos: [grip.x, grip.y + 0.08, grip.z + 0.025],
        lotusVisible: true, bloomProgress: 0.26, paperLotus: true,
      });
    }
    fx?.update?.(clampedT);

    if (this.postPipeline) {
      const base = CINEMA_MOODS[activeMood] ?? CINEMA_MOODS.sanctuary_dawn;
      const m = act.id === 8
        ? { warmth: 0.09, vignette: 0.30, saturation: 1.04, bloomStr: 0.18, bloomThr: 0.90 }
        : { warmth: base.warmth * .58, vignette: base.vignette * .82,
            saturation: 1 + (base.saturation - 1) * .56, bloomStr: base.bloomStr * .46,
            bloomThr: Math.max(.84, base.bloomThr) };
      this.postPipeline.setCinemaMood({
        warmth: m.warmth,
        vignette: m.vignette,
        saturation: m.saturation,
        flash: act.id === 8 ? flash : flash * .43,
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
      const u = smoothstep(.45, 4.9, t);
      actors.grandpa?.setVisible(true).setPosition(lerp(-4.8, -3.5, u), 0, -1.4).setFacing(1).setPose('hold').setGroundedTravel(u, 1.3, 0);
      actors.pangolin?.setVisible(true).setPosition(lerp(3.5, 7.6, u), lerp(0, 1.8, u), -2.4).setFacing(1).setPose('run');
    } else if (t < 11.5) {
      // Pangolin drills cliff fissure -> Seal cracks -> Scorpion & Snake escape!
      mood = 'seal_storm';
      const crackP = smoothstep(5.8, 8.6, t);
      m?.setSealCrack(crackP);
      m?.setVineGrowth(0.12);

      const stormInt = smoothstep(6.0, 7.4, t) * (1.0 - smoothstep(10.6, 11.5, t));
      fx?.setSealStorm({ pos: [8.5, 3.2, -3.2], intensity: stormInt * .52 });
      flash = pulseBell(t, 6.5, 0.16) * 0.11;

      if (t < 7.2) {
        actors.pangolin?.setVisible(true).setPosition(7.5 + .34 * pulseBell(t, 6.48, .65), 2.2, -2.5).setFacing(1).setPose('hold')
          .setPhysicalBeat({ lean: .30 * pulseBell(t, 6.48, .65), still: .94 });
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
      const u = smoothstep(11.5, 12.74, t) * .41 + smoothstep(13.5, 14.64, t) * .59;
      const reach = smoothstep(12.5, 13.2, t) * (1 - smoothstep(13.45, 14, t));
      const plant = pulseBell(t, 15.1, .85);
      m?.setVineGrowth(lerp(0.12, 0.42, smoothstep(13.8, 16.0, t)));

      actors.grandpa?.setVisible(true)
        .setPosition(lerp(-4.4, -0.8, u), 0, lerp(-1.5, 1.45, u))
        .setFacing(1)
        .setPose('hold').setGroundedTravel(u, 3.6, 2.95).setDirectedReach(Math.max(reach, plant) * .86)
        .setPhysicalBeat({ lean: 0.22 * reach + 0.29 * plant, crouch: 0.10 * reach + 0.16 * plant, still: Math.max(reach, plant) * 0.85 });
      actors.pangolin?.setVisible(true)
        .setPosition(lerp(-3.97, -2.98, easeInOutQuad(u)), 0, lerp(0.25, 1.86, u))
        .setFacing(1)
        .setPose(u < 0.75 ? 'walk' : 'idle');
    } else if (t < 21.5) {
      // Calabash vine bursts into bloom & 7 glowing gourds appear in cascade
      m?.setSealCrack(0.7);
      const vineP = smoothstep(16.18, 18.5, t);
      m?.setVineGrowth(lerp(0.42, 1.0, vineP));

      for (let i = 0; i < 7; i++) {
        const gStart = 17.0 + i * 0.45;
        const gp = easeOutCubic(invLerp(gStart, gStart + 0.9, t));
        m?.setGourdState(i, {
          visible: gp > 0.02,
          scale: gp,
          glow: 0.24 + gp * 0.47,
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
      const liftP = smoothstep(23.8, 26, t);
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
        intensity: 0.42,
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
            .setPose(t < 28.8 ? 'leap' : 'hold')
            .setPhysicalBeat({ crouch: .11 * pulseBell(t, 28.81, .44), turn: .18 * grow, still: .82 });
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
          .setPose('hold').setDirectedReach(.7 * pulseBell(t, 31.78, .94))
          .setPhysicalBeat({ crouch: .085 * pulseBell(t, 33.2, .52),
            lean: -.24 * pulseBell(t, 31.72, .78) + .28 * pulseBell(t, 33.05, .73), still: .92 });

        // Boulder raised over head then smashed down onto (6.2, 0.2, 1.5)
        const throwU = invLerp(31.8, 33.2, t);
        const bX = lerp(dawaX + 0.7, 6.2, throwU);
        const lift = smoothstep(31.03, 31.8, t);
        const bY = t < 31.8 ? lerp(2.55, 5.35, lift) : lerp(5.35, 0.2, throwU * throwU);
        fx?.setDawaSmash({
          boulderPos: [bX, bY, 1.55],
          boulderScale: 1.32,
          boulderVisible: t < 33.6,
          shockPos: [6.2, 0.05, 1.5],
          shockProgress: smashU,
        });
        flash = pulseBell(t, 33.25, 0.15) * 0.10;

        // Toads & Boars charge then get launched sky-high on impact
        const baseFly = 33.23;
        const enemies = [
          { a: actors.toad,  sx: 6.5, ex: 13.0, ey: 5.5, z: 1.75 },
          { a: actors.toad2, sx: 7.5, ex: 14.4, ey: 6.8, z: 1.15 },
          { a: actors.boar,  sx: 6.9, ex: 12.6, ey: 4.8, z: 1.45 },
          { a: actors.boar2, sx: 8.2, ex: 15.0, ey: 5.8, z: 1.30 },
        ];
        enemies.forEach((e, idx) => {
          const fly = easeOutCubic(invLerp(baseFly + .065 * idx, 37.5, t));
          const ex = t < 33.2 ? lerp(e.sx + 2.5, e.sx, chargeU) : lerp(e.sx, e.ex, fly);
          const ey = t < 33.2 ? 0 : Math.sin(fly * Math.PI) * e.ey + fly * 1.5;
          e.a?.setVisible(true)
            .setPosition(ex, ey, e.z)
            .setFacing(-1)
            .setPose(t < 33.2 ? 'run' : 'struggle').setGroundedTravel(t < 33.2 ? chargeU : 1, -2.5, 0);
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
          .setGroundedTravel(Math.min(1, u / .72), 3.24, -.61)
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
        .setPose('hold')
        .setDirectedReach(.72 * pulseBell(t, 55.52, 1.05))
        .setPhysicalBeat({ lean: .14 * pulseBell(t, 56.1, 1.8), turn: .31 * beamInt, still: .86 });

      fx?.setErwaSense({
        origin: [58.9, 6.25, -1.1],
        target: [70.2, 2.5, -1.8],
        beamIntensity: beamInt * .58,
        earRipple: earInt * .40,
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
        const sneak = smoothstep(62.15, 66.03, t);
        actors.erwa?.setVisible(true)
          .setPosition(lerp(69.0, 70.6, sneak), 1.4, -1.4)
          .setFacing(1)
          .setPose('hold').setGroundedTravel(sneak, 1.6, 0);
        actors.snake?.setVisible(true)
          .setPosition(73.1, 2.0, -2.0)
          .setFacing(-1)
          .setPose('cast');
      } else {
        // 66.5..71s: Blinding crimson-white sword rays pierce Erwa's eyes!
        const blindP = invLerp(66.8, 69.4, t);
        const stagger = smoothstep(67.62, 69.64, t);
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
        const fall = invLerp(72.4, 75.62, t);
        actors.pangolin?.setVisible(true)
          .setPosition(lerp(59.2, 56.9, easeOutCubic(fall)), 4.6 + Math.sin(fall * Math.PI) * .4 - fall * fall * 7.8, lerp(-1.2, -0.4, fall))
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
      const openP = smoothstep(78.33, 79.44, t);
      p?.setDoorOpen(openP);
      const through = t >= 78.92;
      const runU = through ? smoothstep(78.92, 80.5, t) : smoothstep(76.12, 78.27, t);
      const sx = through ? lerp(119.44, 122.6, runU) : lerp(117.90, 119.44, runU);
      const sz = through ? lerp(2.58, 1.98, runU) : lerp(2.79, 2.58, runU);
      actors.sanwa?.setVisible(true).setPosition(sx, 0, sz).setFacing(1).setPose('hold')
        .setGroundedTravel(runU, through ? 3.16 : 1.54, through ? -.6 : -.21)
        .setDirectedReach(pulseBell(t, 78.31, .57))
        .setPhysicalBeat({ lean: .28 * pulseBell(t, 78.3, .54), turn: .18, still: 0.26 });
      fx?.setSanwaIron({ pos: [sx, 0, sz], shieldIntensity: pulseBell(t, 78.43, .46) * .08 });
      flash = pulseBell(t, 78.6, 0.14) * 0.09;
    } else if (t < 86.0) {
      // Copper head & iron arms deflecting 24 wasp poison needles + shattering Centipede's axe!
      p?.setDoorOpen(1);
      const u = smoothstep(80.5, 82.6, t) * .58 + smoothstep(84.15, 84.77, t) * .42;
      const sx = lerp(124.2, 127.8, u);
      actors.sanwa?.setVisible(true).setPosition(sx, 0, -0.35).setFacing(1).setPose('hold').setGroundedTravel(u, 3.6, 0)
        .setDirectedReach(pulseBell(t, 84.77, .64))
        .setPhysicalBeat({ lean: -.13 * pulseBell(t, 83.2, .82) + .24 * pulseBell(t, 84.77, .65), still: .33 });

      actors.wasp?.setVisible(true).setPosition(130.6, 2.7 + Math.sin(t * 7) * 0.2, -0.6).setFacing(-1).setPose('attack');
      actors.wasp2?.setVisible(true).setPosition(131.5, 3.4 + Math.cos(t * 7) * 0.2, -0.1).setFacing(-1).setPose('attack');

      const centX = t < 84.8 ? lerp(131.2, 129.0, invLerp(82.5, 84.8, t)) : lerp(129.0, 131.8, invLerp(84.8, 86.0, t));
      actors.centipede?.setVisible(true)
        .setPosition(centX, 0, -0.45)
        .setFacing(-1)
        .setPose(t < 84.8 ? 'attack' : 'struggle');

      fx?.setSanwaIron({
        pos: [sx, 0, -0.35],
        shieldIntensity: .38 + .26 * pulseBell(t, 84.76, .7),
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
      const sy = t < 88.8 ? Math.sin(leapU * Math.PI * 0.69) * 2.4 : lerp(2.0, 0, easeInOutQuad(landU));
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
      const thrust = pulseBell(t, 92.9, 1.04);
      const recoil = smoothstep(93.92, 95.35, t);
      const hold = smoothstep(94.63, 96.85, t);
      const sx = 131.05 + 0.34 * thrust - 0.62 * recoil;
      const sy = 0.2 - 0.12 * hold;
      const sz = 1.13 + 0.32 * recoil;
      actors.sanwa?.setVisible(true)
        .setPosition(sx, sy, sz)
        .setFacing(1)
        .setPose('hold').setDirectedReach(.87 * thrust - .43 * recoil)
        .setPhysicalBeat({ lean: 0.31 * thrust - 0.37 * recoil + 0.17 * hold, turn: -0.28 * recoil, crouch: 0.08 * hold, still: 0.38 * hold });
      actors.snake?.setVisible(true)
        .setPosition(133.8 + 0.30 * recoil, 0.25, -1.0)
        .setFacing(-1)
        .setPose(wrapP < 0.85 ? 'cast' : 'heroic')
        .setPhysicalBeat({ lean: 0.26 * thrust, turn: -0.13 * hold, still: 0.72 * hold });

      if (t >= 97.0) {
        actors.scorpion?.setVisible(true).setPosition(127.05, 0, -1.55).setFacing(1).setPose('heroic');
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
      const enterU = smoothstep(102.06, 105.17, t);
      const siwaX = lerp(123.3, 125.61, enterU);
      const wuwaX = lerp(124.7, 127.36, enterU);
      const fireInt = smoothstep(105.65, 106.55, t) * (1 - .46 * smoothstep(108.4, 111.4, t));
      const waterInt = smoothstep(108.2, 109.5, t);

      actors.siwa?.setVisible(true).setPosition(siwaX, 0, .96).setFacing(1).setPose('hold').setGroundedTravel(enterU, 2.31, 0)
        .setDirectedReach(.72 * pulseBell(t, 105.74, 1.05))
        .setPhysicalBeat({ lean: .23 * fireInt, turn: .15 * fireInt, still: .36 });
      actors.wuwa?.setVisible(true).setPosition(wuwaX, 0, 1.80).setFacing(1).setPose('hold').setGroundedTravel(enterU, 2.66, 0)
        .setDirectedReach(.82 * pulseBell(t, 108.55, 1.12))
        .setPhysicalBeat({ lean: -.17 * waterInt, turn: -.16 * waterInt, still: .30 });

      fx?.setSiwaFire({ origin: [siwaX + 0.7, 1.5, 1.0], target: [133.5, 1.4, -0.9], intensity: fireInt * .63 });
      fx?.setWuwaWater({ origin: [wuwaX + 0.7, 1.4, 1.86], target: [133.8, 1.2, 1.04], intensity: waterInt * .56 });

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
        .setPose(t < 116.2 ? 'hold' : 'drunk').setDirectedReach(.8 * pulseBell(t, 115.54, .95))
        .setPhysicalBeat({ lean: 0.33 * pulseBell(t, 116.2, 1.25), crouch: 0.11 * pulseBell(t, 116.2, 1.25) });
      const check = smoothstep(116.25, 117.55, t);
      actors.siwa?.setVisible(true).setPosition(131.6 - 0.87 * check, 0, 0.15 + 0.65 * check)
        .setFacing(-1).setPose('hold').setGroundedTravel(check, -.87, .65)
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
        .setPose(frozen ? 'frozen' : 'hold')
        .setDirectedReach(.79 * pulseBell(t, 121.5, .91))
        .setPhysicalBeat({ lean: -.29 * pulseBell(t, 122.55, 1.16), still: .76 });
      actors.snake?.setVisible(true).setPosition(134.8, 0.1, -0.2).setFacing(-1).setPose('cast');

      // Dying fire vs overpowering blizzard
      const dyingFire = 1.0 - smoothstep(119.8, 122.2, t);
      if (dyingFire > 0.02) {
        fx?.setSiwaFire({ origin: [132.8, 1.6, 0.5], target: [134.4, 1.6, 0.0], intensity: dyingFire });
      }
      fx?.setBanquetTraps({
        ruyiOrigin: [134.1, 2.2, -0.1],
        iceTarget: [132.2, 1.6, 0.5],
        blizzardIntensity: blizInt * .59,
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
      const u = smoothstep(132.12, 136.85, t);
      const lx = lerp(119.0, 124.2, u);
      actors.liuwa?.setVisible(true).setPosition(lx, 0.1, 0.75).setFacing(1).setStealth(0.72 + .15 * pulseBell(t, 134.12, .85)).setPose('hold').setGroundedTravel(u, 5.2, 0);
      fx?.setLiuwaTrick({ ghostPos: [lx, 1.2, 0.75], ghostPulse: .34 });
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
        ghostPulse: .34,
        powderPos: [129.5, 1.4, -0.5],
        powderProgress: invLerp(137.3, 139.6, t),
        flowerPos: flowerOnScorpion ? [131.2, 2.55, -0.4] : [lx - 0.35, 1.25, -0.2],
        flowerVisible: t >= 138.0,
      });
    } else if (t < 148.0) {
      // Scorpion & Centipede chase the yellow flower and knock each other out!
      p?.setRuyiOnCouch(true);
      const clash = smoothstep(142.64, 145.6, t);
      const ko = invLerp(145.6, 148.0, t);
      const sx = t < 145.6 ? lerp(129.7, 130.85, clash) : lerp(130.85, 129.72, ko);
      const cx = t < 145.6 ? lerp(134.15, 132.55, clash) : lerp(132.55, 133.82, ko);

      actors.scorpion?.setVisible(true).setPosition(sx, t < 145.6 ? 0 : -ko * 0.18, 2.25).setFacing(1).setPose(t < 145.6 ? 'hold' : 'drunk')
        .setPhysicalBeat({ lean: .22 * clash - .55 * pulseBell(t, 145.84, .48), still: .6 });
      actors.centipede?.setVisible(true).setPosition(cx, t < 145.6 ? 0 : -ko * 0.18, 2.25).setFacing(-1).setPose(t < 145.6 ? 'hold' : 'drunk')
        .setPhysicalBeat({ lean: .23 * clash - .57 * pulseBell(t, 145.84, .48), still: .6 });
      const peek = smoothstep(145.4, 146.8, t);
      actors.liuwa?.setVisible(true).setPosition(127.68 + 0.25 * peek, 0.1, 3.18).setFacing(1).setStealth(0.65).setPose('idle')
        .setPhysicalBeat({ lean: 0.22 * peek, crouch: 0.18 * (1 - peek), still: 0.81 });

      fx?.setLiuwaTrick({
        flowerPos: [sx + 0.35, 2.5 - (t < 145.6 ? 0 : ko * 0.5), 2.48],
        flowerVisible: true,
      });
      flash = pulseBell(t, 145.6, 0.14) * 0.08;
    } else if (t < 153.0) {
      // Liuwa sneaks to Demon Couch & steals Golden Ruyi!
      const contact = pulseBell(t, 150.2, .71);
      const stolen = t >= 150.2;
      p?.setRuyiOnCouch(!stolen);

      const travel = stolen ? smoothstep(150.35, 153, t) : smoothstep(148, 149.98, t);
      const lx = stolen ? lerp(136.92, 135.62, travel) : lerp(137.82, 136.92, travel);
      const lz = stolen ? lerp(-.72, .08, travel) : lerp(-.15, -.72, travel);
      const couch = p?.getRuyiWorldPos(this._tmpVecB);
      const liftRuyi = smoothstep(150.20, 150.83, t);
      const held = [lx - .34, 1.48, lz + .34];
      actors.liuwa?.setVisible(true).setPosition(lx, 0.1, lz).setFacing(-1).setStealth(0.34 + .30 * (1 - contact)).setPose('hold')
        .setGroundedTravel(travel, stolen ? -1.30 : -.90, stolen ? .80 : -.57).setDirectedReach(contact)
        .setPhysicalBeat({ lean: .18 * contact, turn: -.28 * contact, still: .68 * contact });
      actors.snake?.setVisible(true).setPosition(134.5, 0.1, -1.75).setFacing(-1).setPose('drunk');

      fx?.setLiuwaTrick({
        ghostPos: [lx, 1.1, lz],
        ghostPulse: .09 * (1 - .85 * contact),
        ruyiPos: couch ? held.map((coord, i) => lerp(couch.getComponent(i), coord, liftRuyi)) : held,
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
      const climb = smoothstep(154.5, 155.25, t);
      const crossRim = smoothstep(154.98, 155.65, t);
      const land = smoothstep(155.59, 156.37, t);
      actors.wuwa?.setVisible(true)
        .setPosition(128.2 - .12 * crossRim, (.55 + 1.04 * climb) * (1 - land), .5 + 2.31 * crossRim)
        .setFacing(1).setPose(t < 154.5 ? 'drunk' : t < 156.37 ? 'leap' : 'heroic');

      if (t >= 155.0) {
        actors.dawa?.setVisible(true).setPosition(123.0, 0, 2.45).setFacing(1).setPose('heroic');
        actors.erwa?.setVisible(true).setPosition(124.6, 0, 1.65).setFacing(1).setPose('heroic');
        actors.sanwa?.setVisible(true).setPosition(126.05, 0, 2.51).setFacing(1).setPose('heroic');
      }

      fx?.setLiuwaTrick({
        ruyiPos: [130.6, 1.5, 0.75],
        ruyiVisible: true,
        ruyiBeamTarget: [132.2, 1.6, 0.5],
        ruyiBeamIntensity: beamInt * .57,
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
      al?.setCauldron({ fire: .22, lidOpen: 0, shattered: 0 });
      const rise = smoothstep(158, 160.95, t);
      const bow = pulseBell(t, 162.13, 1.27);
      actors.qiwa?.setVisible(true)
        .setPosition(195.0, lerp(0.15, 0.52, rise), 2.15)
        .setFacing(-1)
        .setCorrupted(1.0)
        .setPose('hold').setDirectedReach(.68 * smoothstep(162.55, 163.90, t))
        .setPhysicalBeat({ lean: .52 * bow, turn: -.28 * bow, crouch: .105 * bow, still: .93 });
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
      al?.setCauldron({ fire: .25, lidOpen: 0, shattered: 0 });
      const gourdPos = this._tmpVecA.set(196.0, 2.32, 2.15);
      const vortexInt = smoothstep(164.5, 166.5, t);

      actors.qiwa?.setVisible(true).setPosition(197.2, 0.52, 1.95).setFacing(-1).setCorrupted(1.0).setPose('cast');
      actors.snake?.setVisible(true).setPosition(198.6, 0.52, 1.25).setFacing(-1).setPose('heroic');

      fx?.setQiwaGourd({
        pos: gourdPos,
        targetPos: [191.6, 1.68, 1.75],
        visible: true,
        scale: 1.25,
        corrupted: 1.0,
        vortexIntensity: vortexInt * .39,
      });

      // Six elder brothers rush in then spiral one-by-one into Qiwa's gourd (including unstealthed Liuwa!)
      const brothers = [
        { a: actors.dawa,  x: 193.36, z: 2.87, suckStart: 168.0, suckEnd: 172.2 },
        { a: actors.erwa,  x: 192.24, z: 0.58, suckStart: 169.2, suckEnd: 173.4 },
        { a: actors.sanwa, x: 191.13, z: 3.72, suckStart: 170.2, suckEnd: 174.5 },
        { a: actors.siwa,  x: 189.98, z: 0.44, suckStart: 171.2, suckEnd: 175.6 },
        { a: actors.wuwa,  x: 189.00, z: 2.98, suckStart: 172.0, suckEnd: 176.6 },
        { a: actors.liuwa, x: 194.42, z: 4.30, suckStart: 173.0, suckEnd: 178.4, isLiuwa: true },
      ];

      brothers.forEach((b, i) => {
        const sp = invLerp(b.suckStart, b.suckEnd, t);
        if (sp >= 0.995) return;
        const approach = smoothstep(164 + i * .11, 167.23 + i * .14, t);
        b.a?.setVisible(true)
          .setPosition(lerp(b.x - 1.6, b.x, approach), 0.52, b.z + (i % 2 ? -0.38 : 0.45) * (1 - approach))
          .setFacing(1);
        if (b.isLiuwa) {
          // Stealth forced to break down as vortex grabs Liuwa!
          b.a?.setStealth(lerp(0.85, 0.0, smoothstep(171.5, 174.0, t)));
        }
        if (sp > 0.01) {
          b.a?.setPose('sucked').setSuction(gourdPos, sp)
            .setGiantScale(1 - .63 * smoothstep(.14, .87, sp));
        } else {
          b.a?.setPose(approach < .99 ? 'hold' : 'struggle')
            .setGroundedTravel(approach, 1.6, i % 2 ? .38 : -.45)
            .setDirectedReach(-.44 * pulseBell(t, b.suckStart - .33, .79));
        }
      });
    } else {
      // 179..188s: All 7 brothers cast into the blazing Three-Legged Bronze Cauldron!
      const dropU = invLerp(179.0, 182.2, t);
      const arcU = easeInOutQuad(dropU);
      const lidClose = 1.0 - smoothstep(182.0, 184.0, t);
      al?.setCauldron({ fire: .2 + .34 * pulseBell(t, 182.35, .92), lidOpen: lidClose, shattered: 0 });

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
    const grandpa = actors.grandpa;
    const scorpion = actors.scorpion;
    const fire = 0.18 + 0.38 * pulseBell(t, 194.9, 1.3)
      + 0.32 * pulseBell(t, 207.9, 1.4);
    const shatter = smoothstep(207.83, 209.27, t);
    const rim = 199.04;

    al?.setSealMountain(0);
    al?.setCauldron({ fire, lidOpen: 0.09 + 0.91 * smoothstep(197.46, 198.48, t), shattered: shatter });

    if (t < 207.83) {
      const walk = smoothstep(188, 192.6, t);
      const fall = smoothstep(194.86, 195.5, t);
      const rise = smoothstep(196.25, 197.32, t) * (1 - smoothstep(197.85, 198.7, t));
      const body = {
        x: lerp(189.6, 192.67, walk) - 0.25 * fall + 0.36 * rise,
        y: 0.52 + 0.15 * fall - 0.07 * rise,
        z: 1.62 + 0.32 * fall,
        tilt: 0.10 * (1 - walk) + 0.28 * fall + 0.14 * rise,
        yaw: 0.27 + 0.14 * rise,
      };
      const arm = -1.27 + 0.62 * fall - 0.96 * rise + 0.67 * smoothstep(198.5, 199.15, t);
      grandpa?.setVisible(true).setPosition(body.x, body.y, body.z).setFacing(1)
        .setPose('hold')
        .setPhysicalBeat({ lean: body.tilt, turn: body.yaw, still: 1 })
        .setLotusArm(arm).setAuraIntensity(0.08).setGroundedTravel(walk, 3.07, 0);
      if (grandpa) grandpa.group.scale.y = 1 - 0.22 * fall + 0.06 * rise;
      if (grandpa && t >= 194.8) grandpa.hurtFlash = pulseBell(t, 194.96, 0.17) * 0.38;

      const advance = smoothstep(192.75, 194.95, t);
      const lunge = pulseBell(t, 194.86, 0.80);
      const recoil = smoothstep(195.05, 195.85, t) + 0.38 * smoothstep(199.1, 201.7, t);
      const scorpionX = 197.32 - 2.31 * advance + 1.76 * recoil;
      scorpion?.setVisible(true).setPosition(scorpionX, 0.52, 1.38)
        .setFacing(-1).setPose('hold').setAuraIntensity(0.14)
        .setPhysicalBeat({ lean: lunge * 0.26 - 0.17 * recoil, turn: 0.42 - lunge * 0.36, still: 1 });
      if (lunge > .012) fx?.setScorpionStrike({
        base: [scorpionX + .25, 3.18, 1.2],
        target: [lerp(scorpionX - .38, body.x + .49, lunge), lerp(3.86, 2.0, lunge), lerp(1.28, body.z + .09, lunge)],
        strength: lunge,
      });
    }

    if (t < 197.48) {
      // Grip will be resolved against the posed wrist after the cast update.
      fx?.setLotusMiracle({ lotusPos: [192.6, 1.3, 2.5], lotusVisible: true, bloomProgress: 0.26, paperLotus: true });
    } else if (t < rim) {
      const u = invLerp(197.48, rim, t);
      // Seamless launch: this is the same fixed pose as the release frame.
      const arm = -1.61;
      const start = this._tmpVecA;
      armGripAtRelease(start, arm);
      fx?.setLotusMiracle({
        lotusPos: [lerp(start.x, 195, u), lerp(start.y + 0.08, 3.24, u) + 1.83 * 4 * u * (1 - u), lerp(start.z + 0.025, -1.65, u)],
        lotusVisible: true, bloomProgress: 0.26 + 0.18 * u, paperLotus: true,
      });
    } else if (t < 207.83) {
      const bloom = smoothstep(199.46, 201.7, t);
      const link = smoothstep(201.3, 207.04, t);
      fx?.setLotusMiracle({
        lotusPos: [195, lerp(3.24, 4.06, bloom), -1.65],
        lotusVisible: t < 199.16 || t >= 199.46,
        bloomProgress: lerp(0.44, 1, bloom), paperLotus: true,
        orbsCenter: [195, 4.18, -1.12], orbsProgress: link,
      });
    } else {
      const seven = [actors.dawa, actors.erwa, actors.sanwa, actors.siwa, actors.wuwa, actors.liuwa, actors.qiwa];
      seven.forEach((actor, i) => {
        const u = easeOutCubic(invLerp(207.85 + i * 0.038, 210.9 + i * 0.038, t));
        const x = (i - 3) * 1.45;
        const ground = 0.51;
        const lift = Math.sin(Math.PI * u) * 1.6;
        actor?.setVisible(u > 0.08).setGiantScale(lerp(.32, 1, smoothstep(.12, .80, u)))
          .setPosition(195 + x * lerp(.45, 1, u), lerp(2.48 + (i % 2) * .33, ground, u) + lift,
            lerp(-.72 + (i % 2 ? -.53 : .34), 1.23 - (1 - Math.abs(i - 3) / 3) * 1.12, u))
          .setPose(u < 0.84 ? 'leap' : 'heroic').setFacing(i < 3 ? 1 : -1)
          .setCorrupted(0).setAuraIntensity(0.15 + 0.23 * (1 - u));
      });
      fx?.setLotusMiracle({
        lotusPos: [195, 4.06 + shatter * 0.45, -1.65],
        lotusVisible: shatter < 0.7, bloomProgress: 1, paperLotus: true,
        orbsCenter: [195, 4.18, -1.12], orbsProgress: 1 - smoothstep(207.83, 208.76, t),
      });
    }
    return { mood: 'alchemy_inferno', flash: 0.018 * pulseBell(t, 194.91, 0.15)
      + 0.035 * pulseBell(t, 199.09, 0.26) + 0.105 * pulseBell(t, 207.99, 0.24) };

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

      // Two staggered floor lanes keep all seven silhouettes separate on the final axis.
      const heroes = [actors.dawa, actors.erwa, actors.sanwa, actors.siwa, actors.wuwa, actors.liuwa, actors.qiwa];
      const blocking = heroes.map((_, i) => {
        const lane = i % 2 ? .20 : 2.55;
        return [187.95 + i * 1.22 + .54 * advance, .51, lane + .21 * advance];
      });
      heroes.forEach((actor, i) => {
        actor?.setVisible(true).setPosition(...blocking[i]).setFacing(1).setCorrupted(0)
          .setPose('hold').setGroundedTravel(advance, .54, .21)
          .setDirectedReach(.82 * pulseBell(t, 217.2 + i * .068, .87))
          .setPhysicalBeat({ lean: 0.17 * advance * (1 - resolve), still: 0.78 * resolve });
      });

      const [qx, , qz] = blocking[6];
      const gourdPos = [qx + .88, 2.23, qz + .16];
      const targetPos = [197.6, 1.5 - sinkY * 0.4, 1.60];
      fx?.setQiwaGourd({
        pos: gourdPos,
        targetPos,
        visible: true,
        scale: 0.92,
        corrupted: 0,
        vortexIntensity: .23 * smoothstep(215.3, 217.4, t),
        petrifyRay: smoothstep(216.8, 218.5, t),
      });

      if (t < 217.8) {
        const [fireX, fireY, fireZ] = blocking[3];
        const [waterX, waterY, waterZ] = blocking[4];
        fx?.setSiwaFire({ origin: [fireX + 0.4, fireY + 1.0, fireZ], target: [197.5, 1.6, 1.55], intensity: .45 * smoothstep(215.9, 216.9, t) });
        fx?.setWuwaWater({ origin: [waterX + 0.4, waterY + 1.0, waterZ], target: [197.4, 1.3, 1.65], intensity: .45 * smoothstep(215.9, 216.9, t) });
      }

      const villains = [
        { a: actors.snake,     x: 197.2, z: 1.60 },
        { a: actors.scorpion,  x: 198.4, z: 1.80 },
        { a: actors.centipede, x: 197.25, z: -0.75 },
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
      const u = smoothstep(228.0, 233.65, t);

      actors.xiaojingang?.setVisible(true)
        .setPosition(lerp(194.7, 195.0, u), lerp(5.1, 6.0, u), lerp(-0.2, 0.38, u))
        .setFacing(1)
        .setGiantScale(lerp(0.85, 1.18, u))
        .setAuraIntensity(0.48)
        .setPose('heroic')
        .setPhysicalBeat({ lean: 0.24 * (1 - u), turn: -.39 * (1 - u) + .105 * smoothstep(233.5, 236.7, t), still: .91 * u });

      fx?.setLotusMiracle({
        orbsCenter: [195.0, lerp(6.8, 7.5, u), -0.6],
        orbsProgress: .88 * (1 - smoothstep(234.1, 239.52, t)),
        paperLotus: true,
      });
      flash = pulseBell(t, 228.4, 0.16) * 0.10;
    }

    return { mood: 'apotheosis_gold', flash };
  }
}

export default FilmDirector;
