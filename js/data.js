'use strict';
// =============================================================
// data.js — 静的データ定義 (パレット/敵/特技/装備/ゾーン/プロローグ)
// =============================================================

const PALETTE = {
  hero:  { base:'#0a1428', panel:'#0f1d36', accent:'#c8b568', text:'#e8e0c8', textDim:'#8a8270', hp:'#a83232', mp:'#3a6aa8', border:'#5a6478', border2:'#2a3848' },
  demon: { base:'#1a0a14', panel:'#26121e', accent:'#8b3a4a', text:'#c8b8a8', textDim:'#7a6858', hp:'#6a2828', mp:'#553868', border:'#4a3848', border2:'#2a1a26' }
};

// ---- 特技 ----
const SKILLS = {
  // 勇者
  zangeki:    { name:'斬撃',     mp:3, type:'atk',   mul:1.5, desc:'武器に気を込めて 一閃。' },
  hikariNoTate:{name:'光の盾',   mp:4, type:'heal',  heal:14, desc:'光が傷を癒す。HP+14。' },
  kyouZangeki:{ name:'強斬撃',   mp:6, type:'atk',   mul:1.9, desc:'踏み込んで 強烈な 一撃。' },
  chiyu:      { name:'治癒の光', mp:8, type:'heal',  heal:28, desc:'温かな光で 大きく 回復。' },
  seiken:     { name:'聖剣',     mp:10,type:'atk',   mul:2.5, sure:true, desc:'聖なる必中の 一撃。' },
  // 魔王
  yamiUchi:   { name:'闇撃',     mp:3, type:'atk',   mul:1.6, desc:'闇の刃で 斬る。' },
  kyuumei:    { name:'吸命撃',   mp:5, type:'drain', mul:1.7, desc:'与ダメ半分を 吸収。' },
  yamiShibari:{ name:'闇縛り',   mp:6, type:'atk',   mul:1.9, desc:'闇が敵を 縛り 強打。' },
  gouka:      { name:'業火',     mp:8, type:'atk',   mul:2.2, desc:'魔界の業火で 焼き払う。' },
  horobi:     { name:'滅びの呪', mp:11,type:'pierce',mul:2.6, desc:'守備を半分無視 する呪詛。' },
};

// 習得 (Lv => skill keys)。Lv1 は初期。
const SKILL_LEARN = {
  hero:  { 1:['zangeki','hikariNoTate'], 3:['kyouZangeki'], 5:['chiyu'], 7:['seiken'] },
  demon: { 1:['yamiUchi','kyuumei'],     3:['yamiShibari'], 5:['gouka'],  7:['horobi'] },
};

// ---- プレイヤー初期 ----
const PLAYER_TEMPLATE = {
  hero: {
    title:'勇者', defaultName:'アレン', sprite:'hero',
    hp:26, maxHp:26, mp:10, maxMp:10, atk:6, def:5, eva:6,
    lv:1, exp:0, gold:30,
    skills:['zangeki','hikariNoTate'],
    weapon:'bronzeSword', armor:'cloth',
    pointsAvail: 0,
  },
  demon: {
    title:'魔王軍幹部', defaultName:'ヴェルク', sprite:'demon',
    hp:32, maxHp:32, mp:12, maxMp:12, atk:10, def:7, eva:10,
    lv:1, exp:0, gold:30,
    skills:['yamiUchi','kyuumei'],
    weapon:'rustyClaw', armor:'darkCloak',
    pointsAvail: 0,
  }
};

const STAT_PT = [
  { key:'たいりょく', stat:'maxHp', amount:2, hint:'最大HP +2' },
  { key:'きあい',     stat:'maxMp', amount:2, hint:'最大MP +2' },
  { key:'ちから',     stat:'atk',   amount:1, hint:'攻撃 +1' },
  { key:'まもり',     stat:'def',   amount:1, hint:'守備 +1' },
  { key:'みのこなし', stat:'eva',   amount:1, hint:'回避 +1%' },
];

function requiredExp(route, lv){
  if (route === 'hero') return Math.floor(6 * Math.pow(lv, 1.4));
  return Math.floor(11 * Math.pow(lv, 1.55));
}
const LEVEL_GAIN = {
  hero:  { hp:3, mp:1, atk:1, def:1, eva:0, points:2 },
  demon: { hp:5, mp:2, atk:2, def:1, eva:1, points:0 }
};

// ---- 装備 ----
// route: 'hero'|'demon'|'any'
const WEAPONS = {
  // 共通(初期)
  bronzeSword: { name:'銅の剣',   atk:2, price:60,  route:'hero', tint:'#a8744a' },
  rustyClaw:   { name:'錆びた爪', atk:3, price:60,  route:'demon', tint:'#5a4838' },
  // ドロップ/商人
  ironSword:   { name:'鉄の剣',   atk:4, price:160, route:'hero', tint:'#a8a8b8' },
  silverSword: { name:'銀の剣',   atk:6, price:380, route:'hero', tint:'#d8d8e0' },
  holyBlade:   { name:'聖なる剣', atk:8, price:780, route:'hero', tint:'#f0e8a8' },
  blackBlade:  { name:'闇の刃',   atk:4, price:160, route:'demon', tint:'#3a2a4a' },
  cursedFang:  { name:'呪いの牙', atk:6, price:380, route:'demon', tint:'#5a2838' },
  doomScythe:  { name:'破滅の鎌', atk:8, price:780, route:'demon', tint:'#682838' },
};
const ARMORS = {
  cloth:       { name:'布の服',   def:0, price:40,  route:'hero', tint:'#9a8a6a' },
  darkCloak:   { name:'闇のローブ',def:1,price:40,  route:'demon', tint:'#3a2a3a' },
  leather:     { name:'革の鎧',   def:2, price:130, route:'hero', tint:'#8a6a3a' },
  chain:       { name:'鎖帷子',   def:4, price:300, route:'hero', tint:'#8898a8' },
  holyMail:    { name:'聖鎧',     def:6, price:620, route:'hero', tint:'#e0d8b0' },
  boneArmor:   { name:'骨の鎧',   def:3, price:130, route:'demon', tint:'#a89c80' },
  necroPlate:  { name:'死霊の鎧', def:5, price:300, route:'demon', tint:'#3a3a5a' },
  voidArmor:   { name:'虚無の鎧', def:7, price:620, route:'demon', tint:'#48283a' },
};

// ---- 敵 ----
const ENEMIES = {
  slime:      { name:'スライム',     hp:9,  atk:4,  def:2, eva:4,  exp:4,  gold:8,  sprite:'slime',     color:'#5aa080' },
  batto:      { name:'大コウモリ',   hp:7,  atk:5,  def:1, eva:20, exp:5,  gold:10, sprite:'batto',     color:'#5a4868' },
  goblin:     { name:'ゴブリン',     hp:13, atk:6,  def:3, eva:8,  exp:8,  gold:14, sprite:'goblin',    color:'#7a8a48' },
  orc:        { name:'オーク',       hp:22, atk:9,  def:5, eva:5,  exp:14, gold:22, sprite:'orc',       color:'#8a5a3a' },
  ankoku:     { name:'暗黒戦士',     hp:26, atk:10, def:6, eva:10, exp:18, gold:28, sprite:'ankoku',    color:'#3a3a5a' },
  shitennou:  { name:'四天王アズマ', hp:42, atk:13, def:7, eva:8,  exp:32, gold:55, sprite:'shitennou', color:'#a85838' },
  maou:       { name:'魔王ザギル',   hp:120,atk:19, def:12,eva:14, exp:0,  gold:0,  sprite:'maou',      color:'#683048' },

  adventurer: { name:'冒険者',       hp:10, atk:6,  def:2, eva:6,  exp:6,  gold:9,  sprite:'adv',       color:'#a89878' },
  shinkan:    { name:'神官',         hp:12, atk:5,  def:3, eva:8,  exp:8,  gold:12, sprite:'shinkan',   color:'#d8c8a8' },
  knight:     { name:'騎士',         hp:16, atk:9,  def:4, eva:6,  exp:11, gold:18, sprite:'knight',    color:'#8898b0' },
  paladin:    { name:'聖騎士',       hp:24, atk:12, def:5, eva:8,  exp:18, gold:28, sprite:'paladin',   color:'#c8c0a8' },
  taichou:    { name:'戦士長',       hp:30, atk:13, def:6, eva:7,  exp:22, gold:34, sprite:'taichou',   color:'#a09078' },
  sage:       { name:'賢者ミラ',     hp:38, atk:16, def:6, eva:16, exp:32, gold:55, sprite:'sage',      color:'#a890c8' },
  yuusha:     { name:'勇者リオン',   hp:128,atk:20, def:12,eva:16, exp:0,  gold:0,  sprite:'yuusha',    color:'#c8b568' },
};

// ---- ゾーン (進軍) ----
// 自軍進行速度範囲 ownSp、敵進行速度範囲 enSp、(/tick %)
const ZONES = {
  hero: [
    { name:'辺境の草原', enemies:['slime','batto'],           dist:0.10, ownSp:[1.4,2.6], enSp:[0.8,1.6], msg:'柔らかな風が草原を 渡る。' },
    { name:'暗き森',     enemies:['slime','batto','goblin'],  dist:0.28, ownSp:[1.2,2.4], enSp:[0.9,1.8], msg:'木々がざわめき、ゴブリンの 気配。' },
    { name:'岩山の道',   enemies:['goblin','orc'],            dist:0.48, ownSp:[1.0,2.2], enSp:[1.0,2.0], msg:'ごつごつとした岩山。咆哮が 響く。' },
    { name:'呪われた砦', enemies:['orc','ankoku'],            dist:0.68, ownSp:[0.9,2.0], enSp:[1.1,2.1], msg:'打ち捨てられた砦。暗黒の 戦士。' },
    { name:'魔王城外郭', enemies:['ankoku','shitennou'],      dist:0.88, ownSp:[0.8,1.8], enSp:[1.2,2.2], msg:'黒い城壁。門前に 四天王。' },
  ],
  demon: [
    { name:'魔界の入口', enemies:['adventurer','shinkan'],          dist:0.10, ownSp:[1.1,2.0], enSp:[1.2,2.4], msg:'人間どもが 押し寄せて くる。' },
    { name:'人界の森',   enemies:['adventurer','shinkan','knight'], dist:0.28, ownSp:[1.0,1.9], enSp:[1.3,2.4], msg:'騎士団の哨戒部隊が 来た。' },
    { name:'街道',       enemies:['knight','taichou'],              dist:0.48, ownSp:[0.9,1.8], enSp:[1.4,2.5], msg:'街道に 戦士長率いる 隊。' },
    { name:'王城前',     enemies:['taichou','paladin'],             dist:0.68, ownSp:[0.8,1.7], enSp:[1.5,2.6], msg:'王都の城壁。精鋭が 並ぶ。' },
    { name:'光の聖堂',   enemies:['paladin','sage'],                dist:0.88, ownSp:[0.8,1.6], enSp:[1.5,2.6], msg:'眩い光に満ちた聖堂。賢者ミラ。' },
  ]
};
const FINAL_BOSS = { hero:'maou', demon:'yuusha' };

// ---- 道具 ----
const ITEMS = {
  yakusou:    { name:'やくそう',   type:'heal',   amount:18, price:30,  desc:'HPを 18 回復する。' },
  mahouNoMizu:{ name:'魔法の水',   type:'mp',     amount:10, price:50,  desc:'MPを 10 回復する。' },
  motheRoot:  { name:'母なる根',   type:'fullHp',            price:200, desc:'HPを 全回復する。希少。' },
};

// ---- プロローグ ----
const PROLOGUE = {
  hero: [
    '― 暦 998 年、大陸は 長き戦の 最中にあった。',
    '魔王ザギルは 四天王を率い、人界を 蝕み続けている。',
    '',
    'そなたは 辺境の村に 生まれた 若き戦士。',
    '王より 聖剣を 授かり、',
    '魔王城へと 旅立つことになった。',
    '',
    '― これは、ひとつの 道の 物語である。',
  ],
  demon: [
    '― 暦 998 年、大陸は 長き戦の 最中にあった。',
    '人間どもは 勇者リオンを 担ぎ、',
    '我ら 魔族の 領土を 侵し続けている。',
    '',
    'そなたは 魔王ザギルに 仕える 若き幹部。',
    '魔王の 命を受け、',
    '人界へと 進軍することになった。',
    '',
    '― これは、もう ひとつの 道の 物語である。',
  ]
};

// ---- カナ入力 ----
const NAME_CHARS = [
  'アイウエオカキクケコ',
  'サシスセソタチツテト',
  'ナニヌネノハヒフヘホ',
  'マミムメモヤユヨラリ',
  'ルレロワヲンー゛゜　',
];
const NAME_GRID_ROWS = 5;
const NAME_GRID_COLS = 10;
const NAME_MAX = 6;

// ---- チュートリアル ----
const TUTORIAL_PAGES = [
  { title:'基本ルール', lines:[
    '・自軍と敵軍は 自動で 進軍する。',
    '・衝突したら エンカウント = 戦闘。',
    '・戦闘中以外は メニューを 開いて',
    '  装備変更・特技確認・道具使用 可能。',
    '・5 エリア進めば 最終決戦。',
  ]},
  { title:'戦闘の 基本', lines:[
    '・攻撃: 通常攻撃。10% 会心。',
    '・特技: MP消費。Lv 3/5/7 で 増える。',
    '・防御: 被ダメ半減 + 回避+10%。',
    '・道具/装備: 戦闘中も 使える。',
    '・逃げる: ボス以外で 60% 成功。',
  ]},
  { title:'成長と 装備', lines:[
    '・勇者: Lv up で ステ振り 2pt。',
    '・魔王: Lv up で 自動成長 大。',
    '・特技は Lv 3/5/7 で 自動習得。',
    '・敵から 装備が ドロップする。',
    '・進軍中 商人が 出ることがある。',
  ]},
  { title:'設定・操作', lines:[
    '・タイトル「せってい」で 音量/拡大/',
    '  キー割当 を 変更できる。',
    '・全画面 タップ/クリック 操作対応。',
    '・コマンドは タップで 直接実行。',
  ]},
];
