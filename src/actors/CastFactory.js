import * as THREE from 'three';
import { PuppetActor } from './PuppetActor.js';

const CAST_SPECS = [
  // Seven Calabash Brothers + Xiaojingang
  { id: 'dawa',        tex: 'hero1',          w: 2.15, h: 2.15, aura: 0xe6392e, auraOpacity: 0.40 },
  { id: 'erwa',        tex: 'hero2',          w: 2.08, h: 2.08, aura: 0xff8c1a, auraOpacity: 0.40 },
  { id: 'sanwa',       tex: 'hero3',          w: 2.12, h: 2.12, aura: 0xffd633, auraOpacity: 0.42 },
  { id: 'siwa',        tex: 'hero4',          w: 2.10, h: 2.10, aura: 0x2ecc71, auraOpacity: 0.40 },
  { id: 'wuwa',        tex: 'hero5',          w: 2.10, h: 2.10, aura: 0x25c4d9, auraOpacity: 0.40 },
  { id: 'liuwa',       tex: 'hero6',          stealthTex: 'hero6_stealth', w: 2.08, h: 2.08, aura: 0x3b7cff, auraOpacity: 0.40 },
  { id: 'qiwa',        tex: 'hero7',          w: 2.05, h: 2.05, aura: 0xa349e6, auraOpacity: 0.42 },
  { id: 'xiaojingang', tex: 'hero8_king',     w: 3.60, h: 3.60, aura: 0xffe066, auraOpacity: 0.58 },

  // Allies
  { id: 'grandpa',     tex: 'grandpa',        w: 2.80, h: 2.80, aura: 0xf5d996, auraOpacity: 0.30 },
  { id: 'pangolin',    tex: 'pangolin',       w: 1.85, h: 1.65, aura: 0xd49a57, auraOpacity: 0.28 },

  // Demon Bosses
  { id: 'centipede',   tex: 'boss_centipede', w: 3.30, h: 3.30, aura: 0x9c3b2e, auraOpacity: 0.36 },
  { id: 'scorpion',    tex: 'boss_scorpion',  w: 3.85, h: 3.85, aura: 0x7a2ea6, auraOpacity: 0.42 },
  { id: 'snake',       tex: 'boss_snake',     w: 3.55, h: 3.55, aura: 0x45e08a, auraOpacity: 0.44 },

  // Demon Minions (pairs)
  { id: 'toad',        tex: 'enemy_toad',     w: 2.05, h: 2.05, aura: 0x5d8a3e, auraOpacity: 0.24 },
  { id: 'toad2',       tex: 'enemy_toad',     w: 2.00, h: 2.00, aura: 0x5d8a3e, auraOpacity: 0.24 },
  { id: 'bat',         tex: 'enemy_bat',      w: 2.30, h: 2.15, aura: 0x6c4a9c, auraOpacity: 0.28 },
  { id: 'bat2',        tex: 'enemy_bat',      w: 2.25, h: 2.10, aura: 0x6c4a9c, auraOpacity: 0.28 },
  { id: 'wasp',        tex: 'enemy_wasp',     w: 2.20, h: 2.10, aura: 0xd9a926, auraOpacity: 0.28 },
  { id: 'wasp2',       tex: 'enemy_wasp',     w: 2.15, h: 2.05, aura: 0xd9a926, auraOpacity: 0.28 },
  { id: 'boar',        tex: 'enemy_boar',     w: 2.55, h: 2.40, aura: 0x8f563b, auraOpacity: 0.24 },
  { id: 'boar2',       tex: 'enemy_boar',     w: 2.50, h: 2.35, aura: 0x8f563b, auraOpacity: 0.24 },
];

export function createFullCast(scene, assets) {
  const root = new THREE.Group();
  root.name = 'CastRoot';
  if (scene) scene.add(root);

  const glowTexture = assets?.getTexture?.('proc_soft_glow') ?? null;
  const actors = {};

  CAST_SPECS.forEach((spec, idx) => {
    const actor = new PuppetActor({
      name: spec.id,
      texture: assets?.getTexture?.(spec.tex) ?? null,
      stealthTexture: spec.stealthTex ? assets?.getTexture?.(spec.stealthTex) ?? null : null,
      glowTexture,
      width: spec.w,
      height: spec.h,
      auraColor: spec.aura,
      auraOpacity: spec.auraOpacity,
      phaseOffset: idx * 0.83,
    });
    actors[spec.id] = actor;
    root.add(actor.group);
  });

  const actorList = Object.values(actors);

  function resetAll() {
    for (let i = 0; i < actorList.length; i++) {
      actorList[i].resetState();
    }
  }

  function updateAll(t) {
    for (let i = 0; i < actorList.length; i++) {
      actorList[i].update(t);
    }
  }

  return {
    root,
    actors,
    resetAll,
    updateAll,
  };
}
