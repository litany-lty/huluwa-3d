/**
 * 《葫芦兄弟》3D 立体宣纸微缩剧场 · 240秒（4分00秒）全片总谱数据
 * Exact landmarks aligned with:
 *  - World 0 MountainSanctuary (x = 0):   cottage (-5, 0, -1.8), pergola (1.2, 0, 0.2), seal fissure (8.5, 3.2, -3.8)
 *  - World 1 MistMireCanyon    (x = 65):  cliff ledge (58, 4.6, -1.5), mire (65, 0.04, 0.4), dream grotto (72, 2.4, -2.2)
 *  - World 2 CrystalPalace     (x = 130): gate (121, 0, 0), grandpa web (125.5, 0, -2.5), banquet (130, 0, -0.8),
 *                                         wine bowl (128.2, 0.9, 0.5), ice prism (132.2, 1.6, 0.5),
 *                                         mirror altar (135, 2.6, -2.0), couch & ruyi (136.8, 0, -2.8)
 *  - World 3 AlchemyCorePeak   (x = 195): altar (195, 0.5, 0), bronze cauldron (195, 2.1, 0),
 *                                         seven-color seal mountain (195, 0, -1.5)
 */

export const FILM_DURATION = 240;

export const ACTS = [
  {
    id: 1,
    numeral: '壹',
    title: '神峰惊变·仙藤结子',
    titleEn: 'The Broken Seal & The Sacred Vine',
    color: '#2e9e5b',
    start: 0,
    end: 26,
    mood: 'sanctuary_dawn',
    bgm: 'bgm2',
    bgmVol: 0.48,
  },
  {
    id: 2,
    numeral: '贰',
    title: '力拔山兮·误入泥潭',
    titleEn: "Titan's Might & The Quicksand Mire",
    color: '#e53935',
    start: 26,
    end: 52,
    mood: 'mire_miasma',
    bgm: 'bgm2',
    bgmVol: 0.52,
  },
  {
    id: 3,
    numeral: '叁',
    title: '慧眼识妖·梦窟伤目',
    titleEn: 'All-Seeing Eyes & The Blinding Mirage',
    color: '#fb8c00',
    start: 52,
    end: 76,
    mood: 'dream_crimson',
    bgm: 'bgm3',
    bgmVol: 0.50,
  },
  {
    id: 4,
    numeral: '肆',
    title: '钢筋铁骨·柔剑缠身',
    titleEn: 'Unbreakable Iron & The Silken Blade',
    color: '#fdd835',
    start: 76,
    end: 102,
    mood: 'palace_amethyst',
    bgm: 'bgm3',
    bgmVol: 0.52,
  },
  {
    id: 5,
    numeral: '伍',
    title: '水火奇功·酒酣心冰',
    titleEn: 'Fire and Flood, Wine and Frost',
    color: '#00acc1',
    start: 102,
    end: 132,
    mood: 'palace_amethyst',
    bgm: 'bgm4',
    bgmVol: 0.52,
  },
  {
    id: 6,
    numeral: '陆',
    title: '捕风捉影·巧夺如意',
    titleEn: 'Unseen Phantom & The Stolen Ruyi',
    color: '#2962ff',
    start: 132,
    end: 158,
    mood: 'palace_amethyst',
    bgm: 'bgm3',
    bgmVol: 0.48,
  },
  {
    id: 7,
    numeral: '柒',
    title: '妖迷心窍·七子入炉',
    titleEn: 'Darkened Heart & The Alchemy Furnace',
    color: '#8e24aa',
    start: 158,
    end: 188,
    mood: 'alchemy_inferno',
    bgm: 'bgm4',
    bgmVol: 0.56,
  },
  {
    id: 8,
    numeral: '捌',
    title: '彩莲泣血·七子连心',
    titleEn: 'Sacred Lotus & Seven Hearts as One',
    color: '#f0a030',
    start: 188,
    end: 214,
    mood: 'alchemy_inferno',
    bgm: 'bgm4',
    bgmVol: 0.58,
  },
  {
    id: 9,
    numeral: '玖',
    title: '神威合璧·化山镇妖',
    titleEn: 'Seven Peaks Rise: Eternal Seal',
    color: '#f5c542',
    start: 214,
    end: 240,
    mood: 'apotheosis_gold',
    bgm: 'bgm4',
    bgmVol: 0.62,
  },
];

// 42 contiguous wide-screen cinema diorama shots covering [0..240] with 0 gaps.
// Camera stays on +Z (z in 6..18) looking into z in -3.8..0.6 for crisp 3D depth & zero occlusion.
export const CAMERA_SHOTS = [
  // === ACT 1 (0..26): 神峰惊变·仙藤结子 (World 0, x = 0) ===
  {
    start: 0,
    end: 5.5,
    fromPos: [-2.5, 6.4, 17.6],
    toPos: [2.2, 4.6, 13.8],
    fromLook: [0.0, 3.4, -2.5],
    toLook: [3.2, 2.8, -2.2],
    fovFrom: 44,
    fovTo: 42,
    shake: 0,
  },
  {
    start: 5.5,
    end: 11.5,
    fromPos: [6.8, 3.8, 10.2],
    toPos: [8.4, 3.6, 7.6],
    fromLook: [8.3, 3.2, -3.6],
    toLook: [8.5, 3.3, -3.8],
    fovFrom: 42,
    fovTo: 39,
    shake: 0.24,
  },
  {
    start: 11.5,
    end: 16.0,
    fromPos: [-3.8, 3.1, 9.6],
    toPos: [-1.2, 2.9, 8.8],
    fromLook: [-4.4, 1.5, -1.6],
    toLook: [-0.8, 1.8, -0.4],
    fovFrom: 40,
    fovTo: 38,
    shake: 0,
  },
  {
    start: 16.0,
    end: 21.5,
    fromPos: [1.2, 2.8, 7.2],
    toPos: [1.2, 3.4, 9.6],
    fromLook: [1.2, 2.2, 0.2],
    toLook: [1.2, 2.8, 0.3],
    fovFrom: 38,
    fovTo: 42,
    shake: 0,
  },
  {
    start: 21.5,
    end: 26.0,
    fromPos: [-0.6, 3.5, 11.4],
    toPos: [3.4, 4.2, 12.6],
    fromLook: [-1.8, 2.1, -0.8],
    toLook: [2.5, 2.8, -1.4],
    fovFrom: 42,
    fovTo: 45,
    shake: 0.18,
  },

  // === ACT 2 (26..52): 力拔山兮·误入泥潭【大娃】 (World 0 -> World 1) ===
  {
    start: 26.0,
    end: 31.0,
    fromPos: [-0.4, 3.0, 6.8],
    toPos: [0.6, 3.2, 9.8],
    fromLook: [-0.7, 2.8, 0.5],
    toLook: [0.8, 2.4, 0.4],
    fovFrom: 36,
    fovTo: 43,
    shake: 0.14,
  },
  {
    start: 31.0,
    end: 37.5,
    fromPos: [3.4, 3.6, 13.4],
    toPos: [5.0, 4.2, 14.6],
    fromLook: [3.8, 2.5, 1.2],
    toLook: [5.0, 2.6, 1.0],
    fovFrom: 44,
    fovTo: 48,
    shake: 0.34,
  },
  {
    start: 37.5,
    end: 42.5,
    fromPos: [62.0, 4.8, 14.5],
    toPos: [64.8, 3.8, 10.6],
    fromLook: [64.6, 1.6, 0.2],
    toLook: [65.0, 1.2, 0.4],
    fovFrom: 44,
    fovTo: 40,
    shake: 0.08,
  },
  {
    start: 42.5,
    end: 47.5,
    fromPos: [65.4, 3.4, 8.6],
    toPos: [64.6, 2.6, 7.0],
    fromLook: [65.0, 1.0, 0.4],
    toLook: [65.0, 0.8, 0.4],
    fovFrom: 40,
    fovTo: 36,
    shake: 0.16,
  },
  {
    start: 47.5,
    end: 52.0,
    fromPos: [64.8, 2.8, 7.6],
    toPos: [65.8, 4.4, 11.4],
    fromLook: [65.0, 1.1, 0.4],
    toLook: [65.2, 1.8, 0.2],
    fovFrom: 37,
    fovTo: 43,
    shake: 0.12,
  },

  // === ACT 3 (52..76): 慧眼识妖·梦窟伤目【二娃】 (World 1, x = 65) ===
  {
    start: 52.0,
    end: 57.0,
    fromPos: [58.4, 5.8, 7.8],
    toPos: [59.8, 6.2, 9.4],
    fromLook: [58.0, 5.4, -1.5],
    toLook: [60.2, 4.8, -1.4],
    fovFrom: 38,
    fovTo: 42,
    shake: 0,
  },
  {
    start: 57.0,
    end: 62.0,
    fromPos: [60.0, 5.8, 10.2],
    toPos: [66.5, 4.4, 12.2],
    fromLook: [60.5, 4.6, -1.4],
    toLook: [69.5, 2.8, -1.8],
    fovFrom: 42,
    fovTo: 44,
    shake: 0.04,
  },
  {
    start: 62.0,
    end: 66.5,
    fromPos: [70.6, 3.3, 9.2],
    toPos: [71.8, 3.1, 7.0],
    fromLook: [72.0, 2.6, -2.2],
    toLook: [72.0, 2.7, -2.2],
    fovFrom: 42,
    fovTo: 37,
    shake: 0.1,
  },
  {
    start: 66.5,
    end: 71.0,
    fromPos: [71.4, 3.0, 7.4],
    toPos: [69.6, 2.9, 8.8],
    fromLook: [71.6, 2.4, -2.0],
    toLook: [69.2, 2.0, -1.2],
    fovFrom: 38,
    fovTo: 42,
    shake: 0.3,
  },
  {
    start: 71.0,
    end: 76.0,
    fromPos: [59.6, 5.6, 9.8],
    toPos: [58.6, 3.6, 12.6],
    fromLook: [58.2, 4.6, -1.5],
    toLook: [58.5, 1.8, -1.2],
    fovFrom: 41,
    fovTo: 46,
    shake: 0.22,
  },

  // === ACT 4 (76..102): 钢筋铁骨·柔剑缠身【三娃】 (World 2, x = 130) ===
  {
    start: 76.0,
    end: 80.5,
    fromPos: [120.5, 3.5, 11.4],
    toPos: [122.4, 3.2, 8.6],
    fromLook: [121.0, 2.6, 0.0],
    toLook: [122.0, 2.4, -0.2],
    fovFrom: 44,
    fovTo: 40,
    shake: 0.16,
  },
  {
    start: 80.5,
    end: 86.0,
    fromPos: [124.2, 3.2, 10.6],
    toPos: [127.6, 3.4, 9.8],
    fromLook: [126.0, 2.0, -0.4],
    toLook: [128.2, 2.1, -0.5],
    fovFrom: 42,
    fovTo: 40,
    shake: 0.24,
  },
  {
    start: 86.0,
    end: 91.5,
    fromPos: [131.6, 3.2, 9.4],
    toPos: [134.2, 3.4, 7.4],
    fromLook: [133.5, 2.4, -1.2],
    toLook: [135.0, 2.6, -2.0],
    fovFrom: 41,
    fovTo: 37,
    shake: 0.28,
  },
  {
    start: 91.5,
    end: 97.0,
    fromPos: [133.5, 3.5, 10.2],
    toPos: [131.2, 3.0, 8.2],
    fromLook: [132.4, 2.1, -0.8],
    toLook: [131.0, 1.9, -0.4],
    fovFrom: 42,
    fovTo: 38,
    shake: 0.18,
  },
  {
    start: 97.0,
    end: 102.0,
    fromPos: [131.0, 2.8, 7.6],
    toPos: [130.0, 4.1, 11.8],
    fromLook: [131.0, 1.8, -0.4],
    toLook: [130.4, 2.2, -1.0],
    fovFrom: 38,
    fovTo: 43,
    shake: 0.08,
  },

  // === ACT 5 (102..132): 水火奇功·酒酣心冰【四娃 & 五娃】 (World 2, x = 130) ===
  {
    start: 102.0,
    end: 107.5,
    fromPos: [126.8, 3.8, 12.2],
    toPos: [129.6, 3.4, 10.6],
    fromLook: [128.4, 2.0, -0.6],
    toLook: [130.0, 2.1, -0.6],
    fovFrom: 44,
    fovTo: 42,
    shake: 0.14,
  },
  {
    start: 107.5,
    end: 113.5,
    fromPos: [130.4, 3.6, 12.6],
    toPos: [129.2, 4.0, 13.4],
    fromLook: [130.2, 2.2, -0.8],
    toLook: [130.0, 2.2, -0.6],
    fovFrom: 43,
    fovTo: 46,
    shake: 0.24,
  },
  {
    start: 113.5,
    end: 119.5,
    fromPos: [128.6, 3.4, 9.6],
    toPos: [128.0, 2.8, 7.0],
    fromLook: [128.4, 1.6, 0.2],
    toLook: [128.2, 1.4, 0.5],
    fovFrom: 41,
    fovTo: 36,
    shake: 0.04,
  },
  {
    start: 119.5,
    end: 126.0,
    fromPos: [130.8, 3.2, 10.8],
    toPos: [130.6, 3.0, 9.8],
    fromLook: [130.4, 1.6, 0.4],
    toLook: [130.5, 1.6, 0.4],
    fovFrom: 43,
    fovTo: 40,
    shake: 0.2,
  },
  {
    start: 126.0,
    end: 132.0,
    fromPos: [130.2, 3.6, 10.6],
    toPos: [130.0, 4.6, 13.6],
    fromLook: [130.2, 1.8, 0.0],
    toLook: [130.0, 2.0, -0.8],
    fovFrom: 42,
    fovTo: 45,
    shake: 0.06,
  },

  // === ACT 6 (132..158): 捕风捉影·巧夺如意【六娃】 (World 2, x = 130) ===
  {
    start: 132.0,
    end: 137.0,
    fromPos: [120.4, 3.1, 9.2],
    toPos: [123.2, 3.0, 8.4],
    fromLook: [121.0, 2.2, 0.0],
    toLook: [123.5, 2.0, -0.4],
    fovFrom: 41,
    fovTo: 39,
    shake: 0,
  },
  {
    start: 137.0,
    end: 142.5,
    fromPos: [126.5, 3.4, 9.8],
    toPos: [130.2, 3.2, 8.8],
    fromLook: [127.8, 2.0, -1.0],
    toLook: [130.4, 1.9, -0.8],
    fovFrom: 41,
    fovTo: 39,
    shake: 0.06,
  },
  {
    start: 142.5,
    end: 148.0,
    fromPos: [130.4, 3.3, 9.6],
    toPos: [132.2, 3.2, 9.2],
    fromLook: [131.0, 1.9, -0.6],
    toLook: [132.0, 1.9, -0.5],
    fovFrom: 41,
    fovTo: 42,
    shake: 0.22,
  },
  {
    start: 148.0,
    end: 153.0,
    fromPos: [135.4, 3.1, 8.0],
    toPos: [136.4, 2.6, 6.4],
    fromLook: [136.6, 1.5, -2.6],
    toLook: [136.8, 1.3, -2.8],
    fovFrom: 38,
    fovTo: 35,
    shake: 0,
  },
  {
    start: 153.0,
    end: 158.0,
    fromPos: [132.4, 3.4, 10.6],
    toPos: [128.4, 3.8, 12.2],
    fromLook: [131.2, 1.8, 0.2],
    toLook: [129.4, 1.8, -0.6],
    fovFrom: 42,
    fovTo: 44,
    shake: 0.16,
  },

  // === ACT 7 (158..188): 妖迷心窍·七子入炉【七娃黑化与全员受困】 (World 3, x = 195) ===
  {
    start: 158.0,
    end: 164.0,
    fromPos: [195.0, 4.8, 15.6],
    toPos: [195.0, 3.4, 11.8],
    fromLook: [195.0, 2.2, 0.4],
    toLook: [195.0, 2.0, 0.9],
    fovFrom: 46,
    fovTo: 40,
    shake: 0.08,
  },
  {
    start: 164.0,
    end: 170.5,
    fromPos: [193.2, 3.3, 9.6],
    toPos: [196.4, 3.6, 10.6],
    fromLook: [194.8, 2.2, 0.2],
    toLook: [195.2, 2.3, 0.2],
    fovFrom: 40,
    fovTo: 43,
    shake: 0.18,
  },
  {
    start: 170.5,
    end: 179.0,
    fromPos: [196.2, 4.0, 12.6],
    toPos: [194.2, 4.6, 14.0],
    fromLook: [195.0, 2.6, 0.0],
    toLook: [195.0, 2.8, 0.0],
    fovFrom: 44,
    fovTo: 48,
    shake: 0.3,
  },
  {
    start: 179.0,
    end: 188.0,
    fromPos: [194.6, 4.4, 12.4],
    toPos: [195.4, 3.4, 8.6],
    fromLook: [195.0, 2.4, -0.8],
    toLook: [195.0, 2.3, -0.8],
    fovFrom: 44,
    fovTo: 39,
    shake: 0.2,
  },

  // === ACT 8 (188..214): 彩莲泣血·七子连心 (World 3, x = 195) ===
  {
    start: 188.0,
    end: 194.0,
    fromPos: [191.2, 3.1, 10.2],
    toPos: [193.6, 2.9, 8.6],
    fromLook: [192.6, 1.8, 0.6],
    toLook: [194.6, 2.0, 0.2],
    fovFrom: 41,
    fovTo: 38,
    shake: 0.12,
  },
  {
    start: 194.0,
    end: 200.0,
    fromPos: [193.6, 2.8, 8.2],
    toPos: [195.0, 3.5, 9.2],
    fromLook: [194.2, 1.8, 0.4],
    toLook: [195.0, 2.8, 0.0],
    fovFrom: 38,
    fovTo: 41,
    shake: 0.26,
  },
  {
    start: 200.0,
    end: 207.5,
    fromPos: [195.0, 3.6, 9.6],
    toPos: [195.0, 4.8, 13.6],
    fromLook: [195.0, 2.8, 0.0],
    toLook: [195.0, 3.6, 0.0],
    fovFrom: 41,
    fovTo: 46,
    shake: 0.16,
  },
  {
    start: 207.5,
    end: 214.0,
    fromPos: [195.0, 4.4, 13.2],
    toPos: [195.0, 5.6, 15.8],
    fromLook: [195.0, 3.4, 0.0],
    toLook: [195.0, 4.2, -0.4],
    fovFrom: 46,
    fovTo: 50,
    shake: 0.42,
  },

  // === ACT 9 (214..240): 神威合璧·化山镇妖 (World 3 -> Peak Apotheosis) ===
  {
    start: 214.0,
    end: 221.0,
    fromPos: [193.2, 4.8, 14.4],
    toPos: [196.6, 4.4, 12.6],
    fromLook: [195.0, 2.6, 0.2],
    toLook: [195.2, 2.2, 0.2],
    fovFrom: 45,
    fovTo: 42,
    shake: 0.24,
  },
  {
    start: 221.0,
    end: 228.0,
    fromPos: [196.2, 4.2, 13.4],
    toPos: [195.0, 5.4, 16.4],
    fromLook: [195.0, 2.6, -0.6],
    toLook: [195.0, 4.4, -1.4],
    fovFrom: 43,
    fovTo: 47,
    shake: 0.36,
  },
  {
    start: 228.0,
    end: 234.5,
    fromPos: [195.0, 5.4, 16.4],
    toPos: [195.0, 7.0, 17.8],
    fromLook: [195.0, 4.8, -1.5],
    toLook: [195.0, 6.2, -1.5],
    fovFrom: 47,
    fovTo: 49,
    shake: 0.14,
  },
  {
    start: 234.5,
    end: 240.0,
    fromPos: [195.0, 7.0, 17.8],
    toPos: [195.0, 7.8, 18.0],
    fromLook: [195.0, 6.2, -1.5],
    toLook: [195.0, 7.2, -1.5],
    fovFrom: 49,
    fovTo: 46,
    shake: 0,
  },
];

// 42 bilingual cinema captions narrating every plot beat, 1:1 skill, and 1:1 trap
export const SUBTITLES = [
  // Act 1
  {
    start: 0.8,
    end: 5.2,
    text: '云海青峰藏古洞，葫芦山下锁千年二妖。',
    en: 'Beneath Calabash Mountain’s mist-veiled peaks, two ancient demons lie sealed in stone.',
  },
  {
    start: 6.0,
    end: 11.2,
    text: '穿山甲误破山壁封印，黑风席卷，蝎子精与金蛇精破石脱逃！',
    en: 'Pangolin accidentally pierces the cliff seal; dark winds roar as Scorpion and Snake break free!',
  },
  {
    start: 12.0,
    end: 15.8,
    text: '老爷爷舍身救下穿山甲，得山神遗赠七彩葫芦仙籽。',
    en: 'Grandpa braves peril to save Pangolin and receives the Mountain Spirit’s seven-colored gourd seeds.',
  },
  {
    start: 16.4,
    end: 21.2,
    text: '灵藤盘架而生，七色宝葫芦次第垂挂，霞光流转山谷。',
    en: 'The sacred vine blooms across the trellis, bearing seven radiant gourds that bathe the valley in dawn.',
  },
  {
    start: 21.8,
    end: 25.6,
    text: '妖风骤起！蝎子精撒下黑雾蛛网，卷走爷爷遁入妖山！',
    en: 'A wicked gale strikes! Scorpion casts a dark web, abducting Grandpa into the demon peaks!',
  },

  // Act 2
  {
    start: 26.5,
    end: 30.8,
    text: '赤红葫芦破壳落地，大娃迎风暴涨三丈，力拔山兮气盖世！',
    en: 'The crimson gourd bursts open; First Brother towers thirty feet tall, wielding mountain-moving might!',
  },
  {
    start: 31.4,
    end: 37.0,
    text: '大娃举起千钧巨石砸碎妖阵，云雷震地，蛤蟆野猪望风披靡。',
    en: 'Hurling a colossal boulder, he shatters the demon ranks—toads and boars scatter like leaves in thunder.',
  },
  {
    start: 38.0,
    end: 42.2,
    text: '急追妖踪误入幽谷，脚下暗藏蛇精所设迷魂泥潭！',
    en: 'Pursuing into the misty gorge, he steps straight into Snake’s treacherous Quicksand Mire!',
  },
  {
    start: 42.8,
    end: 47.2,
    text: '大娃深陷泥沼无处借力，空有一身神力难挣脱！',
    en: 'Sinking deeper with nowhere to brace his footing, even titan strength cannot pull him free!',
  },
  {
    start: 47.8,
    end: 51.6,
    text: '蝙蝠妖群俯冲撒下五彩毒蛛网，封锁丹田命门，大娃缩小被擒。',
    en: 'Bat demons swoop with five-colored venom webs, sealing his Dantian core to shrink and capture him.',
  },

  // Act 3
  {
    start: 52.5,
    end: 56.8,
    text: '橘橙葫芦觉醒，二娃登临绝壁，双目金芒如炬！',
    en: 'The orange gourd awakens; Second Brother ascends the cliff edge, his eyes blazing like golden torches!',
  },
  {
    start: 57.4,
    end: 61.8,
    text: '千里眼穿透重雾窥见妖洞，顺风耳听破蛇蝎毒计。',
    en: 'Thousand-Mile Eyes pierce the demon mist; Wind-Following Ears uncover Snake and Scorpion’s foul plot.',
  },
  {
    start: 62.4,
    end: 66.2,
    text: '二娃潜入梦窟迷境，金蛇精催动水晶魔镜，幻化漫天绯红妖眼！',
    en: 'Stepping into the Mirage Cavern, he faces Snake’s Crystal Mirror as crimson demon eyes fill the gloom!',
  },
  {
    start: 66.8,
    end: 70.8,
    text: '毒风剑光直刺双目震伤双耳，二娃失明跌落迷窟！',
    en: 'Poison-wind sword rays sear his eyes and shatter his hearing, casting blinded Second Brother down!',
  },
  {
    start: 71.4,
    end: 75.6,
    text: '穿山甲拼死掩护爷爷与二娃，惨遭蝎子精推落万丈悬崖！',
    en: 'Fighting desperately to shield Grandpa and Second Brother, Pangolin is hurled by Scorpion into the abyss!',
  },

  // Act 4
  {
    start: 76.5,
    end: 80.2,
    text: '明黄葫芦炸裂，三娃钢筋铁骨闯破妖洞巨石门！',
    en: 'The yellow gourd bursts open; iron-bodied Third Brother smashes through the demon cave’s stone gate!',
  },
  {
    start: 81.0,
    end: 85.8,
    text: '铜头铁臂刀枪不入，黄蜂毒针尽数震飞，蜈蚣巨斧应声折断！',
    en: 'Copper head and iron arms deflect wasp venom needles and snap Centipede’s great battle-axe in two!',
  },
  {
    start: 86.4,
    end: 91.2,
    text: '三娃腾空一掌，将金蛇精的水晶魔镜震得粉碎！',
    en: 'Leaping skyward, Third Brother shatters Snake’s Crystal Magic Mirror with a single thunderous palm!',
  },
  {
    start: 92.0,
    end: 96.8,
    text: '金蛇精祭出刚柔阴阳剑，剑化紫青电光柔丝，以柔克刚！',
    en: 'Snake unsheathes her Rigid-Soft Yin-Yang Sword—violet-cyan silk ribbons unfurl to conquer steel with grace!',
  },
  {
    start: 97.4,
    end: 101.6,
    text: '绕指柔丝层层缠缚铁臂，三娃化作丝茧动弹不得！',
    en: 'Silken coils wind tight around his iron limbs, trapping Third Brother in an inescapable cocoon!',
  },

  // Act 5
  {
    start: 102.5,
    end: 107.2,
    text: '绿青双葫芦齐开！四娃吐火如龙，五娃喷水成涛，齐闯水晶魔殿！',
    en: 'Green and cyan gourds open together! Fourth breathes dragon fire and Fifth unleashes surging torrents into the hall!',
  },
  {
    start: 108.0,
    end: 113.2,
    text: '烈焰火龙与高压水柱交织席卷，群妖溃逃无处藏身。',
    en: 'Twin streams of searing flame and crashing flood sweep the demon host away with nowhere to hide.',
  },
  {
    start: 114.0,
    end: 119.2,
    text: '紫晶花树厅设下鸿门酒宴，五娃豪饮冷泉迷魂酒，醉倒巨型青花酒碗！',
    en: 'Lured to the Amethyst Banquet, Fifth Brother drains enchanted cold-spring wine and slumps drunk in the giant porcelain bowl!',
  },
  {
    start: 120.0,
    end: 125.6,
    text: '金蛇精摇动金如意唤来玄冥寒风，熄灭阳火，将四娃封入八面体玄冰巨晶！',
    en: 'Snake waves her Golden Ruyi to summon an abyssal blizzard, quenching Fourth Brother’s flame in an octahedral ice crystal!',
  },
  {
    start: 126.4,
    end: 131.5,
    text: '水火双雄一醉一冰，皆落入蛇蝎圈套。',
    en: 'One lost to wine, the other locked in frost—the Lords of Fire and Water both fall into the trap.',
  },

  // Act 6
  {
    start: 132.5,
    end: 136.8,
    text: '靛蓝葫芦破壳，六娃施展隐身穿墙神通，如清风潜入魔殿！',
    en: 'The indigo gourd hatches; Sixth Brother phases unseen through solid stone, gliding into the palace like wind!',
  },
  {
    start: 137.4,
    end: 142.2,
    text: '蛇精洒金粉贴下显形小黄花，六娃机灵移花接木，巧贴蝎子精鼻头！',
    en: 'Snake scatters golden tracking dust and a tiny yellow flower—clever Sixth slips it right onto Scorpion’s nose!',
  },
  {
    start: 143.0,
    end: 147.6,
    text: '蝎子精与蜈蚣精被戏耍得自相残杀，挥刀互砍齐齐昏倒！',
    en: 'Tricked into a blind frenzy, Scorpion and Centipede slash each other clean unconscious!',
  },
  {
    start: 148.4,
    end: 152.8,
    text: '六娃悄然潜至石榻，盗走金蛇精的镇洞法宝——金如意！',
    en: 'Stealing silently to the stone couch, Sixth Brother claims Snake’s prized treasure—the Golden Ruyi!',
  },
  {
    start: 153.4,
    end: 157.6,
    text: '金如意神光迸发，破开玄冰巨晶与酒碗，救出受困兄长！',
    en: 'Radiant Ruyi light shatters the ice crystal and wine bowl, setting his captive brothers free!',
  },

  // Act 7
  {
    start: 158.6,
    end: 163.8,
    text: '地心深渊黑雾翻涌，紫葫芦久受妖毒浸染，七娃黑化破壳认贼作母！',
    en: 'Steeped in abyssal venom mist, the stolen Purple Gourd hatches a darkened Seventh Brother who calls Snake “Mother”!',
  },
  {
    start: 164.6,
    end: 170.2,
    text: '七娃举起紫金宝葫芦催动离心咒，紫红漩涡席卷八方！',
    en: 'Raising his Purple-Gold Gourd, he chants the Centrifugal Curse as a crimson-violet vortex erupts!',
  },
  {
    start: 171.0,
    end: 178.5,
    text: '连隐身潜行的六娃亦被迫显形，六位哥哥全员被吸入宝葫芦！',
    en: 'Even unseen Sixth Brother is torn into view as all six elder brothers are pulled into the gourd!',
  },
  {
    start: 179.4,
    end: 187.5,
    text: '蛇蝎狂笑，将七兄弟投入三足青铜炼丹炉，燃起地心烈火欲炼七心丹！',
    en: 'Laughing wildly, the demons cast all seven brothers into the blazing Bronze Cauldron to refine the Seven-Heart Elixir!',
  },

  // Act 8
  {
    start: 188.6,
    end: 193.8,
    text: '老爷爷手捧山神所赐幽谷七色彩莲，义无反顾冲向丹炉！',
    en: 'Cradling the Mountain Spirit’s Seven-Color Sacred Lotus, Grandpa charges fearlessly toward the cauldron!',
  },
  {
    start: 194.4,
    end: 199.8,
    text: '蝎子精毒尾钢叉骤袭！爷爷临终泣血，奋力将七色彩莲投入炉火！',
    en: 'Struck down by Scorpion’s poisoned spear, dying Grandpa hurls the Sacred Lotus into the roaring flames!',
  },
  {
    start: 200.6,
    end: 207.2,
    text: '七色莲华冲天绽放，涤尽七娃心魔，七颗灵珠连成七子连心光阵！',
    en: 'Seven-colored lotus light blooms skyward, cleansing Seventh Brother’s mind as seven spirit orbs link their hearts as one!',
  },
  {
    start: 208.0,
    end: 213.6,
    text: '轰隆巨响！三足青铜炼丹炉炸裂四散，七兄弟齐心破炉腾空！',
    en: 'With a thunderous blast, the Bronze Cauldron shatters apart and all seven brothers soar free as one!',
  },

  // Act 9
  {
    start: 214.6,
    end: 220.8,
    text: '七娃调转紫金宝葫芦，联合六兄神通，狂风神光将蛇蝎二妖镇为顽石！',
    en: 'Seventh Brother turns his Purple-Gold Gourd alongside his brothers’ powers, petrifying Snake and Scorpion into stone!',
  },
  {
    start: 221.6,
    end: 228.0,
    text: '七兄弟化作七道长虹坠地，大地震动，拔地而起七色镇妖神峰！',
    en: 'Diving as seven rainbows into the trembling earth, the brothers raise the towering Seven-Color Seal Mountain!',
  },
  {
    start: 228.8,
    end: 234.5,
    text: '破晓金云漫卷苍穹，七心合一，葫芦小金刚金身辉映天地！',
    en: 'Dawn’s golden clouds part across the heavens as seven hearts unite into the radiant Calabash Diamond King!',
  },
  {
    start: 235.0,
    end: 239.6,
    text: '山河重归青绿祥和，葫芦兄弟永镇人间。',
    en: 'Rivers and peaks return to emerald peace, guarded by the Calabash Brothers forevermore.',
  },
];

// 48 timed SFX cues synced precisely across all 9 acts using sfx02..sfx18
export const SFX_CUES = [
  // Act 1
  { time: 6.2, sfx: 'sfx07', vol: 0.72, rate: 0.92 },  // Cliff seal fissure cracks open
  { time: 8.6, sfx: 'sfx16', vol: 0.75, rate: 0.96 },  // Scorpion & Snake escape in dark wind
  { time: 13.0, sfx: 'sfx03', vol: 0.68, rate: 1.0 },  // Grandpa rescues Pangolin / sacred seeds
  { time: 16.8, sfx: 'sfx02', vol: 0.75, rate: 1.0 },  // Vine sprouts & gourds shimmer
  { time: 18.8, sfx: 'sfx02', vol: 0.65, rate: 1.15 }, // Seven gourds glowing in cascade
  { time: 22.4, sfx: 'sfx16', vol: 0.80, rate: 1.02 }, // Scorpion swoops in to abduct Grandpa

  // Act 2
  { time: 26.4, sfx: 'sfx04', vol: 0.85, rate: 1.0 },  // Red gourd hatches -> Dawa awakens
  { time: 29.2, sfx: 'sfx07', vol: 0.82, rate: 0.86 }, // Dawa grows to giant 3.2x scale
  { time: 33.0, sfx: 'sfx07', vol: 0.92, rate: 1.0 },  // Dawa boulder smash shockwave
  { time: 35.2, sfx: 'sfx06', vol: 0.78, rate: 0.95 }, // Toad & Boar sent flying
  { time: 38.8, sfx: 'sfx05', vol: 0.68, rate: 1.0 },  // Dawa dashes into Mist Mire Canyon
  { time: 43.2, sfx: 'sfx13', vol: 0.66, rate: 0.82 }, // Quicksand mire drags Dawa down
  { time: 48.2, sfx: 'sfx15', vol: 0.76, rate: 1.12 }, // 5-color spiderweb seals Dantian

  // Act 3
  { time: 52.4, sfx: 'sfx04', vol: 0.82, rate: 1.06 }, // Orange gourd hatches -> Erwa
  { time: 56.2, sfx: 'sfx08', vol: 0.85, rate: 1.0 },  // Thousand-mile eye beam & wind-ear ripple
  { time: 60.2, sfx: 'sfx08', vol: 0.70, rate: 1.12 }, // Erwa locks onto Grandpa in cave
  { time: 63.0, sfx: 'sfx15', vol: 0.68, rate: 0.88 }, // Dream grotto crimson eyes open
  { time: 67.2, sfx: 'sfx17', vol: 0.86, rate: 1.05 }, // Poison-wind blinding rays pierce Erwa
  { time: 72.2, sfx: 'sfx16', vol: 0.84, rate: 0.95 }, // Scorpion pushes Pangolin off cliff

  // Act 4
  { time: 76.4, sfx: 'sfx04', vol: 0.85, rate: 1.02 }, // Yellow gourd hatches -> Sanwa
  { time: 78.6, sfx: 'sfx07', vol: 0.78, rate: 1.08 }, // Demon cave stone gate smashes open
  { time: 81.8, sfx: 'sfx17', vol: 0.80, rate: 1.04 }, // Wasp poison needle rain volley
  { time: 83.2, sfx: 'sfx09', vol: 0.88, rate: 1.0 },  // Sanwa iron body deflects needles
  { time: 84.8, sfx: 'sfx09', vol: 0.90, rate: 0.92 }, // Centipede battle-axe shatters on Sanwa
  { time: 88.8, sfx: 'sfx06', vol: 0.90, rate: 1.18 }, // Sanwa smashes Crystal Magic Mirror!
  { time: 93.0, sfx: 'sfx15', vol: 0.88, rate: 1.0 },  // Yin-Yang Silk Sword unfurls
  { time: 96.4, sfx: 'sfx15', vol: 0.78, rate: 1.1 },  // Silk cocoon binds Sanwa tight

  // Act 5
  { time: 102.4, sfx: 'sfx04', vol: 0.86, rate: 1.04 }, // Green & Cyan gourds burst open
  { time: 106.0, sfx: 'sfx10', vol: 0.88, rate: 1.0 },  // Siwa roaring 3D fire-dragon stream
  { time: 109.2, sfx: 'sfx11', vol: 0.88, rate: 1.0 },  // Wuwa high-pressure water torrent
  { time: 112.0, sfx: 'sfx06', vol: 0.75, rate: 1.0 },  // Demons washed & scorched back
  { time: 116.2, sfx: 'sfx03', vol: 0.72, rate: 0.88 }, // Wuwa gulps enchanted cold-spring wine
  { time: 120.8, sfx: 'sfx14', vol: 0.90, rate: 1.0 },  // Snake's Golden Ruyi freezing blizzard
  { time: 123.6, sfx: 'sfx14', vol: 0.80, rate: 1.14 }, // Siwa frozen solid in octahedral ice prism

  // Act 6
  { time: 132.4, sfx: 'sfx04', vol: 0.82, rate: 1.1 },  // Blue gourd hatches -> Liuwa
  { time: 134.8, sfx: 'sfx12', vol: 0.85, rate: 1.0 },  // Liuwa stealth phase through closed gate
  { time: 139.2, sfx: 'sfx12', vol: 0.74, rate: 1.15 }, // Yellow flower moved onto Scorpion's nose
  { time: 144.2, sfx: 'sfx06', vol: 0.84, rate: 1.0 },  // Scorpion & Centipede slash each other
  { time: 146.4, sfx: 'sfx06', vol: 0.80, rate: 0.92 }, // Both bosses knocked out cold
  { time: 150.2, sfx: 'sfx02', vol: 0.82, rate: 1.12 }, // Liuwa steals Golden Ruyi from couch
  { time: 154.2, sfx: 'sfx08', vol: 0.84, rate: 1.08 }, // Ruyi golden beam shatters ice & rescues brothers

  // Act 7
  { time: 159.0, sfx: 'sfx04', vol: 0.84, rate: 0.84 }, // Corrupted Purple gourd hatches -> Qiwa
  { time: 165.4, sfx: 'sfx13', vol: 0.92, rate: 1.0 },  // Purple-Gold Gourd centrifugal vortex begins
  { time: 171.8, sfx: 'sfx12', vol: 0.76, rate: 0.86 }, // Liuwa forced out of stealth into vortex
  { time: 174.5, sfx: 'sfx13', vol: 0.94, rate: 1.08 }, // All six elder brothers sucked into gourd
  { time: 181.2, sfx: 'sfx10', vol: 0.86, rate: 0.88 }, // Seven brothers cast into blazing Bronze Cauldron

  // Act 8
  { time: 190.2, sfx: 'sfx05', vol: 0.74, rate: 0.92 }, // Grandpa rushes toward cauldron with Sacred Lotus
  { time: 195.2, sfx: 'sfx16', vol: 0.92, rate: 0.98 }, // Scorpion strikes Grandpa down
  { time: 198.4, sfx: 'sfx02', vol: 0.88, rate: 1.0 },  // Sacred Seven-Color Lotus enters cauldron
  { time: 202.2, sfx: 'sfx04', vol: 0.88, rate: 1.12 }, // Seven Spirit Orbs link & purify Qiwa
  { time: 208.2, sfx: 'sfx07', vol: 0.96, rate: 0.90 }, // Monumental Bronze Cauldron shatters apart!

  // Act 9
  { time: 215.2, sfx: 'sfx13', vol: 0.92, rate: 1.04 }, // Qiwa turns gourd to capture Snake & Scorpion
  { time: 219.4, sfx: 'sfx09', vol: 0.84, rate: 0.85 }, // Snake & Scorpion petrified into stone
  { time: 222.8, sfx: 'sfx07', vol: 0.94, rate: 0.82 }, // Seven-Color Seal Mountain rises from earth
  { time: 229.6, sfx: 'sfx18', vol: 0.92, rate: 1.0 },  // Triumphant gongs & drums + Xiaojingang apotheosis
];
