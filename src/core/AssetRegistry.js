import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const MODEL_3D_PATHS = {
  // Heroes & Allies
  hero1: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_01_大娃_红娃.glb',
  hero2: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_02_二娃_橙娃.glb',
  hero3: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_03_三娃_黄娃.glb',
  hero4: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_04_四娃_绿娃.glb',
  hero5: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_05_五娃_青娃.glb',
  hero6: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_06_六娃_蓝娃.glb',
  hero6_stealth: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_06b_六娃_隐身态.glb',
  hero7: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_07_七娃_紫娃.glb',
  hero8_king: './assets/Models_3D/Characters/01_Heroes_Allies/Hero_08_葫芦小金刚.glb',
  grandpa: './assets/Models_3D/Characters/01_Heroes_Allies/NPC_01_爷爷.glb',
  pangolin: './assets/Models_3D/Characters/01_Heroes_Allies/NPC_02_穿山甲.glb',

  // Enemies & Bosses
  boss_centipede: './assets/Models_3D/Characters/02_Enemies_Bosses/Boss_01_蜈蚣精.glb',
  boss_scorpion: './assets/Models_3D/Characters/02_Enemies_Bosses/Boss_02_蝎子精.glb',
  boss_snake: './assets/Models_3D/Characters/02_Enemies_Bosses/Boss_03_金蛇精.glb',
  enemy_toad: './assets/Models_3D/Characters/02_Enemies_Bosses/Enemy_01_蛤蟆精.glb',
  enemy_bat: './assets/Models_3D/Characters/02_Enemies_Bosses/Enemy_02_蝙蝠精.glb',
  enemy_wasp: './assets/Models_3D/Characters/02_Enemies_Bosses/Enemy_03_黄蜂精.glb',
  enemy_boar: './assets/Models_3D/Characters/02_Enemies_Bosses/Enemy_04_野猪精.glb',

  // Props & Treasures
  prop_vine: './assets/Models_3D/Props/Prop_01_七色葫芦仙藤.glb',
  prop_cauldron: './assets/Models_3D/Props/Prop_02_三足青铜炼丹炉.glb',
  prop_lotus: './assets/Models_3D/Props/Prop_03_幽谷七色彩莲.glb',
  prop_mirror: './assets/Models_3D/Props/Prop_04_水晶魔镜.glb',
  prop_sword: './assets/Models_3D/Props/Prop_05_刚柔阴阳剑.glb',
  prop_peach: './assets/Models_3D/Props/Prop_06_回血蟠桃.glb',

  // Stage Obstacles
  stage_rock: './assets/Models_3D/Stages/Stage_01_青绿剪纸奇石.glb',
  stage_pillar: './assets/Models_3D/Stages/Stage_02_妖洞钟乳石柱.glb',
  stage_mire: './assets/Models_3D/Stages/Stage_03_迷魂泥潭陷阱.glb',
  stage_web_grandpa: './assets/Models_3D/Stages/Stage_04_困爷爷蛛网石柱.glb',
  stage_door_closed: './assets/Models_3D/Stages/Stage_05_妖洞通关石门_闭.glb',
  stage_door_open: './assets/Models_3D/Stages/Stage_05b_妖洞通关石门_开.glb',

  // Spirit Orbs
  orb1: './assets/Models_3D/Orbs/Orb_01_赤红灵珠.glb',
  orb2: './assets/Models_3D/Orbs/Orb_02_橘橙灵珠.glb',
  orb3: './assets/Models_3D/Orbs/Orb_03_明黄灵珠.glb',
  orb4: './assets/Models_3D/Orbs/Orb_04_翠绿灵珠.glb',
  orb5: './assets/Models_3D/Orbs/Orb_05_青蓝灵珠.glb',
  orb6: './assets/Models_3D/Orbs/Orb_06_靛蓝灵珠.glb',
  orb7: './assets/Models_3D/Orbs/Orb_07_紫红灵珠.glb',

  // Volumetric 3D VFX
  vfx1: './assets/Models_3D/VFX/VFX_01_大娃_裂地云雷震波.glb',
  vfx2: './assets/Models_3D/VFX/VFX_02_二娃_千里眼暴击神光印.glb',
  vfx3: './assets/Models_3D/VFX/VFX_03_三娃_铜头铁臂金钟护盾.glb',
  vfx4: './assets/Models_3D/VFX/VFX_04_四娃_剪纸烈火舌喷射.glb',
  vfx5: './assets/Models_3D/VFX/VFX_05_五娃_剪纸卷浪水柱.glb',
  vfx6: './assets/Models_3D/VFX/VFX_06_七娃_宝葫芦紫金旋涡.glb',
  vfx7: './assets/Models_3D/VFX/VFX_07_金蛇精_金如意冰凌寒风.glb',
  vfx8: './assets/Models_3D/VFX/VFX_08_金蛇精_刚柔阴阳剑柔丝网.glb',

  // 3D Terrain Tiles
  map_mountain: './assets/Models_3D/Maps/MapBG_01_葫芦山脚宣纸底.glb',
  map_cave: './assets/Models_3D/Maps/MapBG_02_妖洞前殿岩彩底.glb',
  map_palace: './assets/Models_3D/Maps/MapBG_03_水晶内殿暗紫底.glb',
};

export const ASSET_PATHS = {
  // Heroes & Allies
  hero1: './assets/Sprites_Characters/01_Heroes_Allies/Hero_01_大娃_红娃.png',
  hero2: './assets/Sprites_Characters/01_Heroes_Allies/Hero_02_二娃_橙娃.png',
  hero3: './assets/Sprites_Characters/01_Heroes_Allies/Hero_03_三娃_黄娃.png',
  hero4: './assets/Sprites_Characters/01_Heroes_Allies/Hero_04_四娃_绿娃.png',
  hero5: './assets/Sprites_Characters/01_Heroes_Allies/Hero_05_五娃_青娃.png',
  hero6: './assets/Sprites_Characters/01_Heroes_Allies/Hero_06_六娃_蓝娃.png',
  hero6_stealth: './assets/Sprites_Characters/01_Heroes_Allies/Hero_06b_六娃_隐身态.png',
  hero7: './assets/Sprites_Characters/01_Heroes_Allies/Hero_07_七娃_紫娃.png',
  hero8_king: './assets/Sprites_Characters/01_Heroes_Allies/Hero_08_葫芦小金刚.png',
  grandpa: './assets/Sprites_Characters/01_Heroes_Allies/NPC_01_爷爷.png',
  pangolin: './assets/Sprites_Characters/01_Heroes_Allies/NPC_02_穿山甲.png',

  // Enemies & Bosses
  boss_centipede: './assets/Sprites_Characters/02_Enemies_Bosses/Boss_01_蜈蚣精.png',
  boss_scorpion: './assets/Sprites_Characters/02_Enemies_Bosses/Boss_02_蝎子精.png',
  boss_snake: './assets/Sprites_Characters/02_Enemies_Bosses/Boss_03_金蛇精.png',
  enemy_toad: './assets/Sprites_Characters/02_Enemies_Bosses/Enemy_01_蛤蟆精.png',
  enemy_bat: './assets/Sprites_Characters/02_Enemies_Bosses/Enemy_02_蝙蝠精.png',
  enemy_wasp: './assets/Sprites_Characters/02_Enemies_Bosses/Enemy_03_黄蜂精.png',
  enemy_boar: './assets/Sprites_Characters/02_Enemies_Bosses/Enemy_04_野猪精.png',

  // Map Ground Textures (Clean De-Papered Seamless PBR Albedo & Normal)
  map_mountain: './assets/Models_3D/Maps/MapBG_01_clean.png',
  map_cave: './assets/Models_3D/Maps/MapBG_02_clean.png',
  map_palace: './assets/Models_3D/Maps/MapBG_03_clean.png',
  map_mountain_normal: './assets/Models_3D/Maps/MapBG_01_normal.png',
  map_cave_normal: './assets/Models_3D/Maps/MapBG_02_normal.png',
  map_palace_normal: './assets/Models_3D/Maps/MapBG_03_normal.png',

  // Props & Treasures
  prop_vine: './assets/Sprites_Props_Env/01_Props_Treasures/Prop_01_七色葫芦仙藤.png',
  prop_cauldron: './assets/Sprites_Props_Env/01_Props_Treasures/Prop_02_三足青铜炼丹炉.png',
  prop_lotus: './assets/Sprites_Props_Env/01_Props_Treasures/Prop_03_幽谷七色彩莲.png',
  prop_mirror: './assets/Sprites_Props_Env/01_Props_Treasures/Prop_04_水晶魔镜.png',
  prop_sword: './assets/Sprites_Props_Env/01_Props_Treasures/Prop_05_刚柔阴阳剑.png',
  prop_peach: './assets/Sprites_Props_Env/01_Props_Treasures/Prop_06_回血蟠桃.png',

  // Stage Obstacles
  stage_rock: './assets/Sprites_Props_Env/02_Stage_Obstacles/Stage_01_青绿剪纸奇石.png',
  stage_pillar: './assets/Sprites_Props_Env/02_Stage_Obstacles/Stage_02_妖洞钟乳石柱.png',
  stage_mire: './assets/Sprites_Props_Env/02_Stage_Obstacles/Stage_03_迷魂泥潭陷阱.png',
  stage_web_grandpa: './assets/Sprites_Props_Env/02_Stage_Obstacles/Stage_04_困爷爷蛛网石柱.png',
  stage_door_closed: './assets/Sprites_Props_Env/02_Stage_Obstacles/Stage_05_妖洞通关石门_闭.png',
  stage_door_open: './assets/Sprites_Props_Env/02_Stage_Obstacles/Stage_05b_妖洞通关石门_开.png',

  // Spirit Orbs
  orb1: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_01_赤红灵珠.png',
  orb2: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_02_橘橙灵珠.png',
  orb3: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_03_明黄灵珠.png',
  orb4: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_04_翠绿灵珠.png',
  orb5: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_05_青蓝灵珠.png',
  orb6: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_06_靛蓝灵珠.png',
  orb7: './assets/Sprites_Props_Env/03_Drop_Orbs/Orb_07_紫红灵珠.png',

  // VFX Sprites
  vfx1: './assets/Sprites_VFX/VFX_01_大娃_裂地云雷震波.png',
  vfx2: './assets/Sprites_VFX/VFX_02_二娃_千里眼暴击神光印.png',
  vfx3: './assets/Sprites_VFX/VFX_03_三娃_铜头铁臂金钟护盾.png',
  vfx4: './assets/Sprites_VFX/VFX_04_四娃_剪纸烈火舌喷射.png',
  vfx5: './assets/Sprites_VFX/VFX_05_五娃_剪纸卷浪水柱.png',
  vfx6: './assets/Sprites_VFX/VFX_06_七娃_宝葫芦紫金旋涡.png',
  vfx7: './assets/Sprites_VFX/VFX_07_金蛇精_金如意冰凌寒风.png',
  vfx8: './assets/Sprites_VFX/VFX_08_金蛇精_刚柔阴阳剑柔丝网.png',

  // BGM
  bgm1: './assets/Audio_Pure/BGM/BGM_01_主题旋律_葫芦娃国风器乐版.wav',
  bgm2: './assets/Audio_Pure/BGM/BGM_02_第一幕_葫芦山脚青绿奇遇.wav',
  bgm3: './assets/Audio_Pure/BGM/BGM_03_第二幕_十八层妖洞幽冥潜行.wav',
  bgm4: './assets/Audio_Pure/BGM/BGM_04_第三幕与Boss战_蛇蝎急板破阵曲.wav',
  bgm5: './assets/Audio_Pure/BGM/BGM_05_片尾主题曲_升调再现.wav',

  // SFX
  sfx01: './assets/Audio_Pure/SFX/SFX_01_UI_卷轴选牌点击.wav',
  sfx02: './assets/Audio_Pure/SFX/SFX_02_拾取_七色灵气珠.wav',
  sfx03: './assets/Audio_Pure/SFX/SFX_03_拾取_蟠桃回血滋润.wav',
  sfx04: './assets/Audio_Pure/SFX/SFX_04_升级_葫芦金光破壳觉醒.wav',
  sfx05: './assets/Audio_Pure/SFX/SFX_05_通用_角色冲刺闪避.wav',
  sfx06: './assets/Audio_Pure/SFX/SFX_06_通用_拳脚兵刃击中妖怪.wav',
  sfx07: './assets/Audio_Pure/SFX/SFX_07_大娃_千钧巨石震地轰鸣.wav',
  sfx08: './assets/Audio_Pure/SFX/SFX_08_二娃_千里眼弱点锁定神光.wav',
  sfx09: './assets/Audio_Pure/SFX/SFX_09_三娃_铜头铁臂金铁格挡铛声.wav',
  sfx10: './assets/Audio_Pure/SFX/SFX_10_四娃_张口烈火喷射咆哮.wav',
  sfx11: './assets/Audio_Pure/SFX/SFX_11_五娃_高压水柱激流冲击.wav',
  sfx12: './assets/Audio_Pure/SFX/SFX_12_六娃_隐身潜行奇幻电子颤音.wav',
  sfx13: './assets/Audio_Pure/SFX/SFX_13_七娃_宝葫芦旋涡吞噬吸纳.wav',
  sfx14: './assets/Audio_Pure/SFX/SFX_14_金蛇精_金如意冰封寒风呼啸.wav',
  sfx15: './assets/Audio_Pure/SFX/SFX_15_金蛇精_刚柔阴阳剑电光柔网.wav',
  sfx16: './assets/Audio_Pure/SFX/SFX_16_蝎子精_巨钳横扫与毒尾突刺.wav',
  sfx17: './assets/Audio_Pure/SFX/SFX_17_小妖_黄蜂毒针破空攒射.wav',
  sfx18: './assets/Audio_Pure/SFX/SFX_18_通关_打破蛛网救出爷爷锣鼓欢庆.wav',
};

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|svg)$/i;

function createMulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  return canvas;
}

/**
 * Generates a tileable Xuan-paper heightfield used by both grain albedo and normal map.
 */
function buildPaperHeightField(size = 256, seed = 1986) {
  const rand = createMulberry32(seed);
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Warm mid-gray neutral pulp base
  ctx.fillStyle = '#dcdcdc';
  ctx.fillRect(0, 0, size, size);

  // Soft cloudy paper thickness undulations (wrapped for seamless tiling)
  for (let i = 0; i < 95; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 14 + rand() * 34;
    const shade = rand() > 0.5 ? 255 : 175;
    const alpha = 0.04 + rand() * 0.05;
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const cx = x + ox * size;
        const cy = y + oy * size;
        const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
        g.addColorStop(0, `rgba(${shade},${shade},${shade},${alpha})`);
        g.addColorStop(1, `rgba(${shade},${shade},${shade},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Mulberry / Xuan long fibers wrapped seamlessly across borders
  ctx.lineCap = 'round';
  for (let i = 0; i < 420; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 8 + rand() * 26;
    const angle = rand() * Math.PI * 2;
    const bend = (rand() - 0.5) * 10;
    const bright = rand() > 0.35;
    const col = bright ? 250 : 145;
    const alpha = 0.08 + rand() * 0.14;
    ctx.strokeStyle = `rgba(${col},${col},${col},${alpha})`;
    ctx.lineWidth = 0.55 + rand() * 1.1;

    const ex = x + Math.cos(angle) * len;
    const ey = y + Math.sin(angle) * len;
    const mx = (x + ex) * 0.5 - Math.sin(angle) * bend;
    const my = (y + ey) * 0.5 + Math.cos(angle) * bend;

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        ctx.beginPath();
        ctx.moveTo(x + ox * size, y + oy * size);
        ctx.quadraticCurveTo(mx + ox * size, my + oy * size, ex + ox * size, ey + oy * size);
        ctx.stroke();
      }
    }
  }

  // Fine mineral/pulp flecks
  for (let i = 0; i < 700; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const s = 0.7 + rand() * 1.6;
    const v = rand() > 0.5 ? 245 : 155;
    ctx.fillStyle = `rgba(${v},${v},${v},${0.06 + rand() * 0.1})`;
    ctx.fillRect(x, y, s, s);
  }

  return ctx.getImageData(0, 0, size, size);
}

export function generateProceduralPaperTextures(size = 256) {
  const heightImg = buildPaperHeightField(size, 1986);
  const src = heightImg.data;

  // 1. Warm Xuan-paper grain albedo (kept bright 0.90..1.0 so it tints cleanly with mineral colors)
  const grainCanvas = makeCanvas(size, size);
  const grainCtx = grainCanvas.getContext('2d');
  const grainImg = grainCtx.createImageData(size, size);
  const gData = grainImg.data;

  // 2. Tangent-space normal map computed via Sobel on the tileable heightfield
  const normCanvas = makeCanvas(size, size);
  const normCtx = normCanvas.getContext('2d');
  const normImg = normCtx.createImageData(size, size);
  const nData = normImg.data;

  const sampleH = (x, y) => {
    const wx = ((x % size) + size) % size;
    const wy = ((y % size) + size) % size;
    return src[(wy * size + wx) * 4] / 255;
  };

  const strength = 2.6;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const h = src[idx] / 255;

      // Subtle warm Xuan tint in [0.89..1.0]
      const tone = 0.89 + h * 0.11;
      gData[idx] = Math.min(255, Math.round(tone * 255));
      gData[idx + 1] = Math.min(255, Math.round(tone * 249));
      gData[idx + 2] = Math.min(255, Math.round(tone * 236));
      gData[idx + 3] = 255;

      // Sobel gradient for seamless normal
      const tl = sampleH(x - 1, y - 1);
      const t = sampleH(x, y - 1);
      const tr = sampleH(x + 1, y - 1);
      const l = sampleH(x - 1, y);
      const r = sampleH(x + 1, y);
      const bl = sampleH(x - 1, y + 1);
      const b = sampleH(x, y + 1);
      const br = sampleH(x + 1, y + 1);

      const dx = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
      const dy = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
      let nx = -dx;
      let ny = -dy;
      let nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      nx *= invLen;
      ny *= invLen;
      nz *= invLen;

      nData[idx] = Math.round((nx * 0.5 + 0.5) * 255);
      nData[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      nData[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      nData[idx + 3] = 255;
    }
  }

  grainCtx.putImageData(grainImg, 0, 0);
  normCtx.putImageData(normImg, 0, 0);

  const grain = new THREE.CanvasTexture(grainCanvas);
  grain.wrapS = THREE.RepeatWrapping;
  grain.wrapT = THREE.RepeatWrapping;
  grain.colorSpace = THREE.SRGBColorSpace;
  grain.needsUpdate = true;

  const normal = new THREE.CanvasTexture(normCanvas);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;
  normal.colorSpace = THREE.NoColorSpace;
  normal.needsUpdate = true;

  return { grain, normal };
}

export function generateSoftGlowTexture(size = 256) {
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size * 0.5;
  const cy = size * 0.5;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.22, 'rgba(255, 250, 238, 0.72)');
  grad.addColorStop(0.55, 'rgba(255, 244, 224, 0.22)');
  grad.addColorStop(0.82, 'rgba(255, 240, 215, 0.04)');
  grad.addColorStop(1.0, 'rgba(255, 240, 215, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function generateCloudTexture(w = 512, h = 256) {
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Layered auspicious-cloud / ink-wash mist puffs
  const puffs = [
    [0.24, 0.58, 0.17, 0.25, 0.65],
    [0.37, 0.45, 0.22, 0.32, 0.85],
    [0.52, 0.48, 0.24, 0.34, 0.92],
    [0.67, 0.52, 0.20, 0.28, 0.80],
    [0.78, 0.60, 0.14, 0.21, 0.58],
    [0.46, 0.60, 0.30, 0.22, 0.72],
    [0.30, 0.63, 0.18, 0.16, 0.50],
  ];

  for (const [nx, ny, rx, ry, a] of puffs) {
    ctx.save();
    ctx.translate(nx * w, ny * h);
    ctx.scale(1, ry / rx);
    const r = rx * w;
    const grad = ctx.createRadialGradient(0, -r * 0.15, r * 0.05, 0, 0, r);
    grad.addColorStop(0.0, `rgba(255, 250, 240, ${a})`);
    grad.addColorStop(0.55, `rgba(246, 238, 224, ${a * 0.68})`);
    grad.addColorStop(0.85, `rgba(225, 228, 225, ${a * 0.18})`);
    grad.addColorStop(1.0, 'rgba(225, 228, 225, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Subtle decorative Chinese curl highlights
  ctx.strokeStyle = 'rgba(255, 252, 245, 0.28)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(w * 0.18, h * 0.64);
  ctx.bezierCurveTo(w * 0.32, h * 0.72, w * 0.66, h * 0.72, w * 0.82, h * 0.63);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function generateInkRingTexture(size = 256) {
  const rand = createMulberry32(777);
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const cx = size * 0.5;
  const cy = size * 0.5;
  const baseR = size * 0.37;

  // Soft outer aura ring
  const outer = ctx.createRadialGradient(cx, cy, baseR * 0.65, cx, cy, baseR * 1.25);
  outer.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
  outer.addColorStop(0.45, 'rgba(255, 250, 240, 0.55)');
  outer.addColorStop(0.62, 'rgba(255, 255, 255, 0.92)');
  outer.addColorStop(0.78, 'rgba(255, 248, 232, 0.35)');
  outer.addColorStop(1.0, 'rgba(255, 248, 232, 0.0)');
  ctx.fillStyle = outer;
  ctx.fillRect(0, 0, size, size);

  // Calligraphy dry-brush concentric strokes
  const steps = 160;
  for (let layer = 0; layer < 5; layer++) {
    const rOff = (layer - 2) * 3.8;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wobble = Math.sin(a * 5 + layer * 1.7) * 2.5 + Math.cos(a * 11 - layer) * 1.4;
      const r = baseR + rOff + wobble;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(255, 253, 248, ${0.42 + (layer === 2 ? 0.45 : 0.0)})`;
    ctx.lineWidth = layer === 2 ? 4.5 : 1.8 + rand() * 1.6;
    ctx.stroke();
  }

  // Ink splatter flecks near ring perimeter
  for (let i = 0; i < 48; i++) {
    const a = rand() * Math.PI * 2;
    const r = baseR + (rand() - 0.5) * 24;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const dot = 0.8 + rand() * 2.2;
    ctx.fillStyle = `rgba(255, 252, 245, ${0.25 + rand() * 0.55})`;
    ctx.beginPath();
    ctx.arc(px, py, dot, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

function createFallbackTexture(key) {
  const size = 128;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Deterministic warm mineral hue from key hash
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;

  if (key.startsWith('map_')) {
    ctx.fillStyle = `hsl(${hue}, 30%, 28%)`;
    ctx.fillRect(0, 0, size, size);
  } else {
    // Paper-cutout emblem fallback with transparent margin
    const cx = size * 0.5;
    const cy = size * 0.5;
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, size * 0.44);
    grad.addColorStop(0, `hsla(${hue}, 65%, 64%, 0.98)`);
    grad.addColorStop(0.85, `hsla(${hue}, 55%, 42%, 0.95)`);
    grad.addColorStop(1, `hsla(${hue}, 55%, 42%, 0.0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(248, 238, 214, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.36, 0, Math.PI * 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export class AssetRegistry {
  constructor() {
    this.textures = new Map();
    this.models = new Map();
    this.loader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.loaded = false;
    this._initProceduralTextures();
  }

  _initProceduralTextures() {
    const { grain, normal } = generateProceduralPaperTextures(256);
    this.textures.set('proc_paper_grain', grain);
    this.textures.set('proc_paper_normal', normal);
    this.textures.set('proc_soft_glow', generateSoftGlowTexture(256));
    this.textures.set('proc_cloud', generateCloudTexture(512, 256));
    this.textures.set('proc_ink_ring', generateInkRingTexture(256));
  }

  getPath(key) {
    return ASSET_PATHS[key] ?? null;
  }

  getModelPath(key) {
    return MODEL_3D_PATHS[key] ?? null;
  }

  getUrl(key) {
    const path = ASSET_PATHS[key];
    return path ? encodeURI(path) : null;
  }

  hasTexture(key) {
    return this.textures.has(key);
  }

  hasModel(key) {
    return this.models.has(key);
  }

  getTexture(key) {
    const tex = this.textures.get(key);
    if (tex) return tex;
    const fallback = createFallbackTexture(String(key || 'unknown'));
    this.textures.set(key, fallback);
    return fallback;
  }

  /**
   * Instantiates a 3D GLB model from loaded templates with optional auto-fitting,
   * bottom/center pivoting, baked geometry coordinates, and group material opacity proxy.
   */
  instantiateModel(key, opts = {}) {
    const tpl = this.models.get(key);
    if (!tpl) return null;

    const cloned = tpl.clone(true);
    cloned.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    let scaleFactor = 1.0;
    if (opts.fitHeight && size.y > 1e-4) {
      scaleFactor = opts.fitHeight / size.y;
    } else if (opts.fitSize) {
      const maxDim = Math.max(size.x, size.y, size.z, 1e-4);
      scaleFactor = opts.fitSize / maxDim;
    }

    const offsetX = -center.x * scaleFactor;
    const offsetY = opts.pivotBottom ? -box.min.y * scaleFactor : opts.centerOrigin ? -center.y * scaleFactor : 0;
    const offsetZ = -center.z * scaleFactor;

    const materialsList = [];

    if (opts.bakeTransform) {
      const rootGroup = new THREE.Group();
      rootGroup.name = `Model3D_${key}`;
      const invRoot = cloned.matrixWorld.clone().invert();
      const bakeMat = new THREE.Matrix4()
        .makeTranslation(offsetX, offsetY, offsetZ)
        .multiply(new THREE.Matrix4().makeScale(scaleFactor, scaleFactor, scaleFactor))
        .multiply(invRoot);

      cloned.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const g = child.geometry.clone();
          const m = bakeMat.clone().multiply(child.matrixWorld);
          g.applyMatrix4(m);
          g.computeBoundingBox();
          g.computeBoundingSphere();

          const mat = Array.isArray(child.material)
            ? child.material.map((mt) => mt.clone())
            : child.material
              ? child.material.clone()
              : new THREE.MeshStandardMaterial();
          if (Array.isArray(mat)) materialsList.push(...mat);
          else materialsList.push(mat);

          const bakedMesh = new THREE.Mesh(g, mat);
          bakedMesh.name = child.name || key;
          bakedMesh.castShadow = opts.castShadow ?? true;
          bakedMesh.receiveShadow = opts.receiveShadow ?? true;
          bakedMesh.frustumCulled = false;
          rootGroup.add(bakedMesh);
        }
      });
      return rootGroup;
    }

    cloned.traverse((child) => {
      if (child.isMesh) {
        if (opts.cloneGeometry && child.geometry) {
          child.geometry = child.geometry.clone();
        }
        if (Array.isArray(child.material)) {
          child.material = child.material.map((m) => m.clone());
          materialsList.push(...child.material);
        } else if (child.material) {
          child.material = child.material.clone();
          materialsList.push(child.material);
        }
        child.castShadow = opts.castShadow ?? true;
        child.receiveShadow = opts.receiveShadow ?? true;
      }
    });

    cloned.scale.multiplyScalar(scaleFactor);
    cloned.position.set(offsetX, offsetY, offsetZ);

    const wrapper = new THREE.Group();
    wrapper.name = `Model3D_${key}`;
    wrapper.add(cloned);

    if (opts.opacityProxy) {
      const baseOpacities = materialsList.map((m) => m.opacity ?? 1.0);
      let currentOp = opts.initialOpacity ?? 1.0;
      const applyOp = (val) => {
        currentOp = val;
        for (let i = 0; i < materialsList.length; i++) {
          const m = materialsList[i];
          const target = baseOpacities[i] * currentOp;
          m.transparent = target < 0.995 || baseOpacities[i] < 0.995;
          m.opacity = target;
          if (m.transparent && target < 0.85) m.depthWrite = false;
        }
      };
      applyOp(currentOp);
      wrapper.material = {
        get opacity() {
          return currentOp;
        },
        set opacity(val) {
          applyOp(val);
        },
      };
    }

    return wrapper;
  }

  async loadAll(onProgress) {
    const imageEntries = Object.entries(ASSET_PATHS).filter(([, path]) => IMAGE_EXT_RE.test(path));
    const modelEntries = Object.entries(MODEL_3D_PATHS);
    const total = imageEntries.length + modelEntries.length;
    let completed = 0;

    if (total === 0) {
      this.loaded = true;
      if (onProgress) onProgress(1, '', 0, 0);
      return this;
    }

    const loadOneImage = ([key, rawPath]) =>
      new Promise((resolve) => {
        const url = encodeURI(rawPath);
        this.loader.load(
          url,
          (tex) => {
            const isNormal = key.endsWith('_normal');
            tex.colorSpace = isNormal ? THREE.NoColorSpace : THREE.SRGBColorSpace;
            tex.generateMipmaps = true;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            if (key.startsWith('map_')) {
              tex.wrapS = THREE.RepeatWrapping;
              tex.wrapT = THREE.RepeatWrapping;
            } else {
              tex.wrapS = THREE.ClampToEdgeWrapping;
              tex.wrapT = THREE.ClampToEdgeWrapping;
            }
            tex.needsUpdate = true;
            this.textures.set(key, tex);
            completed += 1;
            if (onProgress) onProgress(completed / total, key, completed, total);
            resolve(tex);
          },
          undefined,
          (err) => {
            console.warn(`[AssetRegistry] Failed to load "${key}" (${url}), using fallback.`, err);
            const fallback = createFallbackTexture(key);
            this.textures.set(key, fallback);
            completed += 1;
            if (onProgress) onProgress(completed / total, key, completed, total);
            resolve(fallback);
          }
        );
      });

    const loadOneModel = ([key, rawPath]) =>
      new Promise((resolve) => {
        const url = encodeURI(rawPath);
        this.gltfLoader.load(
          url,
          (gltf) => {
            this.models.set(key, gltf.scene);
            completed += 1;
            if (onProgress) onProgress(completed / total, `3d:${key}`, completed, total);
            resolve(gltf.scene);
          },
          undefined,
          (err) => {
            console.warn(`[AssetRegistry] Failed to load 3D model "${key}" (${url}).`, err);
            completed += 1;
            if (onProgress) onProgress(completed / total, `3d:${key}`, completed, total);
            resolve(null);
          }
        );
      });

    await Promise.all([...imageEntries.map(loadOneImage), ...modelEntries.map(loadOneModel)]);
    this.loaded = true;
    return this;
  }

  dispose() {
    for (const tex of this.textures.values()) {
      tex?.dispose?.();
    }
    this.textures.clear();
    this.models.clear();
    this.loaded = false;
  }
}
