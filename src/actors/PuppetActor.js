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

function collectDeformableParts(rootObj) {
  const parts = [];
  if (!rootObj) return parts;
  rootObj.traverse((child) => {
    if (child.isMesh && child.geometry?.attributes?.position) {
      const posAttr = child.geometry.attributes.position;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      parts.push({
        mesh: child,
        geometry: child.geometry,
        basePositions: Float32Array.from(posAttr.array),
        materials: mats.map((m) => ({
          mat: m,
          baseColor: m.color ? m.color.clone() : new THREE.Color(0xffffff),
          baseEmissive: m.emissive ? m.emissive.clone() : new THREE.Color(0x000000),
          baseEmissiveIntensity: m.emissiveIntensity ?? 0,
          baseOpacity: m.opacity ?? 1.0,
          baseTransparent: Boolean(m.transparent),
        })),
      });
    }
  });
  return parts;
}

export class PuppetActor {
  /**
   * Full 3D Volumetric GLB Actor (with automatic fallback if no 3D model is provided).
   * Supports all 14 story poses, giantScale, sinkDepth, gourd vortex suction, stealth,
   * corruption, freeze, and petrification directly on 3D GLB geometry & PBR materials.
   */
  constructor(opts = {}) {
    this.name = opts.name ?? 'actor3d';
    this.width = opts.width ?? 2.2;
    this.height = opts.height ?? 2.2;
    this.primaryTexture = opts.texture ?? null;
    this.stealthTexture = opts.stealthTexture ?? null;
    this.baseAuraColor = new THREE.Color(opts.auraColor ?? 0xffd27d);
    this.baseAuraOpacity = opts.auraOpacity ?? 0.24;
    this.phaseOffset = opts.phaseOffset ?? Math.random() * Math.PI * 2;

    this.group = new THREE.Group();
    this.group.name = `Actor3D_${this.name}`;

    this.scaleGroup = new THREE.Group();
    this.flipGroup = new THREE.Group();
    this.scaleGroup.add(this.flipGroup);
    this.group.add(this.scaleGroup);

    this.is3DModel = Boolean(opts.model);
    this.primaryModel = opts.model ?? null;
    this.stealthModel = opts.stealthModel ?? null;

    if (this.is3DModel) {
      this.flipGroup.add(this.primaryModel);
      if (this.stealthModel) {
        this.stealthModel.visible = false;
        this.flipGroup.add(this.stealthModel);
      }
      this.primaryParts = collectDeformableParts(this.primaryModel);
      this.stealthParts = collectDeformableParts(this.stealthModel);
    } else {
      // Minimal fallback plane only if GLB failed to load
      const geo = new THREE.PlaneGeometry(this.width, this.height, 10, 14);
      geo.translate(0, this.height * 0.5, 0);
      const mat = new THREE.MeshStandardMaterial({
        map: this.primaryTexture,
        alphaTest: 0.35,
        transparent: true,
        roughness: 0.65,
        side: THREE.DoubleSide,
      });
      const fallbackMesh = new THREE.Mesh(geo, mat);
      fallbackMesh.castShadow = true;
      fallbackMesh.receiveShadow = true;
      this.primaryModel = fallbackMesh;
      this.flipGroup.add(fallbackMesh);
      this.primaryParts = collectDeformableParts(fallbackMesh);
      this.stealthParts = [];
    }

    // Soft Volumetric Rim/Aura Halo behind actor (z = -0.35 so it never intersects 3D back!)
    const auraGeo = new THREE.PlaneGeometry(this.width * 1.42, this.height * 1.34);
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
    this.auraMesh.position.set(0, this.height * 0.52, -0.42);
    this.auraMesh.frustumCulled = false;
    this.flipGroup.add(this.auraMesh);

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

  _restoreParts(parts) {
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      const posAttr = part.geometry.attributes.position;
      posAttr.array.set(part.basePositions);
      posAttr.needsUpdate = true;
      for (const mEntry of part.materials) {
        const m = mEntry.mat;
        if (m.color) m.color.copy(mEntry.baseColor);
        if (m.emissive) m.emissive.copy(mEntry.baseEmissive);
        m.emissiveIntensity = mEntry.baseEmissiveIntensity;
        m.opacity = mEntry.baseOpacity;
        m.transparent = mEntry.baseTransparent;
        m.depthWrite = !mEntry.baseTransparent;
      }
      part.mesh.castShadow = true;
    }
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

    if (this.primaryModel) this.primaryModel.visible = true;
    if (this.stealthModel) this.stealthModel.visible = false;
    this._restoreParts(this.primaryParts);
    this._restoreParts(this.stealthParts);

    this.auraMaterial.color.copy(this.baseAuraColor);
    this.auraMaterial.opacity = this.baseAuraOpacity;
    this.auraMesh.position.set(0, this.height * 0.52, -0.42);
    this.auraMesh.scale.set(1, 1, 1);
    return this;
  }

  update(t = 0) {
    if (!this.group.visible) return;

    const ph = this.phaseOffset;
    const w = this.width;
    const h = this.height;
    const halfW = w * 0.5 || 1;
    const invH = 1 / (h || 1);
    const pose = this.pose || 'idle';

    this.scaleGroup.scale.setScalar(this.giantScale);
    this.flipGroup.scale.x = this.facing < 0 ? -1 : 1;

    let bodyY = -this.sinkDepth;
    let bodyRotY = 0;
    let bodyRotZ = 0;
    let auraScaleMul = 1.0;
    let auraOpacityMul = this.auraIntensity;

    if (pose === 'walk') {
      bodyY += Math.abs(Math.sin(t * 6.5 + ph)) * h * 0.048;
      bodyRotZ = -0.035 + Math.sin(t * 6.5 + ph) * 0.025;
      bodyRotY = Math.sin(t * 6.5 + ph) * 0.12;
    } else if (pose === 'run') {
      bodyY += Math.abs(Math.sin(t * 11.0 + ph)) * h * 0.085;
      bodyRotZ = -0.11 + Math.sin(t * 11.0 + ph) * 0.038;
      bodyRotY = Math.sin(t * 11.0 + ph) * 0.18;
    } else if (pose === 'leap') {
      bodyY += Math.sin(t * 4.0 + ph) * h * 0.03;
      bodyRotZ = -0.09;
    } else if (pose === 'cast') {
      bodyY += Math.sin(t * 5.2 + ph) * h * 0.022;
      auraScaleMul = 1.25 + 0.16 * Math.sin(t * 9.0 + ph);
      auraOpacityMul *= 1.55;
    } else if (pose === 'attack') {
      const punch = Math.pow(Math.max(0, Math.sin(t * 10.5 + ph)), 2);
      bodyRotZ = -0.12 * punch + 0.05 * (1 - punch);
      bodyRotY = 0.22 * punch - 0.08;
      auraScaleMul = 1.12 + 0.22 * punch;
      auraOpacityMul *= 1.3 + 0.4 * punch;
    } else if (pose === 'struggle') {
      bodyY += Math.sin(t * 14.0 + ph) * h * 0.018;
      bodyRotZ = Math.sin(t * 16.5 + ph) * 0.068;
      bodyRotY = Math.cos(t * 12.0 + ph) * 0.18;
    } else if (pose === 'blinded') {
      bodyRotZ = -0.07 + Math.sin(t * 28.0 + ph) * 0.03;
      bodyRotY = Math.sin(t * 14.0 + ph) * 0.14;
    } else if (pose === 'bound') {
      bodyRotZ = Math.sin(t * 10.0 + ph) * 0.04;
      bodyRotY = Math.sin(t * 8.0 + ph) * 0.10;
    } else if (pose === 'drunk') {
      bodyY += Math.sin(t * 4.2 + ph) * h * 0.028;
      bodyRotZ = Math.sin(t * 2.1 + ph) * 0.15;
      bodyRotY = Math.cos(t * 2.1 + ph) * 0.20;
    } else if (pose === 'heroic') {
      bodyY += Math.sin(t * 2.2 + ph) * h * 0.018;
      bodyRotY = Math.sin(t * 1.4 + ph) * 0.10;
      auraScaleMul = 1.28 + 0.10 * Math.sin(t * 3.5 + ph);
      auraOpacityMul *= 1.65;
    } else if (pose === 'idle') {
      bodyRotY = Math.sin(t * 1.2 + ph) * 0.08;
    }

    this.flipGroup.position.set(0, bodyY, 0);
    this.flipGroup.rotation.set(0, bodyRotY, bodyRotZ);

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

    const stealth = this.stealthAmount;
    const useStealthModel = Boolean(this.stealthModel && stealth > 0.35);
    if (this.stealthModel) {
      this.primaryModel.visible = !useStealthModel;
      this.stealthModel.visible = useStealthModel;
    }
    const activeParts = useStealthModel ? this.stealthParts : this.primaryParts;

    const breath = Math.sin(t * 2.4 + ph);
    const sway = Math.sin(t * 1.6 + ph);
    const strideWalk = Math.sin(t * 6.5 + ph);
    const strideRun = Math.sin(t * 11.0 + ph);
    const strike = Math.sin(t * 10.5 + ph);

    // Real-time 3D volumetric deformation on active GLB mesh
    for (let p = 0; p < activeParts.length; p++) {
      const part = activeParts[p];
      const posAttr = part.geometry.attributes.position;
      const arr = posAttr.array;
      const base = part.basePositions;
      const count = posAttr.count;

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const bx = base[i3];
        const by = base[i3 + 1];
        const bz = base[i3 + 2];

        const u = bx / halfW;
        const v = Math.max(0, Math.min(1.2, by * invH));
        const chest = Math.exp(-Math.pow((v - 0.54) * 3.8, 2));

        let x = bx;
        let y = by;
        let z = bz;

        if (pose === 'idle') {
          const ribScale = 1.0 + breath * 0.022 * chest;
          x *= ribScale;
          z *= ribScale;
          y += breath * 0.012 * h * v;
          x += sway * 0.022 * w * Math.pow(v, 1.8);
        } else if (pose === 'walk') {
          x += 0.045 * w * v + strideWalk * 0.065 * w * Math.max(0, 0.48 - v);
          y += Math.abs(strideWalk) * 0.018 * h * v;
          z += strideWalk * 0.075 * u * (0.35 + 0.65 * v);
        } else if (pose === 'run') {
          x += 0.12 * w * Math.pow(v, 1.2) + strideRun * 0.095 * w * Math.max(0, 0.5 - v);
          y -= Math.abs(strideRun) * 0.03 * h * Math.max(0, 1 - v);
          z += strideRun * 0.095 * u;
        } else if (pose === 'leap') {
          y *= 1.07;
          x += 0.065 * w * v - 0.11 * w * Math.pow(Math.max(0, 1 - v), 2);
          z += 0.065 * Math.sin(Math.min(1, v) * Math.PI);
        } else if (pose === 'cast') {
          const wave = Math.sin(v * 8.0 - t * 10.0 + ph);
          x *= 1.0 + 0.055 * chest + 0.025 * wave * v;
          z *= 1.0 + 0.065 * chest;
          x -= 0.055 * w * Math.pow(v, 1.6);
          y += 0.032 * h * v;
        } else if (pose === 'attack') {
          const lunge = Math.max(0, strike);
          x += (lunge * 0.18 - 0.04) * w * Math.pow(v, 1.3);
          y += 0.02 * h * lunge * v;
          z += 0.09 * lunge * v;
        } else if (pose === 'struggle') {
          const upper = Math.max(0, (v - 0.28) / 0.72);
          const thrash = Math.sin(t * 17.5 + ph + v * 4.0);
          x += thrash * 0.08 * w * upper;
          y += Math.abs(thrash) * 0.022 * h * upper;
          z += thrash * 0.065 * u * upper;
        } else if (pose === 'blinded') {
          const top = Math.max(0, (v - 0.45) / 0.55);
          const tremor = Math.sin(t * 28.0 + ph + (i % 7) * 0.5);
          x += tremor * 0.016 * w + 0.06 * w * top * top;
          y -= 0.08 * h * top * top;
          z += 0.065 * top;
        } else if (pose === 'bound') {
          const bindMask = Math.sin(Math.min(1, v) * Math.PI);
          const squeeze = 0.78 + 0.04 * Math.sin(t * 11.0 + ph);
          const sq = 1.0 - (1.0 - squeeze) * bindMask;
          x *= sq;
          z *= sq;
          x += Math.sin(t * 13.0 + ph + v * 5.0) * 0.024 * w * bindMask;
        } else if (pose === 'drunk') {
          x += Math.sin(t * 2.1 + ph) * 0.12 * w * v;
          y += Math.sin(t * 4.2 + ph) * 0.028 * h * v - 0.032 * h * v * v;
          z += Math.cos(t * 2.1 + ph) * 0.065 * v;
        } else if (pose === 'sucked') {
          const pull = Math.pow(sucP, 1.15);
          const vertexPull = Math.min(1, pull * (0.72 + 0.58 * Math.min(1, v)));
          const funnelRadius = Math.max(0.05, 1.0 - vertexPull * 0.90);
          const twistAngle = vertexPull * 9.5 + v * 3.8 + t * 12.0;
          const cx = x * funnelRadius;
          const cz = z * funnelRadius;
          const cosA = Math.cos(twistAngle);
          const sinA = Math.sin(twistAngle);
          x = cx * cosA - cz * sinA;
          z = cx * sinA + cz * cosA;
          y = by * (1.0 + vertexPull * 0.32 * (1.0 - sucP));
          if (hasSuction) {
            const spiralAmp = (1.0 - vertexPull) * vertexPull * 0.42 * w;
            x = x * (1.0 - vertexPull) + sucX * vertexPull + Math.cos(twistAngle) * spiralAmp;
            y = y * (1.0 - vertexPull) + sucY * vertexPull;
            z = z * (1.0 - vertexPull) + sucZ * vertexPull + Math.sin(twistAngle) * spiralAmp;
          }
        } else if (pose === 'petrified') {
          const pAmt = this._petrifyExplicit ? this._petrifyProgress : 1.0;
          x += sway * 0.015 * w * v * (1.0 - pAmt);
        } else if (pose === 'heroic') {
          const heroRib = 1.0 + (0.035 + 0.018 * breath) * chest;
          x *= heroRib;
          z *= heroRib;
          y *= 1.025;
        }

        if (stealth > 0.02) {
          x += Math.sin(v * 14.0 - t * 8.5 + u * 4.0) * 0.028 * w * stealth;
        }

        arr[i3] = x;
        arr[i3 + 1] = y;
        arr[i3 + 2] = z;
      }

      posAttr.needsUpdate = true;

      // PBR Material States (freeze, drunk, corrupt, stealth, hurt, petrify)
      TEMP_COLOR.copy(COLOR_WHITE);
      TEMP_EMISSIVE.copy(COLOR_BLACK);
      let emissiveIntensity = 0;

      if (pose === 'drunk') {
        TEMP_COLOR.lerp(COLOR_ROSY, 0.42);
      } else if (pose === 'frozen') {
        TEMP_COLOR.lerp(COLOR_FROZEN, 0.72);
        TEMP_EMISSIVE.copy(COLOR_FROZEN_EMISSIVE);
        emissiveIntensity = 0.42;
        auraOpacityMul *= 1.35;
      } else if (pose === 'blinded') {
        const pulse = 0.45 + 0.55 * Math.abs(Math.sin(t * 14.0 + ph));
        TEMP_EMISSIVE.copy(COLOR_HURT_EMISSIVE);
        emissiveIntensity = 0.5 * pulse;
      } else if (pose === 'heroic') {
        TEMP_EMISSIVE.copy(COLOR_HEROIC_EMISSIVE);
        emissiveIntensity = 0.26 + 0.12 * Math.sin(t * 4.0 + ph);
      } else if (pose === 'cast') {
        TEMP_EMISSIVE.copy(this.baseAuraColor);
        emissiveIntensity = 0.24 + 0.15 * Math.sin(t * 9.0 + ph);
      }

      if (this.hurtFlash > 0.01) {
        TEMP_EMISSIVE.lerp(COLOR_HURT_EMISSIVE, this.hurtFlash);
        emissiveIntensity = Math.max(emissiveIntensity, this.hurtFlash * 0.85);
      }

      if (this.corruptedAmount > 0.01) {
        const c = this.corruptedAmount;
        TEMP_COLOR.lerp(COLOR_CORRUPT_TINT, c * 0.65);
        TEMP_EMISSIVE.lerp(COLOR_CORRUPT_EMISSIVE, c);
        emissiveIntensity = Math.max(emissiveIntensity, c * (0.5 + 0.22 * Math.sin(t * 7.5)));
      }

      let targetOpacity = 1.0;
      if (stealth > 0.01) {
        TEMP_COLOR.lerp(COLOR_STEALTH, stealth * 0.5);
        TEMP_EMISSIVE.lerp(COLOR_STEALTH_EMISSIVE, stealth * 0.7);
        emissiveIntensity = Math.max(emissiveIntensity, stealth * (0.32 + 0.18 * Math.sin(t * 8.0)));
        targetOpacity = useStealthModel ? Math.max(0.32, 1.0 - stealth * 0.35) : 1.0 - stealth * 0.68;
      }

      if (pose === 'sucked' && sucP > 0.78) {
        targetOpacity *= Math.max(0, 1.0 - (sucP - 0.78) / 0.22);
      }

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

      for (const mEntry of part.materials) {
        const m = mEntry.mat;
        if (m.color) m.color.copy(mEntry.baseColor).multiply(TEMP_COLOR);
        if (m.emissive) {
          if (emissiveIntensity > 0.005) {
            m.emissive.copy(TEMP_EMISSIVE);
            m.emissiveIntensity = emissiveIntensity;
          } else {
            m.emissive.copy(mEntry.baseEmissive);
            m.emissiveIntensity = mEntry.baseEmissiveIntensity;
          }
        }
        const finalOp = mEntry.baseOpacity * targetOpacity;
        m.opacity = finalOp;
        m.transparent = mEntry.baseTransparent || finalOp < 0.99;
        m.depthWrite = finalOp > 0.82 && !mEntry.baseTransparent;
      }
      part.mesh.castShadow = targetOpacity > 0.45;
    }

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
    this.auraMesh.position.set(0, h * 0.52, -0.42);
  }

  dispose() {
    for (const part of [...this.primaryParts, ...this.stealthParts]) {
      part.geometry?.dispose?.();
      for (const mEntry of part.materials) {
        mEntry.mat?.dispose?.();
      }
    }
    this.auraMesh?.geometry?.dispose?.();
    this.auraMaterial?.dispose?.();
  }
}
