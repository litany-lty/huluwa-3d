import * as THREE from 'three';

const TEMP_COLOR = new THREE.Color();
const TEMP_EMISSIVE = new THREE.Color();
const COLOR_WHITE = new THREE.Color(0xffffff);
const COLOR_BLACK = new THREE.Color(0x000000);
const COLOR_ROSY = new THREE.Color(0xffb5c4);
const COLOR_FROZEN = new THREE.Color(0x88e6ff);
const COLOR_FROZEN_EMISSIVE = new THREE.Color(0x2898c8);
const COLOR_STONE = new THREE.Color(0x7c7b78);
const COLOR_STEALTH = new THREE.Color(0x7eeeff);
const COLOR_STEALTH_EMISSIVE = new THREE.Color(0x1f8fb8);
const COLOR_CORRUPT_TINT = new THREE.Color(0x6d3b8a);
const COLOR_CORRUPT_EMISSIVE = new THREE.Color(0x52127a);
const COLOR_HURT_EMISSIVE = new THREE.Color(0xd9381e);
const COLOR_HEROIC_EMISSIVE = new THREE.Color(0x664810);
const TEMP_VEC3 = new THREE.Vector3();

function createXuanBackingMaterial(texture, backingColor, alphaTest) {
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(backingColor),
    map: texture ?? null,
    alphaTest,
    transparent: true,
    opacity: 1.0,
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
    depthWrite: true,
  });

  if (texture) {
    mat.customProgramCacheKey = () => 'xuan_paper_puppet_backing_v1';
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
          vec4 sampledDiffuseColor = texture2D( map, vMapUv );
          diffuseColor.a *= sampledDiffuseColor.a;
        #endif`
      );
    };
  }
  return mat;
}

export class PuppetActor {
  /**
   * @param {Object} opts
   * @param {string} [opts.name]
   * @param {THREE.Texture} opts.texture
   * @param {THREE.Texture} [opts.stealthTexture]
   * @param {THREE.Texture} [opts.glowTexture]
   * @param {number} [opts.width=2.2]
   * @param {number} [opts.height=2.2]
   * @param {number|string} [opts.auraColor=0xffd27d]
   * @param {number} [opts.auraOpacity=0.38]
   * @param {number|string} [opts.backingColor=0xf3e5c8]
   * @param {number} [opts.phaseOffset]
   */
  constructor(opts = {}) {
    this.name = opts.name ?? 'puppet';
    this.width = opts.width ?? 2.2;
    this.height = opts.height ?? 2.2;
    this.primaryTexture = opts.texture ?? null;
    this.stealthTexture = opts.stealthTexture ?? null;
    this.baseAuraColor = new THREE.Color(opts.auraColor ?? 0xffd27d);
    this.baseAuraOpacity = opts.auraOpacity ?? 0.36;
    this.phaseOffset = opts.phaseOffset ?? Math.random() * Math.PI * 2;

    // Root bottom-pivoted group (group.position = feet on ground)
    this.group = new THREE.Group();
    this.group.name = `Puppet_${this.name}`;

    // Intermediate groups: scaleGroup handles giantScale; flipGroup handles X-facing mirror
    // keeping frontMesh (+0.02) always closer to camera than backMesh (-0.05) and auraMesh (-0.09).
    this.scaleGroup = new THREE.Group();
    this.flipGroup = new THREE.Group();
    this.scaleGroup.add(this.flipGroup);
    this.group.add(this.scaleGroup);

    // Subdivided deformable PlaneGeometry shifted so y=0 is at feet
    const segX = 10;
    const segY = 14;
    this.geometry = new THREE.PlaneGeometry(this.width, this.height, segX, segY);
    this.geometry.translate(0, this.height * 0.5, 0);
    this.basePositions = Float32Array.from(this.geometry.attributes.position.array);

    const alphaTest = opts.alphaTest ?? 0.35;

    // Front shadow-puppet cutout mesh (z = +0.02)
    this.frontMaterial = new THREE.MeshStandardMaterial({
      map: this.primaryTexture,
      color: 0xffffff,
      alphaTest,
      transparent: true,
      opacity: 1.0,
      roughness: 0.76,
      metalness: 0.02,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    this.frontMesh = new THREE.Mesh(this.geometry, this.frontMaterial);
    this.frontMesh.position.z = 0.02;
    this.frontMesh.castShadow = true;
    this.frontMesh.receiveShadow = true;
    this.frontMesh.frustumCulled = false;

    this.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.primaryTexture,
      alphaTest,
    });
    this.frontMesh.customDepthMaterial = this.customDepthMaterial;
    this.flipGroup.add(this.frontMesh);

    // Warm Xuan-paper backing thickness silhouette (z = -0.05), sharing deformed geometry
    this.backMaterial = createXuanBackingMaterial(
      this.primaryTexture,
      opts.backingColor ?? 0xf3e5c8,
      alphaTest
    );
    this.backMesh = new THREE.Mesh(this.geometry, this.backMaterial);
    this.backMesh.position.z = -0.05;
    this.backMesh.scale.set(1.018, 1.012, 1.0);
    this.backMesh.castShadow = false;
    this.backMesh.receiveShadow = true;
    this.backMesh.frustumCulled = false;
    this.flipGroup.add(this.backMesh);

    // Backlit soft aura glow plane (z = -0.09)
    const auraGeo = new THREE.PlaneGeometry(this.width * 1.48, this.height * 1.38);
    this.auraMaterial = new THREE.MeshBasicMaterial({
      map: opts.glowTexture ?? null,
      color: this.baseAuraColor.clone(),
      transparent: true,
      opacity: this.baseAuraOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.auraMesh = new THREE.Mesh(auraGeo, this.auraMaterial);
    this.auraMesh.position.set(0, this.height * 0.52, -0.09);
    this.auraMesh.frustumCulled = false;
    this.flipGroup.add(this.auraMesh);

    // Runtime state
    this._activeTexture = this.primaryTexture;
    this._petrifyExplicit = false;
    this._petrifyProgress = 0;
    this.resetState();
  }

  get petrifyProgress() {
    return this._petrifyProgress;
  }

  set petrifyProgress(val) {
    this._petrifyExplicit = true;
    this._petrifyProgress = Math.max(0, Math.min(1, Number(val) || 0));
  }

  setFacing(dir) {
    this.facing = dir < 0 ? -1 : 1;
    this.flipGroup.scale.x = this.facing;
    return this;
  }

  setPose(pose) {
    this.pose = pose || 'idle';
    return this;
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    return this;
  }

  setVisible(visible) {
    this.group.visible = Boolean(visible);
    return this;
  }

  setStealth(amount) {
    this.stealthAmount = Math.max(0, Math.min(1, Number(amount) || 0));
    return this;
  }

  setCorrupted(amount) {
    this.corruptedAmount = Math.max(0, Math.min(1, Number(amount) || 0));
    return this;
  }

  setGiantScale(mult) {
    this.giantScale = Math.max(0.05, Number(mult) || 1);
    this.scaleGroup.scale.setScalar(this.giantScale);
    return this;
  }

  setSinkDepth(depth) {
    this.sinkDepth = Math.max(0, Number(depth) || 0);
    return this;
  }

  setSuction(target, progress) {
    if (target) {
      if (!this.suctionTarget) this.suctionTarget = new THREE.Vector3();
      this.suctionTarget.copy(target);
    }
    if (typeof progress === 'number') {
      this.suctionProgress = Math.max(0, Math.min(1, progress));
    }
    return this;
  }

  setPetrify(progress) {
    this.petrifyProgress = progress;
    return this;
  }

  setAuraIntensity(intensity) {
    this.auraIntensity = Math.max(0, Number(intensity) || 0);
    return this;
  }

  resetState() {
    this.group.visible = false;
    this.group.position.set(0, 0, 0);
    this.group.rotation.set(0, 0, 0);
    this.group.scale.set(1, 1, 1);

    this.facing = 1;
    this.flipGroup.scale.set(1, 1, 1);
    this.flipGroup.position.set(0, 0, 0);
    this.flipGroup.rotation.set(0, 0, 0);

    this.giantScale = 1.0;
    this.scaleGroup.scale.set(1, 1, 1);

    this.pose = 'idle';
    this.sinkDepth = 0;
    this.stealthAmount = 0;
    this.corruptedAmount = 0;
    this.suctionTarget = null;
    this.suctionProgress = 0;
    this._petrifyProgress = 0;
    this._petrifyExplicit = false;
    this.auraIntensity = 1.0;
    this.hurtFlash = 0;

    this._applyTexture(this.primaryTexture);
    this.frontMaterial.color.copy(COLOR_WHITE);
    this.frontMaterial.emissive.copy(COLOR_BLACK);
    this.frontMaterial.emissiveIntensity = 0;
    this.frontMaterial.opacity = 1.0;
    this.frontMaterial.depthWrite = true;

    this.backMesh.visible = true;
    this.backMaterial.opacity = 1.0;
    this.auraMaterial.color.copy(this.baseAuraColor);
    this.auraMaterial.opacity = this.baseAuraOpacity;
    this.auraMesh.position.set(0, this.height * 0.52, -0.09);
    this.auraMesh.scale.set(1, 1, 1);

    // Restore base geometry positions
    const posAttr = this.geometry.attributes.position;
    posAttr.array.set(this.basePositions);
    posAttr.needsUpdate = true;
    return this;
  }

  _applyTexture(tex) {
    if (this._activeTexture === tex) return;
    this._activeTexture = tex;
    this.frontMaterial.map = tex;
    this.frontMaterial.needsUpdate = true;
    this.backMaterial.map = tex;
    this.backMaterial.needsUpdate = true;
    this.customDepthMaterial.map = tex;
    this.customDepthMaterial.needsUpdate = true;
  }

  update(t = 0) {
    if (!this.group.visible) return;

    const ph = this.phaseOffset;
    const w = this.width;
    const h = this.height;
    const halfW = w * 0.5 || 1;
    const invH = 1 / (h || 1);
    const pose = this.pose || 'idle';

    // Ensure scaleGroup & flipGroup reflect current properties (even if mutated directly)
    this.scaleGroup.scale.setScalar(this.giantScale);
    this.flipGroup.scale.x = this.facing < 0 ? -1 : 1;

    // 1. Whole-body bounce / sink offset on flipGroup
    let bodyY = -this.sinkDepth;
    let bodyRotZ = 0;
    let auraScaleMul = 1.0;
    let auraOpacityMul = this.auraIntensity;

    if (pose === 'walk') {
      bodyY += Math.abs(Math.sin(t * 6.5 + ph)) * h * 0.055;
      bodyRotZ = -0.045 + Math.sin(t * 6.5 + ph) * 0.025;
    } else if (pose === 'run') {
      bodyY += Math.abs(Math.sin(t * 11.0 + ph)) * h * 0.095;
      bodyRotZ = -0.13 + Math.sin(t * 11.0 + ph) * 0.04;
    } else if (pose === 'leap') {
      bodyY += Math.sin(t * 4.0 + ph) * h * 0.03;
      bodyRotZ = -0.1;
    } else if (pose === 'cast') {
      bodyY += Math.sin(t * 5.2 + ph) * h * 0.025;
      auraScaleMul = 1.25 + 0.18 * Math.sin(t * 9.0 + ph);
      auraOpacityMul *= 1.65;
    } else if (pose === 'attack') {
      const punch = Math.pow(Math.max(0, Math.sin(t * 10.5 + ph)), 2);
      bodyRotZ = -0.14 * punch + 0.06 * (1 - punch);
      auraScaleMul = 1.12 + 0.25 * punch;
      auraOpacityMul *= 1.35 + 0.45 * punch;
    } else if (pose === 'struggle') {
      bodyY += Math.sin(t * 14.0 + ph) * h * 0.02;
      bodyRotZ = Math.sin(t * 16.5 + ph) * 0.075;
    } else if (pose === 'blinded') {
      bodyRotZ = -0.08 + Math.sin(t * 28.0 + ph) * 0.035;
    } else if (pose === 'bound') {
      bodyRotZ = Math.sin(t * 10.0 + ph) * 0.045;
    } else if (pose === 'drunk') {
      bodyY += Math.sin(t * 4.2 + ph) * h * 0.03;
      bodyRotZ = Math.sin(t * 2.1 + ph) * 0.16;
    } else if (pose === 'heroic') {
      bodyY += Math.sin(t * 2.2 + ph) * h * 0.02;
      auraScaleMul = 1.32 + 0.12 * Math.sin(t * 3.5 + ph);
      auraOpacityMul *= 1.75;
    }

    this.flipGroup.position.set(0, bodyY, 0);
    this.flipGroup.rotation.set(0, 0, bodyRotZ);

    // Precompute local suction vector if in 'sucked' pose
    let hasSuction = false;
    let sucX = 0;
    let sucY = h * 0.5;
    let sucZ = 0;
    const sucP = pose === 'sucked' ? Math.max(0, Math.min(1, this.suctionProgress)) : 0;
    if (pose === 'sucked' && this.suctionTarget) {
      hasSuction = true;
      TEMP_VEC3.copy(this.suctionTarget).sub(this.group.position);
      const invScale = 1 / Math.max(0.05, this.giantScale);
      sucX = TEMP_VEC3.x * invScale * (this.facing < 0 ? -1 : 1);
      sucY = TEMP_VEC3.y * invScale - bodyY;
      sucZ = TEMP_VEC3.z * invScale;
    }

    // 2. Real-time vertex rig deformation from immutable basePositions
    const posAttr = this.geometry.attributes.position;
    const arr = posAttr.array;
    const base = this.basePositions;
    const count = posAttr.count;

    const breath = Math.sin(t * 2.4 + ph);
    const sway = Math.sin(t * 1.6 + ph);
    const strideWalk = Math.sin(t * 6.5 + ph);
    const strideRun = Math.sin(t * 11.0 + ph);
    const strike = Math.sin(t * 10.5 + ph);
    const stealth = this.stealthAmount;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const bx = base[i3];
      const by = base[i3 + 1];
      const bz = base[i3 + 2];

      const u = bx / halfW; // [-1, 1]
      const v = by * invH;  // [0, 1]

      // Subtle cowhide / layered-paper natural Z-camber
      let x = bx;
      let y = by;
      let z = bz - 0.032 * w * (u * u);

      // Chest Gaussian mask (centered around v = 0.56)
      const chest = Math.exp(-Math.pow((v - 0.56) * 3.8, 2));

      if (pose === 'idle') {
        x *= 1.0 + breath * 0.022 * chest;
        y += breath * 0.015 * h * v;
        z += breath * 0.035 * chest;
        // Head / calabash leaf sway near top
        x += sway * 0.032 * w * Math.pow(v, 1.8);
      } else if (pose === 'walk') {
        // Upper forward lean + lower shadow-puppet leg shear
        x += 0.055 * w * v + strideWalk * 0.075 * w * Math.max(0, 0.48 - v);
        y += Math.abs(strideWalk) * 0.02 * h * v;
        z += strideWalk * 0.085 * u * (0.35 + 0.65 * v);
      } else if (pose === 'run') {
        x += 0.14 * w * Math.pow(v, 1.2) + strideRun * 0.11 * w * Math.max(0, 0.5 - v);
        y -= Math.abs(strideRun) * 0.035 * h * (1 - v);
        z += strideRun * 0.11 * u + 0.05 * Math.sin(v * 6.0 - t * 12.0) * v;
      } else if (pose === 'leap') {
        // Airborne heroic stretch & trailing legs
        y *= 1.09;
        x += 0.08 * w * v - 0.14 * w * Math.pow(1 - v, 2);
        z += 0.09 * Math.sin(v * Math.PI);
      } else if (pose === 'cast') {
        const wave = Math.sin(v * 9.0 - t * 10.5 + ph);
        x *= 1.0 + 0.065 * chest + 0.03 * wave * v;
        x -= 0.07 * w * Math.pow(v, 1.6); // Arch back slightly as power surges
        y += 0.04 * h * v + 0.018 * h * Math.sin(t * 8.0 + ph) * v;
        z += 0.095 * chest + 0.04 * wave;
      } else if (pose === 'attack') {
        const lunge = Math.max(0, strike);
        x += (lunge * 0.22 - 0.06) * w * Math.pow(v, 1.3);
        x *= 1.0 + 0.05 * lunge * chest;
        y += 0.025 * h * lunge * v;
        z += (0.12 * lunge * v) + 0.06 * strike * u * v;
      } else if (pose === 'struggle') {
        // Frantic arm/shoulder thrashing while lower body is trapped in mire
        const upper = Math.max(0, (v - 0.28) / 0.72);
        const thrash = Math.sin(t * 17.5 + ph + v * 4.0);
        const heave = Math.cos(t * 13.0 + ph);
        x += thrash * 0.095 * w * upper;
        x *= 1.0 + heave * 0.055 * chest;
        y += Math.abs(thrash) * 0.028 * h * upper;
        z += thrash * 0.075 * u * upper;
      } else if (pose === 'blinded') {
        // Head/upper torso bowed in pain + fine tremor
        const top = Math.max(0, (v - 0.45) / 0.55);
        const tremor = Math.sin(t * 28.0 + ph + i * 0.3);
        x += tremor * 0.022 * w + 0.075 * w * top * top;
        y -= 0.095 * h * top * top;
        z += 0.08 * top + tremor * 0.015;
      } else if (pose === 'bound') {
        // Compressed squeeze around torso + restrained wriggle
        const bindMask = Math.sin(v * Math.PI);
        const squeeze = 0.76 + 0.045 * Math.sin(t * 11.0 + ph);
        x *= 1.0 - (1.0 - squeeze) * bindMask;
        x += Math.sin(t * 13.0 + ph + v * 5.0) * 0.03 * w * bindMask;
        y *= 1.03 + 0.015 * Math.sin(t * 11.0 + ph);
        z += Math.sin(t * 9.0 + ph) * 0.04 * u;
      } else if (pose === 'drunk') {
        // Dreamy figure-8 sway & tipsy droop
        const figX = Math.sin(t * 2.1 + ph) * 0.14 * w * v;
        const figY = Math.sin(t * 4.2 + ph) * 0.035 * h * v;
        x += figX;
        y += figY - 0.04 * h * Math.pow(v, 2);
        z += Math.cos(t * 2.1 + ph) * 0.06 * v;
      } else if (pose === 'frozen') {
        // Rigid crystalline stillness with faint faceted micro-shiver
        z += Math.sin(u * 5.0 + v * 7.0) * 0.015;
      } else if (pose === 'sucked') {
        // Spiral funnel stretch + pull toward suctionTarget
        const pull = Math.pow(sucP, 1.15);
        const vertexPull = Math.min(1, pull * (0.72 + 0.58 * v));
        const funnelRadius = Math.max(0.06, 1.0 - vertexPull * 0.88);
        const twistAngle = vertexPull * 9.5 + v * 3.8 + t * 12.0;

        // Taper & twist local silhouette around center axis
        const cx = x * funnelRadius;
        const cz = z * funnelRadius;
        const cosA = Math.cos(twistAngle);
        const sinA = Math.sin(twistAngle);
        x = cx * cosA - cz * sinA;
        z = cx * sinA + cz * cosA;
        y = by * (1.0 + vertexPull * 0.35 * (1.0 - sucP));

        if (hasSuction) {
          // Pull smoothly toward gourd mouth along curved vortex spiral
          const spiralAmp = (1.0 - vertexPull) * vertexPull * 0.45 * w;
          x = x * (1.0 - vertexPull) + sucX * vertexPull + Math.cos(twistAngle) * spiralAmp;
          y = y * (1.0 - vertexPull) + sucY * vertexPull;
          z = z * (1.0 - vertexPull) + sucZ * vertexPull + Math.sin(twistAngle) * spiralAmp;
        }
      } else if (pose === 'petrified') {
        // Motionless stone
        const pAmt = this._petrifyExplicit ? this._petrifyProgress : 1.0;
        const live = 1.0 - pAmt;
        x += sway * 0.02 * w * v * live;
      } else if (pose === 'heroic') {
        x *= 1.0 + (0.04 + 0.02 * breath) * chest;
        y *= 1.03;
        z += 0.065 * chest + 0.03 * Math.sin(t * 4.5 + ph + v * 4.0) * v;
        x += Math.sin(t * 2.8 + ph) * 0.022 * w * Math.pow(v, 2.0);
      }

      // Stealth water-ripple refraction shimmer (Liuwa)
      if (stealth > 0.02) {
        const ripple = Math.sin(v * 14.0 - t * 8.5 + u * 4.0) * 0.035 * w * stealth;
        x += ripple;
        z += Math.cos(v * 12.0 - t * 7.0) * 0.03 * stealth;
      }

      // Corrupted dark-energy jitter (Qiwa)
      if (this.corruptedAmount > 0.05) {
        z += Math.sin(v * 10.0 - t * 9.0 + ph) * 0.035 * this.corruptedAmount;
      }

      arr[i3] = x;
      arr[i3 + 1] = y;
      arr[i3 + 2] = z;
    }

    posAttr.needsUpdate = true;

    // 3. Material tinting, stealth swap, corruption, freeze, petrification & aura styling
    const useStealthTex = Boolean(this.stealthTexture && stealth > 0.35);
    this._applyTexture(useStealthTex ? this.stealthTexture : this.primaryTexture);

    TEMP_COLOR.copy(COLOR_WHITE);
    TEMP_EMISSIVE.copy(COLOR_BLACK);
    let emissiveIntensity = 0;

    if (pose === 'drunk') {
      TEMP_COLOR.lerp(COLOR_ROSY, 0.45);
    } else if (pose === 'frozen') {
      TEMP_COLOR.lerp(COLOR_FROZEN, 0.72);
      TEMP_EMISSIVE.copy(COLOR_FROZEN_EMISSIVE);
      emissiveIntensity = 0.42;
      auraOpacityMul *= 1.35;
    } else if (pose === 'blinded') {
      const pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * 14.0 + ph));
      TEMP_EMISSIVE.copy(COLOR_HURT_EMISSIVE);
      emissiveIntensity = 0.55 * pulse;
    } else if (pose === 'heroic') {
      TEMP_EMISSIVE.copy(COLOR_HEROIC_EMISSIVE);
      emissiveIntensity = 0.32 + 0.14 * Math.sin(t * 4.0 + ph);
    } else if (pose === 'cast') {
      TEMP_EMISSIVE.copy(this.baseAuraColor);
      emissiveIntensity = 0.28 + 0.18 * Math.sin(t * 9.0 + ph);
    }

    if (this.hurtFlash > 0.01) {
      TEMP_EMISSIVE.lerp(COLOR_HURT_EMISSIVE, this.hurtFlash);
      emissiveIntensity = Math.max(emissiveIntensity, this.hurtFlash * 0.85);
    }

    // Corruption overlay (Qiwa dark purple-black energy)
    if (this.corruptedAmount > 0.01) {
      const c = this.corruptedAmount;
      TEMP_COLOR.lerp(COLOR_CORRUPT_TINT, c * 0.65);
      TEMP_EMISSIVE.lerp(COLOR_CORRUPT_EMISSIVE, c);
      emissiveIntensity = Math.max(emissiveIntensity, c * (0.55 + 0.25 * Math.sin(t * 7.5)));
    }

    // Stealth translucency & cyan shimmer (Liuwa)
    let targetOpacity = 1.0;
    if (stealth > 0.01) {
      TEMP_COLOR.lerp(COLOR_STEALTH, stealth * 0.55);
      TEMP_EMISSIVE.lerp(COLOR_STEALTH_EMISSIVE, stealth * 0.75);
      emissiveIntensity = Math.max(emissiveIntensity, stealth * (0.35 + 0.2 * Math.sin(t * 8.0)));
      targetOpacity = 1.0 - stealth * 0.68;
    }

    // Fade out at the final moment of gourd suction
    if (pose === 'sucked' && sucP > 0.78) {
      targetOpacity *= Math.max(0, 1.0 - (sucP - 0.78) / 0.22);
    }

    // Petrification stone-gray mineral tint
    const petrifyAmt =
      pose === 'petrified'
        ? this._petrifyExplicit
          ? this._petrifyProgress
          : 1.0
        : this._petrifyProgress;
    if (petrifyAmt > 0.01) {
      TEMP_COLOR.lerp(COLOR_STONE, petrifyAmt * 0.85);
      emissiveIntensity *= 1.0 - petrifyAmt;
      auraOpacityMul *= 1.0 - petrifyAmt;
    }

    this.frontMaterial.color.copy(TEMP_COLOR);
    this.frontMaterial.emissive.copy(TEMP_EMISSIVE);
    this.frontMaterial.emissiveIntensity = emissiveIntensity;
    this.frontMaterial.opacity = targetOpacity;
    this.frontMaterial.depthWrite = targetOpacity > 0.85;
    this.frontMesh.castShadow = targetOpacity > 0.45;

    // Backing layer dims & hides during heavy stealth or suction vanish
    const backOpacity = Math.max(0, targetOpacity - stealth * 0.5);
    this.backMesh.visible = backOpacity > 0.15;
    this.backMaterial.opacity = backOpacity;
    this.backMaterial.depthWrite = backOpacity > 0.85;

    // Aura color & breathing pulse
    this.auraMaterial.color.copy(this.baseAuraColor);
    if (pose === 'frozen') this.auraMaterial.color.lerp(COLOR_FROZEN, 0.8);
    if (stealth > 0.05) this.auraMaterial.color.lerp(COLOR_STEALTH, stealth * 0.85);
    if (this.corruptedAmount > 0.05) {
      this.auraMaterial.color.lerp(COLOR_CORRUPT_EMISSIVE, this.corruptedAmount * 0.9);
    }

    const auraPulse = 0.88 + 0.12 * Math.sin(t * 3.6 + ph);
    this.auraMaterial.opacity = Math.max(
      0,
      Math.min(1.0, this.baseAuraOpacity * auraOpacityMul * auraPulse * (1.0 - sucP * 0.85))
    );
    this.auraMesh.scale.setScalar(auraScaleMul * (1.0 - sucP * 0.75));
    this.auraMesh.position.set(0, h * 0.52, -0.09);
  }

  dispose() {
    this.geometry?.dispose?.();
    this.frontMaterial?.dispose?.();
    this.backMaterial?.dispose?.();
    this.customDepthMaterial?.dispose?.();
    this.auraMesh?.geometry?.dispose?.();
    this.auraMaterial?.dispose?.();
  }
}
