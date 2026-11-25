import * as THREE from 'three';
import { createPaperStandardMaterial } from '../core/PaperMaterials.js';

const SEVEN_COLORS = [
  0xe6392e, // 1 Red
  0xff8c1a, // 2 Orange
  0xffd633, // 3 Yellow
  0x2ecc71, // 4 Green
  0x25c4d9, // 5 Cyan
  0x3b7cff, // 6 Blue
  0xa349e6, // 7 Purple
];

const FIVE_WEB_COLORS = [0xff3b30, 0xffd633, 0x34c759, 0x25d4ff, 0xc742ff];

const UP_VEC = new THREE.Vector3(0, 1, 0);
const _tmpA = new THREE.Vector3();
const _tmpB = new THREE.Vector3();
const _tmpDir = new THREE.Vector3();
const _tmpMid = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
const _tmpColor = new THREE.Color();

function toVec3(input, target) {
  if (!input) return target.set(0, 0, 0);
  if (input.isVector3) return target.copy(input);
  if (Array.isArray(input)) {
    return target.set(input[0] ?? 0, input[1] ?? 0, input[2] ?? 0);
  }
  return target.set(input.x ?? 0, input.y ?? 0, input.z ?? 0);
}

function clamp01(v) {
  return Math.max(0, Math.min(1, Number(v) || 0));
}

function hash1(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/**
 * Orients a Y-aligned mesh (length 1 along +Y from 0..1 or -0.5..0.5) between from and to.
 */
function orientSegment(obj, from, to, centered = true) {
  _tmpDir.subVectors(to, from);
  const dist = _tmpDir.length();
  if (dist < 0.0001) {
    obj.visible = false;
    return 0;
  }
  if (centered) {
    _tmpMid.addVectors(from, to).multiplyScalar(0.5);
    obj.position.copy(_tmpMid);
  } else {
    obj.position.copy(from);
  }
  _tmpDir.divideScalar(dist);
  _tmpQuat.setFromUnitVectors(UP_VEC, _tmpDir);
  obj.quaternion.copy(_tmpQuat);
  return dist;
}

function makeHelixTubeGeometry(turns, radiusStart, radiusEnd, length, tubeRadius, tubularSegs = 48) {
  const pts = [];
  for (let i = 0; i <= tubularSegs; i++) {
    const u = i / tubularSegs;
    const angle = u * Math.PI * 2 * turns;
    const r = THREE.MathUtils.lerp(radiusStart, radiusEnd, u);
    pts.push(new THREE.Vector3(Math.cos(angle) * r, u * length, Math.sin(angle) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  return new THREE.TubeGeometry(curve, tubularSegs, tubeRadius, 6, false);
}

function makeGlowPlane(texture, color, w, h, opacity = 0.85, additive = true) {
  const geo = new THREE.PlaneGeometry(w, h);
  const mat = new THREE.MeshBasicMaterial({
    map: texture ?? null,
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geo, mat);
}

function makeGourdGeometry() {
  // Canon double-bulb calabash gourd lathe profile (bottom at y=-0.55, mouth at y=+0.65)
  const points = [
    new THREE.Vector2(0.0, -0.55),
    new THREE.Vector2(0.22, -0.53),
    new THREE.Vector2(0.40, -0.40),
    new THREE.Vector2(0.45, -0.22),
    new THREE.Vector2(0.36, -0.04),
    new THREE.Vector2(0.18, 0.08), // waist
    new THREE.Vector2(0.28, 0.22),
    new THREE.Vector2(0.30, 0.36),
    new THREE.Vector2(0.20, 0.50),
    new THREE.Vector2(0.10, 0.58),
    new THREE.Vector2(0.12, 0.65), // flared lip
    new THREE.Vector2(0.06, 0.65),
  ];
  return new THREE.LatheGeometry(points, 20);
}

function makeRuyiGroup() {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xffd24d,
    emissive: 0x7a4e08,
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.72,
  });
  const jadeMat = new THREE.MeshStandardMaterial({
    color: 0x3ef0a8,
    emissive: 0x107a52,
    emissiveIntensity: 0.6,
    roughness: 0.3,
    metalness: 0.15,
  });

  // S-curved Golden Ruyi handle
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, -0.08, 0),
    new THREE.Vector3(-0.18, 0.06, 0),
    new THREE.Vector3(0.22, -0.04, 0),
    new THREE.Vector3(0.54, 0.10, 0),
  ]);
  const handle = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.055, 8, false), goldMat);
  group.add(handle);

  // Cloud-head Ruyi crown
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), goldMat);
  head.scale.set(1.25, 0.85, 0.55);
  head.position.set(0.62, 0.14, 0);
  group.add(head);

  const jewel = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), jadeMat);
  jewel.position.set(0.62, 0.14, 0.06);
  group.add(jewel);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 16), goldMat);
  ring.position.set(-0.58, -0.10, 0);
  group.add(ring);

  return group;
}

function makeYellowFlowerGroup() {
  const group = new THREE.Group();
  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xffe436,
    emissive: 0x996d00,
    emissiveIntensity: 0.55,
    roughness: 0.45,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0xff7b1a,
    emissive: 0x993300,
    emissiveIntensity: 0.45,
    roughness: 0.5,
  });
  const petalGeo = new THREE.SphereGeometry(0.12, 8, 8);
  petalGeo.scale(1.25, 0.72, 0.35);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, petalMat);
    petal.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0);
    petal.rotation.z = a;
    group.add(petal);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 10), centerMat);
  core.position.z = 0.03;
  group.add(core);
  return group;
}

export class PowersAndTrapsFX {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.root = new THREE.Group();
    this.root.name = 'PowersAndTrapsFX';
    if (scene) scene.add(this.root);

    this.glowTex = assets?.getTexture?.('proc_soft_glow') ?? null;
    this.inkRingTex = assets?.getTexture?.('proc_ink_ring') ?? null;

    // Active state records refreshed deterministically each frame
    this._active = {};

    this._buildSealStorm();
    this._buildDawaSmash();
    this._buildDawaMireTrap();
    this._buildErwaSense();
    this._buildErwaBlindTrap();
    this._buildSanwaIron();
    this._buildSanwaSilkTrap();
    this._buildSiwaFire();
    this._buildWuwaWater();
    this._buildBanquetTraps();
    this._buildLiuwaTrick();
    this._buildQiwaGourd();
    this._buildLotusMiracle();

    // Articulated chitin insert used only for the short Scorpion contact.
    this._strike = new THREE.Group();
    this._strikePoints = Array.from({length: 9}, () => new THREE.Vector3());
    const shell = new THREE.MeshStandardMaterial({
      color: 0x794a39, emissive: 0x241710, emissiveIntensity: 0.32, roughness: 0.79,
    });
    const tip = new THREE.MeshStandardMaterial({ color: 0x442f33, roughness: 0.85 });
    const shellGeo = new THREE.CylinderGeometry(.81, 1, 1, 7, 1);
    for (let i=0; i<7; i++) this._strike.add(new THREE.Mesh(shellGeo, shell));
    this._strike.add(new THREE.Mesh(new THREE.ConeGeometry(1, 1, 7), tip));
    this.root.add(this._strike);

    this.resetAll();
  }

  setScorpionStrike({ base, target, strength }) {
    const curveStart = this._strikePoints[0].fromArray(base);
    const curveEnd = this._strikePoints[8].fromArray(target);
    this._strike.visible = strength > .012;
    for (let i=1; i<8; i++) {
      const u = i / 8;
      this._strikePoints[i].lerpVectors(curveStart, curveEnd, u);
      this._strikePoints[i].y += Math.sin(u * Math.PI) * (.58 + .34 * strength);
      this._strikePoints[i].z += Math.sin(u * Math.PI) * .16;
    }
    for (let i=0; i<8; i++) {
      const part = this._strike.children[i];
      const dist = orientSegment(part, this._strikePoints[i], this._strikePoints[i+1]);
      const r = .225 - .019 * i;
      part.scale.set(r, dist + (i === 7 ? 0 : .075), r);
    }
  }

  _tex(key) {
    return this.assets?.getTexture?.(key) ?? null;
  }

  _modelOrPlane(key, color, w, h, opacity = 0.9, additive = false, pivotBottom = false) {
    const m3d = this.assets?.instantiateModel?.(key, {
      fitSize: Math.max(w, h),
      centerOrigin: !pivotBottom,
      pivotBottom,
      opacityProxy: true,
      initialOpacity: opacity,
      castShadow: false,
      receiveShadow: false,
    });
    if (m3d) return m3d;
    return makeGlowPlane(this._tex(key), color, w, h, opacity, additive);
  }

  // =========================================================================
  // 1. Act 1: Seal Storm & Grandpa Spiderweb Snare
  // =========================================================================
  _buildSealStorm() {
    const g = new THREE.Group();
    const stormCore = new THREE.Group();
    g.add(stormCore);

    const aura = makeGlowPlane(this.glowTex, 0x7b2cff, 7.5, 7.5, 0.7);
    stormCore.add(aura);

    const ribbons = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0x26083b : 0x7c2de0,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.4 + i * 0.85, 0.11, 8, 32), mat);
      ring.rotation.x = Math.PI * 0.38 + i * 0.25;
      ring.rotation.y = i * 0.7;
      stormCore.add(ring);
      ribbons.push(ring);
    }

    // 4 jagged purple-white lightning bolts
    const bolts = [];
    const segs = 12;
    for (let b = 0; b < 4; b++) {
      const positions = new Float32Array(segs * 3);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({
        color: b % 2 === 0 ? 0xe5c7ff : 0x9b4dff,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      stormCore.add(line);
      bolts.push({ line, positions, segs });
    }

    // Spiderweb snare strands + wrapping rings
    const webGroup = new THREE.Group();
    g.add(webGroup);
    const webLines = [];
    for (let i = 0; i < 6; i++) {
      const pos = new Float32Array(6);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? 0xeadcff : 0xb382ff,
        transparent: true,
        opacity: 0.88,
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      webGroup.add(line);
      webLines.push({ line, pos });
    }
    const snareRings = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xe6d6ff,
        transparent: true,
        opacity: 0.75,
        wireframe: false,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.65 + i * 0.14, 0.035, 6, 20), mat);
      ring.rotation.x = Math.PI * 0.5 + (i - 1) * 0.45;
      webGroup.add(ring);
      snareRings.push(ring);
    }

    this.root.add(g);
    this._fxSealStorm = { group: g, stormCore, aura, ribbons, bolts, webGroup, webLines, snareRings };
  }

  setSealStorm({ pos, intensity = 0, webFrom, webTo, webProgress = 0 } = {}) {
    const s = this._active.sealStorm;
    s.active = intensity > 0.005 || webProgress > 0.005;
    toVec3(pos, s.pos);
    s.intensity = clamp01(intensity);
    s.hasWeb = Boolean(webFrom && webTo && webProgress > 0.005);
    if (webFrom) toVec3(webFrom, s.webFrom);
    if (webTo) toVec3(webTo, s.webTo);
    s.webProgress = clamp01(webProgress);
    this._fxSealStorm.group.visible = s.active;
  }

  // =========================================================================
  // 2. Act 2: Dawa Giant Boulder & Ground Shockwave
  // =========================================================================
  _buildDawaSmash() {
    const g = new THREE.Group();

    // Sculpted origami boulder
    const rockGeo = new THREE.DodecahedronGeometry(1.15, 1);
    const pAttr = rockGeo.attributes.position;
    for (let i = 0; i < pAttr.count; i++) {
      const vx = pAttr.getX(i);
      const vy = pAttr.getY(i);
      const vz = pAttr.getZ(i);
      const jitter = 0.86 + 0.28 * hash1(i * 3.17 + vx * 5.2 + vy * 7.1);
      pAttr.setXYZ(i, vx * jitter * 1.12, vy * jitter * 0.92, vz * jitter);
    }
    rockGeo.computeVertexNormals();
    const rockMat = createPaperStandardMaterial({
      color: 0x5d7268,
      roughness: 0.88,
      flatShading: true,
    });
    const boulder = new THREE.Mesh(rockGeo, rockMat);
    boulder.castShadow = true;
    boulder.receiveShadow = true;
    g.add(boulder);

    // Shockwave cluster
    const shockGroup = new THREE.Group();
    g.add(shockGroup);

    const vfxPlane = this._modelOrPlane('vfx1', 0xffd27a, 4.8, 4.8, 0.92, true);
    vfxPlane.rotation.x = -Math.PI * 0.5;
    vfxPlane.position.y = 0.08;
    shockGroup.add(vfxPlane);

    const inkRing = makeGlowPlane(this.inkRingTex, 0xffe49c, 5.2, 5.2, 0.85, true);
    inkRing.rotation.x = -Math.PI * 0.5;
    inkRing.position.y = 0.12;
    shockGroup.add(inkRing);

    const ringTorus = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.12, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffb84d,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ringTorus.rotation.x = Math.PI * 0.5;
    ringTorus.position.y = 0.14;
    shockGroup.add(ringTorus);

    // 14 flying sculpted rock chips (compact pebbles scattering cleanly along shockwave rim)
    const chipGeo = new THREE.TetrahedronGeometry(0.14, 0);
    const chipMat = createPaperStandardMaterial({ color: 0x6f7f73, flatShading: true });
    const chips = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(chipGeo, chipMat);
      m.castShadow = true;
      shockGroup.add(m);
      const ang = (i / 14) * Math.PI * 2 + hash1(i * 4.3) * 0.35;
      chips.push({
        mesh: m,
        ang,
        speed: 4.6 + hash1(i * 9.1) * 4.8,
        vy: 3.4 + hash1(i * 5.7) * 3.2,
        spin: 5 + hash1(i * 2.1) * 8,
        baseScale: 0.72 + hash1(i * 6.3) * 0.65,
      });
    }

    this.root.add(g);
    this._fxDawaSmash = { group: g, boulder, shockGroup, vfxPlane, inkRing, ringTorus, chips };
  }

  setDawaSmash({ boulderPos, boulderScale = 1, boulderVisible = false, shockPos, shockProgress = 0 } = {}) {
    const s = this._active.dawaSmash;
    s.boulderVisible = Boolean(boulderVisible);
    s.shockProgress = clamp01(shockProgress);
    s.active = s.boulderVisible || (s.shockProgress > 0.005 && s.shockProgress < 0.995);
    if (boulderPos) toVec3(boulderPos, s.boulderPos);
    s.boulderScale = Math.max(0.05, Number(boulderScale) || 1);
    if (shockPos) toVec3(shockPos, s.shockPos);
    this._fxDawaSmash.group.visible = s.active;
  }

  // =========================================================================
  // 3. Act 2: Dawa Mire Grip & 5-Color Toxic Spiderweb Seal
  // =========================================================================
  _buildDawaMireTrap() {
    const g = new THREE.Group();

    const mireRings = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0x3b1b4a : 0x5b2b6e,
        emissive: 0x2a0e38,
        emissiveIntensity: 0.4,
        roughness: 0.45,
        transparent: true,
        opacity: 0.85,
      });
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.85 + i * 0.48, 0.11 - i * 0.02, 8, 28), mat);
      r.rotation.x = Math.PI * 0.5;
      r.position.y = 0.08 + i * 0.04;
      g.add(r);
      mireRings.push(r);
    }

    const mudGlobs = [];
    const globGeo = new THREE.SphereGeometry(0.14, 8, 8);
    const globMat = new THREE.MeshStandardMaterial({
      color: 0x4b225c,
      emissive: 0x38144a,
      emissiveIntensity: 0.35,
      roughness: 0.3,
    });
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(globGeo, globMat);
      g.add(m);
      mudGlobs.push(m);
    }

    // 5-Color toxic spiderweb threads sealing Dantian
    const webSealGroup = new THREE.Group();
    g.add(webSealGroup);
    const sealBands = [];
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: FIVE_WEB_COLORS[i],
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.75 + (i % 2) * 0.16, 0.032, 6, 24), mat);
      band.rotation.set(0.55 * (i - 2), 0.42 * i, 0.3 * i);
      webSealGroup.add(band);
      sealBands.push(band);
    }
    const sealCore = makeGlowPlane(this.inkRingTex, 0xd86bff, 1.9, 1.9, 0.85, true);
    sealCore.position.z = 0.25;
    webSealGroup.add(sealCore);

    this.root.add(g);
    this._fxDawaMire = { group: g, mireRings, mudGlobs, webSealGroup, sealBands, sealCore };
  }

  setDawaMireTrap({ pos, mireGrip = 0, webSealProgress = 0 } = {}) {
    const s = this._active.dawaMire;
    s.mireGrip = clamp01(mireGrip);
    s.webSealProgress = clamp01(webSealProgress);
    s.active = s.mireGrip > 0.005 || s.webSealProgress > 0.005;
    if (pos) toVec3(pos, s.pos);
    this._fxDawaMire.group.visible = s.active;
  }

  // =========================================================================
  // 4. Act 3: Erwa Clairvoyant Twin Beams & Ear Soundwaves
  // =========================================================================
  _buildErwaSense() {
    const g = new THREE.Group();

    const coneGeo = new THREE.CylinderGeometry(0.05, 0.72, 1.0, 14, 1, true);
    coneGeo.translate(0, 0.5, 0);
    const coneMat = new THREE.MeshBasicMaterial({
      color: 0xffdf59,
      transparent: true,
      opacity: 0.46,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamL = new THREE.Mesh(coneGeo, coneMat);
    const beamR = new THREE.Mesh(coneGeo, coneMat.clone());
    g.add(beamL, beamR);

    const lockSigil = this._modelOrPlane('vfx2', 0xffe46b, 3.2, 3.2, 0.92, true);
    g.add(lockSigil);

    const lockRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.045, 8, 28),
      new THREE.MeshBasicMaterial({
        color: 0xffd24d,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    g.add(lockRing);

    // Concentric golden soundwave rings around Erwa's ears
    const earGroup = new THREE.Group();
    g.add(earGroup);
    const earRings = [];
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(0.55, 0.032, 8, 28),
        new THREE.MeshBasicMaterial({
          color: 0xffd966,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      earGroup.add(m);
      earRings.push(m);
    }

    this.root.add(g);
    this._fxErwaSense = { group: g, beamL, beamR, lockSigil, lockRing, earGroup, earRings };
  }

  setErwaSense({ origin, target, beamIntensity = 0, earRipple = 0 } = {}) {
    const s = this._active.erwaSense;
    s.beamIntensity = clamp01(beamIntensity);
    s.earRipple = clamp01(earRipple);
    s.active = s.beamIntensity > 0.005 || s.earRipple > 0.005;
    if (origin) toVec3(origin, s.origin);
    if (target) toVec3(target, s.target);
    this._fxErwaSense.group.visible = s.active;
  }

  // =========================================================================
  // 5. Act 3: Erwa Blind Trap (Crimson-White Poison-Wind Sword Rays)
  // =========================================================================
  _buildErwaBlindTrap() {
    const g = new THREE.Group();

    const rayGeo = new THREE.CylinderGeometry(0.06, 0.16, 1.0, 10, 1, true);
    rayGeo.translate(0, 0.5, 0);
    const rays = [];
    for (let i = 0; i < 3; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i === 1 ? 0xffffff : 0xff2850,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(rayGeo, mat);
      g.add(m);
      rays.push(m);
    }

    const burstGroup = new THREE.Group();
    g.add(burstGroup);
    const flash = makeGlowPlane(this.glowTex, 0xff4266, 3.4, 3.4, 0.95, true);
    burstGroup.add(flash);

    const sparks = [];
    const spGeo = new THREE.ConeGeometry(0.07, 0.75, 5);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(
        spGeo,
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xffffff : 0xff3b5c,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      burstGroup.add(m);
      sparks.push(m);
    }

    this.root.add(g);
    this._fxErwaBlind = { group: g, rays, burstGroup, flash, sparks };
  }

  setErwaBlindTrap({ from, to, progress = 0 } = {}) {
    const s = this._active.erwaBlind;
    s.progress = clamp01(progress);
    s.active = s.progress > 0.005 && s.progress < 0.995;
    if (from) toVec3(from, s.from);
    if (to) toVec3(to, s.to);
    this._fxErwaBlind.group.visible = s.active;
  }

  // =========================================================================
  // 6. Act 4: Sanwa Iron Body, 24 Wasp Needles & Shattering Axe
  // =========================================================================
  _buildSanwaIron() {
    const g = new THREE.Group();

    const shieldGroup = new THREE.Group();
    g.add(shieldGroup);
    const bellSprite = this._modelOrPlane('vfx3', 0xffe066, 3.6, 3.6, 0.85, true);
    bellSprite.position.y = 1.15;
    shieldGroup.add(bellSprite);

    // Sculpted translucent golden Jin-Zhong bell dome
    const bellPts = [
      new THREE.Vector2(1.18, 0.0),
      new THREE.Vector2(1.06, 0.75),
      new THREE.Vector2(0.92, 1.55),
      new THREE.Vector2(0.62, 2.15),
      new THREE.Vector2(0.0, 2.38),
    ];
    const bellDome = new THREE.Mesh(
      new THREE.LatheGeometry(bellPts, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffd54f,
        transparent: true,
        opacity: 0.24,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    shieldGroup.add(bellDome);

    // 24 flying wasp poison needles + 12 metallic ricochet sparks
    const needleGroup = new THREE.Group();
    g.add(needleGroup);
    const needleGeo = new THREE.ConeGeometry(0.045, 0.58, 5);
    const needleMat = new THREE.MeshStandardMaterial({
      color: 0xffe46b,
      emissive: 0x996b00,
      emissiveIntensity: 0.65,
      metalness: 0.8,
      roughness: 0.2,
    });
    const needles = [];
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(needleGeo, needleMat);
      needleGroup.add(m);
      needles.push({
        mesh: m,
        delay: hash1(i * 2.7) * 0.28,
        spreadY: (hash1(i * 5.3) - 0.5) * 2.4,
        spreadZ: (hash1(i * 8.9) - 0.5) * 1.4,
        hitY: 0.45 + hash1(i * 4.1) * 1.6,
        deflectAng: (hash1(i * 11.3) - 0.5) * Math.PI * 1.35,
        deflectY: 0.4 + hash1(i * 7.7) * 2.2,
      });
    }

    const sparks = [];
    for (let i = 0; i < 12; i++) {
      const sp = makeGlowPlane(this.glowTex, 0xfff099, 0.85, 0.85, 0.95, true);
      needleGroup.add(sp);
      sparks.push(sp);
    }

    // Shattering battle-axe shards
    const axeGroup = new THREE.Group();
    g.add(axeGroup);
    const shardGeo = new THREE.BoxGeometry(0.32, 0.14, 0.08);
    const shardMat = createPaperStandardMaterial({
      color: 0x7d8491,
      metalness: 0.65,
      roughness: 0.32,
      flatShading: true,
    });
    const axeShards = [];
    for (let i = 0; i < 10; i++) {
      const m = new THREE.Mesh(shardGeo, shardMat);
      axeGroup.add(m);
      const a = (i / 10) * Math.PI * 2 + 0.2;
      axeShards.push({
        mesh: m,
        vx: Math.cos(a) * (2.2 + hash1(i * 3.1) * 2.8),
        vy: 2.2 + hash1(i * 6.7) * 3.2,
        vz: Math.sin(a) * (1.2 + hash1(i * 9.3) * 1.8),
        spin: 6 + hash1(i * 4.5) * 8,
      });
    }
    const axeFlash = makeGlowPlane(this.glowTex, 0xffe680, 3.0, 3.0, 0.9, true);
    axeGroup.add(axeFlash);

    this.root.add(g);
    this._fxSanwaIron = {
      group: g,
      shieldGroup,
      bellSprite,
      bellDome,
      needleGroup,
      needles,
      sparks,
      axeGroup,
      axeShards,
      axeFlash,
    };
  }

  setSanwaIron({
    pos,
    shieldIntensity = 0,
    needleOrigin,
    needleProgress = 0,
    axeShatterPos,
    axeShatterProgress = 0,
  } = {}) {
    const s = this._active.sanwaIron;
    s.shieldIntensity = clamp01(shieldIntensity);
    s.needleProgress = clamp01(needleProgress);
    s.axeShatterProgress = clamp01(axeShatterProgress);
    s.active =
      s.shieldIntensity > 0.005 ||
      (s.needleProgress > 0.005 && s.needleProgress < 0.995) ||
      (s.axeShatterProgress > 0.005 && s.axeShatterProgress < 0.995);
    if (pos) toVec3(pos, s.pos);
    if (needleOrigin) toVec3(needleOrigin, s.needleOrigin);
    if (axeShatterPos) toVec3(axeShatterPos, s.axeShatterPos);
    this._fxSanwaIron.group.visible = s.active;
  }

  // =========================================================================
  // 7. Act 4: Yin-Yang Silk Sword & Glowing Cocoon
  // =========================================================================
  _buildSanwaSilkTrap() {
    const g = new THREE.Group();

    // 3D Rigid-Soft Yin-Yang Sword
    const swordGroup = new THREE.Group();
    const swordModel = this._modelOrPlane('prop_sword', 0xffffff, 2.2, 2.2, 1.0, false);
    swordGroup.add(swordModel);
    g.add(swordGroup);

    // Twin streaming violet-cyan 3D silk ribbons (TubeGeometry unit length 1 along +Y)
    const ribbonViolet = new THREE.Mesh(
      makeHelixTubeGeometry(2.5, 0.06, 0.28, 1.0, 0.045, 42),
      new THREE.MeshBasicMaterial({
        color: 0xc24dff,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const ribbonCyan = new THREE.Mesh(
      makeHelixTubeGeometry(-2.5, 0.06, 0.28, 1.0, 0.04, 42),
      new THREE.MeshBasicMaterial({
        color: 0x3ef2ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    g.add(ribbonViolet, ribbonCyan);

    // Cocoon coils + vfx8 silk web wrapping Sanwa
    const cocoonGroup = new THREE.Group();
    g.add(cocoonGroup);
    const coils = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xc24dff : 0x45f2ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const r = 0.68 - Math.abs(i - 2.5) * 0.07;
      const coil = new THREE.Mesh(new THREE.TorusGeometry(r, 0.042, 8, 28), mat);
      coil.rotation.x = Math.PI * 0.5 + (i % 2 === 0 ? 0.22 : -0.22);
      coil.position.y = 0.32 + i * 0.32;
      cocoonGroup.add(coil);
      coils.push(coil);
    }
    const vfxSilk = this._modelOrPlane('vfx8', 0xd48cff, 2.8, 3.0, 0.85, true);
    vfxSilk.position.set(0, 1.1, 0.16);
    cocoonGroup.add(vfxSilk);

    this.root.add(g);
    this._fxSanwaSilk = { group: g, swordGroup, ribbonViolet, ribbonCyan, cocoonGroup, coils, vfxSilk };
  }

  setSanwaSilkTrap({ swordOrigin, targetPos, wrapProgress = 0 } = {}) {
    const s = this._active.sanwaSilk;
    s.wrapProgress = clamp01(wrapProgress);
    s.active = s.wrapProgress > 0.005;
    if (swordOrigin) toVec3(swordOrigin, s.swordOrigin);
    if (targetPos) toVec3(targetPos, s.targetPos);
    this._fxSanwaSilk.group.visible = s.active;
  }

  // =========================================================================
  // 8a. Act 5: Siwa Roaring 3D Fire-Dragon Stream
  // =========================================================================
  _buildSiwaFire() {
    const g = new THREE.Group();
    const beamGroup = new THREE.Group();
    g.add(beamGroup);

    const outerGeo = new THREE.CylinderGeometry(0.18, 0.95, 1.0, 14, 1, true);
    outerGeo.translate(0, 0.5, 0);
    const outerCone = new THREE.Mesh(
      outerGeo,
      new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.62,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    beamGroup.add(outerCone);

    const innerGeo = new THREE.CylinderGeometry(0.08, 0.45, 1.0, 12, 1, true);
    innerGeo.translate(0, 0.5, 0);
    const innerCone = new THREE.Mesh(
      innerGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffe46b,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    beamGroup.add(innerCone);

    // Flame dragon spiral helix
    const fireHelix = new THREE.Mesh(
      makeHelixTubeGeometry(3.0, 0.14, 0.72, 1.0, 0.08, 44),
      new THREE.MeshBasicMaterial({
        color: 0xff8c1a,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beamGroup.add(fireHelix);

    // 3 volumetric 3D VFX_04 flame cones + 16 embers
    const flameCards = [];
    for (let i = 0; i < 3; i++) {
      const c = this._modelOrPlane('vfx4', 0xffaa33, 2.2 + i * 0.5, 2.2 + i * 0.5, 0.88, true);
      g.add(c);
      flameCards.push(c);
    }
    const embers = [];
    const emberGeo = new THREE.OctahedronGeometry(0.12, 0);
    const emberMat = new THREE.MeshBasicMaterial({
      color: 0xffd24d,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(emberGeo, emberMat);
      g.add(m);
      embers.push(m);
    }

    this.root.add(g);
    this._fxSiwaFire = { group: g, beamGroup, outerCone, innerCone, fireHelix, flameCards, embers };
  }

  setSiwaFire({ origin, target, intensity = 0 } = {}) {
    const s = this._active.siwaFire;
    s.intensity = clamp01(intensity);
    s.active = s.intensity > 0.005;
    if (origin) toVec3(origin, s.origin);
    if (target) toVec3(target, s.target);
    this._fxSiwaFire.group.visible = s.active;
  }

  // =========================================================================
  // 8b. Act 5: Wuwa Spiraling High-Pressure Water Torrent
  // =========================================================================
  _buildWuwaWater() {
    const g = new THREE.Group();
    const beamGroup = new THREE.Group();
    g.add(beamGroup);

    const coreGeo = new THREE.CylinderGeometry(0.14, 0.52, 1.0, 14, 1, true);
    coreGeo.translate(0, 0.5, 0);
    const coreJet = new THREE.Mesh(
      coreGeo,
      new THREE.MeshBasicMaterial({
        color: 0x38d9f0,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    beamGroup.add(coreJet);

    const helixA = new THREE.Mesh(
      makeHelixTubeGeometry(3.2, 0.16, 0.64, 1.0, 0.065, 44),
      new THREE.MeshBasicMaterial({
        color: 0x8ef5ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const helixB = new THREE.Mesh(
      makeHelixTubeGeometry(-2.8, 0.12, 0.55, 1.0, 0.055, 40),
      new THREE.MeshBasicMaterial({
        color: 0x1ea8d9,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    beamGroup.add(helixA, helixB);

    const waveCards = [];
    for (let i = 0; i < 3; i++) {
      const c = this._modelOrPlane('vfx5', 0xaaf7ff, 2.2 + i * 0.45, 2.2 + i * 0.45, 0.88, true);
      g.add(c);
      waveCards.push(c);
    }

    const droplets = [];
    const dropGeo = new THREE.SphereGeometry(0.11, 7, 7);
    const dropMat = new THREE.MeshBasicMaterial({
      color: 0xd9fbff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(dropGeo, dropMat);
      g.add(m);
      droplets.push(m);
    }

    this.root.add(g);
    this._fxWuwaWater = { group: g, beamGroup, coreJet, helixA, helixB, waveCards, droplets };
  }

  setWuwaWater({ origin, target, intensity = 0 } = {}) {
    const s = this._active.wuwaWater;
    s.intensity = clamp01(intensity);
    s.active = s.intensity > 0.005;
    if (origin) toVec3(origin, s.origin);
    if (target) toVec3(target, s.target);
    this._fxWuwaWater.group.visible = s.active;
  }

  // =========================================================================
  // 9. Act 5: Banquet Traps (Ruyi Blizzard Ice + Drunk Wine Bubbles/Stars)
  // =========================================================================
  _buildBanquetTraps() {
    const g = new THREE.Group();

    const iceGroup = new THREE.Group();
    g.add(iceGroup);
    const frostGeo = new THREE.CylinderGeometry(0.08, 1.15, 1.0, 14, 1, true);
    frostGeo.translate(0, 0.5, 0);
    const frostCone = new THREE.Mesh(
      frostGeo,
      new THREE.MeshBasicMaterial({
        color: 0x8beeff,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    iceGroup.add(frostCone);

    const blizzardCard = this._modelOrPlane('vfx7', 0xbdf6ff, 3.8, 3.8, 0.88, true);
    iceGroup.add(blizzardCard);

    const iceShards = [];
    const shardGeo = new THREE.OctahedronGeometry(0.18, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xbef5ff,
      emissive: 0x39b8e6,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.2,
      transparent: true,
      opacity: 0.88,
    });
    for (let i = 0; i < 16; i++) {
      const m = new THREE.Mesh(shardGeo, shardMat);
      m.scale.set(0.65, 1.6, 0.65);
      iceGroup.add(m);
      iceShards.push(m);
    }

    // Dizzy pink-gold wine bubbles & stars over Wuwa's bowl
    const drunkGroup = new THREE.Group();
    g.add(drunkGroup);
    const wineGlow = makeGlowPlane(this.glowTex, 0xff9ec4, 2.8, 2.8, 0.48, true);
    drunkGroup.add(wineGlow);

    const bubbles = [];
    const bGeo = new THREE.SphereGeometry(0.11, 10, 10);
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(
        bGeo,
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xffa6c9 : 0xffe28a,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      drunkGroup.add(m);
      bubbles.push(m);
    }

    const stars = [];
    const stGeo = new THREE.OctahedronGeometry(0.12, 0);
    stGeo.scale(1.2, 1.2, 0.35);
    const stMat = new THREE.MeshBasicMaterial({
      color: 0xffe46b,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(stGeo, stMat);
      drunkGroup.add(m);
      stars.push(m);
    }

    this.root.add(g);
    this._fxBanquet = { group: g, iceGroup, frostCone, blizzardCard, iceShards, drunkGroup, wineGlow, bubbles, stars };
  }

  setBanquetTraps({ ruyiOrigin, iceTarget, blizzardIntensity = 0, winePos, drunkSwirl = 0 } = {}) {
    const s = this._active.banquet;
    s.blizzardIntensity = clamp01(blizzardIntensity);
    s.drunkSwirl = clamp01(drunkSwirl);
    s.active = s.blizzardIntensity > 0.005 || s.drunkSwirl > 0.005;
    if (ruyiOrigin) toVec3(ruyiOrigin, s.ruyiOrigin);
    if (iceTarget) toVec3(iceTarget, s.iceTarget);
    if (winePos) toVec3(winePos, s.winePos);
    this._fxBanquet.group.visible = s.active;
  }

  // =========================================================================
  // 10. Act 6: Liuwa Stealth Ripples, Gold Powder, Yellow Flower & Golden Ruyi
  // =========================================================================
  _buildLiuwaTrick() {
    const g = new THREE.Group();

    // Stealth refraction rings
    const ghostGroup = new THREE.Group();
    g.add(ghostGroup);
    const ghostRings = [];
    for (let i = 0; i < 3; i++) {
      const r = makeGlowPlane(this.inkRingTex, 0x6ce8ff, 2.0, 2.0, 0.72, true);
      ghostGroup.add(r);
      ghostRings.push(r);
    }

    // Snake's golden tracking powder cloud (28 motes)
    const powderGroup = new THREE.Group();
    g.add(powderGroup);
    const powderMotes = [];
    const moteGeo = new THREE.OctahedronGeometry(0.07, 0);
    const moteMat = new THREE.MeshBasicMaterial({
      color: 0xffe26a,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(moteGeo, moteMat);
      powderGroup.add(m);
      powderMotes.push({
        mesh: m,
        ox: (hash1(i * 3.7) - 0.5) * 3.6,
        oy: hash1(i * 6.1) * 2.8,
        oz: (hash1(i * 9.5) - 0.5) * 2.0,
        drift: (hash1(i * 2.3) - 0.5) * 1.4,
      });
    }

    // 3D Little Yellow Flower (显形小黄花)
    const flowerGroup = makeYellowFlowerGroup();
    const flowerGlow = makeGlowPlane(this.glowTex, 0xffe44d, 0.9, 0.9, 0.65, true);
    flowerGlow.position.z = -0.05;
    flowerGroup.add(flowerGlow);
    g.add(flowerGroup);

    // 3D Golden Ruyi + Rescue Beam
    const ruyiGroup = makeRuyiGroup();
    const ruyiGlow = makeGlowPlane(this.glowTex, 0xffe066, 1.5, 1.5, 0.55, true);
    ruyiGroup.add(ruyiGlow);
    g.add(ruyiGroup);

    const beamGeo = new THREE.CylinderGeometry(0.06, 0.24, 1.0, 12, 1, true);
    beamGeo.translate(0, 0.5, 0);
    const ruyiBeam = new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({
        color: 0xffe36e,
        transparent: true,
        opacity: 0.82,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    g.add(ruyiBeam);

    const ruyiHitFlare = makeGlowPlane(this.glowTex, 0xfff099, 2.8, 2.8, 0.9, true);
    g.add(ruyiHitFlare);

    this.root.add(g);
    this._fxLiuwa = {
      group: g,
      ghostGroup,
      ghostRings,
      powderGroup,
      powderMotes,
      flowerGroup,
      ruyiGroup,
      ruyiBeam,
      ruyiHitFlare,
    };
  }

  setLiuwaTrick({
    ghostPos,
    ghostPulse = 0,
    powderPos,
    powderProgress = 0,
    flowerPos,
    flowerVisible = false,
    ruyiPos,
    ruyiVisible = false,
    ruyiBeamTarget,
    ruyiBeamIntensity = 0,
  } = {}) {
    const s = this._active.liuwa;
    s.ghostPulse = clamp01(ghostPulse);
    s.powderProgress = clamp01(powderProgress);
    s.flowerVisible = Boolean(flowerVisible);
    s.ruyiVisible = Boolean(ruyiVisible);
    s.ruyiBeamIntensity = clamp01(ruyiBeamIntensity);
    s.active =
      s.ghostPulse > 0.005 ||
      (s.powderProgress > 0.005 && s.powderProgress < 0.995) ||
      s.flowerVisible ||
      s.ruyiVisible ||
      s.ruyiBeamIntensity > 0.005;

    if (ghostPos) toVec3(ghostPos, s.ghostPos);
    if (powderPos) toVec3(powderPos, s.powderPos);
    if (flowerPos) toVec3(flowerPos, s.flowerPos);
    if (ruyiPos) toVec3(ruyiPos, s.ruyiPos);
    if (ruyiBeamTarget) toVec3(ruyiBeamTarget, s.ruyiBeamTarget);
    this._fxLiuwa.group.visible = s.active;
  }

  // =========================================================================
  // 11. Act 7 & 9: Qiwa Purple-Gold Gourd, Tornado Vortex & Petrify Ray
  // =========================================================================
  _buildQiwaGourd() {
    const g = new THREE.Group();

    const gourdGroup = new THREE.Group();
    const gourdMat = new THREE.MeshStandardMaterial({
      color: 0x8b2fc9,
      emissive: 0x3b0c66,
      emissiveIntensity: 0.65,
      roughness: 0.28,
      metalness: 0.45,
    });
    const gourdMesh = new THREE.Mesh(makeGourdGeometry(), gourdMat);
    gourdMesh.castShadow = true;
    gourdGroup.add(gourdMesh);

    const bandMat = new THREE.MeshStandardMaterial({
      color: 0xffd24d,
      emissive: 0x8a5a0a,
      emissiveIntensity: 0.6,
      roughness: 0.25,
      metalness: 0.78,
    });
    const waistBand = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.032, 8, 20), bandMat);
    waistBand.rotation.x = Math.PI * 0.5;
    waistBand.position.y = 0.08;
    gourdGroup.add(waistBand);

    const gourdAura = makeGlowPlane(this.glowTex, 0xc355ff, 2.2, 2.2, 0.68, true);
    gourdGroup.add(gourdAura);
    g.add(gourdGroup);

    // Massive 3D Funnel Tornado Vortex oriented from gourd mouth -> targetPos
    const vortexGroup = new THREE.Group();
    g.add(vortexGroup);

    const funnelGeo = new THREE.CylinderGeometry(0.14, 1.9, 1.0, 18, 1, true);
    funnelGeo.translate(0, 0.5, 0);
    const funnelOuter = new THREE.Mesh(
      funnelGeo,
      new THREE.MeshBasicMaterial({
        color: 0x9b30ff,
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    vortexGroup.add(funnelOuter);

    const vortexRibbons = [];
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(
        makeHelixTubeGeometry(3.4, 0.14, 1.65, 1.0, 0.055, 48),
        new THREE.MeshBasicMaterial({
          color: i === 1 ? 0xffcc4d : 0xc24dff,
          transparent: true,
          opacity: 0.78,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      m.rotation.y = (i / 3) * Math.PI * 2;
      vortexGroup.add(m);
      vortexRibbons.push(m);
    }

    const vfxSwirl = this._modelOrPlane('vfx6', 0xd47aff, 3.6, 3.6, 0.9, true);
    g.add(vfxSwirl);

    const vortexParticles = [];
    const vpGeo = new THREE.OctahedronGeometry(0.095, 0);
    const vpMat = new THREE.MeshBasicMaterial({
      color: 0xe6a6ff,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 24; i++) {
      const m = new THREE.Mesh(vpGeo, vpMat);
      g.add(m);
      vortexParticles.push(m);
    }

    // Act 9 white petrification ray
    const petGeo = new THREE.CylinderGeometry(0.09, 0.42, 1.0, 12, 1, true);
    petGeo.translate(0, 0.5, 0);
    const petRay = new THREE.Mesh(
      petGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf4f7ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    g.add(petRay);
    const petHalo = makeGlowPlane(this.inkRingTex, 0xe8eeff, 3.4, 3.4, 0.85, true);
    g.add(petHalo);

    this.root.add(g);
    this._fxQiwaGourd = {
      group: g,
      gourdGroup,
      gourdMat,
      gourdAura,
      vortexGroup,
      funnelOuter,
      vortexRibbons,
      vfxSwirl,
      vortexParticles,
      petRay,
      petHalo,
    };
  }

  setQiwaGourd({
    pos,
    targetPos,
    visible = false,
    scale = 1,
    corrupted = 0,
    vortexIntensity = 0,
    petrifyRay = 0,
  } = {}) {
    const s = this._active.qiwaGourd;
    s.visible = Boolean(visible);
    s.scale = Math.max(0.05, Number(scale) || 1);
    s.corrupted = clamp01(corrupted);
    s.vortexIntensity = clamp01(vortexIntensity);
    s.petrifyRay = clamp01(petrifyRay);
    s.active = s.visible || s.vortexIntensity > 0.005 || s.petrifyRay > 0.005;
    if (pos) toVec3(pos, s.pos);
    if (targetPos) toVec3(targetPos, s.targetPos);
    this._fxQiwaGourd.group.visible = s.active;
  }

  // =========================================================================
  // 12. Act 8 & 9: Sacred 7-Color Lotus, 7 Spirit Orbs & 7 Rainbow Pillars
  // =========================================================================
  _buildLotusMiracle() {
    const g = new THREE.Group();

    // 3D 7-petal glowing Sacred Lotus
    const lotusGroup = new THREE.Group();
    g.add(lotusGroup);

    const lotusSprite = this._modelOrPlane('prop_lotus', 0xffffff, 2.4, 2.4, 0.98, false, true);
    lotusSprite.position.y = 0.05;
    lotusGroup.add(lotusSprite);
    const paperStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.045, 0.52, 6),
      new THREE.MeshStandardMaterial({ color: 0x637234, roughness: 0.91 }),
    );
    paperStem.position.y = -0.19;
    const paperSeed = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.19, 1),
      new THREE.MeshStandardMaterial({ color: 0xf0b849, roughness: 0.84 }),
    );
    paperSeed.position.y = 0.22;
    lotusGroup.add(paperStem, paperSeed);

    const lotusGlow = makeGlowPlane(this.glowTex, 0xfff0a8, 4.2, 4.2, 0.72, true);
    lotusGlow.position.y = 0.4;
    lotusGroup.add(lotusGlow);

    const petals = [];
    const petalGeo = new THREE.ConeGeometry(0.28, 0.95, 5);
    petalGeo.scale(1.0, 1.0, 0.32);
    petalGeo.translate(0, 0.45, 0);
    for (let i = 0; i < 7; i++) {
      const pivot = new THREE.Group();
      pivot.rotation.y = (i / 7) * Math.PI * 2;
      const mat = new THREE.MeshStandardMaterial({
        color: SEVEN_COLORS[i],
        emissive: SEVEN_COLORS[i],
        emissiveIntensity: 0.75,
        roughness: 0.25,
        metalness: 0.1,
        transparent: true,
        opacity: 0.9,
      });
      const petal = new THREE.Mesh(petalGeo, mat);
      pivot.add(petal);
      lotusGroup.add(pivot);
      petals.push(petal);
    }

    // 7 Spirit Orbs (orb1..orb7) + 7-Heart connecting filament ring
    const orbsGroup = new THREE.Group();
    g.add(orbsGroup);
    const orbs = [];
    const orbCoreGeo = new THREE.SphereGeometry(0.18, 10, 10);
    for (let i = 0; i < 7; i++) {
      const holder = new THREE.Group();
      const sp = this._modelOrPlane(`orb${i + 1}`, 0xffffff, 1.05, 1.05, 0.98, false);
      const halo = makeGlowPlane(this.glowTex, SEVEN_COLORS[i], 1.75, 1.75, 0.65, true);
      halo.position.z = -0.05;
      holder.add(halo, sp);
      orbsGroup.add(holder);
      orbs.push(holder);
    }

    // Heptagram connecting lines (7 edges)
    const crestPos = new Float32Array(8 * 3);
    const crestGeo = new THREE.BufferGeometry();
    crestGeo.setAttribute('position', new THREE.BufferAttribute(crestPos, 3));
    const crestLine = new THREE.Line(
      crestGeo,
      new THREE.LineBasicMaterial({
        color: 0xffe985,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      })
    );
    crestLine.frustumCulled = false;
    orbsGroup.add(crestLine);

    // 7 Rainbow Light Pillars diving into rising Seven-Color Mountain
    const rainbowGroup = new THREE.Group();
    g.add(rainbowGroup);
    const pillars = [];
    const pillarGeo = new THREE.CylinderGeometry(0.32, 0.78, 18.0, 12, 1, true);
    pillarGeo.translate(0, 9.0, 0);
    for (let i = 0; i < 7; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: SEVEN_COLORS[i],
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const m = new THREE.Mesh(pillarGeo, mat);
      rainbowGroup.add(m);
      pillars.push(m);
    }
    const rainbowFlare = makeGlowPlane(this.glowTex, 0xfff3b0, 12.0, 12.0, 0.8, true);
    rainbowFlare.position.y = 1.6;
    rainbowGroup.add(rainbowFlare);

    this.root.add(g);
    this._fxLotus = {
      group: g,
      lotusGroup,
      lotusSprite,
      paperStem,
      paperSeed,
      lotusGlow,
      petals,
      orbsGroup,
      orbs,
      crestLine,
      crestPos,
      rainbowGroup,
      pillars,
      rainbowFlare,
    };
  }

  setLotusMiracle({
    lotusPos,
    lotusVisible = false,
    bloomProgress = 0,
    paperLotus = false,
    orbsCenter,
    orbsProgress = 0,
    rainbowCenter,
    rainbowProgress = 0,
  } = {}) {
    const s = this._active.lotus;
    s.lotusVisible = Boolean(lotusVisible);
    s.bloomProgress = clamp01(bloomProgress);
    s.paperLotus = paperLotus;
    s.orbsProgress = clamp01(orbsProgress);
    s.rainbowProgress = clamp01(rainbowProgress);
    s.active = s.lotusVisible || s.orbsProgress > 0.005 || s.rainbowProgress > 0.005;
    if (lotusPos) toVec3(lotusPos, s.lotusPos);
    if (orbsCenter) toVec3(orbsCenter, s.orbsCenter);
    if (rainbowCenter) toVec3(rainbowCenter, s.rainbowCenter);
    this._fxLotus.group.visible = s.active;
  }

  // =========================================================================
  // Deterministic Reset & Per-Frame Update
  // =========================================================================
  resetAll() {
    this._active = {
      sealStorm: { active: false, pos: new THREE.Vector3(), intensity: 0, hasWeb: false, webFrom: new THREE.Vector3(), webTo: new THREE.Vector3(), webProgress: 0 },
      dawaSmash: { active: false, boulderPos: new THREE.Vector3(), boulderScale: 1, boulderVisible: false, shockPos: new THREE.Vector3(), shockProgress: 0 },
      dawaMire: { active: false, pos: new THREE.Vector3(), mireGrip: 0, webSealProgress: 0 },
      erwaSense: { active: false, origin: new THREE.Vector3(), target: new THREE.Vector3(), beamIntensity: 0, earRipple: 0 },
      erwaBlind: { active: false, from: new THREE.Vector3(), to: new THREE.Vector3(), progress: 0 },
      sanwaIron: { active: false, pos: new THREE.Vector3(), shieldIntensity: 0, needleOrigin: new THREE.Vector3(), needleProgress: 0, axeShatterPos: new THREE.Vector3(), axeShatterProgress: 0 },
      sanwaSilk: { active: false, swordOrigin: new THREE.Vector3(), targetPos: new THREE.Vector3(), wrapProgress: 0 },
      siwaFire: { active: false, origin: new THREE.Vector3(), target: new THREE.Vector3(), intensity: 0 },
      wuwaWater: { active: false, origin: new THREE.Vector3(), target: new THREE.Vector3(), intensity: 0 },
      banquet: { active: false, ruyiOrigin: new THREE.Vector3(), iceTarget: new THREE.Vector3(), blizzardIntensity: 0, winePos: new THREE.Vector3(), drunkSwirl: 0 },
      liuwa: { active: false, ghostPos: new THREE.Vector3(), ghostPulse: 0, powderPos: new THREE.Vector3(), powderProgress: 0, flowerPos: new THREE.Vector3(), flowerVisible: false, ruyiPos: new THREE.Vector3(), ruyiVisible: false, ruyiBeamTarget: new THREE.Vector3(), ruyiBeamIntensity: 0 },
      qiwaGourd: { active: false, pos: new THREE.Vector3(), targetPos: new THREE.Vector3(), visible: false, scale: 1, corrupted: 0, vortexIntensity: 0, petrifyRay: 0 },
      lotus: { active: false, lotusPos: new THREE.Vector3(), lotusVisible: false, bloomProgress: 0, paperLotus: false, orbsCenter: new THREE.Vector3(), orbsProgress: 0, rainbowCenter: new THREE.Vector3(), rainbowProgress: 0 },
    };

    this._fxSealStorm.group.visible = false;
    this._fxDawaSmash.group.visible = false;
    this._fxDawaMire.group.visible = false;
    this._fxErwaSense.group.visible = false;
    this._fxErwaBlind.group.visible = false;
    this._fxSanwaIron.group.visible = false;
    this._fxSanwaSilk.group.visible = false;
    this._fxSiwaFire.group.visible = false;
    this._fxWuwaWater.group.visible = false;
    this._fxBanquet.group.visible = false;
    this._fxLiuwa.group.visible = false;
    this._fxQiwaGourd.group.visible = false;
    this._fxLotus.group.visible = false;
    this._strike.visible = false;
  }

  update(t = 0) {
    if (this._active.sealStorm.active) this._updateSealStorm(t);
    if (this._active.dawaSmash.active) this._updateDawaSmash(t);
    if (this._active.dawaMire.active) this._updateDawaMire(t);
    if (this._active.erwaSense.active) this._updateErwaSense(t);
    if (this._active.erwaBlind.active) this._updateErwaBlind(t);
    if (this._active.sanwaIron.active) this._updateSanwaIron(t);
    if (this._active.sanwaSilk.active) this._updateSanwaSilk(t);
    if (this._active.siwaFire.active) this._updateSiwaFire(t);
    if (this._active.wuwaWater.active) this._updateWuwaWater(t);
    if (this._active.banquet.active) this._updateBanquet(t);
    if (this._active.liuwa.active) this._updateLiuwa(t);
    if (this._active.qiwaGourd.active) this._updateQiwaGourd(t);
    if (this._active.lotus.active) this._updateLotus(t);
  }

  _updateSealStorm(t) {
    const s = this._active.sealStorm;
    const fx = this._fxSealStorm;

    fx.stormCore.visible = s.intensity > 0.005;
    if (fx.stormCore.visible) {
      fx.stormCore.position.copy(s.pos);
      const sc = 0.65 + s.intensity * 0.75;
      fx.stormCore.scale.setScalar(sc);
      fx.aura.material.opacity = s.intensity * (0.55 + 0.25 * Math.sin(t * 9.0));
      fx.ribbons.forEach((r, i) => {
        r.rotation.z = t * (2.6 + i * 1.1) * (i % 2 === 0 ? 1 : -1);
        r.material.opacity = s.intensity * 0.65;
      });

      const step = Math.floor(t * 18);
      fx.bolts.forEach((b, idx) => {
        const ang = (idx / 4) * Math.PI * 2 + t * 1.6;
        const len = 2.6 + s.intensity * 2.4;
        for (let k = 0; k < b.segs; k++) {
          const u = k / (b.segs - 1);
          const zig = (k === 0 ? 0 : (hash1(step * 13 + idx * 31 + k * 7) - 0.5) * 0.95);
          const zag = (k === 0 ? 0 : (hash1(step * 17 + idx * 19 + k * 11) - 0.5) * 0.65);
          b.positions[k * 3] = Math.cos(ang) * len * u + zig;
          b.positions[k * 3 + 1] = Math.sin(ang) * len * u * 0.8 + zag;
          b.positions[k * 3 + 2] = (hash1(step + k * 5 + idx) - 0.5) * 0.6;
        }
        b.line.geometry.attributes.position.needsUpdate = true;
        b.line.material.opacity = s.intensity * (0.55 + 0.45 * hash1(step + idx * 11));
      });
    }

    fx.webGroup.visible = s.hasWeb;
    if (s.hasWeb) {
      _tmpA.lerpVectors(s.webFrom, s.webTo, s.webProgress);
      fx.webLines.forEach((wl, i) => {
        const ang = (i / 6) * Math.PI * 2;
        const spread = 0.42 * s.webProgress;
        wl.pos[0] = s.webFrom.x;
        wl.pos[1] = s.webFrom.y;
        wl.pos[2] = s.webFrom.z;
        wl.pos[3] = _tmpA.x + Math.cos(ang) * spread;
        wl.pos[4] = _tmpA.y + Math.sin(ang) * spread;
        wl.pos[5] = _tmpA.z + Math.sin(ang * 2) * 0.2;
        wl.line.geometry.attributes.position.needsUpdate = true;
      });

      const snareAmt = clamp01((s.webProgress - 0.5) * 2.0);
      fx.snareRings.forEach((r, i) => {
        r.visible = snareAmt > 0.02;
        r.position.copy(s.webTo);
        r.position.y += (i - 1) * 0.4;
        r.scale.setScalar(0.2 + snareAmt * 0.95);
        r.rotation.z = t * 2.4 * (i % 2 === 0 ? 1 : -1);
      });
    }
  }

  _updateDawaSmash(t) {
    const s = this._active.dawaSmash;
    const fx = this._fxDawaSmash;

    fx.boulder.visible = s.boulderVisible;
    if (s.boulderVisible) {
      fx.boulder.position.copy(s.boulderPos);
      fx.boulder.scale.setScalar(s.boulderScale);
      fx.boulder.rotation.set(t * 0.8, t * 1.1, 0);
    }

    const p = s.shockProgress;
    fx.shockGroup.visible = p > 0.005 && p < 0.995;
    if (fx.shockGroup.visible) {
      fx.shockGroup.position.copy(s.shockPos);
      const fade = 1.0 - Math.pow(p, 1.6);
      const waveScale = 0.4 + p * 3.4;

      fx.vfxPlane.scale.setScalar(waveScale);
      fx.vfxPlane.rotation.z = t * 1.8;
      fx.vfxPlane.material.opacity = fade * 0.92;

      fx.inkRing.scale.setScalar(0.5 + p * 4.2);
      fx.inkRing.rotation.z = -t * 1.2;
      fx.inkRing.material.opacity = fade * 0.82;

      fx.ringTorus.scale.setScalar(0.3 + p * 3.0);
      fx.ringTorus.material.opacity = fade * 0.85;

      fx.chips.forEach((c) => {
        const rad = 0.85 + c.speed * p;
        const y = Math.max(0.05, c.vy * p - 5.2 * p * p);
        c.mesh.position.set(Math.cos(c.ang) * rad, y, Math.sin(c.ang) * rad);
        c.mesh.rotation.set(p * c.spin, p * c.spin * 1.3, p * 3.0);
        c.mesh.scale.setScalar(c.baseScale * Math.max(0.05, 1.0 - p * 0.72));
      });
    }
  }

  _updateDawaMire(t) {
    const s = this._active.dawaMire;
    const fx = this._fxDawaMire;
    fx.group.position.copy(s.pos);

    const g = s.mireGrip;
    fx.mireRings.forEach((r, i) => {
      r.visible = g > 0.01;
      const pulse = 0.88 + 0.14 * Math.sin(t * 4.5 + i * 1.7);
      r.scale.setScalar((0.5 + g * 0.7) * pulse);
      r.rotation.z = t * (1.8 + i * 0.6) * (i % 2 === 0 ? 1 : -1);
    });

    fx.mudGlobs.forEach((m, i) => {
      m.visible = g > 0.01;
      const a = (i / 10) * Math.PI * 2 + t * 2.1;
      const rad = 0.65 + 0.55 * (i % 3) * 0.45;
      const phase = (t * 1.6 + i * 0.37) % 1;
      m.position.set(Math.cos(a) * rad, 0.06 + Math.sin(phase * Math.PI) * 0.42 * g, Math.sin(a) * rad);
      m.scale.setScalar((0.5 + 0.8 * Math.sin(phase * Math.PI)) * g);
    });

    const w = s.webSealProgress;
    fx.webSealGroup.visible = w > 0.01;
    if (fx.webSealGroup.visible) {
      fx.webSealGroup.position.set(0, 0.95, 0.08);
      fx.sealBands.forEach((b, i) => {
        const localW = clamp01(w * 1.4 - i * 0.1);
        b.scale.setScalar(0.25 + localW * 0.95);
        b.rotation.z = t * (2.0 + i * 0.35) * (i % 2 === 0 ? 1 : -1);
        b.material.opacity = localW * 0.9;
      });
      fx.sealCore.scale.setScalar(0.3 + w * 1.0 + 0.08 * Math.sin(t * 9.0));
      fx.sealCore.rotation.z = -t * 1.5;
      fx.sealCore.material.opacity = w * 0.82;
    }
  }

  _updateErwaSense(t) {
    const s = this._active.erwaSense;
    const fx = this._fxErwaSense;

    const bInt = s.beamIntensity;
    const showBeams = bInt > 0.005;
    fx.beamL.visible = showBeams;
    fx.beamR.visible = showBeams;
    fx.lockSigil.visible = showBeams;
    fx.lockRing.visible = showBeams;

    if (showBeams) {
      const shimmer = 0.8 + 0.2 * Math.sin(t * 14.0);
      _tmpA.copy(s.origin);
      _tmpA.x -= 0.14;
      _tmpA.z += 0.08;
      const dL = orientSegment(fx.beamL, _tmpA, s.target, false);
      fx.beamL.scale.set(0.65 + 0.35 * bInt, dL, 0.65 + 0.35 * bInt);
      fx.beamL.material.opacity = bInt * 0.45 * shimmer;

      _tmpB.copy(s.origin);
      _tmpB.x += 0.14;
      _tmpB.z += 0.08;
      const dR = orientSegment(fx.beamR, _tmpB, s.target, false);
      fx.beamR.scale.set(0.65 + 0.35 * bInt, dR, 0.65 + 0.35 * bInt);
      fx.beamR.material.opacity = bInt * 0.45 * shimmer;

      fx.lockSigil.position.copy(s.target);
      fx.lockSigil.position.z += 0.15;
      fx.lockSigil.rotation.z = t * 1.6;
      fx.lockSigil.scale.setScalar(0.75 + 0.35 * bInt + 0.08 * Math.sin(t * 8.0));
      fx.lockSigil.material.opacity = bInt * 0.9;

      fx.lockRing.position.copy(s.target);
      fx.lockRing.position.z += 0.12;
      fx.lockRing.rotation.z = -t * 2.4;
      fx.lockRing.scale.setScalar(0.85 + 0.3 * Math.sin(t * 6.0));
      fx.lockRing.material.opacity = bInt * 0.85;
    }

    const eInt = s.earRipple;
    fx.earGroup.visible = eInt > 0.005;
    if (fx.earGroup.visible) {
      fx.earGroup.position.copy(s.origin);
      fx.earRings.forEach((ring, i) => {
        const phase = (t * 1.35 + i * 0.25) % 1;
        ring.scale.setScalar(0.45 + phase * 3.8);
        ring.material.opacity = (1.0 - phase) * eInt * 0.78;
      });
    }
  }

  _updateErwaBlind(t) {
    const s = this._active.erwaBlind;
    const fx = this._fxErwaBlind;
    const p = s.progress;

    const tipP = clamp01(p * 1.75);
    const tailP = clamp01((p - 0.35) * 1.6);

    fx.rays.forEach((r, i) => {
      const off = (i - 1) * 0.28;
      _tmpA.lerpVectors(s.from, s.to, tailP);
      _tmpB.lerpVectors(s.from, s.to, tipP);
      _tmpA.y += off * (1 - tailP);
      _tmpB.y += off * 0.25;
      const dist = orientSegment(r, _tmpA, _tmpB, false);
      r.visible = dist > 0.05;
      r.scale.set(1.0 + 0.3 * Math.sin(t * 24 + i), dist, 1.0);
      r.material.opacity = (1.0 - tailP) * .66;
    });

    const hitP = clamp01((p - 0.42) / 0.58);
    fx.burstGroup.visible = hitP > 0.01;
    if (fx.burstGroup.visible) {
      fx.burstGroup.position.copy(s.to);
      const fade = 1.0 - hitP;
      fx.flash.scale.setScalar(0.5 + hitP * 2.2);
      fx.flash.material.opacity = fade * 0.95;

      fx.sparks.forEach((sp, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.25;
        const rad = 0.25 + hitP * 2.4;
        sp.position.set(Math.cos(a) * rad, Math.sin(a) * rad, (i % 3 - 1) * 0.25);
        sp.rotation.z = a - Math.PI * 0.5;
        sp.scale.setScalar(0.6 + fade * 0.8);
        sp.material.opacity = fade;
      });
    }
  }

  _updateSanwaIron(t) {
    const s = this._active.sanwaIron;
    const fx = this._fxSanwaIron;

    fx.shieldGroup.visible = s.shieldIntensity > 0.005;
    if (fx.shieldGroup.visible) {
      fx.shieldGroup.position.copy(s.pos);
      const pulse = 0.94 + 0.08 * Math.sin(t * 10.0);
      fx.bellSprite.scale.setScalar((0.8 + 0.35 * s.shieldIntensity) * pulse);
      fx.bellSprite.rotation.z = t * 0.8;
      fx.bellSprite.material.opacity = s.shieldIntensity * .33;
      fx.bellDome.scale.setScalar(0.92 + 0.12 * s.shieldIntensity);
      fx.bellDome.material.opacity = s.shieldIntensity * .12 * pulse;
    }

    const np = s.needleProgress;
    fx.needleGroup.visible = np > 0.005 && np < 0.995;
    if (fx.needleGroup.visible) {
      const impactCenter = _tmpA.copy(s.pos);
      impactCenter.y += 1.05;

      fx.needles.forEach((n) => {
        const lp = clamp01((np - n.delay) / (1.0 - n.delay));
        if (lp <= 0.001 || lp >= 0.999) {
          n.mesh.visible = false;
          return;
        }
        n.mesh.visible = true;
        const hitX = s.pos.x;
        const hitY = s.pos.y + n.hitY;
        const hitZ = s.pos.z + n.spreadZ * 0.25;

        if (lp < 0.52) {
          const u = lp / 0.52;
          const sx = s.needleOrigin.x;
          const sy = s.needleOrigin.y + n.spreadY;
          const sz = s.needleOrigin.z + n.spreadZ;
          n.mesh.position.set(
            THREE.MathUtils.lerp(sx, hitX, u),
            THREE.MathUtils.lerp(sy, hitY, u),
            THREE.MathUtils.lerp(sz, hitZ, u)
          );
          _tmpDir.set(hitX - sx, hitY - sy, hitZ - sz).normalize();
          n.mesh.quaternion.setFromUnitVectors(UP_VEC, _tmpDir);
        } else {
          // Deflected ricochet off Sanwa's iron body
          const u = (lp - 0.52) / 0.48;
          const backSign = s.needleOrigin.x >= hitX ? 1 : -1;
          const vx = backSign * (2.6 + Math.cos(n.deflectAng) * 2.2);
          const vy = n.deflectY - 3.6 * u;
          const vz = Math.sin(n.deflectAng) * 2.2;
          n.mesh.position.set(hitX + vx * u, hitY + vy * u, hitZ + vz * u);
          n.mesh.rotation.set(u * 14, u * 11, u * 16);
        }
      });

      const sparkVis = np > 0.35 && np < 0.85;
      fx.sparks.forEach((sp, i) => {
        sp.visible = sparkVis;
        if (!sparkVis) return;
        const flick = Math.abs(Math.sin(t * 28.0 + i * 2.3));
        sp.position.set(
          impactCenter.x + (hash1(i * 4.7) - 0.5) * 1.1,
          impactCenter.y + (hash1(i * 7.1) - 0.5) * 1.5,
          impactCenter.z + 0.25
        );
        sp.scale.setScalar(0.45 + flick * 0.95);
        sp.material.opacity = flick;
      });
    }

    const ap = s.axeShatterProgress;
    fx.axeGroup.visible = ap > 0.005 && ap < 0.995;
    if (fx.axeGroup.visible) {
      fx.axeGroup.position.copy(s.axeShatterPos);
      const fade = 1.0 - ap;
      fx.axeFlash.scale.setScalar(0.4 + ap * 2.4);
      fx.axeFlash.material.opacity = Math.max(0, 1.0 - ap * 2.2);
      fx.axeShards.forEach((sh) => {
        sh.mesh.position.set(sh.vx * ap, Math.max(-0.8, sh.vy * ap - 5.4 * ap * ap), sh.vz * ap);
        sh.mesh.rotation.set(ap * sh.spin, ap * sh.spin * 0.8, ap * 5.0);
        sh.mesh.scale.setScalar(0.35 + fade * 0.85);
      });
    }
  }

  _updateSanwaSilk(t) {
    const s = this._active.sanwaSilk;
    const fx = this._fxSanwaSilk;
    const p = s.wrapProgress;

    fx.swordGroup.position.copy(s.swordOrigin);
    fx.swordGroup.position.y += Math.sin(t * 4.5) * 0.16;
    fx.swordGroup.rotation.z = Math.sin(t * 3.8) * 0.22;

    const targetCenter = _tmpA.copy(s.targetPos);
    targetCenter.y += 1.05;

    const streamTip = _tmpB.lerpVectors(s.swordOrigin, targetCenter, clamp01(p * 1.5));
    const dist = orientSegment(fx.ribbonViolet, s.swordOrigin, streamTip, false);
    fx.ribbonViolet.visible = dist > 0.05;
    fx.ribbonViolet.scale.set(0.75 + 0.35 * p, dist, 0.75 + 0.35 * p);
    fx.ribbonViolet.material.opacity = .37;
    fx.ribbonViolet.rotateY(t * 3.4);

    orientSegment(fx.ribbonCyan, s.swordOrigin, streamTip, false);
    fx.ribbonCyan.visible = dist > 0.05;
    fx.ribbonCyan.scale.set(0.7 + 0.3 * p, dist, 0.7 + 0.3 * p);
    fx.ribbonCyan.material.opacity = .31;
    fx.ribbonCyan.rotateY(-t * 2.8);

    const cocoonAmt = clamp01((p - 0.25) / 0.75);
    fx.cocoonGroup.visible = cocoonAmt > 0.01;
    if (fx.cocoonGroup.visible) {
      fx.cocoonGroup.position.copy(s.targetPos);
      fx.coils.forEach((c, i) => {
        const local = clamp01(cocoonAmt * 1.5 - i * 0.08);
        c.visible = local > 0.01;
        // Tightens inward as wrapProgress increases
        const tighten = 1.45 - local * 0.55;
        c.scale.setScalar(tighten);
        c.rotation.z = t * (4.0 + i * 0.6) * (i % 2 === 0 ? 1 : -1);
        c.material.opacity = local * (i > 4 ? .30 : .58);
        c.position.y = .27 + .215 * i;
        c.rotation.z = .11 * Math.sin((t + i) * 2.2) * (1 - local);
      });
      fx.vfxSilk.scale.setScalar(0.5 + cocoonAmt * 0.75);
      fx.vfxSilk.rotation.z = Math.sin(t * 5.0) * 0.15;
      fx.vfxSilk.position.set(0, .91, -.48);
      fx.vfxSilk.material.opacity = cocoonAmt * .24;
    }
  }

  _updateSiwaFire(t) {
    const s = this._active.siwaFire;
    const fx = this._fxSiwaFire;
    const inten = s.intensity;

    const dist = orientSegment(fx.beamGroup, s.origin, s.target, false);
    fx.beamGroup.visible = dist > 0.05;
    if (!fx.beamGroup.visible) return;

    const pulse = 0.88 + 0.16 * Math.sin(t * 18.0);
    fx.beamGroup.scale.set((0.45 + 0.75 * inten) * pulse, dist, (0.45 + 0.75 * inten) * pulse);
    fx.fireHelix.rotation.y = -t * 12.0;
    fx.outerCone.material.opacity = inten * 0.6;
    fx.innerCone.material.opacity = inten * 0.85;

    fx.flameCards.forEach((c, i) => {
      const u = ((t * 1.8 + i / 3) % 1) * 0.88 + 0.12;
      c.position.lerpVectors(s.origin, s.target, u);
      c.position.y += Math.sin(t * 12.0 + i * 2.1) * 0.25;
      c.scale.setScalar((0.6 + u * 0.85) * inten);
      c.rotation.z = Math.sin(t * 9.0 + i) * 0.35;
      c.material.opacity = inten * (1.0 - Math.abs(u - 0.55));
    });

    fx.embers.forEach((m, i) => {
      const u = (t * (1.5 + hash1(i * 3.1)) + i / 16) % 1;
      m.position.lerpVectors(s.origin, s.target, u);
      const rad = (0.15 + u * 0.85) * inten;
      const a = u * 10.0 + i * 1.4;
      m.position.x += Math.cos(a) * rad * 0.35;
      m.position.y += Math.sin(a) * rad + u * 0.35;
      m.position.z += Math.sin(a * 1.3) * rad;
      m.scale.setScalar((1.1 - u * 0.7) * inten);
    });
  }

  _updateWuwaWater(t) {
    const s = this._active.wuwaWater;
    const fx = this._fxWuwaWater;
    const inten = s.intensity;

    const dist = orientSegment(fx.beamGroup, s.origin, s.target, false);
    fx.beamGroup.visible = dist > 0.05;
    if (!fx.beamGroup.visible) return;

    const surge = 0.9 + 0.14 * Math.sin(t * 15.0);
    fx.beamGroup.scale.set((0.45 + 0.72 * inten) * surge, dist, (0.45 + 0.72 * inten) * surge);
    fx.helixA.rotation.y = t * 14.0;
    fx.helixB.rotation.y = -t * 11.0;
    fx.coreJet.material.opacity = inten * 0.68;

    fx.waveCards.forEach((c, i) => {
      const u = ((t * 2.1 + i / 3) % 1) * 0.85 + 0.15;
      c.position.lerpVectors(s.origin, s.target, u);
      c.scale.setScalar((0.55 + u * 0.9) * inten);
      c.rotation.z = t * 3.0 + i;
      c.material.opacity = inten * 0.82;
    });

    fx.droplets.forEach((m, i) => {
      const u = (t * 2.0 + i / 16) % 1;
      const a = (i / 16) * Math.PI * 2 + t * 5.0;
      const sprayR = 0.25 + u * 1.6 * inten;
      m.position.set(
        s.target.x + Math.cos(a) * sprayR,
        s.target.y + Math.sin(u * Math.PI) * 1.45 * inten,
        s.target.z + Math.sin(a) * sprayR
      );
      m.scale.setScalar((1.0 - u * 0.65) * inten);
    });
  }

  _updateBanquet(t) {
    const s = this._active.banquet;
    const fx = this._fxBanquet;

    const bInt = s.blizzardIntensity;
    fx.iceGroup.visible = bInt > 0.005;
    if (fx.iceGroup.visible) {
      const dist = orientSegment(fx.frostCone, s.ruyiOrigin, s.iceTarget, false);
      fx.frostCone.visible = dist > 0.05;
      fx.frostCone.scale.set(0.55 + 0.65 * bInt, dist, 0.55 + 0.65 * bInt);
      fx.frostCone.material.opacity = bInt * 0.45;

      fx.blizzardCard.position.copy(s.iceTarget);
      fx.blizzardCard.position.z -= .39;
      fx.blizzardCard.rotation.z = t * 4.5;
      fx.blizzardCard.scale.setScalar(.45 + .22 * bInt);
      fx.blizzardCard.material.opacity = bInt * .36;

      fx.iceShards.forEach((sh, i) => {
        const a = (i / 16) * Math.PI * 2 + t * 3.8;
        const rad = 0.65 + (i % 3) * 0.35;
        sh.position.set(
          s.iceTarget.x + Math.cos(a) * rad,
          s.iceTarget.y + ((i % 5) - 2) * 0.42 + Math.sin(t * 5.0 + i) * 0.15,
          s.iceTarget.z + Math.sin(a) * rad
        );
        sh.rotation.set(t * 4.0 + i, t * 3.0, a);
        sh.scale.set(0.65 * bInt, 1.55 * bInt, 0.65 * bInt);
      });
    }

    const dSw = s.drunkSwirl;
    fx.drunkGroup.visible = dSw > 0.005;
    if (fx.drunkGroup.visible) {
      fx.drunkGroup.position.copy(s.winePos);
      fx.wineGlow.material.opacity = dSw * 0.45;
      fx.wineGlow.scale.setScalar(0.8 + 0.25 * Math.sin(t * 3.5));

      fx.bubbles.forEach((b, i) => {
        const phase = (t * 0.65 + i / 12) % 1;
        const a = i * 1.3 + t * 1.8;
        const rad = 0.35 + 0.55 * hash1(i * 4.3);
        b.position.set(Math.cos(a) * rad, phase * 2.2, Math.sin(a) * rad);
        b.scale.setScalar((0.5 + 0.8 * Math.sin(phase * Math.PI)) * dSw);
      });

      fx.stars.forEach((st, i) => {
        const a = (i / 6) * Math.PI * 2 + t * 2.8;
        st.position.set(Math.cos(a) * 0.88, 1.45 + Math.sin(a * 2.0) * 0.18, Math.sin(a) * 0.65);
        st.rotation.z = t * 5.0 + i;
        st.scale.setScalar(0.95 * dSw);
      });
    }
  }

  _updateLiuwa(t) {
    const s = this._active.liuwa;
    const fx = this._fxLiuwa;

    fx.ghostGroup.visible = s.ghostPulse > 0.005;
    if (fx.ghostGroup.visible) {
      fx.ghostGroup.position.copy(s.ghostPos);
      fx.ghostRings.forEach((r, i) => {
        const ph = (t * 1.5 + i / 3) % 1;
        r.scale.setScalar(0.5 + ph * 2.4);
        r.rotation.z = t * 1.2 * (i % 2 === 0 ? 1 : -1);
        r.material.opacity = (1.0 - ph) * s.ghostPulse * 0.72;
      });
    }

    const pp = s.powderProgress;
    fx.powderGroup.visible = pp > 0.005 && pp < 0.995;
    if (fx.powderGroup.visible) {
      fx.powderGroup.position.copy(s.powderPos);
      const fade = Math.sin(pp * Math.PI);
      fx.powderMotes.forEach((m, i) => {
        m.mesh.position.set(
          m.ox + m.drift * pp + Math.sin(t * 5.0 + i) * 0.14,
          m.oy - pp * 2.2,
          m.oz + Math.cos(t * 4.0 + i) * 0.12
        );
        m.mesh.rotation.set(t * 4 + i, t * 5, 0);
        m.mesh.scale.setScalar(0.55 + fade * 0.85);
      });
    }

    fx.flowerGroup.visible = s.flowerVisible;
    if (s.flowerVisible) {
      fx.flowerGroup.position.copy(s.flowerPos);
      fx.flowerGroup.position.y += Math.sin(t * 5.5) * 0.06;
      fx.flowerGroup.rotation.z = Math.sin(t * 4.2) * 0.18;
    }

    fx.ruyiGroup.visible = s.ruyiVisible;
    if (s.ruyiVisible) {
      fx.ruyiGroup.position.copy(s.ruyiPos);
      fx.ruyiGroup.position.y += Math.sin(t * 3.8) * 0.08;
      fx.ruyiGroup.rotation.z = Math.sin(t * 2.6) * 0.14;
    }

    const bInt = s.ruyiBeamIntensity;
    const showBeam = bInt > 0.005;
    fx.ruyiBeam.visible = showBeam;
    fx.ruyiHitFlare.visible = showBeam;
    if (showBeam) {
      const dist = orientSegment(fx.ruyiBeam, s.ruyiPos, s.ruyiBeamTarget, false);
      fx.ruyiBeam.visible = dist > 0.05;
      fx.ruyiBeam.scale.set(0.65 + 0.55 * bInt, dist, 0.65 + 0.55 * bInt);
      fx.ruyiBeam.material.opacity = bInt * (0.75 + 0.2 * Math.sin(t * 16.0));

      fx.ruyiHitFlare.position.copy(s.ruyiBeamTarget);
      fx.ruyiHitFlare.scale.setScalar(0.8 + bInt * 1.4 + 0.15 * Math.sin(t * 14.0));
      fx.ruyiHitFlare.material.opacity = bInt * 0.92;
    }
  }

  _updateQiwaGourd(t) {
    const s = this._active.qiwaGourd;
    const fx = this._fxQiwaGourd;

    fx.gourdGroup.visible = s.visible;
    if (s.visible) {
      fx.gourdGroup.position.copy(s.pos);
      fx.gourdGroup.scale.setScalar(s.scale);
      fx.gourdGroup.rotation.z = Math.sin(t * 3.5) * 0.18 - (s.vortexIntensity > 0.1 ? 0.55 : 0);
      fx.gourdGroup.rotation.y = t * 1.2;

      // Corrupted dark violet-black vs purified royal purple-gold
      const c = s.corrupted;
      fx.gourdMat.color.setHex(0x8b2fc9).lerp(_tmpColor.setHex(0x28083b), c * 0.8);
      fx.gourdMat.emissive.setHex(0x52168a).lerp(_tmpColor.setHex(0x700c99), c);
      fx.gourdMat.emissiveIntensity = 0.55 + s.vortexIntensity * 0.75 + c * 0.4;
      fx.gourdAura.material.color.setHex(c > 0.4 ? 0x8e1aff : 0xd478ff);
      fx.gourdAura.material.opacity = .19 + s.vortexIntensity * .28;
    }

    const vInt = s.vortexIntensity;
    const showVortex = vInt > 0.005;
    fx.vortexGroup.visible = showVortex;
    fx.vfxSwirl.visible = false;
    if (showVortex) {
      const dist = orientSegment(fx.vortexGroup, s.pos, s.targetPos, false);
      fx.vortexGroup.visible = dist > 0.05;
      fx.vortexGroup.scale.set(0.45 + 0.75 * vInt, dist, 0.45 + 0.75 * vInt);
      fx.vortexGroup.rotateY(t * 10.0);
      fx.funnelOuter.material.opacity = vInt * .18;
      fx.vortexRibbons.forEach((r,i) => { r.material.opacity = vInt * (.45 - .10 * i); });
      fx.funnelOuter.material.color.setHex(s.corrupted > 0.4 ? 0x6b12b8 : 0xb24dff);


      fx.vortexParticles.forEach((m, i) => {
        m.visible = true;
        // Stream inward from targetPos (u=1) toward gourd mouth pos (u=0)
        const u = 1.0 - ((t * 1.45 + i / 24) % 1);
        m.position.lerpVectors(s.pos, s.targetPos, u);
        const rad = (0.12 + u * 1.6) * vInt;
        const ang = u * 11.0 - t * 9.0 + i * 0.8;
        m.position.x += Math.cos(ang) * rad * 0.45;
        m.position.y += Math.sin(ang) * rad;
        m.position.z += Math.sin(ang * 1.2) * rad;
        m.scale.setScalar((0.4 + u * 0.9) * vInt);
      });
    } else {
      fx.vortexParticles.forEach((m) => {
        m.visible = false;
      });
    }

    const pRay = s.petrifyRay;
    const showPet = pRay > 0.005;
    fx.petRay.visible = showPet;
    fx.petHalo.visible = showPet;
    if (showPet) {
      const dist = orientSegment(fx.petRay, s.pos, s.targetPos, false);
      fx.petRay.visible = dist > 0.05;
      fx.petRay.scale.set(0.55 + 0.65 * pRay, dist, 0.55 + 0.65 * pRay);
      fx.petRay.material.opacity = pRay * 0.85;

      fx.petHalo.position.copy(s.targetPos);
      fx.petHalo.scale.setScalar(0.6 + pRay * 1.4);
      fx.petHalo.rotation.z = t * 2.8;
      fx.petHalo.material.opacity = pRay * 0.85;
    }
  }

  _updateLotus(t) {
    const s = this._active.lotus;
    const fx = this._fxLotus;

    fx.lotusGroup.visible = s.lotusVisible;
    if (s.lotusVisible) {
      fx.lotusGroup.position.copy(s.lotusPos);
      fx.lotusSprite.visible = !s.paperLotus;
      fx.paperStem.visible = s.paperLotus;
      fx.paperSeed.visible = s.paperLotus;
      fx.lotusGroup.rotation.y = s.paperLotus ? 0.12 + s.bloomProgress * 0.65 : t * 0.9;
      fx.lotusGroup.scale.setScalar(s.paperLotus ? 0.35 + s.bloomProgress * 0.28 : 1);
      const b = s.bloomProgress;
      const openAngle = THREE.MathUtils.lerp(0.22, 1.22, b);
      fx.petals.forEach((p, i) => {
        p.rotation.x = openAngle + 0.06 * Math.sin(t * 4.0 + i);
        p.scale.setScalar(0.65 + 0.55 * b);
        p.material.emissiveIntensity = s.paperLotus ? 0.16 + 0.21 * b : 0.75;
        p.material.opacity = s.paperLotus ? 1 : 0.9;
      });
      fx.lotusGlow.scale.setScalar(0.75 + 1.15 * b + 0.12 * Math.sin(t * 6.0));
      fx.lotusGlow.material.opacity = s.paperLotus ? 0.02 + 0.20 * b : 0.35 + 0.55 * b;
    }

    const op = s.orbsProgress;
    fx.orbsGroup.visible = op > 0.005;
    if (fx.orbsGroup.visible) {
      fx.orbsGroup.position.copy(s.orbsCenter);
      const rad = THREE.MathUtils.lerp(0.4, 2.85, op);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + (s.paperLotus ? op * 0.68 : t * 1.35) + Math.PI * 0.5;
        const ox = Math.cos(a) * rad;
        const oy = Math.sin(a) * rad;
        const oz = Math.sin(a * 2.0 + t * 2.0) * 0.32;
        fx.orbs[i].position.set(ox, oy, oz);
        const appear = s.paperLotus ? clamp01((op - i * 0.097) * 3.2) : op;
        const orb = fx.orbs[i];
        orb.visible = appear > 0.005;
        orb.scale.setScalar(s.paperLotus ? (0.16 + 0.55 * op) * appear : 0.35 + 0.85 * op);
        orb.children[0].material.opacity = s.paperLotus ? 0.16 * appear : 0.65;
        fx.crestPos[i * 3] = ox;
        fx.crestPos[i * 3 + 1] = oy;
        fx.crestPos[i * 3 + 2] = oz;
      }
      // Close the 7-Heart heptagram loop
      fx.crestPos[7 * 3] = fx.crestPos[0];
      fx.crestPos[7 * 3 + 1] = fx.crestPos[1];
      fx.crestPos[7 * 3 + 2] = fx.crestPos[2];
      fx.crestLine.geometry.attributes.position.needsUpdate = true;
      fx.crestLine.material.opacity = s.paperLotus ? clamp01((op - 0.74) * 4) * 0.54 : clamp01((op - 0.25) * 1.4) * 0.9;
    }

    const rp = s.rainbowProgress;
    fx.rainbowGroup.visible = rp > 0.005;
    if (fx.rainbowGroup.visible) {
      fx.rainbowGroup.position.copy(s.rainbowCenter);
      const diveY = THREE.MathUtils.lerp(18.0, 0.0, Math.pow(rp, 0.7));
      const fade = rp > 0.85 ? 1.0 - (rp - 0.85) / 0.15 : Math.min(1.0, rp * 2.5);
      fx.pillars.forEach((p, i) => {
        const spreadX = (i - 3) * 1.65;
        const spreadZ = Math.abs(i - 3) * -0.55;
        p.position.set(spreadX, diveY, spreadZ);
        p.rotation.z = (3 - i) * 0.06;
        p.scale.set(0.65 + 0.55 * fade, 1.0, 0.65 + 0.55 * fade);
        p.material.opacity = fade * (0.62 + 0.18 * Math.sin(t * 7.0 + i));
      });
      fx.rainbowFlare.scale.setScalar(0.5 + rp * 1.6);
      fx.rainbowFlare.material.opacity = fade * 0.75;
    }
  }

  dispose() {
    this.root.traverse((obj) => {
      obj.geometry?.dispose?.();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m?.dispose?.());
      } else {
        obj.material?.dispose?.();
      }
    });
    this.root.parent?.remove(this.root);
  }
}
