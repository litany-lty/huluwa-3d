import * as THREE from 'three';
import {
  createPaperStandardMaterial,
  createShadowCutoutMesh,
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

function createQinghuaPorcelainTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Glossy ivory-white porcelain base
  ctx.fillStyle = '#f2efe6';
  ctx.fillRect(0, 0, 512, 256);

  // Cobalt blue double rim bands
  ctx.fillStyle = '#1b4796';
  ctx.fillRect(0, 14, 512, 12);
  ctx.fillRect(0, 32, 512, 5);
  ctx.fillRect(0, 214, 512, 10);
  ctx.fillRect(0, 232, 512, 5);

  // Traditional cloud-scroll & lotus petal brushwork motifs
  ctx.strokeStyle = '#1f4fa3';
  ctx.fillStyle = '#2558b0';
  ctx.lineWidth = 4;
  for (let i = 0; i < 8; i++) {
    const cx = 32 + i * 64;
    // Cloud whorl
    ctx.beginPath();
    ctx.arc(cx, 118, 22, 0.2, Math.PI * 1.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 12, 110, 12, Math.PI * 0.4, Math.PI * 1.9);
    ctx.stroke();
    // Lotus leaf medallions
    ctx.beginPath();
    ctx.moveTo(cx, 170);
    ctx.quadraticCurveTo(cx - 18, 195, cx, 206);
    ctx.quadraticCurveTo(cx + 18, 195, cx, 170);
    ctx.fill();
    // Upper key-fret accents
    ctx.strokeRect(cx - 10, 48, 20, 14);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createAmethystBlossomTree(assets, scale = 1.0, flipX = 1) {
  const tree = new THREE.Group();
  const trunkMat = makePaperMat(assets, {
    color: 0x4c3569,
    emissive: 0x261242,
    emissiveIntensity: 0.35,
    roughness: 0.58,
    metalness: 0.2,
    flatShading: true,
  });
  const crystalMatA = makePaperMat(assets, {
    color: 0xd96bff,
    emissive: 0xb938f0,
    emissiveIntensity: 0.72,
    roughness: 0.22,
    metalness: 0.12,
    transparent: true,
    opacity: 0.9,
    flatShading: true,
  });
  const crystalMatB = makePaperMat(assets, {
    color: 0xff8ad8,
    emissive: 0xe64ab0,
    emissiveIntensity: 0.78,
    roughness: 0.25,
    metalness: 0.1,
    transparent: true,
    opacity: 0.92,
    flatShading: true,
  });

  // Gnarled sculptural trunk + curving crystal boughs
  const branches = [
    [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.25 * flipX, 1.4, 0.1),
      new THREE.Vector3(-0.15 * flipX, 2.9, -0.1),
      new THREE.Vector3(0.65 * flipX, 4.1, 0.2),
    ],
    [
      new THREE.Vector3(0.05 * flipX, 2.2, 0),
      new THREE.Vector3(-1.15 * flipX, 3.1, 0.35),
      new THREE.Vector3(-1.95 * flipX, 3.5, 0.2),
    ],
    [
      new THREE.Vector3(0.1 * flipX, 2.5, -0.05),
      new THREE.Vector3(1.1 * flipX, 3.25, -0.25),
      new THREE.Vector3(1.85 * flipX, 3.7, -0.15),
    ],
  ];

  const tips = [];
  for (let b = 0; b < branches.length; b++) {
    const curve = new THREE.CatmullRomCurve3(branches[b].map((p) => p.clone().multiplyScalar(scale)));
    const r = (b === 0 ? 0.16 : 0.095) * scale;
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 18, r, 6, false), trunkMat);
    mesh.castShadow = true;
    tree.add(mesh);
    tips.push(curve.getPoint(0.75), curve.getPoint(1.0));
  }

  // Faceted glowing amethyst crystal flower clusters (1986 Episode 8-9 signature!)
  const blossoms = [];
  const petalGeo = new THREE.OctahedronGeometry(0.32 * scale, 0);
  for (let i = 0; i < tips.length; i++) {
    const tip = tips[i];
    const cluster = new THREE.Group();
    cluster.position.copy(tip);
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      const mat = (k + i) % 2 === 0 ? crystalMatA : crystalMatB;
      const petal = new THREE.Mesh(petalGeo, mat);
      petal.position.set(
        Math.cos(a) * 0.48 * scale,
        Math.sin(k * 1.7) * 0.28 * scale + 0.12 * scale,
        Math.sin(a) * 0.42 * scale
      );
      petal.scale.set(0.75 + (k % 3) * 0.22, 1.25, 0.72);
      petal.rotation.set(k * 0.5, a, k * 0.35);
      cluster.add(petal);
    }
    tree.add(cluster);
    blossoms.push({ group: cluster, phase: i * 1.15 });
  }

  return { group: tree, blossoms };
}

export class CrystalPalace {
  constructor(assets, center = new THREE.Vector3(130, 0, 0)) {
    this.assets = assets;
    this.group = new THREE.Group();
    this.group.name = 'CrystalPalace';
    this.group.position.copy(center);
    this.center = this.group.position;

    this._blossoms = [];
    this._wineState = { active: false, swirl: 0 };
    this._iceState = { active: false, shatter: 0 };
    this._mirrorState = { active: true, beam: 0, shattered: 0 };
    this._iceShards = [];
    this._mirrorShards = [];

    this._buildPalaceHall();
    this._buildDemonGate();
    this._buildGrandpaWebPillar();
    this._buildAmethystTreesAndBanquet();
    this._buildWineBowl();
    this._buildIcePrism();
    this._buildMirrorAltar();
    this._buildDemonCouchAndRuyi();

    // Initial defaults
    this.setDoorOpen(0);
    this.setGrandpaWeb(true);
    this.setWineBowl({ active: false, swirl: 0 });
    this.setIcePrism({ active: false, shatter: 0 });
    this.setMirror({ active: true, beam: 0, shattered: false });
    this.setRuyiOnCouch(true);
  }

  _buildPalaceHall() {
    const floorMat = makePaperMat(this.assets, {
      color: 0x1b122b,
      roughness: 0.72,
      metalness: 0.14,
      flatShading: true,
    });
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(24, 26, 2.4, 24), floorMat);
    plinth.position.set(0, -1.2, -1.6);
    plinth.receiveShadow = true;
    this.group.add(plinth);

    // map_palace ornate subterranean floor medallion
    const palaceTex = this.assets?.getTexture?.('map_palace');
    if (palaceTex) {
      const floorInlay = new THREE.Mesh(
        new THREE.PlaneGeometry(28, 17),
        new THREE.MeshStandardMaterial({
          map: palaceTex,
          color: 0x9b86bd,
          roughness: 0.78,
          metalness: 0.12,
          transparent: true,
          opacity: 0.48,
        })
      );
      floorInlay.rotation.x = -Math.PI / 2;
      floorInlay.position.set(0.5, 0.014, -1.2);
      floorInlay.receiveShadow = true;
      this.group.add(floorInlay);
    }

    // Rear crystal cavern vaulted backdrop wall
    const wallMat = makePaperMat(this.assets, {
      color: 0x150d26,
      roughness: 0.86,
      metalness: 0.12,
      flatShading: true,
    });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(36, 15, 2.4), wallMat);
    backWall.position.set(1.0, 6.8, -9.8);
    backWall.receiveShadow = true;
    this.group.add(backWall);

    // Carved demon crystal columns lining the palace hall
    const pillarMat = makePaperMat(this.assets, {
      color: 0x35254f,
      roughness: 0.78,
      metalness: 0.18,
      flatShading: true,
    });
    const runeBandMat = makePaperMat(this.assets, {
      color: 0x9b5de5,
      emissive: 0x7b2cbf,
      emissiveIntensity: 0.75,
      roughness: 0.4,
      flatShading: true,
    });

    const pillarCoords = [
      [-6.8, -5.6],
      [-1.5, -6.2],
      [3.8, -6.2],
      [9.4, -5.2],
      [11.2, 0.4],
    ];
    for (const [px, pz] of pillarCoords) {
      const col = new THREE.Group();
      col.position.set(px, 0, pz);

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.82, 10.2, 8), pillarMat);
      shaft.position.y = 5.1;
      shaft.castShadow = true;
      shaft.receiveShadow = true;
      col.add(shaft);

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.65, 8), pillarMat);
      base.position.y = 0.325;
      col.add(base);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 0.28, 8), runeBandMat);
      band.position.y = 3.2;
      col.add(band);

      this.group.add(col);
    }

    // 3D Cavern Stalagmite Pillars framing palace wings (Stage_02 GLB)
    const pL = this.assets?.instantiateModel?.('stage_pillar', { fitHeight: 6.4, pivotBottom: true });
    if (pL) {
      pL.position.set(-11.2, 0.0, -3.2);
      this.group.add(pL);
    }
    const pR = this.assets?.instantiateModel?.('stage_pillar', { fitHeight: 6.6, pivotBottom: true });
    if (pR) {
      pR.position.set(11.6, 0.0, -2.6);
      this.group.add(pR);
    }

    // Hanging luminous crystal stalactites across cavern ceiling
    const stalactiteMat = makePaperMat(this.assets, {
      color: 0x563985,
      emissive: 0x3b1e6e,
      emissiveIntensity: 0.45,
      roughness: 0.38,
      metalness: 0.18,
      flatShading: true,
    });
    for (let i = 0; i < 14; i++) {
      const h = 2.0 + (i % 4) * 0.95;
      const r = 0.26 + (i % 3) * 0.14;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), stalactiteMat);
      cone.rotation.x = Math.PI;
      cone.position.set(-10 + i * 1.65, 10.6 - h * 0.35, -3.5 - (i % 3) * 1.8);
      this.group.add(cone);
    }

    // Ambient amethyst palace chandelier light
    this._palaceLight = new THREE.PointLight(0xb86bff, 2.2, 18, 1.6);
    this._palaceLight.position.set(0.5, 5.6, -0.5);
    this.group.add(this._palaceLight);
  }

  _buildDemonGate() {
    // Demon Cave Gate at world x = 121 (local x = -9, y = 0, z = 0)
    const gate = new THREE.Group();
    gate.name = 'DemonCaveGate';
    gate.position.set(-9.0, 0, 0);
    gate.rotation.y = Math.PI * 0.36; // angled slightly toward viewer & hall

    const stoneMat = makePaperMat(this.assets, { color: 0x383248, roughness: 0.9, flatShading: true });
    const leafMat = makePaperMat(this.assets, { color: 0x4b425c, roughness: 0.85, metalness: 0.15, flatShading: true });
    const brassMat = makePaperMat(this.assets, {
      color: 0xc99c42,
      emissive: 0x5c3e0e,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
      flatShading: true,
    });

    // Heavy stone arch frame with fang keystones
    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.95, 5.4, 1.2), stoneMat);
    pillarL.position.set(-1.95, 2.7, 0);
    pillarL.castShadow = true;
    pillarL.receiveShadow = true;
    gate.add(pillarL);

    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.95, 5.4, 1.2), stoneMat);
    pillarR.position.set(1.95, 2.7, 0);
    pillarR.castShadow = true;
    pillarR.receiveShadow = true;
    gate.add(pillarR);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.1, 1.45), stoneMat);
    lintel.position.set(0, 5.55, 0);
    lintel.castShadow = true;
    gate.add(lintel);

    // Carved stone fangs along lintel underside
    for (let i = -2; i <= 2; i++) {
      const fang = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.55, 4), stoneMat);
      fang.rotation.x = Math.PI;
      fang.position.set(i * 0.65, 4.82, 0.35);
      gate.add(fang);
    }

    // Two sliding carved stone door leaves
    this._doorLeft = new THREE.Group();
    this._doorLeft.position.set(-0.74, 2.5, 0);
    const leafMeshL = new THREE.Mesh(new THREE.BoxGeometry(1.46, 4.95, 0.42), leafMat);
    leafMeshL.castShadow = true;
    leafMeshL.receiveShadow = true;
    this._doorLeft.add(leafMeshL);
    const knockerL = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 6, 12), brassMat);
    knockerL.position.set(0.35, -0.1, 0.24);
    this._doorLeft.add(knockerL);
    gate.add(this._doorLeft);

    this._doorRight = new THREE.Group();
    this._doorRight.position.set(0.74, 2.5, 0);
    const leafMeshR = new THREE.Mesh(new THREE.BoxGeometry(1.46, 4.95, 0.42), leafMat);
    leafMeshR.castShadow = true;
    leafMeshR.receiveShadow = true;
    this._doorRight.add(leafMeshR);
    const knockerR = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 6, 12), brassMat);
    knockerR.position.set(-0.35, -0.1, 0.24);
    this._doorRight.add(knockerR);
    gate.add(this._doorRight);

    // 3D Dungeon Stone Doors Closed & Open (Stage_05 & Stage_05b GLB)
    const closed3D = this.assets?.instantiateModel?.('stage_door_closed', { fitHeight: 5.2, pivotBottom: true });
    if (closed3D) {
      this._doorClosedCutout = closed3D;
      this._doorClosedCutout.position.set(0, 0.0, 0.04);
      gate.add(this._doorClosedCutout);
    }
    const open3D = this.assets?.instantiateModel?.('stage_door_open', { fitHeight: 5.3, pivotBottom: true });
    if (open3D) {
      this._doorOpenCutout = open3D;
      this._doorOpenCutout.position.set(0, 0.0, -0.35);
      this._doorOpenCutout.visible = false;
      gate.add(this._doorOpenCutout);
    }

    this.group.add(gate);
    this.demonGate = gate;
  }

  _buildGrandpaWebPillar() {
    // Grandpa spiderweb prison pillar at world x = 125.5, z = -2.5 (local x = -4.5, y = 0, z = -2.5)
    const pillarGroup = new THREE.Group();
    pillarGroup.name = 'GrandpaWebPillar';
    pillarGroup.position.set(-4.5, 0, -2.5);

    const colMat = makePaperMat(this.assets, { color: 0x3b354b, roughness: 0.9, flatShading: true });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.68, 6.2, 7), colMat);
    shaft.position.y = 3.1;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    pillarGroup.add(shaft);

    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.1, 0.45, 7), colMat);
    pedestal.position.y = 0.225;
    pedestal.receiveShadow = true;
    pillarGroup.add(pedestal);

    // Spiderweb binding container toggled by setGrandpaWeb(visible)
    this._grandpaWebGroup = new THREE.Group();
    pillarGroup.add(this._grandpaWebGroup);

    // 3D glowing spider-silk radial & concentric web strands
    const silkMat = new THREE.MeshBasicMaterial({
      color: 0xe6e0f5,
      transparent: true,
      opacity: 0.72,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI;
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 3.1, 4), silkMat);
      strand.position.set(0, 2.15, 0.62);
      strand.rotation.z = a;
      this._grandpaWebGroup.add(strand);
    }
    for (const r of [0.55, 1.0, 1.45]) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 4, 14), silkMat);
      ring.position.set(0, 2.15, 0.62);
      this._grandpaWebGroup.add(ring);
    }

    // 3D Bound Grandpa on Spiderweb Rock Pillar (Stage_04 GLB)
    const web3D = this.assets?.instantiateModel?.('stage_web_grandpa', { fitHeight: 4.2, pivotBottom: true });
    if (web3D) {
      web3D.position.set(0, 0.05, 0.65);
      this._grandpaWebGroup.add(web3D);
    }

    this.group.add(pillarGroup);
    this.grandpaPillar = pillarGroup;
  }

  _buildAmethystTreesAndBanquet() {
    // 1986-authentic glowing amethyst blossom trees flanking the banquet hall
    const treeL = createAmethystBlossomTree(this.assets, 1.18, 1);
    treeL.group.position.set(-3.2, 0, -4.4);
    this.group.add(treeL.group);
    this._blossoms.push(...treeL.blossoms);

    const treeR = createAmethystBlossomTree(this.assets, 1.12, -1);
    treeR.group.position.set(3.4, 0, -4.5);
    this.group.add(treeR.group);
    this._blossoms.push(...treeR.blossoms);

    // Red-lacquer banquet table at world x = 130, z = -0.8 (local x = 0, y = 0, z = -0.8)
    const table = new THREE.Group();
    table.name = 'RedLacquerBanquetTable';
    table.position.set(0, 0, -0.8);

    const lacquerMat = makePaperMat(this.assets, {
      color: 0x9c1b1f,
      roughness: 0.34,
      metalness: 0.14,
      flatShading: true,
    });
    const goldMat = makePaperMat(this.assets, {
      color: 0xe3b84c,
      emissive: 0x6b4a0d,
      emissiveIntensity: 0.25,
      roughness: 0.35,
      metalness: 0.65,
      flatShading: true,
    });

    // Ornate table top & gold trim apron
    const top = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.16, 1.55), lacquerMat);
    top.position.y = 0.88;
    top.castShadow = true;
    top.receiveShadow = true;
    table.add(top);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.88, 0.07, 1.62), goldMat);
    trim.position.y = 0.78;
    table.add(trim);

    // 4 sculpted legs
    for (const lx of [-1.62, 1.62]) {
      for (const lz of [-0.58, 0.58]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.82, 0.16), lacquerMat);
        leg.position.set(lx, 0.41, lz);
        leg.castShadow = true;
        table.add(leg);
      }
    }

    // Golden wine flagons & jade dish offerings on the banquet table
    const jadeMat = makePaperMat(this.assets, { color: 0x52c49b, roughness: 0.3, flatShading: true });
    for (const fx of [-1.1, 0.15, 1.15]) {
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.18, 0.08, 10), jadeMat);
      dish.position.set(fx, 1.0, 0.08);
      table.add(dish);
    }
    const flagon = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.18, 0.46, 10), goldMat);
    flagon.position.set(-0.45, 1.19, -0.18);
    flagon.castShadow = true;
    table.add(flagon);

    const flagon2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.4, 10), goldMat);
    flagon2.position.set(0.68, 1.16, -0.12);
    flagon2.castShadow = true;
    table.add(flagon2);

    this.group.add(table);
    this.banquetTable = table;
  }

  _buildWineBowl() {
    // Giant Blue-and-White Porcelain Wine Bowl at world x = 128.2, y = 0.9, z = 0.5 (local x = -1.8, y = 0.9, z = 0.5)
    const bowlGroup = new THREE.Group();
    bowlGroup.name = 'PorcelainWineBowl';
    bowlGroup.position.set(-1.8, 0.9, 0.5);

    const profile = [
      new THREE.Vector2(0.0, -0.88),
      new THREE.Vector2(0.62, -0.88),
      new THREE.Vector2(0.68, -0.74),
      new THREE.Vector2(1.05, -0.45),
      new THREE.Vector2(1.36, 0.0),
      new THREE.Vector2(1.48, 0.46),
      new THREE.Vector2(1.56, 0.62),
      new THREE.Vector2(1.44, 0.64),
      new THREE.Vector2(1.32, 0.38),
      new THREE.Vector2(1.02, -0.35),
      new THREE.Vector2(0.55, -0.68),
      new THREE.Vector2(0.0, -0.70),
    ];
    const bowlGeo = new THREE.LatheGeometry(profile, 28);
    const qinghuaTex = createQinghuaPorcelainTexture();
    const porcelainMat = new THREE.MeshStandardMaterial({
      map: qinghuaTex,
      color: qinghuaTex ? 0xffffff : 0xeef2fa,
      roughness: 0.22,
      metalness: 0.08,
    });
    const bowlMesh = new THREE.Mesh(bowlGeo, porcelainMat);
    bowlMesh.castShadow = true;
    bowlMesh.receiveShadow = true;
    bowlGroup.add(bowlMesh);

    // Swirling cold-spring enchanted emerald-cyan wine surface inside bowl
    this._wineSurfaceGroup = new THREE.Group();
    this._wineSurfaceGroup.position.y = 0.34;

    const wineBaseMat = new THREE.MeshStandardMaterial({
      color: 0x35d6c5,
      emissive: 0x1aa89c,
      emissiveIntensity: 0.65,
      roughness: 0.18,
      transparent: true,
      opacity: 0.88,
    });
    const wineDisk = new THREE.Mesh(new THREE.CircleGeometry(1.32, 24), wineBaseMat);
    wineDisk.rotation.x = -Math.PI / 2;
    this._wineSurfaceGroup.add(wineDisk);

    // Swirling spiral foam arms
    const swirlMat = new THREE.MeshBasicMaterial({
      color: 0xc2fff8,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    for (let i = 0; i < 3; i++) {
      const pts = [];
      for (let k = 0; k <= 14; k++) {
        const u = k / 14;
        const a = u * Math.PI * 1.9 + (i * Math.PI * 2) / 3;
        pts.push(new THREE.Vector3(Math.cos(a) * u * 1.18, 0.02, Math.sin(a) * u * 1.18));
      }
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.045, 5, false),
        swirlMat
      );
      this._wineSurfaceGroup.add(tube);
    }
    bowlGroup.add(this._wineSurfaceGroup);

    // Intoxicating mist glow sprite above bowl
    const glowTex = this.assets?.getTexture?.('proc_soft_glow');
    this._wineGlowMat = new THREE.MeshBasicMaterial({
      map: glowTex || null,
      color: 0x54ffe8,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wineGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), this._wineGlowMat);
    wineGlow.position.set(0, 0.72, 0.1);
    bowlGroup.add(wineGlow);

    this.group.add(bowlGroup);
    this.wineBowl = bowlGroup;
  }

  _buildIcePrism() {
    // Translucent Octahedral Ice Crystal Prism at world x = 132.2, y = 1.6, z = 0.5 (local x = 2.2, y = 1.6, z = 0.5)
    const prismGroup = new THREE.Group();
    prismGroup.name = 'IceCrystalPrism';
    prismGroup.position.set(2.2, 1.6, 0.5);

    this._iceCoreGroup = new THREE.Group();
    this._iceCoreGroup.rotation.z = -0.22; // iconic tilted octahedral glacier prison

    const iceMat = new THREE.MeshStandardMaterial({
      color: 0x7beeff,
      emissive: 0x147ca3,
      emissiveIntensity: 0.22,
      roughness: 0.12,
      metalness: 0.08,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      flatShading: true,
      side: THREE.FrontSide,
    });
    const prismGeo = new THREE.OctahedronGeometry(1.45, 0);
    prismGeo.scale(0.86, 1.52, 0.86);
    this._iceMesh = new THREE.Mesh(prismGeo, iceMat);
    this._iceMesh.castShadow = true;
    this._iceMesh.renderOrder = 6;
    this._iceCoreGroup.add(this._iceMesh);

    // Crisp crystalline white facet edges
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(prismGeo),
      new THREE.LineBasicMaterial({ color: 0xe3ffff, transparent: true, opacity: 0.85 })
    );
    this._iceCoreGroup.add(edges);

    // Base frost spike cluster
    const spikeGeo = new THREE.ConeGeometry(0.32, 1.25, 5);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(spikeGeo, iceMat);
      spike.position.set(Math.cos(a) * 0.95, -1.35, Math.sin(a) * 0.95);
      spike.rotation.set(Math.sin(a) * 0.45, a, -Math.cos(a) * 0.45);
      this._iceCoreGroup.add(spike);
    }
    prismGroup.add(this._iceCoreGroup);

    // Pre-built flying ice shatter shards
    const shardGeo = new THREE.TetrahedronGeometry(0.38, 0);
    this._iceShardGroup = new THREE.Group();
    this._iceShardGroup.visible = false;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const elev = -0.5 + (i % 4) * 0.45;
      const dir = new THREE.Vector3(Math.cos(a), elev + 0.35, Math.sin(a)).normalize();
      const shard = new THREE.Mesh(shardGeo, iceMat);
      shard.scale.set(0.6 + (i % 3) * 0.35, 1.35, 0.55);
      this._iceShardGroup.add(shard);
      this._iceShards.push({
        mesh: shard,
        dir,
        speed: 2.2 + (i % 4) * 0.85,
        rotSpeed: new THREE.Vector3(2.2 + i * 0.3, 3.1 + i * 0.2, 1.8 + i * 0.4),
      });
    }
    prismGroup.add(this._iceShardGroup);

    this.group.add(prismGroup);
    this.icePrism = prismGroup;
  }

  _buildMirrorAltar() {
    // 3D Crystal Magic Mirror Altar at world x = 135, y = 2.6, z = -2 (local x = 5, y = 2.6, z = -2)
    const altarGroup = new THREE.Group();
    altarGroup.name = 'CrystalMirrorAltar';
    altarGroup.position.set(5.0, 2.6, -2.0);
    altarGroup.rotation.y = -0.25;

    const stoneMat = makePaperMat(this.assets, { color: 0x302145, roughness: 0.82, flatShading: true });
    const goldMat = makePaperMat(this.assets, {
      color: 0xe6be53,
      emissive: 0x855a10,
      emissiveIntensity: 0.35,
      metalness: 0.62,
      roughness: 0.34,
      flatShading: true,
    });

    // Stepped obsidian-amethyst pedestal reaching from ground (local y = -2.6) up to mirror frame
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.95, 0.55, 8), stoneMat);
    step1.position.y = -2.32;
    step1.receiveShadow = true;
    altarGroup.add(step1);

    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.4, 0.95, 8), stoneMat);
    step2.position.y = -1.6;
    step2.castShadow = true;
    altarGroup.add(step2);

    const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.72, 1.0, 8), goldMat);
    stand.position.y = -0.78;
    stand.castShadow = true;
    altarGroup.add(stand);

    // Ornate 3D beveled dragon-scroll mirror frame
    const outerFrame = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.16, 8, 20), goldMat);
    outerFrame.scale.set(0.95, 1.12, 1);
    outerFrame.castShadow = true;
    altarGroup.add(outerFrame);

    // Crown lotus crest atop frame
    const crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), goldMat);
    crest.position.set(0, 1.62, 0);
    crest.scale.set(1.2, 0.95, 0.6);
    altarGroup.add(crest);

    // Intact iridescent mirror glass surface + prop_mirror accent
    this._mirrorGlassGroup = new THREE.Group();
    this._mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xd0b3ff,
      emissive: 0x9b4dff,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.65,
      transparent: true,
      opacity: 0.92,
    });
    const glass = new THREE.Mesh(new THREE.CircleGeometry(1.22, 24), this._mirrorGlassMat);
    glass.scale.set(0.95, 1.12, 1);
    this._mirrorGlassGroup.add(glass);

    const mirror3D = this.assets?.instantiateModel?.('prop_mirror', { fitHeight: 3.1, centerOrigin: true });
    if (mirror3D) {
      mirror3D.position.set(0, 0, -0.05);
      this._mirrorGlassGroup.add(mirror3D);
    }
    altarGroup.add(this._mirrorGlassGroup);

    // Sweeping magic mirror light beam cone
    this._mirrorBeamMat = new THREE.MeshBasicMaterial({
      color: 0xffd15c,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beamGeo = new THREE.ConeGeometry(2.4, 11.5, 18, 1, true);
    beamGeo.translate(0, -5.75, 0);
    beamGeo.rotateX(-Math.PI / 2);
    this._mirrorBeam = new THREE.Mesh(beamGeo, this._mirrorBeamMat);
    this._mirrorBeam.position.set(0, 0, 0.12);
    this._mirrorBeam.visible = false;
    altarGroup.add(this._mirrorBeam);

    // Flying shattered glass fragments when Sanwa smashes the mirror!
    this._mirrorShardGroup = new THREE.Group();
    this._mirrorShardGroup.visible = false;
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xeadbff,
      emissive: 0xb67bff,
      emissiveIntensity: 0.9,
      roughness: 0.15,
      metalness: 0.6,
      side: THREE.DoubleSide,
    });
    const shardGeo = new THREE.CircleGeometry(0.32, 3);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const shard = new THREE.Mesh(shardGeo, shardMat);
      this._mirrorShardGroup.add(shard);
      this._mirrorShards.push({
        mesh: shard,
        dir: new THREE.Vector3(Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0.8 + (i % 3) * 0.4).normalize(),
        speed: 2.0 + (i % 4) * 0.7,
        rot: new THREE.Vector3(3 + i * 0.4, 2 + i * 0.3, 4 + i * 0.2),
      });
    }
    altarGroup.add(this._mirrorShardGroup);

    // Local altar magic light
    this._mirrorLight = new THREE.PointLight(0xd980ff, 1.5, 12, 1.7);
    this._mirrorLight.position.set(0, 0.2, 1.2);
    altarGroup.add(this._mirrorLight);

    this.group.add(altarGroup);
    this.mirrorAltar = altarGroup;
  }

  _buildDemonCouchAndRuyi() {
    // Demon Stone Couch at world x = 136.8, z = -2.8 (local x = 6.8, y = 0, z = -2.8)
    const couch = new THREE.Group();
    couch.name = 'DemonStoneCouch';
    couch.position.set(6.8, 0, -2.8);
    couch.rotation.y = -0.35;

    const stoneMat = makePaperMat(this.assets, { color: 0x2f2542, roughness: 0.85, flatShading: true });
    const brocadeMat = makePaperMat(this.assets, {
      color: 0x7c1c4e,
      emissive: 0x2b071a,
      emissiveIntensity: 0.3,
      roughness: 0.72,
      flatShading: true,
    });
    const goldMat = makePaperMat(this.assets, {
      color: 0xf7ca4c,
      emissive: 0xd99616,
      emissiveIntensity: 0.55,
      metalness: 0.72,
      roughness: 0.24,
      flatShading: true,
    });

    // Sculpted stone divan plinth & curved serpent-crest backrest
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.72, 1.55), stoneMat);
    base.position.y = 0.36;
    base.castShadow = true;
    base.receiveShadow = true;
    couch.add(base);

    const cushion = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.24, 1.32), brocadeMat);
    cushion.position.y = 0.82;
    cushion.receiveShadow = true;
    couch.add(cushion);

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.35, 0.28), stoneMat);
    backrest.position.set(0, 1.35, -0.66);
    backrest.castShadow = true;
    couch.add(backrest);

    // Carved armrests
    for (const ax of [-1.58, 1.58]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 1.48), stoneMat);
      arm.position.set(ax, 1.02, 0);
      arm.castShadow = true;
      couch.add(arm);
    }

    // Silk bolster pillow
    const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.12, 10), brocadeMat);
    bolster.rotation.x = Math.PI / 2;
    bolster.position.set(1.15, 1.1, 0);
    couch.add(bolster);

    // Detachable 3D Golden Ruyi (金如意) resting on the couch cushion
    this._ruyiGroup = new THREE.Group();
    this._ruyiGroup.name = 'GoldenRuyi';
    this._ruyiGroup.position.set(-0.35, 1.12, 0.16);
    this._ruyiGroup.rotation.set(0.2, 0.25, -0.18);

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.68, -0.04, 0),
      new THREE.Vector3(-0.22, 0.08, 0.04),
      new THREE.Vector3(0.22, -0.05, -0.02),
      new THREE.Vector3(0.55, 0.06, 0),
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 20, 0.055, 7, false), goldMat);
    stem.castShadow = true;
    this._ruyiGroup.add(stem);

    // Ornate ruyi cloud-scroll head
    const headShape = new THREE.Shape();
    headShape.moveTo(0, -0.14);
    headShape.bezierCurveTo(0.26, -0.28, 0.44, -0.02, 0.28, 0.16);
    headShape.bezierCurveTo(0.18, 0.3, -0.08, 0.28, -0.14, 0.14);
    headShape.bezierCurveTo(-0.24, 0.02, -0.14, -0.14, 0, -0.14);
    const headGeo = new THREE.ExtrudeGeometry(headShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 1,
    });
    headGeo.translate(0, 0, -0.04);
    const head = new THREE.Mesh(headGeo, goldMat);
    head.position.set(0.62, 0.06, 0);
    head.castShadow = true;
    this._ruyiGroup.add(head);

    // Soft golden sparkle aura around Ruyi
    const glowTex = this.assets?.getTexture?.('proc_soft_glow');
    this._ruyiGlowMat = new THREE.MeshBasicMaterial({
      map: glowTex || null,
      color: 0xffe066,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ruyiGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.15), this._ruyiGlowMat);
    ruyiGlow.position.set(0.1, 0.05, 0.08);
    this._ruyiGroup.add(ruyiGlow);

    couch.add(this._ruyiGroup);
    this.group.add(couch);
    this.demonCouch = couch;
  }

  setDoorOpen(p = 0) {
    const o = clamp01(p);
    this._doorLeft.position.x = -0.74 - o * 1.25;
    this._doorRight.position.x = 0.74 + o * 1.25;
    if (this._doorClosedCutout) {
      this._doorClosedCutout.visible = o < 0.45;
    }
    if (this._doorOpenCutout) {
      this._doorOpenCutout.visible = o >= 0.45;
    }
  }

  setGrandpaWeb(visible = true) {
    this._grandpaWebGroup.visible = Boolean(visible);
  }

  setWineBowl(opts = {}) {
    if (opts.active !== undefined) this._wineState.active = Boolean(opts.active);
    if (opts.swirl !== undefined) this._wineState.swirl = clamp01(Number(opts.swirl));

    this.wineBowl.visible = this._wineState.active;
    this._wineGlowMat.opacity = 0.2 + this._wineState.swirl * 0.55;
  }

  setIcePrism(opts = {}) {
    if (opts.active !== undefined) this._iceState.active = Boolean(opts.active);
    if (opts.shatter !== undefined) {
      this._iceState.shatter = typeof opts.shatter === 'boolean' ? (opts.shatter ? 1 : 0) : clamp01(Number(opts.shatter));
    }

    const sh = this._iceState.shatter;
    this.icePrism.visible = this._iceState.active || sh > 0.005;
    this._iceCoreGroup.visible = this._iceState.active && sh < 0.28;
    this._iceShardGroup.visible = sh > 0.005;

    if (sh > 0.005) {
      for (const s of this._iceShards) {
        const dist = sh * s.speed;
        const drop = sh * sh * 1.65;
        s.mesh.position.set(
          s.dir.x * dist,
          s.dir.y * dist - drop,
          s.dir.z * dist
        );
        s.mesh.rotation.set(s.rotSpeed.x * sh, s.rotSpeed.y * sh, s.rotSpeed.z * sh);
        const fadeScale = Math.max(0.01, 1 - sh * 0.65);
        s.mesh.scale.setScalar(fadeScale);
      }
    }
  }

  setMirror(opts = {}) {
    if (opts.active !== undefined) this._mirrorState.active = Boolean(opts.active);
    if (opts.beam !== undefined) this._mirrorState.beam = clamp01(Number(opts.beam));
    if (opts.shattered !== undefined) {
      this._mirrorState.shattered = typeof opts.shattered === 'boolean' ? (opts.shattered ? 1 : 0) : clamp01(Number(opts.shattered));
    }

    const { active, beam, shattered } = this._mirrorState;
    this._mirrorGlassGroup.visible = shattered < 0.2;
    this._mirrorGlassMat.emissiveIntensity = active ? 0.85 + beam * 1.1 : 0.15;

    const showBeam = active && beam > 0.01 && shattered < 0.15;
    this._mirrorBeam.visible = showBeam;
    this._mirrorBeamMat.opacity = showBeam ? beam * 0.45 : 0;

    this._mirrorShardGroup.visible = shattered > 0.005;
    if (shattered > 0.005) {
      for (const s of this._mirrorShards) {
        const d = shattered * s.speed;
        const drop = shattered * shattered * 1.4;
        s.mesh.position.set(s.dir.x * d, s.dir.y * d - drop, s.dir.z * d);
        s.mesh.rotation.set(s.rot.x * shattered, s.rot.y * shattered, s.rot.z * shattered);
        s.mesh.scale.setScalar(Math.max(0.01, 1 - shattered * 0.5));
      }
    }

    this._mirrorLight.intensity = shattered > 0.2 ? 0.25 : active ? 1.4 + beam * 2.8 : 0.35;
  }

  setRuyiOnCouch(visible = true) {
    this._ruyiGroup.visible = Boolean(visible);
  }

  getRuyiWorldPos(target = new THREE.Vector3()) {
    this._ruyiGroup.updateWorldMatrix(true, false);
    return this._ruyiGroup.getWorldPosition(target);
  }

  update(t = 0) {
    // Shimmering 1986 amethyst blossom crystal clusters
    for (const b of this._blossoms) {
      const s = 0.96 + Math.sin(t * 2.2 + b.phase) * 0.05;
      b.group.scale.setScalar(s);
    }

    // Swirling enchanted wine vortex
    if (this._wineState.active) {
      const spinSpeed = 0.8 + this._wineState.swirl * 3.8;
      this._wineSurfaceGroup.rotation.y = t * spinSpeed;
      this._wineGlowMat.opacity = (0.22 + this._wineState.swirl * 0.48) * (0.88 + Math.sin(t * 3.4) * 0.12);
    }

    // Ice prism subtle frosty crystalline shimmer
    if (this._iceState.active && this._iceCoreGroup.visible) {
      this._iceCoreGroup.rotation.y = Math.sin(t * 0.9) * 0.12;
    }

    // Magic mirror beam gentle hypnotic sweep
    if (this._mirrorBeam.visible) {
      this._mirrorBeam.rotation.y = Math.sin(t * 1.8) * 0.18;
      this._mirrorBeamMat.opacity = this._mirrorState.beam * (0.38 + Math.sin(t * 6.5) * 0.08);
    }

    // Golden Ruyi floating pulse on Demon Couch
    if (this._ruyiGroup.visible) {
      this._ruyiGroup.position.y = 1.12 + Math.sin(t * 2.6) * 0.05;
      this._ruyiGlowMat.opacity = 0.52 + Math.sin(t * 4.2) * 0.18;
    }
  }
}

export default CrystalPalace;
