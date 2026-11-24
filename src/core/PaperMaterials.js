import * as THREE from 'three';
import {
  generateProceduralPaperTextures,
  generateSoftGlowTexture,
} from './AssetRegistry.js';

let _sharedPaperTextures = null;
let _sharedGlowTexture = null;

function getSharedPaperTextures() {
  if (!_sharedPaperTextures) {
    _sharedPaperTextures = generateProceduralPaperTextures(256);
    _sharedPaperTextures.grain.repeat.set(2, 2);
    _sharedPaperTextures.normal.repeat.set(2, 2);
  }
  return _sharedPaperTextures;
}

function getSharedGlowTexture() {
  if (!_sharedGlowTexture) {
    _sharedGlowTexture = generateSoftGlowTexture(256);
  }
  return _sharedGlowTexture;
}

function withRepeat(baseTex, repeat) {
  if (!repeat) return baseTex;
  const rx = Array.isArray(repeat) ? repeat[0] : repeat;
  const ry = Array.isArray(repeat) ? repeat[1] : repeat;
  const cloned = baseTex.clone();
  cloned.wrapS = THREE.RepeatWrapping;
  cloned.wrapT = THREE.RepeatWrapping;
  cloned.repeat.set(rx, ry);
  cloned.needsUpdate = true;
  return cloned;
}

/**
 * Creates a MeshStandardMaterial enriched with subtle procedural Xuan-paper grain,
 * tangent-space fiber normal/bump relief, and warm handmade mineral-pigment tactility.
 */
export function createPaperStandardMaterial(opts = {}) {
  const shared = getSharedPaperTextures();
  const repeat = opts.repeat ?? null;

  const grainTex = opts.grainMap ?? (repeat ? withRepeat(shared.grain, repeat) : shared.grain);
  const normalTex = opts.normalMap ?? (repeat ? withRepeat(shared.normal, repeat) : shared.normal);

  const normalStrength = opts.normalStrength ?? 0.24;
  const usePaperGrainAsMap = !opts.map && opts.usePaperGrain !== false;

  const params = {
    color: opts.color !== undefined ? new THREE.Color(opts.color) : new THREE.Color(0xf3ead8),
    roughness: opts.roughness ?? 0.84,
    metalness: opts.metalness ?? 0.04,
    flatShading: opts.flatShading ?? true,
    side: opts.side ?? THREE.FrontSide,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1.0,
    depthWrite: opts.depthWrite ?? !(opts.transparent && (opts.opacity ?? 1.0) < 0.99),
    vertexColors: opts.vertexColors ?? false,
  };

  if (opts.map) {
    params.map = opts.map;
  } else if (usePaperGrainAsMap) {
    params.map = grainTex;
  }

  if (opts.useNormalMap !== false) {
    params.normalMap = normalTex;
    params.normalScale =
      opts.normalScale instanceof THREE.Vector2
        ? opts.normalScale
        : new THREE.Vector2(normalStrength, normalStrength);
  }

  if (opts.bumpMap || opts.useBumpMap) {
    params.bumpMap = opts.bumpMap ?? grainTex;
    params.bumpScale = opts.bumpScale ?? 0.032;
  }

  if (opts.emissive !== undefined) {
    params.emissive = new THREE.Color(opts.emissive);
    params.emissiveIntensity = opts.emissiveIntensity ?? 1.0;
  }
  if (opts.emissiveMap) {
    params.emissiveMap = opts.emissiveMap;
  }
  if (opts.alphaTest !== undefined) {
    params.alphaTest = opts.alphaTest;
  }
  if (opts.fog !== undefined) {
    params.fog = opts.fog;
  }

  return new THREE.MeshStandardMaterial(params);
}

/**
 * Creates a warm Xuan-paper silhouette backing material that extracts alpha from the
 * sprite PNG's alpha channel while rendering solid warm paper RGB under full scene lighting.
 */
function createXuanPaperBackingMaterial(texture, opts = {}) {
  const alphaTest = opts.alphaTest ?? 0.35;
  const mat = new THREE.MeshStandardMaterial({
    color: opts.backingColor !== undefined ? new THREE.Color(opts.backingColor) : new THREE.Color(0xf2e4c8),
    map: texture ?? null,
    alphaTest,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1.0,
    roughness: 0.92,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  if (texture) {
    mat.customProgramCacheKey = () => 'xuan_paper_backing_v1';
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

/**
 * Builds a 3D layered shadow-puppet / paper-cutout group:
 *  - Front illustrated cutout plane (alphaTest: 0.35, custom depth alphaTest shadows)
 *  - Warm Xuan-paper backing thickness layer at z = -(opts.thickness ?? 0.06)
 *  - Optional backlit aura glow plane
 */
export function createShadowCutoutMesh(texture, width = 2, height = 2, opts = {}) {
  const group = new THREE.Group();
  const alphaTest = opts.alphaTest ?? 0.35;
  const thickness = opts.thickness ?? 0.06;
  const segX = opts.segmentsX ?? 1;
  const segY = opts.segmentsY ?? 1;

  const frontGeo = new THREE.PlaneGeometry(width, height, segX, segY);
  if (opts.pivotBottom) {
    frontGeo.translate(0, height * 0.5, 0);
  }

  const frontMat = new THREE.MeshStandardMaterial({
    map: texture ?? null,
    color: opts.color !== undefined ? new THREE.Color(opts.color) : new THREE.Color(0xffffff),
    alphaTest,
    transparent: opts.transparent ?? true,
    opacity: opts.opacity ?? 1.0,
    roughness: opts.roughness ?? 0.78,
    metalness: opts.metalness ?? 0.02,
    side: opts.side ?? THREE.DoubleSide,
    depthWrite: opts.depthWrite ?? true,
    emissive: opts.emissive !== undefined ? new THREE.Color(opts.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: opts.emissiveIntensity ?? 0.0,
  });

  const frontMesh = new THREE.Mesh(frontGeo, frontMat);
  frontMesh.castShadow = opts.castShadow ?? true;
  frontMesh.receiveShadow = opts.receiveShadow ?? true;

  if (texture) {
    frontMesh.customDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: texture,
      alphaTest,
    });
  }
  group.add(frontMesh);

  // Warm Xuan-paper backing thickness silhouette
  const backGeo = frontGeo.clone();
  const backMat = createXuanPaperBackingMaterial(texture, {
    alphaTest,
    backingColor: opts.backingColor ?? 0xf2e4c8,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1.0,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.position.z = -thickness;
  backMesh.scale.set(opts.backingScale ?? 1.015, opts.backingScale ?? 1.015, 1);
  backMesh.castShadow = false;
  backMesh.receiveShadow = opts.receiveShadow ?? true;
  group.add(backMesh);

  // Optional subtle backlit aura glow plane
  let auraMesh = null;
  let auraMat = null;
  if (opts.auraColor !== undefined || opts.glowColor !== undefined || opts.aura === true) {
    const auraScale = opts.auraScale ?? 1.35;
    const auraGeo = new THREE.PlaneGeometry(width * auraScale, height * auraScale);
    if (opts.pivotBottom) {
      auraGeo.translate(0, height * 0.5, 0);
    }
    auraMat = new THREE.MeshBasicMaterial({
      map: opts.glowTexture ?? getSharedGlowTexture(),
      color: new THREE.Color(opts.auraColor ?? opts.glowColor ?? 0xffd27d),
      transparent: true,
      opacity: opts.auraOpacity ?? 0.36,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    auraMesh = new THREE.Mesh(auraGeo, auraMat);
    auraMesh.position.z = -thickness - 0.035;
    group.add(auraMesh);
  }

  group.userData = {
    frontMesh,
    backMesh,
    auraMesh,
    frontMaterial: frontMat,
    backMaterial: backMat,
    auraMaterial: auraMat,
  };

  return group;
}

const WATER_MIRE_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const COMMON_NOISE_GLSL = /* glsl */ `
  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise2(p);
      p = rot * p * 2.02 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }
`;

const WATER_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  ${COMMON_NOISE_GLSL}

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.85;

    // Flowing mountain stream coordinates
    vec2 flow1 = vec2(uv.x * 5.0 + sin(uv.y * 6.0 + t) * 0.18, uv.y * 7.5 - t * 1.45);
    vec2 flow2 = vec2(uv.x * 9.0 - cos(uv.y * 5.0 - t * 0.8) * 0.14, uv.y * 11.0 - t * 2.1);

    float n1 = fbm(flow1);
    float n2 = fbm(flow2);
    float ripples = sin(uv.y * 34.0 - t * 5.2 + n1 * 6.5) * 0.5 + 0.5;

    // Mineral cyan-jade palette (Song-dynasty blue-green stream)
    vec3 deepJade = vec3(0.07, 0.34, 0.42);
    vec3 midTeal = vec3(0.16, 0.58, 0.62);
    vec3 foamWhite = vec3(0.88, 0.97, 0.95);

    vec3 col = mix(deepJade, midTeal, smoothstep(0.22, 0.78, n1 * 0.65 + n2 * 0.35));

    // Stylized ink-scroll water ridges and sparkling crests
    float crest = smoothstep(0.76, 0.96, ripples * n2 + 0.15 * n1);
    float silkLine = smoothstep(0.86, 0.97, sin((uv.x * 16.0 + n1 * 4.5)) * 0.5 + 0.5) * 0.35;
    float edgeFoam = smoothstep(0.36, 0.50, abs(uv.x - 0.5)) * (0.45 + 0.55 * n2);

    col = mix(col, foamWhite, clamp(crest * 0.85 + silkLine + edgeFoam * 0.6, 0.0, 1.0));
    col *= (0.92 + 0.16 * uIntensity);

    float alpha = uOpacity * (0.82 + 0.18 * clamp(crest + edgeFoam, 0.0, 1.0));
    gl_FragColor = vec4(col, alpha);
  }
`;

const MIRE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  ${COMMON_NOISE_GLSL}

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float r = length(centered);
    float angle = atan(centered.y, centered.x);
    float t = uTime * (0.7 + 0.5 * uIntensity);

    // Concentric quicksand vortex arms
    float swirl = angle + (1.0 - clamp(r, 0.0, 1.0)) * 5.2 - t * 1.15;
    float spiralWave = sin(swirl * 3.0 + r * 14.0 - t * 2.4) * 0.5 + 0.5;
    float rings = sin(r * 24.0 - t * 3.2 + fbm(centered * 3.5 + t * 0.25) * 4.2) * 0.5 + 0.5;

    float mudNoise = fbm(vec2(cos(swirl), sin(swirl)) * (1.8 + r * 2.2) + t * 0.18);

    // Deep purple-mud & toxic miasma palette
    vec3 abyssMud = vec3(0.08, 0.04, 0.12);
    vec3 plumSludge = vec3(0.24, 0.12, 0.30);
    vec3 eerieRim = vec3(0.46, 0.24, 0.56);
    vec3 toxicGlow = vec3(0.62, 0.82, 0.42);

    vec3 col = mix(abyssMud, plumSludge, smoothstep(0.2, 0.85, mudNoise * 0.65 + rings * 0.35));
    col = mix(col, eerieRim, smoothstep(0.62, 0.94, spiralWave * rings) * (0.45 + 0.35 * uIntensity));

    // Animated popping mud bubbles on grid cells
    vec2 bGrid = centered * 4.5;
    vec2 bId = floor(bGrid);
    vec2 bUv = fract(bGrid) - 0.5;
    float rnd = hash21(bId);
    float phase = fract(t * (0.35 + rnd * 0.45) + rnd * 7.0);
    float bRadius = mix(0.06, 0.36, smoothstep(0.0, 0.82, phase)) * (1.0 - smoothstep(0.84, 1.0, phase));
    vec2 bOff = (vec2(hash21(bId + 3.1), hash21(bId + 8.7)) - 0.5) * 0.32;
    float bDist = length(bUv - bOff);
    float bubbleRing = smoothstep(bRadius, bRadius - 0.06, bDist) * smoothstep(bRadius - 0.14, bRadius - 0.04, bDist);
    float bubbleSpec = smoothstep(bRadius * 0.65, 0.0, length(bUv - bOff - vec2(-0.04, 0.04))) * 0.45;
    float maskInPool = 1.0 - smoothstep(0.75, 1.02, r);
    col += mix(eerieRim, toxicGlow, 0.45) * (bubbleRing * 0.7 + bubbleSpec) * maskInPool * (0.6 + 0.7 * uIntensity);

    // Dark sucking vortex eye at center
    col *= smoothstep(0.02, 0.34, r) * 0.78 + 0.22;

    float edgeFade = 1.0 - smoothstep(0.84, 1.0, r);
    gl_FragColor = vec4(col, uOpacity * edgeFade);
  }
`;

const LAVA_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  ${COMMON_NOISE_GLSL}

  void main() {
    float t = uTime * 0.42;
    vec2 p = vUv * 6.5;

    // Warped ridged magma crust + molten veins
    vec2 warp = vec2(
      fbm(p + vec2(t * 0.6, -t * 0.4)),
      fbm(p + vec2(-t * 0.5, t * 0.7) + 4.3)
    );
    float n = fbm(p + warp * 2.1);
    float ridge = 1.0 - abs(n * 2.0 - 1.0);
    float cracks = pow(clamp(ridge, 0.0, 1.0), 3.4);

    float pulse = 0.85 + 0.22 * sin(uTime * 2.8 + n * 8.0);
    float heat = clamp(cracks * (1.25 + 0.55 * uIntensity) * pulse, 0.0, 1.8);

    vec3 basalt = vec3(0.09, 0.05, 0.06);
    vec3 crimson = vec3(0.82, 0.14, 0.05);
    vec3 magmaOrange = vec3(1.25, 0.48, 0.08);
    vec3 moltenGold = vec3(1.85, 1.38, 0.48);

    vec3 col = mix(basalt, crimson, smoothstep(0.18, 0.48, heat));
    col = mix(col, magmaOrange, smoothstep(0.45, 0.82, heat));
    col = mix(col, moltenGold, smoothstep(0.82, 1.35, heat));

    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * Animated procedural shader material for:
 *  - 'water': cyan-jade mountain stream ripples
 *  - 'mire':  dark purple-mud bubbling concentric quicksand vortex
 *  - 'lava':  crimson-gold magma cracks (HDR emissive to feed UnrealBloomPass)
 * Exposes material.userData.update(t).
 */
export function createWaterMireMaterial(mode = 'water', opts = {}) {
  const normalized = mode === 'mire' || mode === 'lava' ? mode : 'water';
  const fragmentShader =
    normalized === 'mire' ? MIRE_FRAG : normalized === 'lava' ? LAVA_FRAG : WATER_FRAG;

  const uniforms = {
    uTime: { value: 0 },
    uIntensity: { value: opts.intensity ?? 1.0 },
    uOpacity: { value: opts.opacity ?? (normalized === 'lava' ? 1.0 : 0.94) },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: WATER_MIRE_VERT,
    fragmentShader,
    uniforms,
    transparent: normalized !== 'lava' || (opts.opacity !== undefined && opts.opacity < 1.0),
    depthWrite: opts.depthWrite ?? normalized === 'lava',
    side: opts.side ?? THREE.DoubleSide,
  });

  material.userData = {
    mode: normalized,
    update(t) {
      uniforms.uTime.value = t;
    },
    setIntensity(v) {
      uniforms.uIntensity.value = v;
    },
  };

  return material;
}
