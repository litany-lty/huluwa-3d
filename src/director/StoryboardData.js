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

// Each editorial beat specifies a sightline as well as a movement. Camera stays on
// the audience side (+Z), preserving left/right screen direction across reversals.
function shot(start, end, purpose, fromPos, toPos, fromLook, toLook, fovFrom, fovTo, shake = 0) {
  return { start, end, purpose, fromPos, toPos, fromLook, toLook, fovFrom, fovTo, shake };
}

export const CAMERA_SHOTS = [
  // 壹 · Sanctuary: cross the miniature landscape from cottage to fissure, then reverse toward the seed.
  shot(0, 5.5, 'Cottage to sacred ridge', [-7, 3.8, 15], [-3, 4.2, 15], [-0.8, 2.3, -1], [0.6, 2.6, -1], 49, 45),
  shot(5.5, 11.5, 'Crack and escaping silhouettes', [5, 4.5, 6.8], [4, 5.2, 8.5], [8.2, 3, -2.8], [6.8, 3.6, -2.1], 40, 46, 0.12),
  shot(11.5, 16, 'Rescue at human height', [-5.6, 1.95, 5.8], [-1.8, 2.35, 6.6], [-4, 1.1, -0.8], [-1.1, 1.25, 1.3], 39, 43),
  shot(16, 21.5, 'Witnesses below the vine', [-3.0, 2.5, 7.1], [-1.8, 4.1, 9], [-0.5, 1.9, 0.3], [0.5, 2.75, 0.35], 44, 44),
  shot(21.5, 26, 'Abduction cuts across pergola', [3.5, 2.5, 10.5], [5.5, 4.9, 12.5], [-0.8, 1.8, 0.5], [2.2, 3.2, -0.6], 47, 49, 0.10),

  // 贰 · Establish the trap in depth, then get down to the victim's eyeline.
  shot(26, 31, 'Red gourd drops into clearing', [-2.8, 2.4, 6.6], [-3.2, 3.3, 11.2], [-0.5, 2.7, 0.45], [1, 2.6, 0.5], 35, 44, 0.1),
  shot(31, 37.5, 'Giant and scattering attackers', [5.6, 2.25, 12.3], [8.5, 4.8, 14.6], [5.7, 2.6, 1.4], [8.0, 3.4, 1.3], 46, 50, 0.21),
  shot(37.5, 42.5, 'Diagonal chase across mire lip', [60, 5.4, 11.6], [62.2, 4.4, 9.8], [63.6, 1.55, 0.25], [65.25, 1.4, 0.35], 47, 42),
  shot(42.5, 47.5, 'Waterline struggle and Snake hold', [63.5, 2.15, 7.3], [63.7, 1.95, 6.65], [65.77, 1.44, 0.28], [65.73, 1.31, 0.34], 41, 40, 0.045),
  shot(47.5, 52, 'Bats close the trap from above', [67, 4.45, 8.5], [66.8, 3.3, 8.2], [65.0, 1.15, 0.4], [65.1, 1.05, 0.4], 40, 37, 0.08),

  // 叁 · Search, threat, fracture the gaze, then follow the sacrificial fall.
  shot(52, 57, 'Orange scout peers along the ledge', [55.9, 5.0, 6.0], [56.7, 5.8, 8.0], [58.7, 5.4, -1.2], [59.5, 5.35, -1.4], 36, 41),
  shot(57, 62, 'Search sightline uncovers prisoners', [58, 6.4, 12], [65.6, 5, 12.2], [60.2, 4.75, -1.5], [69.6, 2.4, -1.8], 43, 39),
  shot(62, 66.5, 'Grotto ambush from scout side', [68.4, 3.8, 7.5], [69, 3.4, 6.8], [71.3, 2.55, -1.6], [71.8, 2.5, -1.8], 43, 38),
  shot(66.5, 71, 'Poison ray traverses a retreating frame', [72.2, 2.8, 7.5], [68.1, 2.9, 8], [71.2, 2.35, -1.7], [69, 2.0, -1.3], 37, 37, 0.12),
  shot(71, 76, 'Silhouette drops from ledge', [56.8, 6.2, 9], [56.4, 3.5, 12], [58.55, 4.95, -1.45], [58.8, 1.65, -1.25], 40, 46, 0.08),

  // 肆 · Match the iron-body axis until the silk changes the fight to a retreat.
  shot(76, 80.5, 'Gate charge at shoulder height', [117.8, 2.2, 7.5], [120.8, 2.45, 7.7], [120.4, 1.95, 0.3], [122.1, 1.8, 0.25], 43, 43, 0.12),
  shot(80.5, 86, 'Frontal clash lets needles cross frame', [125.2, 3.9, 9.2], [126.2, 2.55, 8.4], [127.0, 2, -0.35], [128.7, 1.85, -0.4], 45, 40, 0.12),
  shot(86, 91.5, 'Low mirror vault then landing', [130.1, 2.4, 8.2], [133.6, 3.2, 8.0], [133.5, 2.4, -1.3], [134.2, 2.2, -1.55], 44, 41, 0.12),
  shot(91.5, 93.4, 'Silk challenge, readable source and target', [134.6, 2.75, 7.3], [134.5, 2.65, 7.1], [132.55, 1.7, -0.5], [132.55, 1.7, -0.5], 38, 38),
  shot(93.4, 97, 'Binding recoil two-shot', [129.7, 2.55, 6.3], [129.4, 2.25, 6.0], [132.35, 1.65, -0.35], [132.05, 1.55, -0.3], 42, 42),
  shot(97, 102, 'Captured tableau with Scorpion behind', [128.5, 2.8, 8.2], [128.85, 3.4, 9.5], [131.45, 1.65, -0.55], [131.55, 1.7, -0.5], 38, 42),

  // 伍 · Paired attacks, then contrast a downward wine insert with freezing resistance.
  shot(102, 107.5, 'Fire charge from below', [125.5, 2.45, 9.9], [128.2, 2.4, 9.45], [128.3, 1.9, -0.45], [130.45, 1.95, -0.4], 48, 45, 0.1),
  shot(107.5, 113.5, 'Flood catches retreating demons', [133.2, 2.75, 11.2], [133.8, 4.4, 14], [130.85, 1.95, -0.5], [132.0, 2.25, -0.6], 47, 47, 0.14),
  shot(113.5, 119.5, 'Wine bowl foreground, worried brother deep', [126.5, 3.8, 6.4], [126.75, 3.2, 5.65], [129.65, 1.5, 0.35], [129.2, 1.4, 0.42], 44, 40),
  shot(119.5, 126, 'Ice advances across fire axis', [134.3, 2.65, 8.3], [132.6, 2.8, 8.8], [132.3, 1.65, 0.2], [132.1, 1.75, 0.45], 42, 37, 0.07),
  shot(126, 132, 'Two traps in one locked tableau', [129.6, 3.8, 9.1], [129.6, 3.8, 9.1], [130.35, 1.45, 0.3], [130.35, 1.45, 0.3], 40, 40),

  // 陆 · Negative space for the invisible boy, reaction cut, then the Ruyi reveal.
  shot(132, 137, 'Empty gate tracks an invisible approach', [117.9, 1.95, 6.4], [122.3, 2.7, 7.3], [120.1, 1.7, 0.4], [123.25, 1.7, 0.45], 43, 38),
  shot(137, 142.5, 'Powder follows the wrong silhouette', [125.25, 2.65, 8.5], [130.8, 2.85, 7.6], [128.35, 1.65, -0.6], [130.5, 1.7, -0.45], 42, 37),
  shot(142.5, 148, 'Decoy watches the collision from foreground', [128.3, 2.25, 7.8], [129.3, 3.3, 8.35], [131.0, 1.65, -0.3], [131.45, 1.45, -0.4], 43, 43, 0.1),
  shot(148, 153, 'Ruyi heist with sleeping guard behind', [133.25, 2.5, 5.3], [135.2, 2.2, 4.4], [135.2, 1.4, -2.1], [136.1, 1.25, -2.3], 41, 37),
  shot(153, 158, 'Release reveals relatives in depth', [132.5, 2.25, 7.8], [128.9, 3.3, 10.4], [131.3, 1.45, 0.5], [129.6, 1.65, 0.25], 42, 44, 0.06),

  // 柒 · Villains flank the bow; breadth for the six approaches, low cauldron threat.
  shot(158, 164, 'Qiwa bows between his captors', [192.0, 2.5, 10.1], [193.3, 2.4, 8.7], [195, 1.9, 1.25], [194.4, 1.55, 1.4], 48, 42),
  shot(164, 170.5, 'Wide vortex opens the approach lane', [191.5, 3.9, 12.6], [193.5, 4, 12.1], [194.8, 2.0, 1], [195.3, 2.15, 1], 46, 44, 0.08),
  shot(170.5, 179, 'Diagonal funnel reveals the last holdout', [197.2, 5.05, 12.8], [198.3, 3.95, 10.7], [194.7, 2.6, 1.25], [196.35, 2.25, 1.45], 47, 42, 0.14),
  shot(179, 188, 'Low furnace and locked captor silhouettes', [196.9, 2.5, 10.7], [196.6, 2.65, 10.3], [195, 2.3, 0], [195, 2.45, 0], 42, 40, 0.08),

  // 捌 · Rush across the foreground; ground-level sacrifice cuts to the rising orbs.
  shot(188, 194, 'Track Grandpa and intercepting Scorpion', [189.8, 2.05, 8.4], [191.05, 2.2, 8.1], [192.4, 1.65, 1.35], [194.7, 1.75, 1.25], 44, 44),
  shot(194, 197.4, 'Low witness to Grandpa falling', [192.3, 1.95, 6.2], [192.7, 1.8, 6], [194.15, 1.45, 1.65], [194.1, 1.28, 1.55], 40, 39, 0.10),
  shot(197.4, 200, 'Lotus ascends from Grandpa to rim', [191.8, 2.5, 8.1], [193.7, 3.85, 9.7], [193.7, 1.65, 1.25], [195.0, 3.0, 0.15], 41, 39),
  shot(200, 207.5, 'Linked orbs above a low foreground', [192.2, 3.4, 9.2], [193.1, 5.35, 12.8], [194.95, 2.8, 0], [195.25, 3.65, -0.1], 43, 43),
  shot(207.5, 214, 'Burst separates seven portrait silhouettes', [196.55, 3.45, 11.8], [195.7, 4.6, 15.15], [195.2, 3.3, 0.5], [195, 3.6, 0.65], 46, 49, 0.16),

  // 玖 · Hero line converges, mountain is earned in wide, fused hero owns the close.
  shot(214, 221, 'Seven versus three across the chasm', [192.2, 3.25, 13.7], [192.8, 3.85, 12.6], [194.8, 2.35, 0.8], [195.1, 2.25, 0.85], 46, 44, 0.08),
  shot(221, 228, 'Seven rising tracks reveal seal mountain', [198.7, 3.9, 12.4], [197.4, 6.3, 16.8], [195, 2.4, -0.6], [195, 4.9, -1.35], 46, 48, 0.18),
  shot(228, 234.5, 'Fused hero against summit sky', [192.4, 6.7, 9.3], [193.5, 7.7, 8.65], [195.05, 7.32, 0.35], [195.15, 7.94, 0.15], 41, 40),
  shot(234.5, 240, 'Still silhouette and complete seal', [196.15, 7.6, 17.8], [196.15, 7.6, 17.8], [195, 5.1, -1.45], [195, 5.1, -1.45], 46, 46),
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
