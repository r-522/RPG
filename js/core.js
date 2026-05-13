'use strict';
// =============================================================
// core.js — 状態 / 設定 / 入力 / オーディオ / 描画基盤 / スプライト / フェード
// =============================================================

const cvs = document.getElementById('screen');
const ctx = cvs.getContext('2d');
ctx.imageSmoothingEnabled = false;
const W = 640, H = 480;

const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const randF = (lo, hi) => Math.random() * (hi - lo) + lo;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---- 設定 ----
const DEFAULT_SETTINGS = {
  scanline: false,
  pixelLarge: false,
  seVolume: 5,
  seEnabled: true,
  keys: {
    up:     ['ArrowUp','KeyW'],
    down:   ['ArrowDown','KeyS'],
    left:   ['ArrowLeft','KeyA'],
    right:  ['ArrowRight','KeyD'],
    ok:     ['Enter','Space','KeyZ'],
    cancel: ['Escape','KeyX','Backspace'],
  }
};
const SETTINGS = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
function loadSettings(){
  try {
    const s = localStorage.getItem('twoPaths_settings');
    if (s){
      const parsed = JSON.parse(s);
      if (parsed && typeof parsed === 'object'){
        Object.assign(SETTINGS, parsed);
        SETTINGS.keys = Object.assign({}, DEFAULT_SETTINGS.keys, parsed.keys || {});
      }
    }
  } catch(e){}
}
function saveSettings(){
  try { localStorage.setItem('twoPaths_settings', JSON.stringify(SETTINGS)); } catch(e){}
}
loadSettings();

// ---- ステート (グローバル) ----
const gameState = {
  scene: 'title',
  route: null,
  player: null,
  zoneIndex: 0,
  enemy: null,
  battlePhase: 'menu',
  cursor: 0,
  subCursor: 0,
  messages: [],
  damages: [],
  effects: [],            // 攻撃エフェクト粒子
  shake: 0, flash: 0,
  fade: 0, fadeDir: 0, fadeNext: null,
  endingType: null,
  endingText: [], endingLine: 0, endingChar: 0, endingDoneTimer: 0,
  prologueText: [], prologueLine: 0, prologueChar: 0, prologueDoneTimer: 0,
  routeDetailCursor: 0,
  nameInput: '',
  nameCursor: 0,
  inventory: { yakusou:2, mahouNoMizu:1, motheRoot:0 },
  showTutorial: false,
  tutorialPage: 0,
  mapMsg: '', mapMsgTimer: 0,
  defending: false,
  msgTimer: 0, nextPhase: null,
  battleTutorialDone: false,
  mapTutorialDone: false,
  subScene: null,
  titleCursor: 0,
  settingsCat: 0, settingsItem: 0,
  rebindKey: null,
  pendingZoneAdvance: false,
  pendingFinal: false,
  statAllocCursor: 0,
  // 進軍
  ownDist: 0,
  enemyDist: 0,
  marchTick: 0,
  marchPaused: false,
  // アニメ
  animTime: 0,
  playerAnim: 'idle', playerAnimTime: 0,
  enemyAnim: 'idle',  enemyAnimTime: 0,
  // 商人
  merchant: null, merchantTab: 0,
  merchantInventory: [],
  pendingMerchant: false,
  // 装備メニュー
  equipCursor: 0, equipSlot: 0, equipListCursor: 0,
};

// ---- 入力: キー ----
const input = { up:false, down:false, left:false, right:false, ok:false, cancel:false };
const justPressed = {};

function actionForCode(code){
  for (const action in SETTINGS.keys){
    if (SETTINGS.keys[action].includes(code)) return action;
  }
  return null;
}
window.addEventListener('keydown', (e) => {
  if (gameState.rebindKey){
    if (e.code === 'Escape'){ gameState.rebindKey = null; e.preventDefault(); return; }
    SETTINGS.keys[gameState.rebindKey] = [e.code];
    saveSettings();
    gameState.rebindKey = null;
    SE.confirm();
    e.preventDefault();
    return;
  }
  const a = actionForCode(e.code);
  if (a){
    if (!input[a]) justPressed[a] = true;
    input[a] = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  const a = actionForCode(e.code);
  if (a){ input[a] = false; e.preventDefault(); }
});
cvs.addEventListener('click', () => cvs.focus());

function consume(name){ if (justPressed[name]){ justPressed[name]=false; return true;} return false; }
function clearJust(){ for (const k in justPressed) justPressed[k]=false; }

// ---- 入力: ポインタ ----
const clickables = [];
function clearClicks(){ clickables.length = 0; }
function addClick(x, y, w, h, action){
  clickables.push({ x, y, w, h, action });
}
function getCanvasPoint(clientX, clientY){
  const rect = cvs.getBoundingClientRect();
  const px = (clientX - rect.left) * (W / rect.width);
  const py = (clientY - rect.top) * (H / rect.height);
  return { x: px, y: py };
}
function handlePointer(clientX, clientY){
  getAudio();
  const { x, y } = getCanvasPoint(clientX, clientY);
  for (let i = clickables.length - 1; i >= 0; i--){
    const c = clickables[i];
    if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h){
      if (c.action) c.action();
      return true;
    }
  }
  return false;
}
cvs.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  cvs.focus();
  handlePointer(e.clientX, e.clientY);
}, { passive: false });

// ---- オーディオ (Web Audio API 合成) ----
let audioCtx = null;
function getAudio(){
  if (!audioCtx){
    try { audioCtx = new (window.AudioContext||window.webkitAudioContext)(); } catch(e){}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}
function playTone(freq, dur, type, gain){
  if (!SETTINGS.seEnabled || SETTINGS.seVolume <= 0) return;
  const ac = getAudio(); if (!ac) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type || 'square';
  o.frequency.value = freq;
  const vol = (SETTINGS.seVolume / 10) * (gain || 0.15);
  g.gain.value = vol;
  o.connect(g); g.connect(ac.destination);
  const now = ac.currentTime;
  o.start(now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.stop(now + dur + 0.02);
}
const SE = {
  cursor:  () => playTone(880, 0.04, 'square', 0.08),
  confirm: () => playTone(1320, 0.08, 'square', 0.12),
  cancel:  () => playTone(440, 0.08, 'square', 0.10),
  hit:     () => playTone(220, 0.10, 'sawtooth', 0.18),
  crit:    () => { playTone(330,0.05,'square',0.15); setTimeout(()=>playTone(660,0.10,'sawtooth',0.2),30); },
  damage:  () => playTone(140, 0.16, 'sawtooth', 0.18),
  miss:    () => playTone(720, 0.05, 'sine', 0.12),
  heal:    () => playTone(1760, 0.18, 'sine', 0.14),
  cast:    () => { playTone(660, 0.06, 'triangle', 0.12); setTimeout(()=>playTone(880,0.06,'triangle',0.12),50); setTimeout(()=>playTone(1320,0.08,'triangle',0.14),100); },
  item:    () => playTone(1480, 0.10, 'triangle', 0.14),
  coin:    () => { playTone(1760,0.05,'square',0.12); setTimeout(()=>playTone(1320,0.08,'square',0.12),50); },
  levelup: () => { [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,0.12,'square',0.15), i*70)); },
  victory: () => { [523,659,784].forEach((f,i)=>setTimeout(()=>playTone(f,0.18,'triangle',0.18), i*110)); },
  defeat:  () => { [392,330,262,196].forEach((f,i)=>setTimeout(()=>playTone(f,0.22,'triangle',0.18), i*170)); },
  fanfare: () => { [523,659,784,1047,1319].forEach((f,i)=>setTimeout(()=>playTone(f,0.18,'square',0.18), i*100)); },
  encounter: () => { [392,523,392,523].forEach((f,i)=>setTimeout(()=>playTone(f,0.10,'square',0.14), i*70)); },
};

// ---- 描画基盤 ----
function pal(){ return gameState.route ? PALETTE[gameState.route] : PALETTE.hero; }

function drawWindow(x, y, w, h, opts){
  opts = opts || {};
  const p = pal();
  const fill = opts.fill || p.panel;
  const border = opts.border || p.border;
  const border2 = opts.border2 || p.border2;
  const hi = opts.highlight || false;
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hi ? p.accent : border; ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = border2; ctx.lineWidth = 1;
  ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
}
function drawText(text, x, y, opts){
  opts = opts || {};
  const size = opts.size || 14;
  const color = opts.color || pal().text;
  const align = opts.align || 'left';
  ctx.font = size + 'px "ＭＳ ゴシック","Osaka-Mono",monospace';
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  if (opts.shadow !== false){
    ctx.fillStyle = '#000';
    ctx.fillText(text, x + 1, y + 1);
  }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}
function drawBar(x, y, w, h, ratio, color){
  const p = pal();
  ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color; ctx.fillRect(x + 1, y + 1, Math.floor((w - 2) * clamp(ratio, 0, 1)), h - 2);
  ctx.strokeStyle = p.border; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}
function fillBg(){ ctx.fillStyle = pal().base; ctx.fillRect(0, 0, W, H); }
function drawScanlines(){
  if (!SETTINGS.scanline) return;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);
}

// ---- スプライト ----
const SPR = {
  slime: ['..........','..........','....11....','...1111...','..111111..','..1.11.1..','.11111111.','.11111111.','..11..11..','..........'],
  batto: ['..1....1..','.11....11.','111....111','1.111111.1','1.111111.1','.11.11.11.','..11..11..','...1..1...','..........','..........'],
  goblin:['..1..1....','..1111....','.111111...','.1.11.1...','.111111...','..1111....','.1.11.1...','111111111.','..1..1....','.11..11...'],
  orc:   ['..1111....','.111111...','11.11.11..','11111111..','11.11.11..','11111111..','.111111...','1111111111','11.1111.11','.11....11.'],
  ankoku:['....1.....','...111....','..1.1.1...','...111....','..11111...','.1111111..','11.111.11','.1111111..','..11.11...','.11...11..'],
  shitennou:['....11....','...1111...','..1.11.1..','..111111..','.11111111.','111.11.111','.11111111.','.11111111.','..11..11..','..1....1..'],
  maou:  ['11......11','11......11','.11.11.11.','.1.1111.1.','.11.11.11.','11111111.1','11.1111.11','11111111.1','.11.11.11.','.1..11..1.'],
  adv:   ['....11....','....11....','...1111...','...1..1...','..111111..','.1.1111.1.','...1111...','...1..1...','..11..11..','..11..11..'],
  shinkan:['...1111...','..111111..','..1.11.1..','..111111..','.11111111.','11.1111.11','.11111111.','...1111...','..11..11..','.11....11.'],
  knight:['....11....','...1111...','..1.11.1..','...1111...','..111111..','.11111111.','..111111..','..1.11.1..','..11..11..','.11....11.'],
  paladin:['....11....','...1111...','...1111...','..1.11.1..','..111111..','.11111111.','.1.1111.1.','.11111111.','...1..1...','..11..11..'],
  taichou:['...1111...','..111111..','.1.1111.1.','..1.11.1..','.11111111.','111.11.111','.11111111.','..111111..','..1.11.1..','.11....11.'],
  sage:  ['...1111...','..111111..','.111111111','.1.1111.1.','..111111..','...1111...','..111111..','.11111111.','..11..11..','.11....11.'],
  yuusha:['....11....','...1111...','..1.11.1..','...1111...','...1..1...','..111111..','.1.1111.1.','...1111...','..11..11..','..11..11..'],
  hero:  ['....11....','...1111...','..1.11.1..','...1111...','..111111..','.11.11.11.','..111111..','..1.11.1..','..11..11..','.11....11.'],
  demon: ['.1......1.','11......11','.11.11.11.','.1.1111.1.','..111111..','.11.11.11.','..111111..','.11.11.11.','..11..11..','..1....1..'],
  merchant:['..1111....','.111111...','.1.11.1...','.111111...','111111111.','1.111111.1','..111111..','..1.11.1..','..11..11..','.11....11.'],
};

function drawSprite(spriteKey, cx, cy, dot, color){
  const grid = SPR[spriteKey]; if (!grid) return;
  const w = grid[0].length * dot;
  const h = grid.length * dot;
  const x0 = Math.floor(cx - w / 2);
  const y0 = Math.floor(cy - h / 2);
  ctx.fillStyle = color;
  for (let r = 0; r < grid.length; r++){
    for (let c = 0; c < grid[r].length; c++){
      if (grid[r][c] === '1') ctx.fillRect(x0 + c * dot, y0 + r * dot, dot, dot);
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.fillRect(x0 + 4, y0 + h + 2, w - 8, 3);
}

// プレイヤー描画 (装備反映 + アニメ)
function drawPlayer(cx, cy, dot){
  const pl = gameState.player;
  const p = pal();
  // アニメオフセット
  let ox = 0, oy = 0, weaponDx = 0, glow = 0;
  if (gameState.playerAnim === 'idle'){
    oy = Math.sin(gameState.animTime * 0.08) * 1.2;
  } else if (gameState.playerAnim === 'attack'){
    const t = gameState.playerAnimTime / 18;
    ox = Math.sin(t * Math.PI) * 12;
    weaponDx = Math.sin(t * Math.PI) * 8;
  } else if (gameState.playerAnim === 'cast'){
    glow = Math.sin(gameState.playerAnimTime * 0.4) * 0.5 + 0.5;
  } else if (gameState.playerAnim === 'hurt'){
    ox = randInt(-2, 2);
  }
  // 本体
  drawSprite(pl.sprite, cx + ox, cy + oy, dot, p.accent);
  // 詠唱グロー
  if (glow > 0){
    ctx.globalAlpha = 0.4 * glow;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.arc(cx + ox, cy + oy, dot * 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // 装備: 武器(右側に小スプライト)
  const wk = pl.weapon ? WEAPONS[pl.weapon] : null;
  if (wk){
    const wx = cx + ox + dot * 5 + weaponDx;
    const wy = cy + oy - dot;
    ctx.fillStyle = wk.tint || '#aaa';
    ctx.fillRect(wx, wy - dot * 2, Math.max(2, dot - 1), dot * 4);
    ctx.fillRect(wx - dot, wy - dot * 2, Math.max(2, dot * 2), Math.max(2, dot - 1));
  }
  // 装備: 防具(胴のラインを 色オーバーレイ)
  const ak = pl.armor ? ARMORS[pl.armor] : null;
  if (ak && ak.tint){
    ctx.fillStyle = ak.tint;
    // 胴体 (6,7行目あたり) を塗る
    const grid = SPR[pl.sprite];
    const baseX = cx + ox - (grid[0].length * dot) / 2;
    const baseY = cy + oy - (grid.length * dot) / 2;
    for (let r = 5; r <= 7; r++){
      for (let c = 0; c < grid[r].length; c++){
        if (grid[r][c] === '1') ctx.fillRect(baseX + c * dot, baseY + r * dot, dot, dot);
      }
    }
  }
}

// 敵描画 (アニメ)
function drawEnemy(cx, cy, dot){
  const en = gameState.enemy;
  let ox = 0, oy = 0;
  if (gameState.enemyAnim === 'idle'){
    oy = Math.sin(gameState.animTime * 0.07 + 1.0) * 1.5;
  } else if (gameState.enemyAnim === 'attack'){
    const t = gameState.enemyAnimTime / 18;
    ox = -Math.sin(t * Math.PI) * 10;
  } else if (gameState.enemyAnim === 'hurt'){
    ox = randInt(-3, 3);
  }
  drawSprite(en.sprite, cx + ox, cy + oy, dot, en.color);
}

// ---- フェード ----
function startFade(onMid){ gameState.fade = 0.01; gameState.fadeDir = 1; gameState.fadeNext = onMid; }
function updateFade(){
  if (gameState.fade <= 0) return;
  gameState.fade += gameState.fadeDir * 0.08;
  if (gameState.fade >= 1 && gameState.fadeDir > 0){
    gameState.fade = 1;
    if (gameState.fadeNext){ gameState.fadeNext(); gameState.fadeNext = null; }
    gameState.fadeDir = -1; clearJust();
  } else if (gameState.fade <= 0 && gameState.fadeDir < 0){
    gameState.fade = 0; gameState.fadeDir = 0;
  }
}
function drawFade(){
  if (gameState.fade <= 0) return;
  ctx.fillStyle = 'rgba(0,0,0,' + gameState.fade + ')';
  ctx.fillRect(0,0,W,H);
}
