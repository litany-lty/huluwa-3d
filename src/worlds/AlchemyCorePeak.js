import * as THREE from 'three';
import {
  createPaperStandardMaterial,
  createShadowCutoutMesh,
  createWaterMireMaterial,
} from '../core/PaperMaterials.js';

const SEVEN_PEAK_COLORS = [
  { name: 'red', color: 0xd9382e, emissive: 0x6e130c, x: -5.4, z: -0.9, h: 7.4, r: 2.35, tiltZ: 0.14 },
  { name: 'orange', color: 0xe67e17, emissive: 0x6e3706, x: -3.5, z: -0.35, h: 8.9, r: 2.45, tiltZ: 0.08 },
  { name: 'yellow', color: 0xe8c427, emissive: 0x6e5a08, x: -1.7, z: 0.1, h: 10.2, r: 2.55, tiltZ: 0.04 },
  { name: 'green', color: 0x2a8f54, emissive: 0x0e4524, x: 0.0, z: -0.25, h: 12.2, r: 2.85, tiltZ: 0.0 },
  { name: 'cyan', color: 0x169bb0, emissive: 0x074652, x: 1.8, z: 0.12, h: 10.1, r: 2.55, tiltZ: -0.04 },
  { name: 'blue', color: 0x2c5bd6, emissive: 0x0d2469, x: 3.6, z: -0.4, h: 8.8, r: 2.45, tiltZ: -0.09 },
  { name: 'purple', color: 0x8026a6, emissive: 0x3b0c52, x: 5.4, z: -0.95, h: 7.5, r: 2.35, tiltZ: -0.14 },
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

function createFacetedPeakGeometry(radius, height, seed = 1) {
  // Hand-sculpted asymmetric multi-tier faceted crystal/origami peak (1986 Ep13 aesthetic)
  const radialSegs = 6;
  const heightSegs = 4;
  const geo = new THREE.CylinderGeometry(0.06, radius, height, radialSegs, heightSegs);
  geo.translate(0, height * 0.5, 0);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const hNorm = y / height;
    if (hNorm > 0.04 && hNorm < 0.96) {
      const ang = Math.atan2(z, x);
      const ridge = 1.0 + Math.sin(ang * 3 + seed * 1.7 + hNorm * 2.5) * 0.16;
      const pinch = hNorm > 0.55 ? 0.92 : 1.05;
      pos.setX(i, x * ridge * pinch);
      pos.setZ(i, z * ridge * pinch * 0.78);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export class AlchemyCorePeak {
  constructor(assets, center = new THREE.Vector3(195, 0, 0)) {
    this.assets = assets;
    this.group = new THREE.Group();
    this.group.name = 'AlchemyCorePeak';
    this.group.position.copy(center);
    this.center = this.group.position;

    this._cauldronState = { fire: 0.6, lidOpen: 0, shattered: 0 };
    this._sealProgress = 0;
    this._flameTongues = [];
    this._lidChunks = [];
    this._bodyShards = [];
    this._sealPeaks = [];
    this._goldenClouds = [];
    this._sunBeams = [];

    this._buildMagmaCavern();
    this._buildSteppedAltar();
    this._buildBronzeCauldron();
    this._buildSevenColorSealMountain();

    this.setCauldron({ fire: 0.6, lidOpen: 0, shattered: 0 });
    this.setSealMountain(0);
  }

  _buildMagmaCavern() {
    this._cavernGroup = new THREE.Group();
    this._cavernGroup.name = 'MagmaCavernBackdrop';
    this.group.add(this._cavernGroup);

    // Glowing abyssal magma sea using createWaterMireMaterial('lava')
    this._lavaMat = createWaterMireMaterial('lava');
    this._lavaMat.side = THREE.DoubleSide;

    const magmaSea = new THREE.Mesh(new THREE.CircleGeometry(28, 36), this._lavaMat);
    magmaSea.rotation.x = -Math.PI / 2;
    magmaSea.position.set(0, -0.35, -1.5);
    this._cavernGroup.add(magmaSea);

    // Dark obsidian volcanic island slabs surrounding the central altar
    const basaltMat = makePaperMat(this.assets, {
      color: 0x261c22,
      emissive: 0x210804,
      emissiveIntensity: .15,
      roughness: 0.92,
      metalness: 0.08,
      flatShading: true,
    });

    const islandRing = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 10.2, 0.72, 12), basaltMat);
    islandRing.position.set(0, -0.36, 0);
    islandRing.receiveShadow = true;
    this._cavernGroup.add(islandRing);

    // Jagged volcanic abyss spires framing left, right, and rear cavern horizon
    const spireConfigs = [
      [-13.5, 0, -7.5, 3.2, 13.5],
      [-9.2, 0, -10.5, 2.8, 15.0],
      [-3.5, 0, -13.5, 3.6, 14.2],
      [4.2, 0, -13.2, 3.4, 14.8],
      [9.8, 0, -10.2, 3.0, 15.2],
      [13.8, 0, -7.2, 3.4, 13.0],
      [-12.5, 0, 1.8, 2.2, 7.2],
      [12.8, 0, 1.6, 2.3, 7.4],
    ];
    for (let i = 0; i < spireConfigs.length; i++) {
      const [x, y, z, r, h] = spireConfigs[i];
      const cliff = createFacetedPeakGeometry(r, h, 3 + i);
      const v = cliff.attributes.position;
      const drift = Math.sin(i * 2.8) * 1.65;
      for (let j=0; j<v.count; j++) {
        const a = v.getY(j) / h;
        const layer = (1 - a) * (a > .48 ? .08 : .21);
        v.setX(j, v.getX(j) * (1 + layer) + drift * a * a);
        v.setZ(j, v.getZ(j) * (1 + .14 * Math.cos(i*1.7)) + a * .55);
      }
      cliff.computeVertexNormals();
      const spire = new THREE.Mesh(cliff, basaltMat);
      spire.position.set(x, y - 0.6, z);
      spire.castShadow = true;
      spire.receiveShadow = true;
      this._cavernGroup.add(spire);
    }

    // Volcanic bridge stones leading forward for hero staging
    const causeway = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.55, 6.5), basaltMat);
    causeway.position.set(0, -0.275, 4.8);
    causeway.receiveShadow = true;
    this._cavernGroup.add(causeway);
  }

  _buildSteppedAltar() {
    // Stepped stone altar centered at world x = 195, y = 0.5, z = 0 (local x = 0, y = 0.5, z = 0)
    const altar = new THREE.Group();
    altar.name = 'SteppedStoneAltar';
    altar.position.set(0, 0, 0);

    const stoneMat = makePaperMat(this.assets, {
      color: 0x3b3136,
      roughness: 0.88,
      metalness: 0.1,
      flatShading: true,
    });
    const bronzeTrimMat = makePaperMat(this.assets, {
      color: 0xb88c3e,
      emissive: 0x4d2b06,
      emissiveIntensity: 0.35,
      metalness: 0.55,
      roughness: 0.42,
      flatShading: true,
    });

    // 3 octagonal sacrificial steps reaching top surface at y = 0.5
    const tier1 = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 6.0, 0.18, 8), stoneMat);
    tier1.position.y = 0.09;
    tier1.receiveShadow = true;
    altar.add(tier1);

    const tier2 = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 5.2, 0.16, 8), stoneMat);
    tier2.position.y = 0.26;
    tier2.receiveShadow = true;
    altar.add(tier2);

    const tier3 = new THREE.Mesh(new THREE.CylinderGeometry(4.1, 4.4, 0.16, 8), stoneMat);
    tier3.position.y = 0.42;
    tier3.receiveShadow = true;
    tier3.castShadow = true;
    altar.add(tier3);

    // Engraved bronze-gold Bagua ritual rim ring at y = 0.505
    const ritualRing = new THREE.Mesh(new THREE.TorusGeometry(3.75, 0.06, 6, 24), bronzeTrimMat);
    ritualRing.rotation.x = Math.PI / 2;
    ritualRing.position.y = 0.51;
    altar.add(ritualRing);

    this.group.add(altar);
    this.altar = altar;
  }

  _buildBronzeCauldron() {
    // Monumental 3D Three-Legged Bronze Cauldron at world x = 195, y = 2.1, z = -1.65 (local x = 0, y = 2.1, z = -1.65)
    const cauldron = new THREE.Group();
    cauldron.name = 'ThreeLeggedBronzeCauldron';
    cauldron.position.set(0, 2.1, -1.65);

    const bronzeMat = makePaperMat(this.assets, {
      color: 0x49665a, // verdigris antique bronze
      emissive: 0x261206,
      emissiveIntensity: 0.28,
      roughness: 0.46,
      metalness: 0.58,
      flatShading: false,
    });
    const goldBandMat = makePaperMat(this.assets, {
      color: 0xcfa048,
      emissive: 0x733e09,
      emissiveIntensity: 0.35,
      roughness: 0.36,
      metalness: 0.72,
      flatShading: true,
    });

    // Intact cauldron body container (hidden when shattered > 0.35)
    this._cauldronIntactGroup = new THREE.Group();
    cauldron.add(this._cauldronIntactGroup);

    // Sculpted LatheGeometry cauldron belly + flared lip
    const bodyProfile = [
      new THREE.Vector2(0.0, -0.92),
      new THREE.Vector2(0.75, -0.88),
      new THREE.Vector2(1.38, -0.58),
      new THREE.Vector2(1.62, -0.1),
      new THREE.Vector2(1.54, 0.45),
      new THREE.Vector2(1.28, 0.85),
      new THREE.Vector2(1.48, 1.05),
      new THREE.Vector2(1.34, 1.08),
      new THREE.Vector2(1.12, 0.82),
      new THREE.Vector2(1.22, -0.45),
      new THREE.Vector2(0.0, -0.72),
    ];
    const bodyGeo = new THREE.LatheGeometry(bodyProfile, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, bronzeMat);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this._cauldronIntactGroup.add(bodyMesh);

    // Embossed bronze-gold taotie/cloud rings around waist & rim
    const waistRing = new THREE.Mesh(new THREE.TorusGeometry(1.61, 0.075, 6, 24), goldBandMat);
    waistRing.rotation.x = Math.PI / 2;
    waistRing.position.y = -0.02;
    this._cauldronIntactGroup.add(waistRing);

    const rimRing = new THREE.Mesh(new THREE.TorusGeometry(1.46, 0.065, 6, 24), goldBandMat);
    rimRing.rotation.x = Math.PI / 2;
    rimRing.position.y = 1.04;
    this._cauldronIntactGroup.add(rimRing);

    // 3 curved tripod legs reaching down cleanly onto altar top (local y = -1.6 -> world y = 0.5)
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const legCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(ca * 1.15, -0.62, sa * 1.15),
        new THREE.Vector3(ca * 1.48, -1.05, sa * 1.48),
        new THREE.Vector3(ca * 1.38, -1.56, sa * 1.38),
      ]);
      const leg = new THREE.Mesh(new THREE.TubeGeometry(legCurve, 14, 0.22, 8, false), bronzeMat);
      leg.castShadow = true;
      leg.receiveShadow = true;
      this._cauldronIntactGroup.add(leg);

      // Bronze paw foot pad flush with altar top
      const paw = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.14, 7), goldBandMat);
      paw.position.set(ca * 1.38, -1.53, sa * 1.38);
      paw.castShadow = true;
      this._cauldronIntactGroup.add(paw);
    }

    // 2 towering arched bronze ear handles on left & right shoulders
    for (const side of [-1, 1]) {
      const handleCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(side * 1.32, 0.55, 0),
        new THREE.Vector3(side * 1.88, 0.92, 0),
        new THREE.Vector3(side * 1.75, 1.48, 0),
        new THREE.Vector3(side * 1.36, 1.06, 0),
      ]);
      const handle = new THREE.Mesh(new THREE.TubeGeometry(handleCurve, 16, 0.11, 7, false), goldBandMat);
      handle.castShadow = true;
      this._cauldronIntactGroup.add(handle);
    }

    // 3D Bronze Tripod Cauldron model (Prop_02 GLB) integrated with hearth
    const cauldron3D = this.assets?.instantiateModel?.('prop_cauldron', { fitHeight: 2.35, pivotBottom: true });
    if (cauldron3D) {
      cauldron3D.position.set(0, -1.15, 0);
      this._cauldronIntactGroup.add(cauldron3D);
    }

    // Explosive domed bronze lid made of 6 interlocking pie-slice chunks + finial knob
    this._lidGroup = new THREE.Group();
    this._lidGroup.position.set(0, 1.06, 0);
    cauldron.add(this._lidGroup);

    const sliceAngle = (Math.PI * 2) / 6;
    for (let i = 0; i < 6; i++) {
      const a0 = i * sliceAngle;
      const midA = a0 + sliceAngle * 0.5;
      const chunkGeo = new THREE.CylinderGeometry(0.22, 1.42, 0.62, 4, 1, false, a0, sliceAngle * 0.96);
      const chunk = new THREE.Mesh(chunkGeo, bronzeMat);
      chunk.position.y = 0.3;
      chunk.castShadow = true;
      this._lidGroup.add(chunk);
      this._lidChunks.push({
        mesh: chunk,
        baseY: 0.3,
        dir: new THREE.Vector3(Math.cos(midA), 1.35 + (i % 2) * 0.45, Math.sin(midA)).normalize(),
        speed: 4.2 + (i % 3) * 0.9,
        rotSpeed: new THREE.Vector3(3.2 + i * 0.5, 2.4 + i * 0.3, 4.0 - i * 0.2),
      });
    }

    // Finial ring knob atop lid
    this._lidFinial = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.075, 7, 14), goldBandMat);
    this._lidFinial.position.y = 0.78;
    this._lidGroup.add(this._lidFinial);

    // Explosive bronze wall shards for full cauldron shatter in Act 8!
    this._bodyShardGroup = new THREE.Group();
    this._bodyShardGroup.visible = false;
    const shardGeo = new THREE.DodecahedronGeometry(0.46, 0);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const shard = new THREE.Mesh(shardGeo, i % 3 === 0 ? goldBandMat : bronzeMat);
      shard.scale.set(1.25, 0.65, 0.42);
      this._bodyShardGroup.add(shard);
      this._bodyShards.push({
        mesh: shard,
        dir: new THREE.Vector3(Math.cos(a), 0.55 + (i % 3) * 0.35, Math.sin(a)).normalize(),
        speed: 3.6 + (i % 4) * 1.1,
        rotSpeed: new THREE.Vector3(4.1 + i * 0.3, 3.0 + i * 0.2, 2.7 + i * 0.4),
      });
    }
    cauldron.add(this._bodyShardGroup);

    // Roaring under-cauldron hearth flames + top escaping fire plume
    this._fireGroup = new THREE.Group();
    cauldron.add(this._fireGroup);

    const flameColors = [0xff4500, 0xff8800, 0xffd23f];
    for (let i = 0; i < 9; i++) {
      const isTopPlume = i >= 5;
      const mat = new THREE.MeshBasicMaterial({
        color: flameColors[i % flameColors.length],
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const radius = isTopPlume ? 0.45 + (i - 5) * 0.14 : 0.42 + (i % 3) * 0.16;
      const height = isTopPlume ? 2.1 + (i - 5) * 0.35 : 1.35 + (i % 3) * 0.32;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 6), mat);
      const a = (i / 5) * Math.PI * 2;
      if (isTopPlume) {
        cone.position.set(Math.cos(a) * 0.35, 1.25, Math.sin(a) * 0.35);
      } else {
        cone.position.set(Math.cos(a) * 0.58, -1.15, Math.sin(a) * 0.58);
      }
      this._fireGroup.add(cone);
      this._flameTongues.push({
        mesh: cone,
        mat,
        isTopPlume,
        baseY: cone.position.y,
        phase: i * 1.13,
      });
    }

    // Core furnace fiery point light
    this._furnaceLight = new THREE.PointLight(0xff6b1a, 4.0, 18, 1.5);
    this._furnaceLight.position.set(0, -0.45, 0.8);
    cauldron.add(this._furnaceLight);

    this.group.add(cauldron);
    this.cauldron = cauldron;
  }

  _buildSevenColorSealMountain() {
    // 1986 Ep13 Faceted Seven-Color Seal Mountain (七色神峰) at world x = 195, y = 0, z = -1.85
    const sealGroup = new THREE.Group();
    sealGroup.name = 'SevenColorSealMountain';
    sealGroup.position.set(0, 0, -1.85);
    sealGroup.visible = false;

    const goldEdgeMat = new THREE.LineBasicMaterial({
      color: 0xffe484,
      transparent: true,
      opacity: 0.52,
    });

    for (let i = 0; i < SEVEN_PEAK_COLORS.length; i++) {
      const cfg = SEVEN_PEAK_COLORS[i];
      const peakHolder = new THREE.Group();
      peakHolder.position.set(cfg.x, -cfg.h, cfg.z);

      const geo = createFacetedPeakGeometry(cfg.r, cfg.h, i + 1);
      const mat = makePaperMat(this.assets, {
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.38,
        roughness: 0.72,
        metalness: 0.14,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.z = cfg.tiltZ;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      peakHolder.add(mesh);

      // Luminous mineral-gold facet edge highlights
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 22), goldEdgeMat);
      edges.rotation.z = cfg.tiltZ;
      peakHolder.add(edges);

      sealGroup.add(peakHolder);
      this._sealPeaks.push({
        group: peakHolder,
        material: mat,
        cfg,
        // Center green peak leads slightly, flanking peaks cascade outward
        delay: Math.abs(i - 3) * 0.08,
      });
    }

    // Majestic Golden Cloud Sea billowing around the base of the 7-Color Seal Mountain
    const cloudMat = makePaperMat(this.assets, {
      color: 0xffe8a3,
      emissive: 0xffb833,
      emissiveIntensity: 0.55,
      roughness: 0.85,
      transparent: true,
      opacity: 0.86,
      flatShading: true,
    });
    const cloudTex = this.assets?.getTexture?.('proc_cloud');

    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const holder = new THREE.Group();
      const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45 + (i % 3) * 0.35, 1), cloudMat);
      puff.scale.set(1.6, 0.58, 1.15);
      holder.add(puff);

      if (cloudTex) {
        const halo = new THREE.Mesh(
          new THREE.PlaneGeometry(5.6, 2.8),
          new THREE.MeshBasicMaterial({
            map: cloudTex,
            color: 0xffe18c,
            transparent: true,
            opacity: 0.45,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        halo.position.set(0, 0.3, 0.4);
        holder.add(halo);
      }

      const radius = 5.4 + (i % 2) * 1.4;
      holder.position.set(Math.cos(a) * radius, 0.55 + (i % 3) * 0.42, Math.sin(a) * (radius * 0.45) + 1.2);
      sealGroup.add(holder);
      this._goldenClouds.push({
        group: holder,
        baseX: holder.position.x,
        baseY: holder.position.y,
        phase: i * 0.9,
      });
    }

    // Celestial golden sunbeams radiating behind the 7 peaks
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffdf70,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._sunBeamMat = beamMat;
    for (let i = 0; i < 7; i++) {
      const beam = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 18.0), beamMat);
      const angle = -0.65 + (i / 6) * 1.3;
      beam.position.set(Math.sin(angle) * 4.5, 9.5, -2.6);
      beam.rotation.z = -angle;
      sealGroup.add(beam);
      this._sunBeams.push({ mesh: beam, baseRot: -angle, phase: i * 0.7 });
    }

    // Golden apotheosis radiance light atop the Seal Mountain
    this._sealPeakLight = new THREE.PointLight(0xffd257, 0, 26, 1.4);
    this._sealPeakLight.position.set(0, 8.5, 2.5);
    sealGroup.add(this._sealPeakLight);

    this.group.add(sealGroup);
    this.sealMountain = sealGroup;
  }

  setCauldron(opts = {}) {
    if (opts.fire !== undefined) this._cauldronState.fire = clamp01(Number(opts.fire));
    if (opts.lidOpen !== undefined) this._cauldronState.lidOpen = clamp01(Number(opts.lidOpen));
    if (opts.shattered !== undefined) {
      this._cauldronState.shattered =
        typeof opts.shattered === 'boolean' ? (opts.shattered ? 1 : 0) : clamp01(Number(opts.shattered));
    }

    const { fire, lidOpen, shattered } = this._cauldronState;

    // Intact cauldron body hides once shatter explosion peaks
    this._cauldronIntactGroup.visible = shattered < 0.35;
    this._bodyShardGroup.visible = shattered > 0.005;

    // Lid lift / tilt when lidOpen > 0, or explosive radial flight when shattered > 0
    if (shattered > 0.005) {
      this._lidGroup.position.set(0, 1.06, 0);
      this._lidGroup.rotation.set(0, 0, 0);
      this._lidFinial.position.set(0, 0.78 + shattered * 6.5, shattered * 1.2);
      this._lidFinial.rotation.set(shattered * 5.0, shattered * 3.5, 0);
      this._lidFinial.visible = shattered < 0.96;

      for (const c of this._lidChunks) {
        const d = shattered * c.speed;
        const grav = shattered * shattered * 2.2;
        c.mesh.position.set(c.dir.x * d, c.baseY + c.dir.y * d - grav, c.dir.z * d);
        c.mesh.rotation.set(c.rotSpeed.x * shattered, c.rotSpeed.y * shattered, c.rotSpeed.z * shattered);
        c.mesh.visible = shattered < 0.96;
      }
      for (const s of this._bodyShards) {
        const d = shattered * s.speed;
        const grav = shattered * shattered * 2.5;
        s.mesh.position.set(s.dir.x * d, s.dir.y * d - grav, s.dir.z * d);
        s.mesh.rotation.set(s.rotSpeed.x * shattered, s.rotSpeed.y * shattered, s.rotSpeed.z * shattered);
        const sc = Math.max(0.01, 1 - shattered * 0.55);
        s.mesh.scale.set(1.25 * sc, 0.65 * sc, 0.42 * sc);
      }
    } else {
      // Smoothly lift and tilt the intact bronze lid
      this._lidGroup.position.set(lidOpen * 0.42, 1.06 + lidOpen * 1.15, 0);
      this._lidGroup.rotation.z = -lidOpen * 0.48;
      this._lidFinial.position.set(0, 0.78, 0);
      this._lidFinial.rotation.set(0, 0, 0);
      this._lidFinial.visible = true;
      for (const c of this._lidChunks) {
        c.mesh.position.set(0, c.baseY, 0);
        c.mesh.rotation.set(0, 0, 0);
        c.mesh.visible = true;
      }
    }

    // Fire tongues & furnace light
    this._fireGroup.visible = fire > 0.01 && shattered < 0.92;
    this._furnaceLight.intensity = shattered > 0.85 ? 0.3 : fire * 5.4;
    this._lavaMat?.userData?.setIntensity?.(0.6 + fire * 1.1);
  }

  setSealMountain(progress = 0) {
    const p = clamp01(progress);
    this._sealProgress = p;

    // Smoothly sink dark magma cavern & foreground spikes as sunlit 7-color peak rises
    if (this._cavernGroup) {
      const sinkP = clamp01((p - 0.45) / 0.42);
      this._cavernGroup.position.y = -sinkP * 6.8;
      this._cavernGroup.visible = p < 0.85;
    }

    this.sealMountain.visible = p > 0.002;
    if (p <= 0.002) {
      this._sealPeakLight.intensity = 0;
      return;
    }

    for (const pk of this._sealPeaks) {
      const localP = clamp01((p - pk.delay) / (1 - pk.delay));
      // Cubic ease-out seismic emergence
      const eased = 1 - Math.pow(1 - localP, 3);
      pk.group.position.y = -pk.cfg.h * (1 - eased) - 0.15;
      pk.material.emissiveIntensity = 0.05 + eased * 0.10;
    }

    const cloudScale = Math.max(0.01, clamp01((p - 0.15) / 0.85));
    for (const c of this._goldenClouds) {
      c.group.scale.setScalar(cloudScale);
    }

    this._sunBeamMat.opacity = clamp01((p - 0.25) / 0.75) * 0.055;
    this._sealPeakLight.intensity = p * 1.15;
  }

  update(t = 0) {
    if (this._lavaMat) {
      if (this._lavaMat.userData && typeof this._lavaMat.userData.update === 'function') {
        this._lavaMat.userData.update(t);
      } else if (this._lavaMat.uniforms?.uTime) {
        this._lavaMat.uniforms.uTime.value = t;
      }
    }

    // Roaring cauldron fire tongues flicker
    const { fire, lidOpen, shattered } = this._cauldronState;
    if (this._fireGroup.visible) {
      for (const fl of this._flameTongues) {
        const showTop = !fl.isTopPlume || lidOpen > 0.08 || shattered > 0.02;
        fl.mesh.visible = showTop;
        if (!showTop) continue;
        const amp = fl.isTopPlume ? Math.max(lidOpen, shattered) * fire : fire;
        const flicker = 0.78 + Math.sin(t * 14.0 + fl.phase) * 0.22 + Math.cos(t * 21.0 + fl.phase) * 0.1;
        fl.mesh.scale.set(
          Math.max(0.05, amp * (0.85 + Math.sin(t * 11 + fl.phase) * 0.15)),
          Math.max(0.05, amp * flicker * 1.25),
          Math.max(0.05, amp * 0.9)
        );
        fl.mesh.position.y = fl.baseY + Math.sin(t * 12 + fl.phase) * 0.1;
        fl.mat.opacity = Math.min(0.95, amp * 0.88);
      }
      this._furnaceLight.intensity = fire * (4.8 + Math.sin(t * 13.5) * 0.9);
    }

    // Majestic Golden Cloud Sea gentle billowing & sunbeam shimmer on 7-Color Seal Mountain
    if (this._sealProgress > 0.005) {
      for (const c of this._goldenClouds) {
        c.group.position.x = c.baseX + Math.sin(t * 0.45 + c.phase) * 0.65;
        c.group.position.y = c.baseY + Math.cos(t * 0.65 + c.phase) * 0.16;
      }
      for (const b of this._sunBeams) {
        b.mesh.rotation.z = b.baseRot + Math.sin(t * 0.5 + b.phase) * 0.035;
      }
      this._sealPeakLight.intensity = this._sealProgress * (1.05 + Math.sin(t * 2.2) * 0.12);
    }
  }
}

export default AlchemyCorePeak;
