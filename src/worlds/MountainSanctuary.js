import * as THREE from 'three';
import {
  createPaperStandardMaterial,
  createShadowCutoutMesh,
  createWaterMireMaterial,
} from '../core/PaperMaterials.js';

const GOURD_PALETTE = [
  { name: 'red', color: 0xe53935, emissive: 0xff5238, glow: 0xff6b52 },
  { name: 'orange', color: 0xfb8c00, emissive: 0xffa726, glow: 0xffb74d },
  { name: 'yellow', color: 0xfdd835, emissive: 0xffe84d, glow: 0xfff176 },
  { name: 'green', color: 0x2e9e5b, emissive: 0x43c674, glow: 0x69e296 },
  { name: 'cyan', color: 0x00acc1, emissive: 0x26d0e6, glow: 0x5be5f7 },
  { name: 'blue', color: 0x2962ff, emissive: 0x4d82ff, glow: 0x73a0ff },
  { name: 'purple', color: 0x8e24aa, emissive: 0xba4de0, glow: 0xd06ef2 },
];

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

function createExtrudedRidge(points, depth, bevelSize = 0.08) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevelSize,
    bevelSize,
    bevelSegments: 1,
    curveSegments: 4,
  });
  geo.translate(0, 0, -depth * 0.5);
  return geo;
}

function createCloudRibbonGeo(width = 6, height = 1.15, depth = 0.22) {
  const hw = width * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(-hw, 0);
  shape.bezierCurveTo(-hw * 0.9, height * 0.65, -hw * 0.45, height * 0.95, -hw * 0.2, height * 0.65);
  shape.bezierCurveTo(-hw * 0.05, height * 1.15, hw * 0.25, height * 1.1, hw * 0.38, height * 0.6);
  shape.bezierCurveTo(hw * 0.62, height * 0.82, hw * 0.92, height * 0.45, hw, 0.05);
  shape.bezierCurveTo(hw * 0.72, -height * 0.12, -hw * 0.72, -height * 0.12, -hw, 0);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geo.translate(0, 0, -depth * 0.5);
  return geo;
}

function createDoubleBulbGourdGeo(scale = 1.0) {
  // Classic waisted calabash silhouette: bottom bulb -> cinched waist -> upper bulb -> stem nub
  const pts = [
    new THREE.Vector2(0.0, -0.52),
    new THREE.Vector2(0.14, -0.50),
    new THREE.Vector2(0.28, -0.40),
    new THREE.Vector2(0.35, -0.24),
    new THREE.Vector2(0.33, -0.08),
    new THREE.Vector2(0.22, 0.03),
    new THREE.Vector2(0.16, 0.11), // waist
    new THREE.Vector2(0.23, 0.22),
    new THREE.Vector2(0.24, 0.34),
    new THREE.Vector2(0.17, 0.44),
    new THREE.Vector2(0.08, 0.50),
    new THREE.Vector2(0.035, 0.56),
    new THREE.Vector2(0.0, 0.58),
  ];
  for (const p of pts) p.multiplyScalar(scale);
  return new THREE.LatheGeometry(pts, 20);
}

function createLeafGeo() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(0.22, 0.08, 0.30, 0.28, 0.14, 0.46);
  shape.bezierCurveTo(0.05, 0.56, 0.01, 0.62, 0, 0.66);
  shape.bezierCurveTo(-0.01, 0.62, -0.05, 0.56, -0.14, 0.46);
  shape.bezierCurveTo(-0.30, 0.28, -0.22, 0.08, 0, 0);
  return new THREE.ShapeGeometry(shape, 5);
}

function createStylizedPine(assets, scale = 1.0) {
  const group = new THREE.Group();
  const trunkMat = makePaperMat(assets, { color: 0x5c4033, roughness: 0.92, flatShading: true });
  const foliageMat = makePaperMat(assets, { color: 0x266b58, roughness: 0.86, flatShading: true });
  const foliageHiMat = makePaperMat(assets, { color: 0x3b8a6f, roughness: 0.84, flatShading: true });

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07 * scale, 0.14 * scale, 1.8 * scale, 6), trunkMat);
  trunk.position.y = 0.9 * scale;
  trunk.rotation.z = 0.06;
  trunk.castShadow = true;
  group.add(trunk);

  const tiers = [
    { x: -0.35, y: 1.55, r: 0.72, h: 0.38, mat: foliageMat },
    { x: 0.38, y: 1.85, r: 0.62, h: 0.34, mat: foliageHiMat },
    { x: -0.05, y: 2.25, r: 0.82, h: 0.42, mat: foliageMat },
    { x: 0.08, y: 2.65, r: 0.52, h: 0.30, mat: foliageHiMat },
  ];
  for (const t of tiers) {
    const pad = new THREE.Mesh(new THREE.ConeGeometry(t.r * scale, t.h * scale, 7), t.mat);
    pad.position.set(t.x * scale, t.y * scale, 0);
    pad.scale.set(1.25, 0.75, 0.85);
    pad.castShadow = true;
    pad.receiveShadow = true;
    group.add(pad);
  }
  return group;
}

export class MountainSanctuary {
  constructor(assets, center = new THREE.Vector3(0, 0, 0)) {
    this.assets = assets;
    this.group = new THREE.Group();
    this.group.name = 'MountainSanctuary';
    this.group.position.copy(center);
    this.center = this.group.position;

    this._clouds = [];
    this._waterMaterials = [];
    this._waterfallFoams = [];
    this._sealProgress = 0;
    this._vineGrowth = 1;
    this._gourds = [];
    this._vineTubes = [];
    this._vineLeaves = [];

    this._buildTerrain();
    this._buildLayeredMountains();
    this._buildWaterfallAndStream();
    this._buildCloudRibbons();
    this._buildCottage();
    this._buildSealFissure();
    this._buildCalabashPergola();

    // Default initial states
    this.setSealCrack(0);
    this.setVineGrowth(1);
  }

  _buildTerrain() {
    const mapTex = this.assets?.getTexture?.('map_mountain');
    const stageMat = makePaperMat(this.assets, {
      color: 0xd8d2b4,
      roughness: 0.92,
      metalness: 0.02,
      flatShading: true,
    });

    // Main diorama stage plinth (y = 0 top surface)
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 2.4, 24), stageMat);
    plinth.position.set(0, -1.2, -2);
    plinth.receiveShadow = true;
    this.group.add(plinth);

    // Subtle Xuan-paper mineral wash ground inlay
    if (mapTex) {
      const groundOverlay = new THREE.Mesh(
        new THREE.PlaneGeometry(34, 20),
        new THREE.MeshStandardMaterial({
          map: mapTex,
          color: 0xeee8d5,
          roughness: 0.95,
          metalness: 0.0,
          transparent: true,
          opacity: 0.52,
        })
      );
      groundOverlay.rotation.x = -Math.PI / 2;
      groundOverlay.position.set(0, 0.015, -1.2);
      groundOverlay.receiveShadow = true;
      this.group.add(groundOverlay);
    }

    // Layered celadon meadow hills framing the valley apron
    const meadowMat = makePaperMat(this.assets, { color: 0x5c9674, roughness: 0.9, flatShading: true });
    const ochreMat = makePaperMat(this.assets, { color: 0xb99255, roughness: 0.92, flatShading: true });
    const stoneMat = makePaperMat(this.assets, { color: 0xc2b79c, roughness: 0.92, flatShading: true });

    const mounds = [
      { x: -11.5, y: 0.35, z: -2.5, sx: 6.2, sy: 1.4, sz: 4.5, mat: meadowMat },
      { x: -5.2, y: 0.02, z: -2.0, sx: 4.8, sy: 0.25, sz: 3.4, mat: ochreMat },
      { x: 11.2, y: 0.45, z: -2.2, sx: 5.5, sy: 1.6, sz: 4.8, mat: meadowMat },
      { x: -12.5, y: 0.2, z: 3.6, sx: 4.5, sy: 0.9, sz: 2.8, mat: ochreMat },
      { x: 12.2, y: 0.25, z: 3.4, sx: 4.2, sy: 1.0, sz: 2.8, mat: meadowMat },
    ];
    for (const m of mounds) {
      const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), m.mat);
      mesh.position.set(m.x, m.y, m.z);
      mesh.scale.set(m.sx, m.sy, m.sz);
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      this.group.add(mesh);
    }

    // Stepping stone path from cottage (-5, -1.8) to pergola (1.2, 0.2)
    const steps = [
      [-3.5, -1.0, 0.48],
      [-2.5, -0.65, 0.42],
      [-1.5, -0.35, 0.52],
      [-0.5, -0.05, 0.45],
      [0.45, 0.15, 0.46],
    ];
    for (let i = 0; i < steps.length; i++) {
      const [sx, sz, r] = steps[i];
      const flag = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, 0.08, 7), stoneMat);
      flag.position.set(sx, 0.03, sz);
      flag.rotation.y = i * 0.9;
      flag.receiveShadow = true;
      this.group.add(flag);
    }

    // Paper-cut rock cutouts + sculpted foreground mineral rocks
    const rockTex = this.assets?.getTexture?.('stage_rock');
    if (rockTex) {
      const leftCutout = createShadowCutoutMesh(rockTex, 3.6, 2.8, { thickness: 0.08 });
      leftCutout.position.set(-10.2, 1.35, 2.6);
      leftCutout.rotation.y = 0.22;
      this.group.add(leftCutout);

      const rightCutout = createShadowCutoutMesh(rockTex, 3.8, 3.1, { thickness: 0.08 });
      rightCutout.position.set(10.8, 1.45, 2.3);
      rightCutout.rotation.y = -0.25;
      this.group.add(rightCutout);
    }

    // Sculpted 青绿 origami rocks near valley perimeter
    const rockSpecs = [
      { x: -8.6, y: 0.55, z: 1.5, s: 0.95, c: 0x3b766c },
      { x: 6.2, y: 0.45, z: -2.6, s: 0.85, c: 0x457d6e },
      { x: 9.2, y: 0.65, z: 1.2, s: 1.05, c: 0x2f635e },
      { x: -2.2, y: 0.35, z: -4.2, s: 0.78, c: 0x628c70 },
    ];
    for (const r of rockSpecs) {
      const mesh = new THREE.Mesh(
        new THREE.DodecahedronGeometry(r.s, 0),
        makePaperMat(this.assets, { color: r.c, roughness: 0.88, flatShading: true })
      );
      mesh.position.set(r.x, r.y, r.z);
      mesh.scale.set(1.25, 0.9, 0.85);
      mesh.rotation.set(0.2, r.x * 0.7, 0.15);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }
  }

  _buildLayeredMountains() {
    // 4-depth Song Dynasty 青绿山水 extruded paper layers
    const layers = [
      {
        // Far azurite-ink range
        z: -19.5,
        depth: 0.9,
        color: 0x295062,
        emissive: 0x0b1a24,
        points: [
          [-28, -1], [-24, 7.5], [-19, 13.5], [-14.5, 9.2], [-9.5, 16.2],
          [-4.2, 11.4], [1.5, 18.0], [6.8, 12.2], [12.5, 16.8], [18.5, 10.6],
          [24, 13.8], [29, -1],
        ],
      },
      {
        // Mid-far mineral teal ridge
        z: -14.0,
        depth: 0.85,
        color: 0x276b6c,
        emissive: 0x091d1c,
        points: [
          [-25, -1], [-20, 6.2], [-15.2, 11.8], [-10.5, 7.5], [-5.2, 13.0],
          [0.2, 8.4], [5.8, 14.4], [11.5, 9.5], [16.8, 12.6], [22.5, 6.8],
          [26, -1],
        ],
      },
      {
        // Mid-near malachite jade peaks
        z: -9.2,
        depth: 0.8,
        color: 0x328164,
        emissive: 0x0a1e16,
        points: [
          [-22, -1], [-17.5, 5.8], [-12.5, 9.8], [-7.5, 8.2], [-2.8, 6.4],
          [2.4, 9.2], [7.8, 11.2], [13.5, 7.8], [19.2, 9.6], [23, -1],
        ],
      },
      {
        // Near golden-ochre foothill silhouettes
        z: -5.8,
        depth: 0.65,
        color: 0xb99153,
        emissive: 0x1e1406,
        points: [
          [-18, -1], [-14.2, 4.4], [-9.6, 6.5], [-4.8, 3.2], [0.5, 4.1],
          [5.6, 5.2], [11.2, 6.8], [16.8, 4.0], [19.5, -1],
        ],
      },
    ];

    const goldTrimMat = makePaperMat(this.assets, {
      color: 0xd9b86c,
      roughness: 0.65,
      metalness: 0.18,
      flatShading: true,
    });

    for (let i = 0; i < layers.length; i++) {
      const l = layers[i];
      const geo = createExtrudedRidge(l.points, l.depth, 0.1);
      const mat = makePaperMat(this.assets, {
        color: l.color,
        emissive: l.emissive,
        emissiveIntensity: 0.25,
        roughness: 0.88,
        metalness: 0.04,
        flatShading: true,
      });
      const ridge = new THREE.Mesh(geo, mat);
      ridge.position.set(0, -0.3, l.z);
      ridge.castShadow = i >= 2;
      ridge.receiveShadow = true;
      this.group.add(ridge);

      // Subtle mineral-gold sunlit crest accent on mid layers
      if (i === 1 || i === 2) {
        const crestPts = l.points.map(([x, y], idx) => [
          x,
          idx === 0 || idx === l.points.length - 1 ? -1 : y + 0.14,
        ]);
        const crestGeo = createExtrudedRidge(crestPts, 0.12, 0.03);
        const crest = new THREE.Mesh(crestGeo, goldTrimMat);
        crest.position.set(0.15, -0.22, l.z - l.depth * 0.45);
        this.group.add(crest);
      }
    }

    // Stylized Song-dynasty cliff pines
    const pineSpots = [
      [-10.2, 0.8, -4.6, 1.05],
      [-2.0, 2.2, -5.6, 0.9],
      [4.5, 2.8, -5.8, 0.82],
      [12.5, 1.4, -4.4, 1.15],
      [-7.8, 0.3, -1.6, 0.78],
    ];
    for (const [x, y, z, s] of pineSpots) {
      const pine = createStylizedPine(this.assets, s);
      pine.position.set(x, y, z);
      this.group.add(pine);
    }
  }

  _buildWaterfallAndStream() {
    const waterMat = createWaterMireMaterial('water');
    waterMat.side = THREE.DoubleSide;
    this._waterMaterials.push(waterMat);

    // Sculpted waterfall cliff backing on rear-left
    const cliffMat = makePaperMat(this.assets, { color: 0x355c5d, roughness: 0.9, flatShading: true });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(2.2, 9.2, 2.2), cliffMat);
    leftWall.position.set(-10.1, 4.2, -6.5);
    leftWall.rotation.z = -0.08;
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    this.group.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(2.0, 8.6, 2.0), cliffMat);
    rightWall.position.set(-6.4, 4.0, -6.4);
    rightWall.rotation.z = 0.07;
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    this.group.add(rightWall);

    // Animated cascading waterfall sheet (two stepped tiers)
    const upperFall = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 5.2, 8, 12), waterMat);
    upperFall.position.set(-8.2, 5.4, -5.65);
    upperFall.rotation.x = 0.14;
    this.group.add(upperFall);

    const lowerFall = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 3.6, 8, 10), waterMat);
    lowerFall.position.set(-8.15, 1.65, -5.05);
    lowerFall.rotation.x = 0.22;
    this.group.add(lowerFall);

    // Jade mountain pool & winding valley stream
    const pool = new THREE.Mesh(new THREE.CircleGeometry(2.7, 24), waterMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(-8.0, 0.04, -3.5);
    this.group.add(pool);

    const streamShape = new THREE.Shape();
    streamShape.moveTo(-9.2, -2.2);
    streamShape.bezierCurveTo(-9.8, -0.5, -10.8, 1.8, -9.2, 4.5);
    streamShape.lineTo(-7.2, 4.5);
    streamShape.bezierCurveTo(-8.4, 1.8, -7.6, -0.5, -6.8, -2.2);
    streamShape.closePath();
    const stream = new THREE.Mesh(new THREE.ShapeGeometry(streamShape, 14), waterMat);
    stream.rotation.x = -Math.PI / 2;
    stream.position.y = 0.035;
    this.group.add(stream);

    // Rising spray mist sprites at waterfall splashdown
    const glowTex = this.assets?.getTexture?.('proc_soft_glow');
    for (let i = 0; i < 4; i++) {
      const mistMat = new THREE.MeshBasicMaterial({
        map: glowTex || null,
        color: 0xdffaf7,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mist = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), mistMat);
      mist.position.set(-8.7 + i * 0.52, 0.65 + (i % 2) * 0.35, -4.5 + (i % 2) * 0.25);
      this.group.add(mist);
      this._waterfallFoams.push({ mesh: mist, baseY: mist.position.y, phase: i * 1.6 });
    }
  }

  _buildCloudRibbons() {
    const cloudMat = makePaperMat(this.assets, {
      color: 0xf7f1e1,
      emissive: 0xffecc9,
      emissiveIntensity: 0.16,
      roughness: 0.95,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const cloudTex = this.assets?.getTexture?.('proc_cloud');

    const configs = [
      { x: -12, y: 8.8, z: -15.5, w: 8.5, h: 1.4, speed: 0.26, amp: 2.2 },
      { x: 4, y: 11.2, z: -16.8, w: 9.8, h: 1.5, speed: 0.2, amp: 2.8 },
      { x: 13, y: 7.6, z: -11.4, w: 7.0, h: 1.25, speed: 0.34, amp: 1.9 },
      { x: -5, y: 6.4, z: -10.8, w: 6.2, h: 1.05, speed: 0.29, amp: 1.7 },
      { x: 1, y: 5.2, z: -7.5, w: 5.5, h: 0.9, speed: 0.38, amp: 1.5 },
    ];

    for (let i = 0; i < configs.length; i++) {
      const c = configs[i];
      const holder = new THREE.Group();
      holder.position.set(c.x, c.y, c.z);

      const ribbon = new THREE.Mesh(createCloudRibbonGeo(c.w, c.h, 0.2), cloudMat);
      holder.add(ribbon);

      if (cloudTex) {
        const wisp = new THREE.Mesh(
          new THREE.PlaneGeometry(c.w * 1.25, c.h * 2.1),
          new THREE.MeshBasicMaterial({
            map: cloudTex,
            color: 0xfff8eb,
            transparent: true,
            opacity: 0.36,
            depthWrite: false,
          })
        );
        wisp.position.set(0, c.h * 0.3, 0.25);
        holder.add(wisp);
      }

      this.group.add(holder);
      this._clouds.push({
        group: holder,
        baseX: c.x,
        baseY: c.y,
        speed: c.speed,
        amp: c.amp,
        phase: i * 1.35,
      });
    }
  }

  _buildCottage() {
    // Grandpa's 3D thatched cottage at x = -5, z = -1.8
    const cottage = new THREE.Group();
    cottage.name = 'GrandpaCottage';
    cottage.position.set(-5.0, 0, -1.8);
    cottage.rotation.y = 0.26;

    const wallMat = makePaperMat(this.assets, { color: 0xebdcb9, roughness: 0.92, flatShading: true });
    const timberMat = makePaperMat(this.assets, { color: 0x6b4226, roughness: 0.88, flatShading: true });
    const thatchMat = makePaperMat(this.assets, { color: 0xc99c4e, roughness: 0.94, flatShading: true });
    const thatchDarkMat = makePaperMat(this.assets, { color: 0xa67c37, roughness: 0.95, flatShading: true });
    const stoneBaseMat = makePaperMat(this.assets, { color: 0x8f8a7a, roughness: 0.92, flatShading: true });
    const windowGlowMat = makePaperMat(this.assets, {
      color: 0xffd17a,
      emissive: 0xffa73b,
      emissiveIntensity: 0.85,
      roughness: 0.5,
      flatShading: false,
    });

    // Stone foundation
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.32, 2.7), stoneBaseMat);
    base.position.y = 0.16;
    base.castShadow = true;
    base.receiveShadow = true;
    cottage.add(base);

    // Main earthen walls
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.1, 1.85, 2.3), wallMat);
    body.position.y = 1.24;
    body.castShadow = true;
    body.receiveShadow = true;
    cottage.add(body);

    // Corner wooden pillars
    const pillarGeo = new THREE.BoxGeometry(0.16, 1.92, 0.16);
    for (const px of [-1.52, 1.52]) {
      for (const pz of [-1.12, 1.12]) {
        const p = new THREE.Mesh(pillarGeo, timberMat);
        p.position.set(px, 1.26, pz);
        p.castShadow = true;
        cottage.add(p);
      }
    }

    // Wooden doorway
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.38, 0.14), timberMat);
    doorFrame.position.set(-0.35, 0.98, 1.14);
    cottage.add(doorFrame);
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.26, 0.08),
      makePaperMat(this.assets, { color: 0x4f2e19, roughness: 0.9 })
    );
    doorPanel.position.set(-0.35, 0.94, 1.19);
    cottage.add(doorPanel);

    // Warm glowing lattice window
    const winBg = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.68), windowGlowMat);
    winBg.position.set(0.75, 1.25, 1.17);
    cottage.add(winBg);
    const winH = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.06, 0.08), timberMat);
    winH.position.set(0.75, 1.25, 1.19);
    cottage.add(winH);
    const winV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 0.08), timberMat);
    winV.position.set(0.75, 1.25, 1.19);
    cottage.add(winV);

    // Sculpted layered thatched gable roof
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-2.2, 0);
    roofShape.lineTo(0, 1.48);
    roofShape.lineTo(2.2, 0);
    roofShape.lineTo(1.75, -0.14);
    roofShape.lineTo(0, 1.05);
    roofShape.lineTo(-1.75, -0.14);
    roofShape.closePath();

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
      depth: 3.15,
      bevelEnabled: true,
      bevelThickness: 0.07,
      bevelSize: 0.06,
      bevelSegments: 1,
    });
    roofGeo.translate(0, 0, -1.575);
    const roof = new THREE.Mesh(roofGeo, thatchMat);
    roof.position.y = 2.08;
    roof.castShadow = true;
    roof.receiveShadow = true;
    cottage.add(roof);

    // Upper thatch ridge cap & overhang fascia
    const ridgeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3.35, 6), thatchDarkMat);
    ridgeCap.rotation.x = Math.PI / 2;
    ridgeCap.position.set(0, 3.52, 0);
    ridgeCap.castShadow = true;
    cottage.add(ridgeCap);

    // Chimney & bamboo yard fence
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 1.0, 6), stoneBaseMat);
    chimney.position.set(-1.1, 3.2, -0.5);
    chimney.castShadow = true;
    cottage.add(chimney);

    const bambooMat = makePaperMat(this.assets, { color: 0x8fa362, roughness: 0.85, flatShading: true });
    for (let i = 0; i < 6; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.72, 5), bambooMat);
      post.position.set(-1.95 - i * 0.36, 0.36, 0.95 - i * 0.12);
      post.castShadow = true;
      cottage.add(post);
    }
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.0, 5), bambooMat);
    rail.rotation.z = Math.PI / 2;
    rail.rotation.y = 0.32;
    rail.position.set(-2.85, 0.52, 0.65);
    cottage.add(rail);

    this.group.add(cottage);
    this.cottage = cottage;
  }

  _buildSealFissure() {
    // Sculpted cliff seal fissure at x = 8.5, y = 3.2, z = -3.8
    const sealGroup = new THREE.Group();
    sealGroup.name = 'CliffSealFissure';
    sealGroup.position.set(8.5, 3.2, -3.8);

    const rockMat = makePaperMat(this.assets, { color: 0x314e52, roughness: 0.9, flatShading: true });
    const darkCavityMat = new THREE.MeshBasicMaterial({ color: 0x100518 });

    // Backing cliff massif behind the fissure
    const backing = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8, 1), rockMat);
    backing.scale.set(1.25, 1.55, 0.7);
    backing.position.set(0, -0.4, -1.7);
    backing.castShadow = true;
    backing.receiveShadow = true;
    sealGroup.add(backing);

    // Split left & right cliff jaws that widen as setSealCrack(p) opens
    const jawShapeL = new THREE.Shape();
    jawShapeL.moveTo(-3.2, -3.2);
    jawShapeL.lineTo(-0.15, -2.5);
    jawShapeL.lineTo(-0.42, -0.8);
    jawShapeL.lineTo(-0.08, 0.6);
    jawShapeL.lineTo(-0.35, 2.3);
    jawShapeL.lineTo(-2.9, 3.2);
    jawShapeL.closePath();

    const jawShapeR = new THREE.Shape();
    jawShapeR.moveTo(3.2, -3.2);
    jawShapeR.lineTo(0.15, -2.5);
    jawShapeR.lineTo(0.36, -0.7);
    jawShapeR.lineTo(0.08, 0.7);
    jawShapeR.lineTo(0.38, 2.3);
    jawShapeR.lineTo(2.9, 3.2);
    jawShapeR.closePath();

    const jawGeoL = new THREE.ExtrudeGeometry(jawShapeL, {
      depth: 1.15,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 1,
    });
    const jawGeoR = new THREE.ExtrudeGeometry(jawShapeR, {
      depth: 1.15,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.12,
      bevelSegments: 1,
    });

    this._sealJawLeft = new THREE.Mesh(jawGeoL, rockMat);
    this._sealJawLeft.position.set(0, 0, -0.55);
    this._sealJawLeft.castShadow = true;
    this._sealJawLeft.receiveShadow = true;
    sealGroup.add(this._sealJawLeft);

    this._sealJawRight = new THREE.Mesh(jawGeoR, rockMat);
    this._sealJawRight.position.set(0, 0, -0.55);
    this._sealJawRight.castShadow = true;
    this._sealJawRight.receiveShadow = true;
    sealGroup.add(this._sealJawRight);

    // Deep abyss cavity
    const cavity = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 4.8), darkCavityMat);
    cavity.position.set(0, 0, -0.42);
    sealGroup.add(cavity);

    // Jagged glowing purple fissure crack
    const crackShape = new THREE.Shape();
    crackShape.moveTo(0, -2.1);
    crackShape.lineTo(0.36, -1.0);
    crackShape.lineTo(0.18, 0.1);
    crackShape.lineTo(0.42, 1.1);
    crackShape.lineTo(0.05, 2.2);
    crackShape.lineTo(-0.34, 1.15);
    crackShape.lineTo(-0.14, 0.05);
    crackShape.lineTo(-0.38, -0.95);
    crackShape.closePath();

    this._sealCrackMat = new THREE.MeshBasicMaterial({
      color: 0xc84bff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._sealCrackMesh = new THREE.Mesh(new THREE.ShapeGeometry(crackShape), this._sealCrackMat);
    this._sealCrackMesh.position.set(0, 0, 0.15);
    sealGroup.add(this._sealCrackMesh);

    // Ancient golden seal ring (breaks apart when fissure opens)
    const sealRingMat = makePaperMat(this.assets, {
      color: 0xe3b84c,
      emissive: 0xc98f22,
      emissiveIntensity: 0.45,
      metalness: 0.35,
      roughness: 0.45,
      flatShading: true,
    });
    this._sealRingLeft = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 6, 12, Math.PI), sealRingMat);
    this._sealRingLeft.rotation.z = Math.PI * 0.5;
    this._sealRingLeft.position.set(-0.04, 0.1, 0.72);
    sealGroup.add(this._sealRingLeft);

    this._sealRingRight = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 6, 12, Math.PI), sealRingMat);
    this._sealRingRight.rotation.z = -Math.PI * 0.5;
    this._sealRingRight.position.set(0.04, 0.1, 0.72);
    sealGroup.add(this._sealRingRight);

    // Soft eerie aura sprite + dedicated inner point light
    const glowTex = this.assets?.getTexture?.('proc_soft_glow');
    this._sealGlowMat = new THREE.MeshBasicMaterial({
      map: glowTex || null,
      color: 0x9b2bff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this._sealGlowSprite = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 6.2), this._sealGlowMat);
    this._sealGlowSprite.position.set(0, 0.1, 0.85);
    sealGroup.add(this._sealGlowSprite);

    this._sealLight = new THREE.PointLight(0xa938ff, 0, 14, 1.8);
    this._sealLight.position.set(0, 0.1, 1.4);
    sealGroup.add(this._sealLight);

    this.group.add(sealGroup);
    this.sealFissure = sealGroup;
  }

  _buildCalabashPergola() {
    // Centerpiece 3D Seven-Color Calabash Vine Pergola at x = 1.2, y = 0, z = 0.2
    const pergola = new THREE.Group();
    pergola.name = 'CalabashPergola';
    pergola.position.set(1.2, 0, 0.2);

    const woodMat = makePaperMat(this.assets, { color: 0x6c4628, roughness: 0.88, flatShading: true });
    const stoneMat = makePaperMat(this.assets, { color: 0x9a9483, roughness: 0.92, flatShading: true });
    const vineMat = makePaperMat(this.assets, { color: 0x2d7a42, roughness: 0.82, flatShading: false });
    const leafMat = makePaperMat(this.assets, {
      color: 0x3b9951,
      roughness: 0.78,
      flatShading: true,
      side: THREE.DoubleSide,
    });

    // Stone pedestals & 4 wooden trellis posts (wide span 4.8 for 7 gourds)
    const postPositions = [
      [-2.35, -0.75],
      [2.35, -0.75],
      [-2.15, 0.75],
      [2.15, 0.75],
    ];
    for (const [px, pz] of postPositions) {
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.34, 7), stoneMat);
      foot.position.set(px, 0.17, pz);
      foot.castShadow = true;
      foot.receiveShadow = true;
      pergola.add(foot);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.12, 3.65, 7), woodMat);
      post.position.set(px, 2.0, pz);
      post.rotation.z = px < 0 ? -0.05 : 0.05;
      post.castShadow = true;
      post.receiveShadow = true;
      pergola.add(post);
    }

    // Overhead arched cross-beams & trellis rafters
    const topFrontBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 5.4, 7), woodMat);
    topFrontBeam.rotation.z = Math.PI / 2;
    topFrontBeam.position.set(0, 3.75, 0.72);
    topFrontBeam.castShadow = true;
    pergola.add(topFrontBeam);

    const topBackBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 5.5, 7), woodMat);
    topBackBeam.rotation.z = Math.PI / 2;
    topBackBeam.position.set(0, 3.85, -0.72);
    topBackBeam.castShadow = true;
    pergola.add(topBackBeam);

    for (let i = -3; i <= 3; i++) {
      const rafter = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 1.95, 6), woodMat);
      rafter.rotation.x = Math.PI / 2;
      rafter.position.set(i * 0.72, 3.88, 0);
      rafter.castShadow = true;
      pergola.add(rafter);
    }

    // Subtle 1986 prop_vine cutout behind the rear posts for painterly lushness
    const vineTex = this.assets?.getTexture?.('prop_vine');
    if (vineTex) {
      this._vineBackdrop = createShadowCutoutMesh(vineTex, 5.4, 3.9, { thickness: 0.04 });
      this._vineBackdrop.position.set(0, 2.05, -0.92);
      pergola.add(this._vineBackdrop);
    }

    // Winding 3D TubeGeometry calabash vines climbing both posts and arching across top
    const mainCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.3, 0.15, 0.65),
      new THREE.Vector3(-2.45, 1.25, 0.4),
      new THREE.Vector3(-2.15, 2.45, 0.85),
      new THREE.Vector3(-1.95, 3.7, 0.55),
      new THREE.Vector3(-0.9, 4.02, 0.12),
      new THREE.Vector3(0.0, 3.92, 0.45),
      new THREE.Vector3(1.0, 4.05, 0.08),
      new THREE.Vector3(2.0, 3.72, 0.52),
      new THREE.Vector3(2.3, 2.35, 0.72),
      new THREE.Vector3(2.15, 0.95, 0.35),
    ]);
    const mainVineGeo = new THREE.TubeGeometry(mainCurve, 72, 0.075, 7, false);
    const mainVine = new THREE.Mesh(mainVineGeo, vineMat);
    mainVine.castShadow = true;
    pergola.add(mainVine);
    this._vineTubes.push({ mesh: mainVine, totalCount: mainVineGeo.index.count });

    const secondaryCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.25, 0.3, -0.65),
      new THREE.Vector3(-1.95, 1.9, -0.82),
      new THREE.Vector3(-1.45, 3.82, -0.58),
      new THREE.Vector3(-0.2, 4.12, -0.25),
      new THREE.Vector3(1.15, 3.95, -0.52),
      new THREE.Vector3(2.25, 3.65, -0.68),
      new THREE.Vector3(2.42, 1.8, -0.55),
    ]);
    const secVineGeo = new THREE.TubeGeometry(secondaryCurve, 56, 0.055, 6, false);
    const secVine = new THREE.Mesh(secVineGeo, vineMat);
    secVine.castShadow = true;
    pergola.add(secVine);
    this._vineTubes.push({ mesh: secVine, totalCount: secVineGeo.index.count });

    // Coiled tendril curls & heart-shaped calabash leaves
    const leafGeo = createLeafGeo();
    for (let i = 0; i < 26; i++) {
      const u = 0.08 + (i / 25) * 0.84;
      const curve = i % 2 === 0 ? mainCurve : secondaryCurve;
      const pt = curve.getPoint(u);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.copy(pt);
      leaf.position.x += (Math.sin(i * 3.1) * 0.18);
      leaf.position.y += (Math.cos(i * 2.7) * 0.12);
      leaf.position.z += (i % 2 === 0 ? 0.14 : -0.14);
      leaf.rotation.set(
        0.5 + Math.sin(i * 1.9) * 0.65,
        Math.cos(i * 2.3) * 1.4,
        Math.sin(i * 1.4) * 0.9
      );
      const targetScale = 0.55 + (i % 4) * 0.16;
      leaf.scale.setScalar(targetScale);
      leaf.castShadow = true;
      pergola.add(leaf);
      this._vineLeaves.push({ mesh: leaf, targetScale, threshold: u * 0.85, phase: i * 0.7 });
    }

    // 7 individually controllable 3D Double-Bulb Gourds (Red..Purple)
    const gourdGeo = createDoubleBulbGourdGeo(0.76);
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.032, 0.42, 5);
    const glowTex = this.assets?.getTexture?.('proc_soft_glow');

    const gourdArcX = [-1.92, -1.28, -0.64, 0.0, 0.64, 1.28, 1.92];
    const gourdArcY = [3.18, 3.36, 3.46, 3.52, 3.46, 3.36, 3.18];
    const gourdArcZ = [0.42, 0.52, 0.58, 0.62, 0.58, 0.52, 0.42];

    for (let i = 0; i < 7; i++) {
      const pal = GOURD_PALETTE[i];
      const anchor = new THREE.Group();
      anchor.name = `CalabashGourd_${i}_${pal.name}`;
      anchor.position.set(gourdArcX[i], gourdArcY[i], gourdArcZ[i]);

      const stem = new THREE.Mesh(stemGeo, vineMat);
      stem.position.y = 0.22;
      anchor.add(stem);

      const bodyHolder = new THREE.Group();
      bodyHolder.position.y = -0.26;
      anchor.add(bodyHolder);

      const gourdMat = makePaperMat(this.assets, {
        color: pal.color,
        emissive: pal.emissive,
        emissiveIntensity: 0.22,
        roughness: 0.42,
        metalness: 0.08,
        flatShading: false,
      });
      const gourdMesh = new THREE.Mesh(gourdGeo, gourdMat);
      gourdMesh.castShadow = true;
      gourdMesh.receiveShadow = true;
      bodyHolder.add(gourdMesh);

      // Fracture crack ring overlay (shown when cracked: true)
      const crackMat = new THREE.MeshBasicMaterial({
        color: 0xfff8d6,
        wireframe: true,
        transparent: true,
        opacity: 0.9,
      });
      const crackOverlay = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), crackMat);
      crackOverlay.scale.set(1.08, 1.48, 1.08);
      crackOverlay.visible = false;
      bodyHolder.add(crackOverlay);

      // Dark corruption shell (shown when darkCorrupted: true, e.g. Act 7 Purple Gourd)
      const darkMat = new THREE.MeshBasicMaterial({
        color: 0x45005e,
        wireframe: true,
        transparent: true,
        opacity: 0.72,
      });
      const darkShell = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), darkMat);
      darkShell.scale.set(1.0, 1.35, 1.0);
      darkShell.visible = false;
      bodyHolder.add(darkShell);

      // Soft emissive aura halo sprite
      const glowMat = new THREE.MeshBasicMaterial({
        map: glowTex || null,
        color: pal.glow,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowSprite = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.85), glowMat);
      glowSprite.position.z = 0.08;
      bodyHolder.add(glowSprite);

      pergola.add(anchor);
      this._gourds.push({
        index: i,
        palette: pal,
        anchor,
        bodyHolder,
        mesh: gourdMesh,
        material: gourdMat,
        crackOverlay,
        darkShell,
        glowSprite,
        glowMat,
        state: {
          visible: true,
          scale: 1,
          glow: 0.3,
          cracked: false,
          darkCorrupted: false,
        },
        phase: i * 0.92,
      });
    }

    // Shared pergola spirit point light (tinted dynamically by brightest glowing gourd)
    this._pergolaLight = new THREE.PointLight(0xffdd99, 1.1, 10, 1.8);
    this._pergolaLight.position.set(0, 3.0, 1.2);
    pergola.add(this._pergolaLight);

    this.group.add(pergola);
    this.pergola = pergola;
  }

  setSealCrack(p = 0) {
    const t = clamp01(p);
    this._sealProgress = t;

    // Widen split cliff jaws and fracture ancient golden seal ring
    this._sealJawLeft.position.x = -t * 0.52;
    this._sealJawRight.position.x = t * 0.52;
    this._sealRingLeft.position.set(-0.04 - t * 0.85, 0.1 + t * 0.25, 0.72 + t * 0.2);
    this._sealRingLeft.rotation.z = Math.PI * 0.5 + t * 0.55;
    this._sealRingRight.position.set(0.04 + t * 0.85, 0.1 - t * 0.22, 0.72 + t * 0.2);
    this._sealRingRight.rotation.z = -Math.PI * 0.5 - t * 0.55;
    this._sealRingLeft.visible = t < 0.96;
    this._sealRingRight.visible = t < 0.96;

    this._sealCrackMat.opacity = t * 0.95;
    this._sealCrackMesh.scale.set(0.35 + t * 0.95, 0.6 + t * 0.5, 1);
    this._sealGlowMat.opacity = t * 0.72;
    this._sealGlowSprite.scale.setScalar(0.6 + t * 0.85);
    this._sealLight.intensity = t * 5.2;
  }

  setVineGrowth(p = 1) {
    const g = clamp01(p);
    this._vineGrowth = g;

    for (const v of this._vineTubes) {
      const count = Math.floor(v.totalCount * g);
      v.mesh.geometry.setDrawRange(0, count);
      v.mesh.visible = g > 0.01;
    }

    for (const leaf of this._vineLeaves) {
      const localP = clamp01((g - leaf.threshold) / 0.22);
      leaf.mesh.visible = localP > 0.01;
      leaf.mesh.scale.setScalar(Math.max(0.001, leaf.targetScale * localP));
    }

    if (this._vineBackdrop) {
      this._vineBackdrop.visible = g > 0.12;
      this._vineBackdrop.scale.set(1, Math.max(0.01, g), 1);
    }
  }

  setGourdState(index, opts = {}) {
    const gourd = this._gourds[index];
    if (!gourd) return;

    const s = gourd.state;
    if (opts.visible !== undefined) s.visible = Boolean(opts.visible);
    if (opts.scale !== undefined) s.scale = Math.max(0, Number(opts.scale));
    if (opts.glow !== undefined) s.glow = Math.max(0, Number(opts.glow));
    if (opts.cracked !== undefined) s.cracked = Boolean(opts.cracked);
    if (opts.darkCorrupted !== undefined) s.darkCorrupted = Boolean(opts.darkCorrupted);

    gourd.anchor.visible = s.visible && s.scale > 0.001;
    gourd.bodyHolder.scale.setScalar(Math.max(0.001, s.scale));

    if (s.darkCorrupted) {
      gourd.material.color.setHex(0x2a083b);
      gourd.material.emissive.setHex(0x7c14b5);
      gourd.material.emissiveIntensity = 0.55 + s.glow * 1.1;
      gourd.glowMat.color.setHex(0x8818c7);
      gourd.glowMat.opacity = Math.min(0.95, 0.35 + s.glow * 0.55);
      gourd.darkShell.visible = true;
    } else {
      gourd.material.color.setHex(gourd.palette.color);
      gourd.material.emissive.setHex(gourd.palette.emissive);
      gourd.material.emissiveIntensity = 0.14 + s.glow * 1.45;
      gourd.glowMat.color.setHex(gourd.palette.glow);
      gourd.glowMat.opacity = Math.min(0.95, s.glow * 0.72);
      gourd.darkShell.visible = false;
    }

    gourd.crackOverlay.visible = s.cracked;
    const haloScale = 0.85 + s.glow * 0.7;
    gourd.glowSprite.scale.set(haloScale, haloScale * 1.15, 1);

    this._refreshPergolaLight();
  }

  _refreshPergolaLight() {
    let maxGlow = 0;
    let bestColor = 0xffdd99;
    let totalGlow = 0;
    for (const g of this._gourds) {
      if (!g.state.visible || g.state.scale <= 0.05) continue;
      totalGlow += g.state.glow;
      if (g.state.glow > maxGlow) {
        maxGlow = g.state.glow;
        bestColor = g.state.darkCorrupted ? 0x9922cc : g.palette.glow;
      }
    }
    this._pergolaLight.color.setHex(bestColor);
    this._pergolaLight.intensity = 0.4 + Math.min(3.5, totalGlow * 0.45 + maxGlow * 1.2);
  }

  getGourdWorldPos(index, target = new THREE.Vector3()) {
    const gourd = this._gourds[index];
    if (!gourd) return target.copy(this.center).add(new THREE.Vector3(1.2, 3.0, 0.6));
    gourd.bodyHolder.updateWorldMatrix(true, false);
    return gourd.bodyHolder.getWorldPosition(target);
  }

  update(t = 0) {
    // Update animated waterfall & stream shaders
    for (const mat of this._waterMaterials) {
      if (mat.userData && typeof mat.userData.update === 'function') {
        mat.userData.update(t);
      } else if (mat.uniforms?.uTime) {
        mat.uniforms.uTime.value = t;
      }
    }

    // Waterfall mist shimmer
    for (const f of this._waterfallFoams) {
      f.mesh.position.y = f.baseY + Math.sin(t * 2.6 + f.phase) * 0.16;
      f.mesh.scale.setScalar(0.92 + Math.sin(t * 3.1 + f.phase) * 0.14);
    }

    // Gentle drifting 3D cloud ribbons
    for (const c of this._clouds) {
      c.group.position.x = c.baseX + Math.sin(t * c.speed + c.phase) * c.amp;
      c.group.position.y = c.baseY + Math.cos(t * c.speed * 0.7 + c.phase) * 0.18;
    }

    // Hanging gourd gentle mountain breeze & crack tremble
    for (const g of this._gourds) {
      if (!g.anchor.visible) continue;
      const sway = Math.sin(t * 1.45 + g.phase) * 0.065;
      const crackJitter = g.state.cracked ? Math.sin(t * 28 + g.phase) * 0.08 : 0;
      g.anchor.rotation.z = sway + crackJitter;
      g.bodyHolder.rotation.y = Math.sin(t * 0.9 + g.phase) * 0.18;
      if (g.state.darkCorrupted) {
        g.darkShell.rotation.y = t * 1.6 + g.phase;
        g.darkShell.rotation.z = Math.sin(t * 2.4 + g.phase) * 0.25;
      }
      if (g.state.glow > 0.05) {
        const pulse = 1 + Math.sin(t * 3.2 + g.phase) * 0.12;
        g.glowMat.opacity = Math.min(0.95, (g.state.darkCorrupted ? 0.35 : 0.08) + g.state.glow * 0.62 * pulse);
      }
    }

    // Eerie seal fissure pulse when cracked
    if (this._sealProgress > 0.01) {
      const flicker = 0.85 + Math.sin(t * 7.5) * 0.15 + Math.sin(t * 15.3) * 0.07;
      this._sealLight.intensity = this._sealProgress * 5.2 * flicker;
      this._sealGlowMat.opacity = this._sealProgress * 0.72 * flicker;
    }
  }
}

export default MountainSanctuary;
