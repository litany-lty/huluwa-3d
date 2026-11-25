import * as THREE from 'three';
import {
  createPaperStandardMaterial,
  createShadowCutoutMesh,
  createWaterMireMaterial,
} from '../core/PaperMaterials.js';

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function makePaperMat(assets, opts = {}) {
  const grainMap = assets?.getTexture?.('proc_paper_grain');
  const normalMap = assets?.getTexture?.('proc_paper_normal');
  return createPaperStandardMaterial({
    ...(grainMap && !opts.grainMap ? { grainMap } : {}),
    ...(normalMap && !opts.normalMap ? { normalMap } : {}),
    ...opts,
  });
}

function createExtrudedCliff(points, depth, bevel = 0.14) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 1,
  });
  geo.translate(0, 0, -depth * 0.5);
  return geo;
}

function createDemonEye(assets, scale = 1.0) {
  const eyeGroup = new THREE.Group();
  const glowTex = assets?.getTexture?.('proc_soft_glow');

  // Outer hypnotic crimson-magenta aura
  const auraMat = new THREE.MeshBasicMaterial({
    map: glowTex || null,
    color: 0xff2b6a,
    transparent: true,
    opacity: 0.72,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const aura = new THREE.Mesh(new THREE.PlaneGeometry(3.6 * scale, 2.2 * scale), auraMat);
  aura.position.z = -0.05;
  eyeGroup.add(aura);

  // Almond-shaped glowing eye sclera/iris (scales Y to blink/open)
  const lidGroup = new THREE.Group();
  const scleraShape = new THREE.Shape();
  const rw = 1.18 * scale;
  const rh = 0.52 * scale;
  scleraShape.moveTo(-rw, 0);
  scleraShape.quadraticCurveTo(0, rh * 1.45, rw, 0);
  scleraShape.quadraticCurveTo(0, -rh * 1.45, -rw, 0);

  const scleraMat = new THREE.MeshBasicMaterial({
    color: 0xffc83b,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
  });
  const sclera = new THREE.Mesh(new THREE.ShapeGeometry(scleraShape, 14), scleraMat);
  lidGroup.add(sclera);

  // Inner fiery scarlet iris ring
  const irisMat = new THREE.MeshBasicMaterial({
    color: 0xe61c4f,
    transparent: true,
    opacity: 0.92,
  });
  const iris = new THREE.Mesh(new THREE.CircleGeometry(0.42 * scale, 18), irisMat);
  iris.position.z = 0.03;
  lidGroup.add(iris);

  // Sharp vertical serpent slit pupil
  const pupilShape = new THREE.Shape();
  pupilShape.moveTo(0, 0.42 * scale);
  pupilShape.quadraticCurveTo(0.14 * scale, 0, 0, -0.42 * scale);
  pupilShape.quadraticCurveTo(-0.14 * scale, 0, 0, 0.42 * scale);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x0b020c });
  const pupil = new THREE.Mesh(new THREE.ShapeGeometry(pupilShape, 8), pupilMat);
  pupil.position.z = 0.06;
  lidGroup.add(pupil);

  // Sculpted dark ink upper & lower eyelid brow rims
  const browCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-rw * 1.12, -0.02, 0.05),
    new THREE.Vector3(-rw * 0.45, rh * 1.05, 0.08),
    new THREE.Vector3(0, rh * 1.25, 0.1),
    new THREE.Vector3(rw * 0.45, rh * 1.05, 0.08),
    new THREE.Vector3(rw * 1.12, -0.02, 0.05),
  ]);
  const browMat = new THREE.MeshBasicMaterial({ color: 0x240519 });
  const upperBrow = new THREE.Mesh(new THREE.TubeGeometry(browCurve, 18, 0.055 * scale, 5, false), browMat);
  lidGroup.add(upperBrow);

  eyeGroup.add(lidGroup);
  return { group: eyeGroup, lidGroup, pupil, auraMat, scleraMat, irisMat };
}

export class MistMireCanyon {
  constructor(assets, center = new THREE.Vector3(65, 0, 0)) {
    this.assets = assets;
    this.group = new THREE.Group();
    this.group.name = 'MistMireCanyon';
    this.group.position.copy(center);
    this.center = this.group.position;

    this._mireActivity = 0.5;
    this._dreamLevel = 0;
    this._mudBubbles = [];
    this._mireRings = [];
    this._mistPlanes = [];
    this._silkRibbons = [];
    this._demonEyes = [];

    this._buildCanyonTerrain();
    this._buildCraggyCliffs();
    this._buildHighCliffLedge();
    this._buildQuicksandMire();
    this._buildDreamGrotto();

    this.setMireActivity(0.5);
    this.setDreamIllusion(0);
  }

  _buildCanyonTerrain() {
    const floorMat = makePaperMat(this.assets, {
      color: 0x454f54,
      roughness: 0.94,
      metalness: 0.04,
      flatShading: true,
    });

    // Canyon stage floor with recessed center for the mire
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 2.4, 24), floorMat);
    floor.position.set(0, -1.2, -1.8);
    floor.receiveShadow = true;
    this.group.add(floor);

    const caveTex = this.assets?.getTexture?.('map_cave');
    if (caveTex) {
      const groundInlay = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 18),
        new THREE.MeshStandardMaterial({
          map: caveTex,
          color: 0x9aa6ad,
          roughness: 0.94,
          transparent: true,
          opacity: 0.42,
        })
      );
      groundInlay.rotation.x = -Math.PI / 2;
      groundInlay.position.set(0, 0.012, -1.2);
      groundInlay.receiveShadow = true;
      this.group.add(groundInlay);
    }

    // Scattered craggy 青灰 canyon boulders
    const boulderMat = makePaperMat(this.assets, { color: 0x3b4852, roughness: 0.9, flatShading: true });
    const boulders = [
      [-10.5, 0.7, 2.2, 1.3],
      [-5.2, 0.45, 2.9, 0.75],
      [5.4, 0.55, 2.8, 0.92],
      [11.2, 0.85, 1.8, 1.4],
      [-3.8, 0.5, -3.5, 0.9],
      [3.6, 0.5, -3.2, 0.85],
    ];
    for (const [x, y, z, s] of boulders) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), boulderMat);
      rock.position.set(x, y, z);
      rock.scale.set(1.3, 0.85, 0.95);
      rock.rotation.set(0.3, x * 0.5, 0.2);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }

    // 3D Rock & Stalagmite Pillar Clusters framing the gorge wings (Stage_01 & Stage_02 GLB)
    const wingL = this.assets?.instantiateModel?.('stage_rock', { fitHeight: 3.2, pivotBottom: true });
    if (wingL) {
      wingL.position.set(-11.4, 0.0, 1.6);
      wingL.rotation.y = 0.25;
      this.group.add(wingL);
    }
    const wingR = this.assets?.instantiateModel?.('stage_pillar', { fitHeight: 5.4, pivotBottom: true });
    if (wingR) {
      wingR.position.set(11.6, 0.0, 0.8);
      wingR.rotation.y = -0.22;
      this.group.add(wingR);
    }
  }

  _buildCraggyCliffs() {
    // 3 layers of jagged 青灰 slate-ink gorge walls
    const cliffLayers = [
      {
        z: -17.5,
        depth: 1.0,
        color: 0x26313b,
        points: [
          [-26, -1], [-22, 13.5], [-16, 10.2], [-10.5, 15.8], [-4.5, 8.2],
          [0.5, 6.4], [5.8, 12.6], [12.0, 16.4], [18.2, 11.4], [24, 14.5], [27, -1],
        ],
      },
      {
        z: -11.8,
        depth: 0.95,
        color: 0x354450,
        points: [
          [-22, -1], [-17.5, 11.4], [-11.5, 8.4], [-6.8, 11.6], [-2.5, 4.8],
          [2.2, 5.2], [7.5, 10.8], [13.2, 9.2], [18.5, 12.0], [22, -1],
        ],
      },
      {
        z: -6.8,
        depth: 0.85,
        color: 0x455663,
        points: [
          [-18, -1], [-13.8, 9.2], [-8.8, 6.8], [-4.6, 3.4], [0.2, 2.2],
          [4.2, 4.2], [9.5, 7.6], [14.8, 8.8], [18.5, -1],
        ],
      },
    ];

    for (let i = 0; i < cliffLayers.length; i++) {
      const c = cliffLayers[i];
      const geo = createExtrudedCliff(c.points, c.depth, 0.14);
      const mat = makePaperMat(this.assets, {
        color: c.color,
        roughness: 0.92,
        metalness: 0.05,
        flatShading: true,
      });
      const wall = new THREE.Mesh(geo, mat);
      wall.position.set(0, -0.4, c.z);
      wall.castShadow = i >= 1;
      wall.receiveShadow = true;
      this.group.add(wall);
    }

    // Drifting low-lying canyon miasma mist sheets
    const cloudTex = this.assets?.getTexture?.('proc_cloud');
    for (let i = 0; i < 6; i++) {
      const mistMat = new THREE.MeshBasicMaterial({
        map: cloudTex || null,
        color: i % 2 === 0 ? 0x8da6a8 : 0x756c8a,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      });
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.2), mistMat);
      mist.position.set(-10 + i * 4.2, 1.3 + (i % 3) * 1.15, -4.5 - (i % 2) * 3.8);
      this.group.add(mist);
      this._mistPlanes.push({ mesh: mist, baseX: mist.position.x, speed: 0.25 + i * 0.06, phase: i * 1.2 });
    }
  }

  _buildHighCliffLedge() {
    // High cliff bridge/ledge at world x = 58, y = 4.6, z = -1.5 (local x = -7, y = 4.6, z = -1.5)
    const ledgeGroup = new THREE.Group();
    ledgeGroup.name = 'HighCliffLedge';
    ledgeGroup.position.set(-7.0, 4.6, -1.5);

    const cliffMat = makePaperMat(this.assets, { color: 0x41525e, roughness: 0.9, flatShading: true });
    const slateTopMat = makePaperMat(this.assets, { color: 0x5c6d78, roughness: 0.88, flatShading: true });
    const woodMat = makePaperMat(this.assets, { color: 0x5e412c, roughness: 0.92, flatShading: true });

    // Towering sheer cliff spire supporting the lookout ledge from below
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 3.2, 4.8, 7), cliffMat);
    spire.position.set(-0.6, -2.55, -0.4);
    spire.scale.set(1.25, 1.0, 0.95);
    spire.castShadow = true;
    spire.receiveShadow = true;
    ledgeGroup.add(spire);

    // Cantilevered flat lookout slab whose top sits flush at y = 0 (world y = 4.6)
    const slab = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.55, 2.3), slateTopMat);
    slab.position.set(0.1, -0.275, 0);
    slab.castShadow = true;
    slab.receiveShadow = true;
    ledgeGroup.add(slab);

    // Jagged overhanging crag teeth underneath the cantilever
    for (let i = 0; i < 4; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.25, 5), cliffMat);
      tooth.rotation.x = Math.PI;
      tooth.position.set(0.6 + i * 0.52, -0.95, -0.35 + (i % 2) * 0.65);
      tooth.castShadow = true;
      ledgeGroup.add(tooth);
    }

    // Weathered timber-and-rope mountain bridge spanning leftward into the western precipice
    for (let i = 0; i < 9; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 1.55), woodMat);
      const bx = -2.2 - i * 0.54;
      const sag = Math.sin((i / 8) * Math.PI) * -0.18;
      plank.position.set(bx, -0.04 + sag, 0);
      plank.rotation.z = (i - 4) * 0.012;
      plank.castShadow = true;
      plank.receiveShadow = true;
      ledgeGroup.add(plank);
    }

    // Bridge side rail posts & rope rails
    const ropeMat = makePaperMat(this.assets, { color: 0x8a7554, roughness: 0.95, flatShading: false });
    for (const rz of [-0.74, 0.74]) {
      const postA = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.05, 5), woodMat);
      postA.position.set(-2.0, 0.45, rz);
      postA.castShadow = true;
      ledgeGroup.add(postA);

      const postB = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 1.05, 5), woodMat);
      postB.position.set(-6.5, 0.45, rz);
      postB.castShadow = true;
      ledgeGroup.add(postB);

      const ropeCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.0, 0.88, rz),
        new THREE.Vector3(-4.25, 0.52, rz),
        new THREE.Vector3(-6.5, 0.88, rz),
      ]);
      const rope = new THREE.Mesh(new THREE.TubeGeometry(ropeCurve, 16, 0.032, 5, false), ropeMat);
      ledgeGroup.add(rope);
    }

    this.group.add(ledgeGroup);
    this.cliffLedge = ledgeGroup;
  }

  _buildQuicksandMire() {
    // 3D Bubbling Quicksand Mire at world x = 65, y = 0.04, z = 0.4 (local x = 0, y = 0.04, z = 0.4)
    const mireGroup = new THREE.Group();
    mireGroup.name = 'QuicksandMire';
    mireGroup.position.set(0, 0.04, 0.4);

    // Sculpted dark mudstone embankment collar
    const rimMat = makePaperMat(this.assets, {
      color: 0x3b3544,
      roughness: 0.92,
      flatShading: true,
    });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.36, 7, 18), rimMat);
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(1.12, 0.88, 0.58);
    collar.position.y = 0.02;
    collar.receiveShadow = true;
    collar.castShadow = true;
    mireGroup.add(collar);

    // Animated mire shader pool
    this._mireMat = createWaterMireMaterial('mire');
    this._mireMat.side = THREE.DoubleSide;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(3.5, 32), this._mireMat);
    pool.rotation.x = -Math.PI / 2;
    pool.scale.set(1.1, 0.86, 1);
    pool.position.y = 0.01;
    mireGroup.add(pool);

    // 3D Stone-Ringed Toxic Mire Trap Basin (Stage_03 GLB)
    const mire3D = this.assets?.instantiateModel?.('stage_mire', { fitSize: 7.4, pivotBottom: true });
    if (mire3D) {
      mire3D.position.y = -0.04;
      mireGroup.add(mire3D);
    }

    // Concentric swirling mud ripple rings
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x9b6ed8,
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.72, 24), ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      mireGroup.add(ring);
      this._mireRings.push({ mesh: ring, mat: ringMat, phase: i / 3 });
    }

    // 16 animated 3D glossy mud bubbles inflating & popping across the bog
    const bubbleGeo = new THREE.SphereGeometry(0.28, 12, 10);
    const bubbleMat = makePaperMat(this.assets, {
      color: 0x4b2f59,
      emissive: 0x3b184a,
      emissiveIntensity: 0.45,
      roughness: 0.25,
      metalness: 0.15,
      flatShading: false,
    });
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (i % 3) * 0.4;
      const dist = 0.55 + ((i * 37) % 100) / 100 * 2.4;
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      bubble.position.set(Math.cos(angle) * dist * 1.05, 0.02, Math.sin(angle) * dist * 0.82);
      bubble.castShadow = true;
      mireGroup.add(bubble);
      this._mudBubbles.push({
        mesh: bubble,
        baseX: bubble.position.x,
        baseZ: bubble.position.z,
        speed: 0.55 + (i % 5) * 0.16,
        phase: (i * 0.67) % 1,
        maxScale: 0.55 + (i % 4) * 0.28,
      });
    }

    // Local eerie bog glow light
    this._mireLight = new THREE.PointLight(0x7c45b5, 1.2, 11, 1.8);
    this._mireLight.position.set(0, 1.3, 0);
    mireGroup.add(this._mireLight);

    this.group.add(mireGroup);
    this.mire = mireGroup;
  }

  _buildDreamGrotto() {
    // Dream Illusion Grotto at world x = 72, y = 2.4, z = -2.2 (local x = 7, y = 2.4, z = -2.2)
    const grotto = new THREE.Group();
    grotto.name = 'DreamIllusionGrotto';
    grotto.position.set(7.0, 2.4, -2.2);

    const obsidianMat = makePaperMat(this.assets, {
      color: 0x2d2438,
      roughness: 0.9,
      flatShading: true,
    });

    // Sculpted scalloped grotto archway framing the dream void
    const archOuter = new THREE.Shape();
    archOuter.moveTo(-4.4, -2.6);
    archOuter.lineTo(-4.2, 2.2);
    archOuter.quadraticCurveTo(0, 5.2, 4.2, 2.2);
    archOuter.lineTo(4.4, -2.6);
    archOuter.closePath();

    const archHole = new THREE.Path();
    archHole.moveTo(-2.8, -2.6);
    archHole.lineTo(-2.6, 1.1);
    archHole.quadraticCurveTo(0, 3.4, 2.6, 1.1);
    archHole.lineTo(2.8, -2.6);
    archHole.closePath();
    archOuter.holes.push(archHole);

    const archGeo = new THREE.ExtrudeGeometry(archOuter, {
      depth: 1.5,
      bevelEnabled: true,
      bevelThickness: 0.14,
      bevelSize: 0.12,
      bevelSegments: 1,
    });
    archGeo.translate(0, 0, -0.75);
    const archMesh = new THREE.Mesh(archGeo, obsidianMat);
    archMesh.castShadow = true;
    archMesh.receiveShadow = true;
    grotto.add(archMesh);

    // Deep velvet-crimson illusion void backing
    this._grottoVoidMat = new THREE.MeshBasicMaterial({
      color: 0x28051a,
      transparent: true,
      opacity: 0.92,
    });
    const voidBack = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.2), this._grottoVoidMat);
    voidBack.position.set(0, 0.2, -1.1);
    grotto.add(voidBack);

    // Illusion container toggled/scaled by setDreamIllusion(p)
    this._illusionGroup = new THREE.Group();
    grotto.add(this._illusionGroup);

    // 5 swirling 3D pink/magenta silk ribbons (TubeGeometry)
    const ribbonColors = [0xff4d8d, 0xff77aa, 0xe82c78, 0xff9ec4, 0xd41c6b];
    for (let r = 0; r < 5; r++) {
      const pts = [];
      const radius = 1.15 + r * 0.42;
      const turns = 1.65;
      for (let k = 0; k <= 24; k++) {
        const u = k / 24;
        const a = u * Math.PI * 2 * turns + r * 1.25;
        const x = Math.cos(a) * radius * (1 - u * 0.25);
        const y = Math.sin(a) * (radius * 0.72) + Math.sin(u * Math.PI * 3) * 0.22;
        const z = -0.8 + u * 1.65;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const ribbonGeo = new THREE.TubeGeometry(curve, 44, 0.065 + (r % 2) * 0.025, 6, false);
      const ribbonMat = new THREE.MeshStandardMaterial({
        color: ribbonColors[r],
        emissive: ribbonColors[r],
        emissiveIntensity: .30,
        roughness: .69,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
      });
      const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      this._illusionGroup.add(ribbon);
      this._silkRibbons.push({ mesh: ribbon, mat: ribbonMat, speed: (r % 2 === 0 ? 1 : -1) * (0.55 + r * 0.14), phase: r * 1.1 });
    }

    // 5 Giant Eerie Glowing Demon Eyes (1 colossal central eye + 4 hypnotic flanking eyes)
    const eyeLayouts = [
      { x: 0.0, y: 0.65, z: -0.35, s: 1.25 },
      { x: -1.75, y: 1.35, z: -0.15, s: 0.68 },
      { x: 1.75, y: 1.35, z: -0.15, s: 0.68 },
      { x: -1.55, y: -0.65, z: 0.0, s: 0.56 },
      { x: 1.55, y: -0.65, z: 0.0, s: 0.56 },
    ];
    for (let i = 0; i < eyeLayouts.length; i++) {
      const cfg = eyeLayouts[i];
      const eye = createDemonEye(this.assets, cfg.s);
      eye.group.position.set(cfg.x, cfg.y, cfg.z);
      this._illusionGroup.add(eye.group);
      this._demonEyes.push({ ...eye, basePos: eye.group.position.clone(), phase: i * 1.3 });
    }

    // Crimson grotto illusion point light
    this._dreamLight = new THREE.PointLight(0xff2e74, 0, 14, 1.7);
    this._dreamLight.position.set(0, 0.5, 1.6);
    grotto.add(this._dreamLight);

    this.group.add(grotto);
    this.grotto = grotto;
  }

  setMireActivity(p = 0.5) {
    this._mireActivity = clamp01(p);
    this._mireLight.intensity = 0.5 + this._mireActivity * 2.4;
    this._mireMat?.userData?.setIntensity?.(0.35 + this._mireActivity * 1.45);
  }

  setDreamIllusion(p = 0) {
    const d = clamp01(p);
    this._dreamLevel = d;
    this._illusionGroup.visible = d > 0.005;

    for (const r of this._silkRibbons) {
      r.mat.opacity = d * .39;
      r.mesh.scale.setScalar(0.45 + d * 0.6);
    }

    for (const eye of this._demonEyes) {
      eye.lidGroup.scale.set(0.6 + d * 0.4, Math.max(0.02, d), 1);
      eye.auraMat.opacity = d * .32;
      eye.scleraMat.opacity = d * 0.96;
      eye.irisMat.opacity = d * 0.92;
    }

    this._dreamLight.intensity = d * 2.0;
  }

  update(t = 0) {
    const mireSpeed = 0.65 + this._mireActivity * 1.45;
    if (this._mireMat) {
      const scaledT = t * mireSpeed;
      if (this._mireMat.userData && typeof this._mireMat.userData.update === 'function') {
        this._mireMat.userData.update(scaledT);
      } else if (this._mireMat.uniforms?.uTime) {
        this._mireMat.uniforms.uTime.value = scaledT;
      }
    }

    // Animated 3D mud bubbles inflating and bursting
    for (const b of this._mudBubbles) {
      const cycle = (t * b.speed * (0.6 + this._mireActivity * 1.2) + b.phase) % 1;
      let s = 0.001;
      let y = 0.0;
      if (cycle < 0.72) {
        const grow = cycle / 0.72;
        s = Math.sin(grow * Math.PI * 0.5) * b.maxScale * (0.55 + this._mireActivity * 0.75);
        y = s * 0.42;
      } else if (cycle < 0.82) {
        // Sudden pop bulge then vanish
        const pop = (cycle - 0.72) / 0.1;
        s = b.maxScale * (0.55 + this._mireActivity * 0.75) * (1.0 + pop * 0.25);
        y = s * 0.45;
      } else {
        s = 0.001;
        y = -0.15;
      }
      b.mesh.scale.set(s, s * 0.85, s);
      b.mesh.position.set(
        b.baseX + Math.sin(t * 2 + b.phase * 6) * 0.05,
        y,
        b.baseZ + Math.cos(t * 1.8 + b.phase * 6) * 0.05
      );
      b.mesh.visible = s > 0.01 && this._mireActivity > 0.02;
    }

    // Concentric mire ripples expanding
    for (const r of this._mireRings) {
      const c = (t * (0.35 + this._mireActivity * 0.45) + r.phase) % 1;
      const rad = 0.4 + c * 3.8;
      r.mesh.scale.set(rad * 1.1, rad * 0.86, 1);
      r.mat.opacity = (1 - c) * (0.14 + this._mireActivity * 0.34);
    }

    // Canyon drifting mist
    for (const m of this._mistPlanes) {
      m.mesh.position.x = m.baseX + Math.sin(t * m.speed + m.phase) * 1.8;
    }

    // Swirling pink dream silk ribbons & hypnotic pulsing demon eyes
    if (this._dreamLevel > 0.005) {
      for (const r of this._silkRibbons) {
        r.mesh.rotation.z = t * r.speed + r.phase;
        r.mesh.rotation.y = Math.sin(t * 0.8 + r.phase) * 0.28;
      }
      for (const eye of this._demonEyes) {
        eye.group.position.y = eye.basePos.y + Math.sin(t * 1.7 + eye.phase) * 0.12;
        const slitPulse = 0.78 + Math.sin(t * 3.5 + eye.phase) * 0.28;
        eye.pupil.scale.set(slitPulse, 1, 1);
        eye.pupil.position.x = Math.sin(t * 1.2 + eye.phase) * 0.14;
      }
      this._dreamLight.intensity = this._dreamLevel * (2.1 + Math.sin(t * 3.8) * .28);
    }
  }
}

export default MistMireCanyon;
