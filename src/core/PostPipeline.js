import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const XuanPaperCinemaShader = {
  name: 'XuanPaperCinemaShader',
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uWarmth: { value: 0.14 },
    uVignette: { value: 0.34 },
    uSaturation: { value: 1.08 },
    uFlash: { value: 0.0 },
    uGrain: { value: 0.035 },
    uResolution: { value: new THREE.Vector2(1280, 720) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uWarmth;
    uniform float uVignette;
    uniform float uSaturation;
    uniform float uFlash;
    uniform float uGrain;
    uniform vec2 uResolution;
    varying vec2 vUv;

    float hash12(vec2 p) {
      vec3 p3 = fract(vec3(p.xyx) * 0.1031);
      p3 += dot(p3, p3.yzx + 33.33);
      return fract((p3.x + p3.y) * p3.z);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
        mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 col = texel.rgb;

      // 1. Warm 1986 Shanghai Animation Studio color grading
      float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 warmLift = vec3(1.0 + uWarmth * 0.24, 1.0 + uWarmth * 0.08, 1.0 - uWarmth * 0.22);
      vec3 shadowTint = vec3(0.95, 0.98, 1.04);
      col *= mix(shadowTint, warmLift, smoothstep(0.05, 0.75, luma));

      // Gentle filmic shoulder contrast preservation
      col = mix(col, col * col * (3.0 - 2.0 * clamp(col, 0.0, 1.0)), 0.08);

      // 2. Saturation adjustment
      float newLuma = dot(col, vec3(0.2126, 0.7152, 0.0722));
      col = mix(vec3(newLuma), col, uSaturation);

      // 3. Subtle Xuan-paper fiber texture + gentle analog film grain (default 0.035)
      vec2 aspectUv = vUv * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
      float fiberA = valueNoise(aspectUv * vec2(220.0, 48.0));
      float fiberB = valueNoise(aspectUv * vec2(52.0, 210.0) + 17.3);
      float pulp = valueNoise(aspectUv * 95.0 + 4.1);
      float paperGrain = ((fiberA * 0.4 + fiberB * 0.35 + pulp * 0.25) - 0.5) * 2.0;

      // Subtle animated cel-film shimmer at 12fps cadence
      float frameStep = floor(uTime * 12.0);
      float filmGrain = (hash12(vUv * uResolution + frameStep * 19.37) - 0.5) * 2.0;

      float combinedGrain = paperGrain * 0.72 + filmGrain * 0.28;
      col += vec3(1.0, 0.97, 0.91) * combinedGrain * uGrain;

      // 4. Soft sumi-ink vignette
      vec2 vigPos = (vUv - 0.5) * 2.0;
      float vigDist = dot(vigPos, vigPos);
      float vigMask = smoothstep(0.35, 1.85, vigDist);
      vec3 inkTint = vec3(0.07, 0.06, 0.08);
      col = mix(col, col * 0.28 + inkTint * 0.12, clamp(vigMask * uVignette, 0.0, 0.92));

      // 5. Dramatic golden-white flash overlay (thunder / cauldron blast / seal peak)
      if (uFlash > 0.001) {
        vec3 flashColor = vec3(1.05, 0.97, 0.84);
        col = mix(col, flashColor, clamp(uFlash, 0.0, 1.0));
      }

      gl_FragColor = vec4(max(col, vec3(0.0)), texel.a);
    }
  `,
};

export class PostPipeline {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    const size = new THREE.Vector2();
    renderer.getSize(size);
    const width = Math.max(1, size.x || window.innerWidth || 1280);
    const height = Math.max(1, size.y || window.innerHeight || 720);

    this.composer = new EffectComposer(renderer);
    this.composer.setPixelRatio(Math.min(renderer.getPixelRatio() || window.devicePixelRatio || 1, 2));
    this.composer.setSize(width, height);

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    // UnrealBloomPass(resolution, strength, radius, threshold)
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.48, 0.42, 0.76);
    this.composer.addPass(this.bloomPass);

    this.cinemaPass = new ShaderPass(XuanPaperCinemaShader);
    this.cinemaPass.uniforms.uResolution.value.set(width, height);
    this.composer.addPass(this.cinemaPass);

    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }

  setSize(w, h) {
    const width = Math.max(1, Math.floor(w));
    const height = Math.max(1, Math.floor(h));
    this.composer.setPixelRatio(Math.min(this.renderer.getPixelRatio() || window.devicePixelRatio || 1, 2));
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
    this.cinemaPass.uniforms.uResolution.value.set(width, height);
  }

  setBloom(strength, threshold, radius) {
    if (typeof strength === 'number') this.bloomPass.strength = strength;
    if (typeof threshold === 'number') this.bloomPass.threshold = threshold;
    if (typeof radius === 'number') this.bloomPass.radius = radius;
  }

  setCinemaMood({ warmth, vignette, saturation, flash, grain } = {}) {
    const u = this.cinemaPass.uniforms;
    if (typeof warmth === 'number') u.uWarmth.value = warmth;
    if (typeof vignette === 'number') u.uVignette.value = vignette;
    if (typeof saturation === 'number') u.uSaturation.value = saturation;
    if (typeof flash === 'number') u.uFlash.value = flash;
    if (typeof grain === 'number') u.uGrain.value = grain;
  }

  render(t = 0) {
    this.cinemaPass.uniforms.uTime.value = t;
    this.composer.render();
  }

  dispose() {
    this.bloomPass?.dispose?.();
    this.cinemaPass?.dispose?.();
    this.outputPass?.dispose?.();
    this.composer?.dispose?.();
  }
}
