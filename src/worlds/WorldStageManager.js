import * as THREE from 'three';
import { MountainSanctuary } from './MountainSanctuary.js';
import { MistMireCanyon } from './MistMireCanyon.js';
import { CrystalPalace } from './CrystalPalace.js';
import { AlchemyCorePeak } from './AlchemyCorePeak.js';

export const MOOD_PRESETS = {
  sanctuary_dawn: {
    zenith: 0x2f6b82,
    mid: 0x7db3a8,
    horizon: 0xf4dfba,
    sunColor: 0xffe4a8,
    sunGlow: 0.95,
    sunDir: [0.35, 0.42, -0.84],
    cloudTint: 0xfff5e0,
    fogColor: 0xd9dec9,
    fogDensity: 0.0115,
    hemiSky: 0xdff2e8,
    hemiGround: 0x6e5f45,
    hemiIntensity: 0.85,
    keyColor: 0xfff0cf,
    keyIntensity: 2.1,
    keyOffset: [12, 19, 14],
    rimColor: 0x7de0cc,
    rimIntensity: 0.72,
    moodColor: 0xffd27d,
    moodIntensity: 0.9,
  },
  seal_storm: {
    zenith: 0x120b24,
    mid: 0x2f1c4d,
    horizon: 0x593469,
    sunColor: 0xba5cff,
    sunGlow: 0.52,
    sunDir: [0.42, 0.28, -0.86],
    cloudTint: 0x6f4b87,
    fogColor: 0x2a1b3d,
    fogDensity: 0.0175,
    hemiSky: 0x6e5299,
    hemiGround: 0x1d1629,
    hemiIntensity: 0.62,
    keyColor: 0xc2b5ff,
    keyIntensity: 1.45,
    keyOffset: [10, 17, 12],
    rimColor: 0xc64dff,
    rimIntensity: 1.15,
    moodColor: 0x9b30ff,
    moodIntensity: 2.2,
  },
  mire_miasma: {
    zenith: 0x1d2d36,
    mid: 0x3b5257,
    horizon: 0x73857c,
    sunColor: 0xbdd1a9,
    sunGlow: 0.45,
    sunDir: [-0.28, 0.36, -0.89],
    cloudTint: 0x8da199,
    fogColor: 0x455658,
    fogDensity: 0.0205,
    hemiSky: 0x8fa8a4,
    hemiGround: 0x2b2433,
    hemiIntensity: 0.68,
    keyColor: 0xd1dfd4,
    keyIntensity: 1.5,
    keyOffset: [-9, 18, 13],
    rimColor: 0x9268c7,
    rimIntensity: 0.88,
    moodColor: 0x7f58b8,
    moodIntensity: 1.7,
  },
  dream_crimson: {
    zenith: 0x1c0518,
    mid: 0x590d38,
    horizon: 0xa62658,
    sunColor: 0xff6b9d,
    sunGlow: 0.88,
    sunDir: [0.22, 0.3, -0.92],
    cloudTint: 0xd94c82,
    fogColor: 0x4d102c,
    fogDensity: 0.019,
    hemiSky: 0xd45b8f,
    hemiGround: 0x26081a,
    hemiIntensity: 0.65,
    keyColor: 0xffa8c8,
    keyIntensity: 1.55,
    keyOffset: [8, 16, 13],
    rimColor: 0xff3b7f,
    rimIntensity: 1.35,
    moodColor: 0xff2e7a,
    moodIntensity: 2.8,
  },
  palace_amethyst: {
    zenith: 0x140a29,
    mid: 0x2f1857,
    horizon: 0x5a3085,
    sunColor: 0xd88cff,
    sunGlow: 0.65,
    sunDir: [0.05, 0.45, -0.89],
    cloudTint: 0x8d5bc2,
    fogColor: 0x180e2e,
    fogDensity: 0.0125,
    hemiSky: 0x9c72d9,
    hemiGround: 0x1e1330,
    hemiIntensity: 0.75,
    keyColor: 0xe6d4ff,
    keyIntensity: 1.48,
    keyOffset: [6, 18, 15],
    rimColor: 0x5be3ff,
    rimIntensity: 1.05,
    moodColor: 0xc25cff,
    moodIntensity: 2.2,
  },
  alchemy_inferno: {
    zenith: 0x170608,
    mid: 0x54110c,
    horizon: 0xb83812,
    sunColor: 0xff8524,
    sunGlow: 0.85,
    sunDir: [0.0, 0.25, -0.96],
    cloudTint: 0xd95626,
    fogColor: 0x42110b,
    fogDensity: 0.017,
    hemiSky: 0xff8a4d,
    hemiGround: 0x4f0e06,
    hemiIntensity: 0.72,
    keyColor: 0xffc07a,
    keyIntensity: 1.85,
    keyOffset: [8, 16, 14],
    rimColor: 0xff5912,
    rimIntensity: 1.45,
    moodColor: 0xff621a,
    moodIntensity: 3.1,
  },
  apotheosis_gold: {
    zenith: 0x21588f,
    mid: 0x6ba6bf,
    horizon: 0xf7d98c,
    sunColor: 0xfff2b2,
    sunGlow: 0.48,
    sunDir: [0.0, 0.34, -0.94],
    cloudTint: 0xffebb0,
    fogColor: 0xead096,
    fogDensity: 0.0085,
    hemiSky: 0xfff3cc,
    hemiGround: 0x9c7838,
    hemiIntensity: 0.78,
    keyColor: 0xfff5d6,
    keyIntensity: 1.52,
    keyOffset: [4, 21, 15],
    rimColor: 0xffcf54,
    rimIntensity: 0.58,
    moodColor: 0xffd55c,
    moodIntensity: 0.85,
  },
};

const SKYDOME_VERT = /* glsl */ `
  varying vec3 vLocalDir;
  void main() {
    vLocalDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SKYDOME_FRAG = /* glsl */ `
  uniform float uTime;
  uniform vec3 uZenithColor;
  uniform vec3 uMidColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uSunGlow;
  uniform vec3 uCloudTint;

  varying vec3 vLocalDir;

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.5);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
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
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(1.7, 9.2);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vLocalDir);
    float h = clamp(dir.y, -0.2, 1.0);

    // 3-stop mineral-pigment sky wash
    vec3 col = mix(uHorizonColor, uMidColor, smoothstep(-0.04, 0.28, h));
    col = mix(col, uZenithColor, smoothstep(0.24, 0.82, h));

    // Soft ink-wash cloud strata drifting across upper sky
    vec2 skyUv = dir.xz / (max(dir.y, 0.08) + 0.35);
    float cloudBand = fbm(skyUv * 1.45 + vec2(uTime * 0.018, -uTime * 0.008));
    float cloudMask = smoothstep(0.46, 0.78, cloudBand) * smoothstep(0.0, 0.22, h) * (1.0 - smoothstep(0.58, 0.92, h));
    col = mix(col, uCloudTint, cloudMask * 0.34);

    // Celestial sun / moon / spirit halo
    float sunDot = max(dot(dir, normalize(uSunDir)), 0.0);
    float disc = smoothstep(0.992, 0.9985, sunDot);
    float halo = pow(sunDot, 10.0) * 0.42 + pow(sunDot, 48.0) * 0.65;
    col += uSunColor * (disc * 0.95 + halo) * uSunGlow;

    // Subtle Xuan-paper fiber luminance texture
    vec2 paperUv = vec2(atan(dir.x, -dir.z) * 18.0, dir.y * 36.0);
    float paperGrain = (noise(paperUv * 3.5) - 0.5) * 0.045 + (noise(paperUv * vec2(12.0, 2.0)) - 0.5) * 0.025;
    col += paperGrain;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export class WorldStageManager {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.group = new THREE.Group();
    this.group.name = 'WorldStageRoot';

    // Instantiate all 4 worlds along X axis (0, 65, 130, 195)
    this.mountain = new MountainSanctuary(assets, new THREE.Vector3(0, 0, 0));
    this.canyon = new MistMireCanyon(assets, new THREE.Vector3(65, 0, 0));
    this.palace = new CrystalPalace(assets, new THREE.Vector3(130, 0, 0));
    this.alchemy = new AlchemyCorePeak(assets, new THREE.Vector3(195, 0, 0));

    this.group.add(this.mountain.group);
    this.group.add(this.canyon.group);
    this.group.add(this.palace.group);
    this.group.add(this.alchemy.group);

    this._lastT = null;
    this._currentMoodName = 'sanctuary_dawn';
    this._targetKeyOffset = new THREE.Vector3(12, 19, 14);
    this._currentKeyOffset = new THREE.Vector3(12, 19, 14);
    this._targetSunDir = new THREE.Vector3(0.35, 0.42, -0.84);
    this._tmpColor = new THREE.Color();

    this._buildSkyDome();
    this._buildLightsAndFog();

    if (this.scene) {
      this.scene.add(this.group);
    }

    this.setMood('sanctuary_dawn', true);
  }

  _buildSkyDome() {
    this._skyUniforms = {
      uTime: { value: 0 },
      uZenithColor: { value: new THREE.Color(MOOD_PRESETS.sanctuary_dawn.zenith) },
      uMidColor: { value: new THREE.Color(MOOD_PRESETS.sanctuary_dawn.mid) },
      uHorizonColor: { value: new THREE.Color(MOOD_PRESETS.sanctuary_dawn.horizon) },
      uSunDir: { value: new THREE.Vector3(...MOOD_PRESETS.sanctuary_dawn.sunDir).normalize() },
      uSunColor: { value: new THREE.Color(MOOD_PRESETS.sanctuary_dawn.sunColor) },
      uSunGlow: { value: MOOD_PRESETS.sanctuary_dawn.sunGlow },
      uCloudTint: { value: new THREE.Color(MOOD_PRESETS.sanctuary_dawn.cloudTint) },
    };

    const skyMat = new THREE.ShaderMaterial({
      vertexShader: SKYDOME_VERT,
      fragmentShader: SKYDOME_FRAG,
      uniforms: this._skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });

    this.skyDome = new THREE.Mesh(new THREE.SphereGeometry(145, 32, 24), skyMat);
    this.skyDome.name = 'XuanPaperSkyDome';
    this.skyDome.renderOrder = -10;
    this.group.add(this.skyDome);
  }

  _buildLightsAndFog() {
    // Atmospheric exponential depth fog
    this.fog = new THREE.FogExp2(MOOD_PRESETS.sanctuary_dawn.fogColor, MOOD_PRESETS.sanctuary_dawn.fogDensity);
    if (this.scene) {
      this.scene.fog = this.fog;
    }

    // Hemisphere ambient fill
    this.hemiLight = new THREE.HemisphereLight(
      MOOD_PRESETS.sanctuary_dawn.hemiSky,
      MOOD_PRESETS.sanctuary_dawn.hemiGround,
      MOOD_PRESETS.sanctuary_dawn.hemiIntensity
    );
    this.group.add(this.hemiLight);

    // Shadow-casting key directional light (tracks cameraTargetX for sharp shadows in every world)
    this.keyLight = new THREE.DirectionalLight(
      MOOD_PRESETS.sanctuary_dawn.keyColor,
      MOOD_PRESETS.sanctuary_dawn.keyIntensity
    );
    this.keyLight.position.set(12, 19, 14);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 68;
    this.keyLight.shadow.camera.left = -24;
    this.keyLight.shadow.camera.right = 24;
    this.keyLight.shadow.camera.top = 18;
    this.keyLight.shadow.camera.bottom = -14;
    this.keyLight.shadow.bias = -0.0005;
    this.keyLight.shadow.normalBias = 0.025;

    this.keyLight.target.position.set(0, 0, 0);
    this.group.add(this.keyLight);
    this.group.add(this.keyLight.target);

    // Back-edge mineral silhouette rim light
    this.rimLight = new THREE.DirectionalLight(
      MOOD_PRESETS.sanctuary_dawn.rimColor,
      MOOD_PRESETS.sanctuary_dawn.rimIntensity
    );
    this.rimLight.position.set(-10, 12, -16);
    this.rimLight.target.position.set(0, 1.5, 0);
    this.group.add(this.rimLight);
    this.group.add(this.rimLight.target);

    // Dynamic roving atmospheric mood point light
    this.moodLight = new THREE.PointLight(
      MOOD_PRESETS.sanctuary_dawn.moodColor,
      MOOD_PRESETS.sanctuary_dawn.moodIntensity,
      28,
      1.5
    );
    this.moodLight.position.set(0, 6.2, 4.5);
    this.group.add(this.moodLight);
  }

  getWorldCenter(index) {
    const worlds = [this.mountain, this.canyon, this.palace, this.alchemy];
    return worlds[index]?.center ?? this.mountain.center;
  }

  setMood(moodPreset = 'sanctuary_dawn', instant = false) {
    const preset = MOOD_PRESETS[moodPreset] ?? MOOD_PRESETS.sanctuary_dawn;
    this._currentMoodName = MOOD_PRESETS[moodPreset] ? moodPreset : 'sanctuary_dawn';
    if (!instant) return;

    this._skyUniforms.uZenithColor.value.setHex(preset.zenith);
    this._skyUniforms.uMidColor.value.setHex(preset.mid);
    this._skyUniforms.uHorizonColor.value.setHex(preset.horizon);
    this._skyUniforms.uSunColor.value.setHex(preset.sunColor);
    this._skyUniforms.uSunGlow.value = preset.sunGlow;
    this._skyUniforms.uSunDir.value.set(...preset.sunDir).normalize();
    this._skyUniforms.uCloudTint.value.setHex(preset.cloudTint);

    this.fog.color.setHex(preset.fogColor);
    this.fog.density = preset.fogDensity;

    this.hemiLight.color.setHex(preset.hemiSky);
    this.hemiLight.groundColor.setHex(preset.hemiGround);
    this.hemiLight.intensity = preset.hemiIntensity;

    this.keyLight.color.setHex(preset.keyColor);
    this.keyLight.intensity = preset.keyIntensity;
    this._currentKeyOffset.set(...preset.keyOffset);

    this.rimLight.color.setHex(preset.rimColor);
    this.rimLight.intensity = preset.rimIntensity;

    this.moodLight.color.setHex(preset.moodColor);
    this.moodLight.intensity = preset.moodIntensity;
  }

  update(t = 0, moodPreset = this._currentMoodName, cameraTargetX = 0) {
    const preset = MOOD_PRESETS[moodPreset] ?? MOOD_PRESETS.sanctuary_dawn;
    this._currentMoodName = MOOD_PRESETS[moodPreset] ? moodPreset : this._currentMoodName;

    // Detect timeline scrubbing / first frame to snap mood immediately without sluggish crossfade
    const rawDt = this._lastT === null ? 99 : Math.abs(t - this._lastT);
    this._lastT = t;
    const isScrubJump = rawDt > 1.5;
    const dt = Math.min(0.1, Math.max(0.001, rawDt));
    const alpha = isScrubJump ? 1.0 : 1.0 - Math.exp(-dt * 3.2);

    // Smoothly interpolate SkyDome uniforms
    this._skyUniforms.uTime.value = t;
    this._skyUniforms.uZenithColor.value.lerp(this._tmpColor.setHex(preset.zenith), alpha);
    this._skyUniforms.uMidColor.value.lerp(this._tmpColor.setHex(preset.mid), alpha);
    this._skyUniforms.uHorizonColor.value.lerp(this._tmpColor.setHex(preset.horizon), alpha);
    this._skyUniforms.uSunColor.value.lerp(this._tmpColor.setHex(preset.sunColor), alpha);
    this._skyUniforms.uCloudTint.value.lerp(this._tmpColor.setHex(preset.cloudTint), alpha);
    this._skyUniforms.uSunGlow.value += (preset.sunGlow - this._skyUniforms.uSunGlow.value) * alpha;
    this._targetSunDir.set(...preset.sunDir).normalize();
    this._skyUniforms.uSunDir.value.lerp(this._targetSunDir, alpha).normalize();

    // Smoothly interpolate FogExp2
    this.fog.color.lerp(this._tmpColor.setHex(preset.fogColor), alpha);
    this.fog.density += (preset.fogDensity - this.fog.density) * alpha;

    // Smoothly interpolate Lighting Rig
    this.hemiLight.color.lerp(this._tmpColor.setHex(preset.hemiSky), alpha);
    this.hemiLight.groundColor.lerp(this._tmpColor.setHex(preset.hemiGround), alpha);
    this.hemiLight.intensity += (preset.hemiIntensity - this.hemiLight.intensity) * alpha;

    this.keyLight.color.lerp(this._tmpColor.setHex(preset.keyColor), alpha);
    this.keyLight.intensity += (preset.keyIntensity - this.keyLight.intensity) * alpha;
    this._targetKeyOffset.set(...preset.keyOffset);
    this._currentKeyOffset.lerp(this._targetKeyOffset, alpha);

    this.rimLight.color.lerp(this._tmpColor.setHex(preset.rimColor), alpha);
    this.rimLight.intensity += (preset.rimIntensity - this.rimLight.intensity) * alpha;

    this.moodLight.color.lerp(this._tmpColor.setHex(preset.moodColor), alpha);
    this.moodLight.intensity += (preset.moodIntensity - this.moodLight.intensity) * alpha;

    // Track SkyDome & directional shadow frustum smoothly to cameraTargetX
    const tx = Number.isFinite(cameraTargetX) ? cameraTargetX : 0;
    this.skyDome.position.set(tx, 0, 0);

    this.keyLight.target.position.set(tx, 0, 0);
    this.keyLight.position.set(
      tx + this._currentKeyOffset.x,
      this._currentKeyOffset.y,
      this._currentKeyOffset.z
    );
    this.keyLight.target.updateMatrixWorld();

    this.rimLight.target.position.set(tx, 1.5, 0);
    this.rimLight.position.set(tx - 10, 12, -16);
    this.rimLight.target.updateMatrixWorld();

    this.moodLight.position.set(
      tx + Math.sin(t * 0.7) * 3.2,
      6.0 + Math.cos(t * 0.9) * 0.8,
      4.5 + Math.sin(t * 0.5) * 1.2
    );

    // Animate all 4 diorama worlds
    this.mountain.update(t, dt);
    this.canyon.update(t, dt);
    this.palace.update(t, dt);
    this.alchemy.update(t, dt);
  }
}

export default WorldStageManager;
