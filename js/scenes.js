'use strict';
// =============================================================
// scenes.js — 各シーンの update/draw
// =============================================================

// =============================================================
// タイトル
// =============================================================
const TITLE_MENU = ['はじめる', 'せってい'];

function updateTitle(){
  if (gameState.fade > 0) return;
  if (consume('up')){   gameState.titleCursor = (gameState.titleCursor + TITLE_MENU.length - 1) % TITLE_MENU.length; SE.cursor(); }
  if (consume('down')){ gameState.titleCursor = (gameState.titleCursor + 1) % TITLE_MENU.length; SE.cursor(); }
  if (consume('ok')) titleAction(gameState.titleCursor);
}
function titleAction(i){
  SE.confirm();
  if (i === 0) startFade(() => { gameState.scene = 'route_select'; gameState.routeDetailCursor = 0; });
  else if (i === 1) startFade(() => { gameState.scene = 'settings'; gameState.settingsCat = 0; gameState.settingsItem = 0; });
}
function drawTitle(){
  clearClicks();
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1;
  for (let y = 80; y < H; y += 40){ ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(W-40,y); ctx.stroke(); }
  drawText('双 つ の 旅 路', W/2, 80, { size:20, align:'center', color:'#c8b568' });
  drawText('TWO  PATHS', W/2, 118, { size:14, align:'center', color:'#5a6478' });
  drawText('～勇者と魔王、二つの物語～', W/2, 152, { size:14, align:'center', color:'#8a8270' });
  const lines = [
    '長き戦の 最中、大陸は 二つに 裂かれていた。',
    '人界を率いる 勇者リオン。魔族を統べる 魔王ザギル。',
    'そなたは どちらの 道を 歩むか。',
  ];
  for (let i = 0; i < lines.length; i++)
    drawText(lines[i], W/2, 200 + i*22, { size:13, align:'center', color:'#a89e84' });

  const mx = 220, my = 290, mw = 200, mh = 100;
  ctx.fillStyle = '#0f1d36'; ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = '#c8b568'; ctx.lineWidth = 2; ctx.strokeRect(mx+1,my+1,mw-2,mh-2);
  ctx.strokeStyle = '#2a3848'; ctx.strokeRect(mx+4,my+4,mw-8,mh-8);
  for (let i = 0; i < TITLE_MENU.length; i++){
    const sel = (i === gameState.titleCursor);
    const ix = mx + 20, iy = my + 18 + i * 36, iw = mw - 40, ih = 30;
    if (sel){ ctx.fillStyle = 'rgba(200,181,104,0.18)'; ctx.fillRect(ix, iy - 2, iw, ih); }
    drawText((sel?'▶ ':'  ') + TITLE_MENU[i], mx + mw/2, iy + 4, { size:16, align:'center', color: sel ? '#c8b568' : '#e8e0c8' });
    addClick(ix, iy - 2, iw, ih, () => { gameState.titleCursor = i; titleAction(i); });
  }
  drawText('Ver 4.0', W - 16, H - 24, { size:12, align:'right', color:'#3a3a4a' });
}

// =============================================================
// 設定
// =============================================================
function settingsCategories(){
  return [
    { label:'グラフィック', items: graphicsItems() },
    { label:'サウンド',     items: soundItems() },
    { label:'キーバインド', items: keyItems() },
    { label:'もどる',       items: [] },
  ];
}
function graphicsItems(){
  return [
    { label:'スキャンライン', value: SETTINGS.scanline ? 'ON' : 'OFF', toggle:() => { SETTINGS.scanline = !SETTINGS.scanline; saveSettings(); SE.confirm(); } },
    { label:'ピクセル拡大',   value: SETTINGS.pixelLarge ? 'ON' : 'OFF', toggle:() => { SETTINGS.pixelLarge = !SETTINGS.pixelLarge; saveSettings(); SE.confirm(); } },
  ];
}
function soundItems(){
  return [
    { label:'効果音', value: SETTINGS.seEnabled ? 'ON' : 'OFF', toggle:() => { SETTINGS.seEnabled = !SETTINGS.seEnabled; saveSettings(); SE.confirm(); } },
    { label:'音量',   value: '◀ ' + SETTINGS.seVolume + ' ▶', left:() => { SETTINGS.seVolume = Math.max(0, SETTINGS.seVolume - 1); saveSettings(); SE.cursor(); }, right:() => { SETTINGS.seVolume = Math.min(10, SETTINGS.seVolume + 1); saveSettings(); SE.confirm(); } },
  ];
}
const KEY_ROW_LABELS = [['up','上'],['down','下'],['left','左'],['right','右'],['ok','決定'],['cancel','取消']];
function keyItems(){
  return KEY_ROW_LABELS.map(([k, lbl]) => ({
    label: lbl, value: (SETTINGS.keys[k] || []).map(prettyKey).join(' / '),
    toggle:() => { gameState.rebindKey = k; SE.confirm(); }
  }));
}
function prettyKey(code){
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Arrow')) return code.slice(5);
  return code;
}

function updateSettings(){
  if (gameState.fade > 0) return;
  if (gameState.rebindKey) return;
  const cats = settingsCategories();
  if (consume('left')){ gameState.settingsCat = (gameState.settingsCat + cats.length - 1) % cats.length; gameState.settingsItem = 0; SE.cursor(); }
  if (consume('right')){ gameState.settingsCat = (gameState.settingsCat + 1) % cats.length; gameState.settingsItem = 0; SE.cursor(); }
  if (consume('cancel')){ SE.cancel(); startFade(() => { gameState.scene = 'title'; }); return; }
  const cat = cats[gameState.settingsCat];
  if (cat.items.length > 0){
    if (consume('up')){ gameState.settingsItem = (gameState.settingsItem + cat.items.length - 1) % cat.items.length; SE.cursor(); }
    if (consume('down')){ gameState.settingsItem = (gameState.settingsItem + 1) % cat.items.length; SE.cursor(); }
    const it = cat.items[gameState.settingsItem];
    if (consume('ok')){ if (it.toggle) it.toggle(); else if (it.right) it.right(); }
    if (consume('left')) { if (it.left) it.left(); else SE.cursor(); }
  } else {
    if (consume('ok')){ SE.cancel(); startFade(() => { gameState.scene = 'title'; }); }
  }
}
function drawSettings(){
  clearClicks();
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H);
  drawText('せってい', W/2, 24, { size:20, align:'center', color:'#c8b568' });

  const cats = settingsCategories();
  const tabY = 60, tabH = 32, tabW = W / cats.length;
  for (let i = 0; i < cats.length; i++){
    const x = i * tabW;
    const sel = (i === gameState.settingsCat);
    ctx.fillStyle = sel ? '#0f1d36' : '#06101e';
    ctx.fillRect(x, tabY, tabW, tabH);
    ctx.strokeStyle = sel ? '#c8b568' : '#2a3848';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(x + 1, tabY + 1, tabW - 2, tabH - 2);
    drawText(cats[i].label, x + tabW/2, tabY + 9, { size:13, align:'center', color: sel ? '#c8b568' : '#8a8270' });
    addClick(x, tabY, tabW, tabH, () => { gameState.settingsCat = i; gameState.settingsItem = 0; SE.cursor(); });
  }
  const bx = 30, by = tabY + tabH + 10, bw = W - 60, bh = H - by - 60;
  ctx.fillStyle = '#0f1d36'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#5a6478'; ctx.lineWidth = 2; ctx.strokeRect(bx+1, by+1, bw-2, bh-2);
  ctx.strokeStyle = '#2a3848'; ctx.strokeRect(bx+4, by+4, bw-8, bh-8);

  const cat = cats[gameState.settingsCat];
  if (cat.items.length === 0){
    drawText('タイトルへ もどる', W/2, by + bh/2 - 8, { size:16, align:'center', color:'#c8b568' });
    addClick(bx, by, bw, bh, () => { SE.cancel(); startFade(() => { gameState.scene = 'title'; }); });
  } else {
    for (let i = 0; i < cat.items.length; i++){
      const it = cat.items[i];
      const sel = (i === gameState.settingsItem);
      const yy = by + 30 + i * 40;
      if (sel){ ctx.fillStyle = 'rgba(200,181,104,0.12)'; ctx.fillRect(bx + 8, yy - 4, bw - 16, 36); }
      drawText((sel?'▶ ':'  ') + it.label, bx + 30, yy + 4, { size:15, color: sel ? '#c8b568' : '#e8e0c8' });
      drawText(it.value, bx + bw - 30, yy + 4, { size:15, color: sel ? '#c8b568' : '#a89e84', align:'right' });
      addClick(bx + 8, yy - 4, bw - 16, 36, () => {
        gameState.settingsItem = i;
        if (it.toggle) it.toggle();
        else if (it.right) it.right();
      });
    }
    if (gameState.settingsCat === 2)
      drawText('項目を選び Z または タップで キー入力待ちに 入る', W/2, by + bh - 30, { size:11, align:'center', color:'#7a7a8a' });
  }

  drawText('←→ タブ   ↑↓ 項目   Z 変更   X タイトル', W/2, H - 28, { size:11, align:'center', color:'#5a5a6a' });

  if (gameState.rebindKey){
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
    const rw = 360, rh = 120;
    const rx = W/2 - rw/2, ry = H/2 - rh/2;
    ctx.fillStyle = '#0f1d36'; ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#c8b568'; ctx.lineWidth = 2; ctx.strokeRect(rx+1, ry+1, rw-2, rh-2);
    drawText('新しいキーを 押してください', W/2, ry + 28, { size:14, align:'center', color:'#c8b568' });
    drawText('(' + (KEY_ROW_LABELS.find(r => r[0] === gameState.rebindKey)||['',''])[1] + ')', W/2, ry + 56, { size:14, align:'center', color:'#e8e0c8' });
    drawText('Esc で キャンセル', W/2, ry + 90, { size:12, align:'center', color:'#7a7a8a' });
  }
}

// =============================================================
// ルート選択
// =============================================================
function updateRouteSelect(){
  if (gameState.fade > 0) return;
  if (consume('left')){  gameState.routeDetailCursor = (gameState.routeDetailCursor + 1) % 2; SE.cursor(); }
  if (consume('right')){ gameState.routeDetailCursor = (gameState.routeDetailCursor + 1) % 2; SE.cursor(); }
  if (consume('cancel')){ SE.cancel(); startFade(() => { gameState.scene = 'title'; }); }
  if (consume('ok')) chooseRoute(gameState.routeDetailCursor);
}
function chooseRoute(i){
  const r = i === 0 ? 'hero' : 'demon';
  SE.confirm();
  startFade(() => {
    gameState.route = r;
    gameState.scene = 'prologue';
    gameState.prologueText = PROLOGUE[r];
    gameState.prologueLine = 0; gameState.prologueChar = 0; gameState.prologueDoneTimer = 0;
  });
}
function drawRouteSelect(){
  clearClicks();
  ctx.fillStyle = '#0a0a14'; ctx.fillRect(0, 0, W, H);
  drawText('道 を 選 べ', W/2, 14, { size:18, align:'center', color:'#c8b568' });
  drawText('クリック/タップで 選ぶ。両ルートとも 完走可能。', W/2, 40, { size:11, align:'center', color:'#8a8270' });
  for (let i = 0; i < 2; i++){
    const key = i === 0 ? 'hero' : 'demon';
    const p = PALETTE[key];
    const tpl = PLAYER_TEMPLATE[key];
    const x = 20 + i * 305, y = 64, w = 295, h = 360;
    const sel = (gameState.routeDetailCursor === i);
    ctx.fillStyle = p.base; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = sel ? p.accent : p.border; ctx.lineWidth = 2;
    ctx.strokeRect(x+1, y+1, w-2, h-2);
    ctx.strokeStyle = p.border2; ctx.lineWidth = 1;
    ctx.strokeRect(x+4, y+4, w-8, h-8);
    ctx.fillStyle = p.panel; ctx.fillRect(x+8, y+8, w-16, 32);
    drawText((i===0?'勇者の道':'魔王軍の道'), x + w/2, y + 14, { size:16, align:'center', color:p.accent });
    drawSprite(tpl.sprite, x + 56, y + 88, 5, p.accent);
    const sx = x + 108, sy = y + 56;
    drawText(tpl.title, sx, sy, { size:13, color:p.text });
    drawText('HP ' + tpl.hp,  sx,      sy+22, { size:12, color:p.text });
    drawText('MP ' + tpl.mp,  sx,      sy+38, { size:12, color:p.text });
    drawText('攻撃 ' + (tpl.atk + WEAPONS[tpl.weapon].atk), sx+88, sy+22, { size:12, color:p.text });
    drawText('守備 ' + (tpl.def + ARMORS[tpl.armor].def),   sx+88, sy+38, { size:12, color:p.text });
    drawText('回避 ' + tpl.eva + '%', sx, sy+54, { size:12, color:p.textDim });

    const summary = (i===0)
      ? '基礎値 低めだが Lv が 上がりやすい。\nLv up で ステ振り 2pt + 装備で 強化。\n進軍は 速く、戦闘 少なめで 先へ。'
      : '基礎値 高め。一撃が 重い。\n敵が 多く、各地で 苦戦の 物量戦。\nLv は 遅い代わり 自動成長 大きい。';
    const sumLines = summary.split('\n');
    for (let li = 0; li < sumLines.length; li++)
      drawText(sumLines[li], x+14, y+136 + li*16, { size:12, color:p.text });

    ctx.fillStyle = p.panel; ctx.fillRect(x+10, y+200, w-20, 124);
    ctx.strokeStyle = p.border2; ctx.lineWidth = 1;
    ctx.strokeRect(x+10, y+200, w-20, 124);
    drawText('初期 特技 + 成長で 習得', x+18, y+206, { size:12, color:p.accent });
    const all = [...SKILL_LEARN[key][1], ...(SKILL_LEARN[key][3]||[]), ...(SKILL_LEARN[key][5]||[]), ...(SKILL_LEARN[key][7]||[])];
    for (let si = 0; si < Math.min(4, all.length); si++){
      const sk = SKILLS[all[si]];
      const learnLv = [1,3,5,7].find(lv => (SKILL_LEARN[key][lv]||[]).includes(all[si]));
      drawText('Lv' + learnLv + ' ' + sk.name + ' (MP' + sk.mp + ')', x+18, y+226 + si*26, { size:12, color:p.text });
      drawText(sk.desc, x+30, y+240 + si*26, { size:10, color:p.textDim });
    }

    if (sel){
      drawText('▶', x - 14, y + h/2 - 10, { size:18, color:p.accent });
      drawText('◀', x + w + 2, y + h/2 - 10, { size:18, color:p.accent });
    }
    addClick(x, y, w, h, () => {
      if (gameState.routeDetailCursor === i) chooseRoute(i);
      else { gameState.routeDetailCursor = i; SE.cursor(); }
    });
  }
  ctx.fillStyle = '#0a1428'; ctx.fillRect(0, H - 36, W, 36);
  drawText('←→ : ルート切替   Z / もう一度タップ : 始める   X : 戻る', W/2, H - 26, { size:12, align:'center', color:'#a89e84' });
  addClick(0, H - 36, 80, 36, () => { SE.cancel(); startFade(() => { gameState.scene = 'title'; }); });
}

// =============================================================
// プロローグ
// =============================================================
function updatePrologue(){
  if (gameState.fade > 0) return;
  const fast = input.ok || input.cancel;
  const speed = fast ? 5 : 1;
  for (let s = 0; s < speed; s++){
    if (gameState.prologueLine >= gameState.prologueText.length){ gameState.prologueDoneTimer++; break; }
    const line = gameState.prologueText[gameState.prologueLine];
    if (gameState.prologueChar < line.length) gameState.prologueChar++;
    else { gameState.prologueDoneTimer++; if (gameState.prologueDoneTimer > 14){ gameState.prologueLine++; gameState.prologueChar = 0; gameState.prologueDoneTimer = 0; } }
  }
  if (gameState.prologueLine >= gameState.prologueText.length && gameState.prologueDoneTimer > 30){
    if (consume('ok')){
      SE.confirm();
      startFade(() => {
        gameState.scene = 'name_input';
        gameState.nameInput = PLAYER_TEMPLATE[gameState.route].defaultName;
        gameState.nameCursor = 0;
      });
    }
  } else { consume('ok'); consume('cancel'); }
}
function drawPrologue(){
  clearClicks();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = pal().accent; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W-80, H-80);
  ctx.strokeStyle = pal().border2; ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, W-92, H-92);
  drawText('プロローグ', W/2, 70, { size:18, align:'center', color:pal().accent });
  const startY = 130;
  for (let i = 0; i <= gameState.prologueLine && i < gameState.prologueText.length; i++){
    let t = gameState.prologueText[i];
    if (i === gameState.prologueLine) t = t.slice(0, gameState.prologueChar);
    drawText(t, W/2, startY + i*26, { size:14, align:'center', color:pal().text });
  }
  if (gameState.prologueLine >= gameState.prologueText.length){
    if (Math.floor(performance.now()/500)%2===0)
      drawText('▼ Z / タップで 次へ', W/2, H-70, { size:13, align:'center', color:pal().accent });
    addClick(0, 0, W, H, () => {
      SE.confirm();
      startFade(() => {
        gameState.scene = 'name_input';
        gameState.nameInput = PLAYER_TEMPLATE[gameState.route].defaultName;
        gameState.nameCursor = 0;
      });
    });
  } else {
    drawText('タップで 早送り', W-60, H-66, { size:11, align:'right', color:'#3a3a4a' });
    addClick(0, 0, W, H, () => {
      gameState.prologueLine = gameState.prologueText.length;
      gameState.prologueDoneTimer = 31;
    });
  }
}

// =============================================================
// 名前入力
// =============================================================
function updateNameInput(){
  if (gameState.fade > 0) return;
  const row = Math.floor(gameState.nameCursor / NAME_GRID_COLS);
  const col = gameState.nameCursor % NAME_GRID_COLS;
  const totalRows = NAME_GRID_ROWS + 1;
  if (consume('up')){    gameState.nameCursor = ((row - 1 + totalRows) % totalRows) * NAME_GRID_COLS + Math.min(col, NAME_GRID_COLS-1); SE.cursor(); }
  if (consume('down')){  gameState.nameCursor = ((row + 1) % totalRows) * NAME_GRID_COLS + Math.min(col, NAME_GRID_COLS-1); SE.cursor(); }
  if (consume('left')){  gameState.nameCursor = row * NAME_GRID_COLS + ((col - 1 + NAME_GRID_COLS) % NAME_GRID_COLS); SE.cursor(); }
  if (consume('right')){ gameState.nameCursor = row * NAME_GRID_COLS + ((col + 1) % NAME_GRID_COLS); SE.cursor(); }
  if (consume('cancel')){ deleteNameChar(); SE.cancel(); }
  if (consume('ok')) confirmNameCursor();
}
function deleteNameChar(){ if (gameState.nameInput.length > 0) gameState.nameInput = gameState.nameInput.slice(0, -1); }
function confirmNameCursor(){
  const row = Math.floor(gameState.nameCursor / NAME_GRID_COLS);
  const col = gameState.nameCursor % NAME_GRID_COLS;
  if (row < NAME_GRID_ROWS){
    const ch = NAME_CHARS[row][col];
    if (ch && gameState.nameInput.length < NAME_MAX){
      if (ch !== '　') { gameState.nameInput += ch; SE.confirm(); }
      else { gameState.nameInput += '　'; SE.cursor(); }
    }
  } else {
    if (col < 5) finalizeName();
    else { deleteNameChar(); SE.cancel(); }
  }
}
function finalizeName(){
  if (gameState.nameInput.trim().length === 0) gameState.nameInput = PLAYER_TEMPLATE[gameState.route].defaultName;
  SE.fanfare();
  startFade(() => {
    gameState.player = JSON.parse(JSON.stringify(PLAYER_TEMPLATE[gameState.route]));
    gameState.player.name = gameState.nameInput.trim() || PLAYER_TEMPLATE[gameState.route].defaultName;
    gameState.zoneIndex = 0;
    gameState.ownDist = 0; gameState.enemyDist = 0;
    gameState.marchTick = 0; gameState.marchPaused = false;
    gameState.inventory = { yakusou:2, mahouNoMizu:1, motheRoot:0 };
    gameState.equipInv = [];
    gameState.scene = 'map';
    gameState.cursor = 0;
    if (!gameState.mapTutorialDone){ gameState.showTutorial = true; gameState.tutorialPage = 0; }
  });
}
function drawNameInput(){
  clearClicks();
  const p = pal();
  fillBg();
  drawText('名前を 入力せよ', W/2, 14, { size:18, align:'center', color:p.accent });
  drawText('(' + PLAYER_TEMPLATE[gameState.route].title + ')', W/2, 42, { size:12, align:'center', color:p.textDim });
  const ix = 180, iy = 60, iw = 280, ih = 40;
  drawWindow(ix, iy, iw, ih);
  let display = gameState.nameInput;
  while (display.length < NAME_MAX) display += '＿';
  drawText(display, ix + iw/2, iy + 12, { size:18, align:'center', color:p.text });

  const gx = 80, gy = 120, cellW = 48, cellH = 34;
  for (let r = 0; r < NAME_GRID_ROWS; r++){
    for (let c = 0; c < NAME_GRID_COLS; c++){
      const ch = NAME_CHARS[r][c];
      const idx = r * NAME_GRID_COLS + c;
      const sel = (idx === gameState.nameCursor);
      const cx = gx + c * cellW, cy = gy + r * cellH;
      if (sel){
        ctx.fillStyle = p.accent; ctx.fillRect(cx, cy, cellW, cellH);
        drawText(ch === '　' ? '空' : ch, cx + cellW/2, cy + 8, { size:18, align:'center', color:p.base });
      } else {
        ctx.strokeStyle = p.border2; ctx.lineWidth = 1;
        ctx.strokeRect(cx + 2, cy + 2, cellW - 4, cellH - 4);
        drawText(ch === '　' ? '空' : ch, cx + cellW/2, cy + 8, { size:18, align:'center', color:p.text });
      }
      addClick(cx, cy, cellW, cellH, () => { gameState.nameCursor = idx; confirmNameCursor(); });
    }
  }
  const extraY = gy + NAME_GRID_ROWS * cellH + 8;
  const buttons = [
    { label:'決定', cStart:0, cEnd:5, action: finalizeName },
    { label:'もどす', cStart:5, cEnd:10, action: () => { deleteNameChar(); SE.cancel(); } },
  ];
  for (const b of buttons){
    const xStart = gx + b.cStart * cellW;
    const w = (b.cEnd - b.cStart) * cellW - 6;
    const cursorCol = gameState.nameCursor % NAME_GRID_COLS;
    const cursorRow = Math.floor(gameState.nameCursor / NAME_GRID_COLS);
    const sel = (cursorRow === NAME_GRID_ROWS && cursorCol >= b.cStart && cursorCol < b.cEnd);
    if (sel){
      ctx.fillStyle = p.accent;
      ctx.fillRect(xStart, extraY, w, cellH);
      drawText(b.label, xStart + w/2, extraY + 8, { size:16, align:'center', color:p.base });
    } else {
      ctx.strokeStyle = p.border2; ctx.lineWidth = 1;
      ctx.strokeRect(xStart + 2, extraY + 2, w - 4, cellH - 4);
      drawText(b.label, xStart + w/2, extraY + 8, { size:16, align:'center', color:p.text });
    }
    addClick(xStart, extraY, w, cellH, () => {
      gameState.nameCursor = NAME_GRID_ROWS * NAME_GRID_COLS + b.cStart;
      b.action();
    });
  }
  drawText('↑↓←→ 選択   Z 文字確定   X 1文字消去', W/2, H - 24, { size:11, align:'center', color:p.textDim });
}

// =============================================================
// マップ (進軍 = オートマーチ)
// =============================================================
const MAP_CMDS = ['装備', '特技', 'ステータス', '道具', 'ヘルプ'];

function updateMap(){
  if (gameState.fade > 0) return;
  if (gameState.showTutorial){ updateTutorial(); return; }
  if (gameState.subScene){
    if (gameState.subScene === 'inventory') updateInventory();
    else if (gameState.subScene === 'status') updateStatusView();
    else if (gameState.subScene === 'statAlloc') updateStatAlloc();
    else if (gameState.subScene === 'equip') updateEquip();
    else if (gameState.subScene === 'skills') updateSkillView();
    return;
  }

  // 進軍ロジック
  if (!gameState.marchPaused){
    gameState.marchTick++;
    if (gameState.marchTick >= 18){  // 約 0.3 秒毎
      gameState.marchTick = 0;
      const zone = ZONES[gameState.route][gameState.zoneIndex];
      gameState.ownDist   += randF(zone.ownSp[0], zone.ownSp[1]);
      gameState.enemyDist += randF(zone.enSp[0],  zone.enSp[1]);
      // 衝突判定
      if (gameState.ownDist + gameState.enemyDist >= 100){
        triggerEncounter();
        return;
      }
      // 商人イベント (低確率、戦闘直後を除く)
      if (Math.random() < 0.04 && gameState.ownDist > 15 && gameState.ownDist < 90){
        triggerMerchant();
        return;
      }
      // 自軍 100% 到達 (敵未遭遇のまま) → 次ゾーン (まれ)
      if (gameState.ownDist >= 100){
        advanceZone();
        return;
      }
    }
  }

  // メニュー操作
  if (consume('up')){   gameState.cursor = (gameState.cursor + MAP_CMDS.length - 1) % MAP_CMDS.length; SE.cursor(); }
  if (consume('down')){ gameState.cursor = (gameState.cursor + 1) % MAP_CMDS.length; SE.cursor(); }
  if (consume('ok'))   mapAction(gameState.cursor);
  if (consume('cancel')) gameState.marchPaused = !gameState.marchPaused;
}

function mapAction(i){
  SE.confirm();
  gameState.marchPaused = true; // メニュー中は進行停止
  if (i === 0){ gameState.subScene = 'equip'; gameState.equipSlot = 0; gameState.equipListCursor = 0; }
  else if (i === 1){ gameState.subScene = 'skills'; }
  else if (i === 2){ gameState.subScene = 'status'; }
  else if (i === 3){ gameState.subScene = 'inventory'; gameState.subCursor = 0; }
  else if (i === 4){ gameState.showTutorial = true; gameState.tutorialPage = 0; }
}

function triggerEncounter(){
  const zone = ZONES[gameState.route][gameState.zoneIndex];
  // 最終ゾーンで両軍合計 100% に達したら 最終戦
  if (gameState.zoneIndex === ZONES[gameState.route].length - 1 &&
      gameState.ownDist >= 60 && gameState.enemyDist >= 25){
    // 進軍がかなり進んだ最終ゾーン衝突 = ボス戦
    startFade(() => startBattle(FINAL_BOSS[gameState.route], true));
    return;
  }
  const ek = zone.enemies[randInt(0, zone.enemies.length - 1)];
  startFade(() => startBattle(ek, false));
}

function triggerMerchant(){
  // 商人の品揃え生成
  gameState.merchantInventory = generateMerchantStock();
  gameState.merchant = { state: 'menu' };
  gameState.merchantTab = 0;
  startFade(() => { gameState.scene = 'merchant'; });
}

function generateMerchantStock(){
  const route = gameState.route;
  const lv = gameState.player.lv;
  const stock = [
    { kind:'item', key:'yakusou', price: ITEMS.yakusou.price },
    { kind:'item', key:'mahouNoMizu', price: ITEMS.mahouNoMizu.price },
  ];
  if (Math.random() < 0.4) stock.push({ kind:'item', key:'motheRoot', price: ITEMS.motheRoot.price });
  for (const k in WEAPONS){
    const w = WEAPONS[k]; if (w.route !== route) continue;
    if (w.atk <= 1 + lv * 2 && w.atk > 0 && Math.random() < 0.45)
      stock.push({ kind:'weapon', key:k, price: w.price });
  }
  for (const k in ARMORS){
    const a = ARMORS[k]; if (a.route !== route) continue;
    if (a.def <= 1 + lv * 2 && Math.random() < 0.45)
      stock.push({ kind:'armor', key:k, price: a.price });
  }
  return stock;
}

function advanceZone(){
  if (gameState.zoneIndex >= ZONES[gameState.route].length - 1){
    // 最終 → ボス
    startFade(() => startBattle(FINAL_BOSS[gameState.route], true));
    return;
  }
  startFade(() => {
    gameState.zoneIndex++;
    gameState.ownDist = 0; gameState.enemyDist = 0; gameState.marchTick = 0;
    gameState.mapMsg = '次の エリアに 進軍した！';
    gameState.mapMsgTimer = 90;
  });
}

function drawMap(){
  clearClicks();
  const p = pal();
  fillBg();
  const zone = ZONES[gameState.route][gameState.zoneIndex];

  // 上部: 進軍バー
  drawMarchBar(0, 0, W, 90);

  // 中央: 風景 + キャラ
  const mx = 16, my = 100, mw = W - 32, mh = 180;
  drawWindow(mx, my, mw, mh);
  drawLandscape(mx + 8, my + 8, mw - 16, mh - 48);
  drawText('第' + (gameState.zoneIndex + 1) + ' / ' + ZONES[gameState.route].length + ' エリア : ' + zone.name, mx + 14, my + mh - 36, { size:14, color:p.accent });
  drawText(zone.msg, mx + 14, my + mh - 18, { size:12, color:p.text });
  drawText(gameState.marchPaused ? '進軍 一時停止中 (X で 再開)' : '進軍中… (X で 停止)', mx + mw - 14, my + mh - 18, { size:11, color:p.textDim, align:'right' });

  // 下部: メニュー
  const cy = 290;
  drawWindow(16, cy, 180, 178);
  drawText('コマンド', 26, cy + 8, { size:12, color:p.accent });
  for (let i = 0; i < MAP_CMDS.length; i++){
    const sel = (i === gameState.cursor);
    const yy = cy + 30 + i * 26;
    if (sel){ ctx.fillStyle = p.accent; ctx.fillRect(26, yy + 8, 8, 4); }
    drawText(MAP_CMDS[i], 42, yy, { size:14, color: sel ? p.accent : p.text });
    addClick(20, yy - 4, 170, 24, () => { gameState.cursor = i; mapAction(i); });
  }
  if (gameState.player.pointsAvail > 0){
    drawText('★ステ振り ' + gameState.player.pointsAvail + ' pt', 26, cy + 150, { size:12, color:p.accent });
    addClick(20, cy + 146, 170, 22, () => { gameState.subScene = 'statAlloc'; gameState.statAllocCursor = 0; gameState.marchPaused = true; SE.confirm(); });
  }

  drawStatusPanel(208, cy, W - 224, 178);

  if (gameState.mapMsgTimer > 0){
    ctx.fillStyle = '#000'; ctx.fillRect(20, 92, W - 40, 18);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 1; ctx.strokeRect(20, 92, W - 40, 18);
    drawText(gameState.mapMsg, W/2, 95, { size:11, align:'center', color:p.text });
    gameState.mapMsgTimer--;
  }

  if (gameState.subScene === 'inventory') drawInventory();
  else if (gameState.subScene === 'status') drawStatusView();
  else if (gameState.subScene === 'statAlloc') drawStatAlloc();
  else if (gameState.subScene === 'equip') drawEquip();
  else if (gameState.subScene === 'skills') drawSkillView();
  if (gameState.showTutorial) drawTutorial();
}

function drawMarchBar(x, y, w, h){
  const p = pal();
  ctx.fillStyle = p.panel; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = p.border; ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);

  drawText('進 軍', x + 16, y + 8, { size:13, color:p.accent });
  drawText('Lv ' + gameState.player.lv + ' / G ' + gameState.player.gold, x + w - 16, y + 8, { size:12, color:p.text, align:'right' });

  const bx = x + 16, by = y + 32, bw = w - 32, bh = 18;
  ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, bh);
  // 自軍ゾーン
  const ownW = Math.floor((bw - 2) * (gameState.ownDist / 100));
  ctx.fillStyle = gameState.route === 'hero' ? '#3a6aa8' : '#6a2a3a';
  ctx.fillRect(bx + 1, by + 1, ownW, bh - 2);
  // 敵軍ゾーン
  const enW = Math.floor((bw - 2) * (gameState.enemyDist / 100));
  ctx.fillStyle = gameState.route === 'hero' ? '#6a2a3a' : '#3a6aa8';
  ctx.fillRect(bx + 1 + (bw - 2) - enW, by + 1, enW, bh - 2);
  // 自軍マーカー
  ctx.fillStyle = p.accent;
  ctx.fillRect(bx + 1 + ownW - 2, by - 4, 4, bh + 8);
  // 敵軍マーカー
  ctx.fillStyle = gameState.route === 'hero' ? '#a85838' : '#c8b568';
  ctx.fillRect(bx + 1 + (bw - 2) - enW - 2, by - 4, 4, bh + 8);
  // 衝突予測ライン
  const meetPct = 100 - gameState.ownDist - gameState.enemyDist;
  ctx.fillStyle = '#888';
  drawText('進 ' + Math.floor(gameState.ownDist) + '%', bx, by + bh + 4, { size:11, color:p.text });
  drawText('衝突まで ' + Math.max(0, Math.floor(meetPct)) + '%', bx + bw/2, by + bh + 4, { size:11, color:p.accent, align:'center' });
  drawText(Math.floor(gameState.enemyDist) + '% 進', bx + bw, by + bh + 4, { size:11, color:p.text, align:'right' });
}

function drawLandscape(x, y, w, h){
  const p = pal();
  ctx.fillStyle = gameState.route === 'hero' ? '#1a2848' : '#2a1428';
  ctx.fillRect(x, y, w, Math.floor(h * 0.55));
  ctx.fillStyle = gameState.route === 'hero' ? '#2a3a28' : '#2a1a1a';
  ctx.fillRect(x, y + Math.floor(h * 0.55), w, h - Math.floor(h * 0.55));
  ctx.fillStyle = '#000';
  ctx.fillRect(x, y + Math.floor(h * 0.55) - 1, w, 1);
  const zi = gameState.zoneIndex;
  ctx.fillStyle = gameState.route === 'hero' ? '#3a4a58' : '#3a2838';
  const horizon = y + Math.floor(h * 0.55);
  for (let i = 0; i < 5 + zi; i++){
    const mx = x + ((i * 97 + zi * 31) % w);
    const mh = 24 + ((i * 53 + zi * 17) % 32);
    for (let dy = 0; dy < mh; dy++){
      const sw = mh - dy;
      ctx.fillRect(mx - sw, horizon - dy, sw * 2, 1);
    }
  }
  // 道
  ctx.fillStyle = gameState.route === 'hero' ? '#5a4a38' : '#3a2828';
  const roadY = horizon + Math.floor((h - (horizon - y)) * 0.4);
  for (let i = 0; i < 20; i++){
    const rw = 6 + i * 3;
    ctx.fillRect(x + w/2 - rw/2, roadY + i * 2, rw, 2);
  }
  // 城
  if (zi >= ZONES[gameState.route].length - 1){
    const cxp = x + w/2, cy2 = horizon - 40;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(cxp - 28, cy2, 56, 44);
    ctx.fillRect(cxp - 34, cy2 + 4, 6, 40);
    ctx.fillRect(cxp + 28, cy2 + 4, 6, 40);
    ctx.fillStyle = p.accent;
    ctx.fillRect(cxp - 1, cy2 - 12, 2, 12);
    ctx.fillRect(cxp - 1, cy2 - 12, 7, 4);
  }
  // 進軍位置に応じて自分と敵の位置を変える
  gameState.animTime++;
  const own01 = gameState.ownDist / 100;
  const enemy01 = gameState.enemyDist / 100;
  // 自分は左から右、敵は右から左
  const px = x + 30 + (w - 60) * own01 * 0.5;
  const py = horizon - 18;
  drawPlayer(px, py, 3);
  // 敵軍シルエット (反対側)
  const epx = x + w - 30 - (w - 60) * enemy01 * 0.5;
  ctx.fillStyle = gameState.route === 'hero' ? '#a85838' : '#c8b568';
  ctx.globalAlpha = 0.7;
  ctx.fillRect(epx - 6, py - 10, 12, 12);
  ctx.fillRect(epx - 2, py - 14, 4, 4);
  ctx.globalAlpha = 1;
}

function drawStatusPanel(x, y, w, h){
  const p = pal();
  drawWindow(x, y, w, h);
  const pl = gameState.player;
  drawText(pl.title + ' ' + pl.name, x + 14, y + 8, { size:13, color:p.accent });
  drawText('Lv ' + pl.lv, x + w - 14, y + 8, { size:13, color:p.text, align:'right' });
  drawText('HP', x + 14, y + 32, { size:12, color:p.text });
  drawBar(x + 44, y + 34, w - 110, 10, pl.hp / pl.maxHp, p.hp);
  drawText(pl.hp + '/' + pl.maxHp, x + w - 14, y + 32, { size:12, color:p.text, align:'right' });
  drawText('MP', x + 14, y + 52, { size:12, color:p.text });
  drawBar(x + 44, y + 54, w - 110, 10, pl.mp / pl.maxMp, p.mp);
  drawText(pl.mp + '/' + pl.maxMp, x + w - 14, y + 52, { size:12, color:p.text, align:'right' });
  const need = requiredExp(gameState.route, pl.lv);
  drawText('EXP', x + 14, y + 72, { size:12, color:p.textDim });
  drawBar(x + 44, y + 74, w - 110, 8, pl.exp / need, p.accent);
  drawText(pl.exp + '/' + need, x + w - 14, y + 72, { size:12, color:p.textDim, align:'right' });
  drawText('攻 ' + effectiveAtk(pl) + ' (基' + pl.atk + '+武' + WEAPONS[pl.weapon].atk + ')', x + 14, y + 94, { size:11, color:p.text });
  drawText('守 ' + effectiveDef(pl) + ' (基' + pl.def + '+鎧' + ARMORS[pl.armor].def + ')', x + 14, y + 110, { size:11, color:p.text });
  drawText('回避 ' + pl.eva + '%   所持 ' + pl.gold + ' G', x + 14, y + 126, { size:11, color:p.text });
  drawText('装備: ' + WEAPONS[pl.weapon].name + ' / ' + ARMORS[pl.armor].name, x + 14, y + 146, { size:11, color:p.textDim });
}

// =============================================================
// ステータス詳細
// =============================================================
function updateStatusView(){
  if (consume('cancel') || consume('ok')){ SE.cancel(); gameState.subScene = null; gameState.marchPaused = false; }
}
function drawStatusView(){
  const p = pal();
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
  const x=60, y=40, w=W-120, h=H-80;
  drawWindow(x, y, w, h);
  const pl = gameState.player;
  drawText('— ステータス —', x + w/2, y + 12, { size:16, align:'center', color:p.accent });
  drawSprite(pl.sprite, x + 80, y + 90, 6, p.accent);
  const tx = x + 160;
  drawText(pl.title + ' ' + pl.name, tx, y + 50, { size:16, color:p.accent });
  drawText('Lv ' + pl.lv, tx, y + 76, { size:14, color:p.text });
  drawText('HP ' + pl.hp + ' / ' + pl.maxHp, tx, y + 100, { size:13, color:p.text });
  drawText('MP ' + pl.mp + ' / ' + pl.maxMp, tx, y + 120, { size:13, color:p.text });
  drawText('攻撃 ' + effectiveAtk(pl) + ' (基' + pl.atk + ' + 武器' + WEAPONS[pl.weapon].atk + ')', tx, y + 144, { size:12, color:p.text });
  drawText('守備 ' + effectiveDef(pl) + ' (基' + pl.def + ' + 鎧' + ARMORS[pl.armor].def + ')', tx, y + 162, { size:12, color:p.text });
  drawText('回避 ' + pl.eva + '%', tx, y + 180, { size:13, color:p.text });
  drawText('EXP ' + pl.exp + ' / ' + requiredExp(gameState.route, pl.lv), tx, y + 198, { size:12, color:p.textDim });
  drawText('所持金 ' + pl.gold + ' G', tx, y + 214, { size:12, color:p.text });
  if (pl.pointsAvail > 0) drawText('未配分 ' + pl.pointsAvail + 'pt', tx, y + 232, { size:13, color:p.accent });
  drawText('— 装備 —', x + 14, y + 250, { size:13, color:p.accent });
  drawText('武器: ' + WEAPONS[pl.weapon].name + ' (+' + WEAPONS[pl.weapon].atk + ')', x + 24, y + 270, { size:12, color:p.text });
  drawText('鎧:   ' + ARMORS[pl.armor].name + '  (+' + ARMORS[pl.armor].def + ')', x + 24, y + 288, { size:12, color:p.text });
  drawText('X / Z で 戻る', x + w/2, y + h - 24, { size:11, align:'center', color:p.textDim });
  addClick(x, y, w, h, () => { SE.cancel(); gameState.subScene = null; gameState.marchPaused = false; });
}

// =============================================================
// 特技一覧
// =============================================================
function updateSkillView(){
  if (consume('cancel') || consume('ok')){ SE.cancel(); gameState.subScene = null; gameState.marchPaused = false; }
}
function drawSkillView(){
  const p = pal();
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
  const x=60, y=40, w=W-120, h=H-80;
  drawWindow(x, y, w, h);
  drawText('— 特技 一覧 —', x + w/2, y + 12, { size:16, align:'center', color:p.accent });
  const pl = gameState.player;
  const tbl = SKILL_LEARN[gameState.route];
  let row = 0;
  for (const lvStr of ['1','3','5','7']){
    const lv = +lvStr;
    const list = tbl[lv] || [];
    for (const k of list){
      const sk = SKILLS[k];
      const yy = y + 50 + row * 50;
      const owned = pl.skills.includes(k);
      const col = owned ? p.text : p.textDim;
      drawText('Lv' + lv + '   ' + sk.name, x + 30, yy, { size:14, color: owned ? p.accent : p.textDim });
      drawText('MP ' + sk.mp, x + 200, yy, { size:13, color: col });
      drawText(owned ? '習得済み' : '未習得',  x + w - 30, yy, { size:13, color: owned ? p.accent : p.textDim, align:'right' });
      drawText(sk.desc, x + 50, yy + 18, { size:11, color: col });
      row++;
    }
  }
  drawText('X / Z で 戻る', x + w/2, y + h - 24, { size:11, align:'center', color:p.textDim });
  addClick(x, y, w, h, () => { SE.cancel(); gameState.subScene = null; gameState.marchPaused = false; });
}

// =============================================================
// ステ振り
// =============================================================
function updateStatAlloc(){
  const pl = gameState.player;
  if (consume('up'))   { gameState.statAllocCursor = (gameState.statAllocCursor + STAT_PT.length - 1) % STAT_PT.length; SE.cursor(); }
  if (consume('down')) { gameState.statAllocCursor = (gameState.statAllocCursor + 1) % STAT_PT.length; SE.cursor(); }
  if (consume('cancel')){
    if (pl.pointsAvail === 0){ gameState.subScene = null; gameState.marchPaused = false; SE.cancel(); }
    else { gameState.mapMsg = 'ポイントが まだ 残っている。'; gameState.mapMsgTimer = 80; }
  }
  if (consume('ok')) applyStatPoint(gameState.statAllocCursor);
}
function applyStatPoint(i){
  const pl = gameState.player;
  if (pl.pointsAvail <= 0) return;
  const s = STAT_PT[i];
  if (s.stat === 'maxHp'){ pl.maxHp += s.amount; pl.hp += s.amount; }
  else if (s.stat === 'maxMp'){ pl.maxMp += s.amount; pl.mp += s.amount; }
  else pl[s.stat] += s.amount;
  pl.pointsAvail--;
  SE.levelup();
}
function drawStatAlloc(){
  const p = pal();
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);
  const x=80, y=60, w=W-160, h=H-120;
  drawWindow(x, y, w, h);
  drawText('— ステータス 振り分け —', x + w/2, y + 14, { size:16, align:'center', color:p.accent });
  drawText('残り ' + gameState.player.pointsAvail + ' pt', x + w/2, y + 40, { size:14, align:'center', color:p.text });
  for (let i = 0; i < STAT_PT.length; i++){
    const s = STAT_PT[i];
    const sel = (i === gameState.statAllocCursor);
    const yy = y + 80 + i * 38;
    if (sel){ ctx.fillStyle = 'rgba(200,181,104,0.18)'; ctx.fillRect(x + 20, yy - 4, w - 40, 34); }
    drawText((sel?'▶ ':'  ') + s.key, x + 40, yy + 4, { size:15, color: sel ? p.accent : p.text });
    drawText(s.hint, x + w - 40, yy + 4, { size:13, color:p.textDim, align:'right' });
    addClick(x + 20, yy - 4, w - 40, 34, () => { gameState.statAllocCursor = i; applyStatPoint(i); });
  }
  drawText('Z / タップ で +1   X で 閉じる(残0時)', x + w/2, y + h - 28, { size:11, align:'center', color:p.textDim });
}

// =============================================================
// 装備変更
// =============================================================
function updateEquip(){
  if (consume('cancel')){ SE.cancel(); gameState.subScene = null; gameState.marchPaused = false; return; }
  if (consume('left'))  { gameState.equipSlot = (gameState.equipSlot + 1) % 2; gameState.equipListCursor = 0; SE.cursor(); }
  if (consume('right')) { gameState.equipSlot = (gameState.equipSlot + 1) % 2; gameState.equipListCursor = 0; SE.cursor(); }
  const list = getEquipList(gameState.equipSlot);
  if (list.length === 0) return;
  if (consume('up'))   { gameState.equipListCursor = (gameState.equipListCursor + list.length - 1) % list.length; SE.cursor(); }
  if (consume('down')) { gameState.equipListCursor = (gameState.equipListCursor + 1) % list.length; SE.cursor(); }
  if (consume('ok'))   equipItem(list[gameState.equipListCursor]);
}
function getEquipList(slot){
  // 所持装備 (現在装備中も含める)
  const slotKey = slot === 0 ? 'weapon' : 'armor';
  const owned = new Set();
  // 装備中
  owned.add(gameState.player[slotKey]);
  for (const e of (gameState.equipInv || [])){
    if (e.slot === slotKey) owned.add(e.key);
  }
  return Array.from(owned);
}
function equipItem(key){
  const pl = gameState.player;
  const slot = gameState.equipSlot === 0 ? 'weapon' : 'armor';
  if (pl[slot] === key){ SE.cancel(); return; }
  // 以前の装備をインベントリへ
  if (!gameState.equipInv) gameState.equipInv = [];
  // インベントリから新装備を削除し、旧装備を追加 (重複保持)
  const idx = gameState.equipInv.findIndex(e => e.slot === slot && e.key === key);
  if (idx >= 0) gameState.equipInv.splice(idx, 1);
  gameState.equipInv.push({ slot, key: pl[slot] });
  pl[slot] = key;
  SE.confirm();
  gameState.mapMsg = (slot==='weapon'?WEAPONS:ARMORS)[key].name + 'を 装備した。';
  gameState.mapMsgTimer = 80;
}
function drawEquip(){
  const p = pal();
  ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);
  const x=40, y=40, w=W-80, h=H-80;
  drawWindow(x, y, w, h);
  drawText('— 装備 変更 —', x + w/2, y + 12, { size:16, align:'center', color:p.accent });
  // タブ
  const tabs = ['武器', '鎧'];
  for (let i = 0; i < tabs.length; i++){
    const tx = x + 30 + i * 120, ty = y + 40;
    const sel = (i === gameState.equipSlot);
    ctx.fillStyle = sel ? p.accent : p.panel;
    ctx.fillRect(tx, ty, 100, 26);
    ctx.strokeStyle = p.border; ctx.lineWidth = 1; ctx.strokeRect(tx, ty, 100, 26);
    drawText(tabs[i], tx + 50, ty + 6, { size:13, align:'center', color: sel ? p.base : p.text });
    addClick(tx, ty, 100, 26, () => { gameState.equipSlot = i; gameState.equipListCursor = 0; SE.cursor(); });
  }
  // 現在装備
  const pl = gameState.player;
  const slot = gameState.equipSlot === 0 ? 'weapon' : 'armor';
  const curObj = gameState.equipSlot === 0 ? WEAPONS[pl.weapon] : ARMORS[pl.armor];
  drawText('現在 装備:', x + 30, y + 80, { size:12, color:p.textDim });
  drawText(curObj.name + (gameState.equipSlot === 0 ? '   攻+' + curObj.atk : '   守+' + curObj.def), x + 130, y + 80, { size:13, color:p.accent });
  // 所持リスト
  const list = getEquipList(gameState.equipSlot);
  drawText('所持 ' + list.length + ' 個', x + 30, y + 110, { size:12, color:p.textDim });
  for (let i = 0; i < list.length; i++){
    const k = list[i];
    const obj = gameState.equipSlot === 0 ? WEAPONS[k] : ARMORS[k];
    const sel = (i === gameState.equipListCursor);
    const yy = y + 134 + i * 26;
    const equipped = (pl[slot] === k);
    if (sel){ ctx.fillStyle = 'rgba(200,181,104,0.15)'; ctx.fillRect(x + 26, yy - 4, w - 52, 24); }
    const mark = equipped ? 'E ' : '  ';
    drawText(mark + obj.name, x + 40, yy, { size:13, color: sel ? p.accent : (equipped ? p.text : p.textDim) });
    drawText(gameState.equipSlot === 0 ? '攻+' + obj.atk : '守+' + obj.def, x + 230, yy, { size:12, color: sel ? p.accent : p.text });
    drawText(obj.price + 'G 相当', x + w - 30, yy, { size:11, color:p.textDim, align:'right' });
    addClick(x + 26, yy - 4, w - 52, 24, () => { gameState.equipListCursor = i; equipItem(k); });
  }
  drawText('←→ タブ   ↑↓ 選択   Z 装備   X 戻る', x + w/2, y + h - 24, { size:11, align:'center', color:p.textDim });
}

// =============================================================
// 道具
// =============================================================
function getInventoryList(){
  const list = [];
  for (const k in gameState.inventory) if (gameState.inventory[k] > 0) list.push(k);
  return list;
}
function updateInventory(){
  const list = getInventoryList();
  if (consume('cancel')){ SE.cancel(); gameState.subScene = null; gameState.marchPaused = false; return; }
  if (list.length === 0){
    if (consume('ok')){ gameState.subScene = null; gameState.marchPaused = false; return; }
    return;
  }
  if (consume('up'))   { gameState.subCursor = (gameState.subCursor + list.length - 1) % list.length; SE.cursor(); }
  if (consume('down')) { gameState.subCursor = (gameState.subCursor + 1) % list.length; SE.cursor(); }
  if (consume('ok')) useItemMap(list[gameState.subCursor]);
}
function useItemMap(k){
  const it = ITEMS[k]; const pl = gameState.player;
  if (it.type === 'heal'){
    if (pl.hp >= pl.maxHp){ gameState.mapMsg = 'HPは満タンだ。'; gameState.mapMsgTimer = 80; SE.cancel(); return; }
    pl.hp = Math.min(pl.maxHp, pl.hp + it.amount);
    gameState.inventory[k]--; gameState.mapMsg = it.name + ' HP+' + it.amount; gameState.mapMsgTimer = 80; SE.heal();
  } else if (it.type === 'mp'){
    if (pl.mp >= pl.maxMp){ gameState.mapMsg = 'MPは満タンだ。'; gameState.mapMsgTimer = 80; SE.cancel(); return; }
    pl.mp = Math.min(pl.maxMp, pl.mp + it.amount);
    gameState.inventory[k]--; gameState.mapMsg = it.name + ' MP+' + it.amount; gameState.mapMsgTimer = 80; SE.heal();
  } else if (it.type === 'fullHp'){
    pl.hp = pl.maxHp; gameState.inventory[k]--; gameState.mapMsg = it.name + ' HP全回復！'; gameState.mapMsgTimer = 80; SE.fanfare();
  }
  if (gameState.subCursor >= getInventoryList().length) gameState.subCursor = Math.max(0, getInventoryList().length - 1);
}
function drawInventory(){
  const p = pal();
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0,W,H);
  const x=100, y=80, w=W-200, h=H-160;
  drawWindow(x, y, w, h);
  drawText('— 道具 —', x + w/2, y + 12, { size:16, align:'center', color:p.accent });
  const list = getInventoryList();
  if (list.length === 0){
    drawText('何も 持っていない。', x + w/2, y + h/2 - 8, { size:14, align:'center', color:p.textDim });
    addClick(x, y, w, h, () => { gameState.subScene = null; gameState.marchPaused = false; SE.cancel(); });
  } else {
    for (let i = 0; i < list.length; i++){
      const k = list[i]; const it = ITEMS[k];
      const sel = (i === gameState.subCursor);
      const yy = y + 50 + i * 36;
      if (sel){ ctx.fillStyle = p.accent; ctx.fillRect(x + 18, yy + 10, 8, 4); }
      drawText(it.name, x + 34, yy, { size:14, color: sel ? p.accent : p.text });
      drawText('×' + gameState.inventory[k], x + 150, yy, { size:13, color:p.text });
      if (sel) drawText(it.desc, x + 34, yy + 18, { size:11, color:p.textDim });
      addClick(x + 18, yy - 4, w - 36, 32, () => { gameState.subCursor = i; useItemMap(k); });
    }
  }
  drawText('Z 使う   X 戻る', x + w/2, y + h - 24, { size:11, align:'center', color:p.textDim });
}

// =============================================================
// チュートリアル
// =============================================================
function updateTutorial(){
  if (consume('ok') || consume('right')){
    SE.cursor();
    gameState.tutorialPage++;
    if (gameState.tutorialPage >= TUTORIAL_PAGES.length){
      gameState.showTutorial = false; gameState.mapTutorialDone = true; gameState.tutorialPage = 0;
    }
  }
  if (consume('left') && gameState.tutorialPage > 0){ gameState.tutorialPage--; SE.cursor(); }
  if (consume('cancel')){ gameState.showTutorial = false; gameState.mapTutorialDone = true; gameState.tutorialPage = 0; SE.cancel(); }
}
function drawTutorial(){
  const p = pal();
  ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0,0,W,H);
  const x=60, y=60, w=W-120, h=H-120;
  drawWindow(x, y, w, h);
  const page = TUTORIAL_PAGES[gameState.tutorialPage];
  drawText('— ' + page.title + ' —', x + w/2, y + 16, { size:16, align:'center', color:p.accent });
  for (let i = 0; i < page.lines.length; i++)
    drawText(page.lines[i], x + 26, y + 60 + i * 24, { size:13, color:p.text });
  drawText('(' + (gameState.tutorialPage + 1) + ' / ' + TUTORIAL_PAGES.length + ')   Z/タップ 次   X 閉じる', x + w/2, y + h - 28, { size:12, align:'center', color:p.textDim });
  addClick(x, y, w, h, () => {
    SE.cursor();
    gameState.tutorialPage++;
    if (gameState.tutorialPage >= TUTORIAL_PAGES.length){
      gameState.showTutorial = false; gameState.mapTutorialDone = true; gameState.tutorialPage = 0;
    }
  });
}

// =============================================================
// 商人
// =============================================================
function updateMerchant(){
  if (gameState.fade > 0) return;
  if (consume('left'))  { gameState.merchantTab = (gameState.merchantTab + 2) % 3; gameState.subCursor = 0; SE.cursor(); }
  if (consume('right')) { gameState.merchantTab = (gameState.merchantTab + 1) % 3; gameState.subCursor = 0; SE.cursor(); }
  if (consume('cancel')){
    SE.cancel();
    startFade(() => { gameState.scene = 'map'; gameState.merchant = null; gameState.marchPaused = false; });
    return;
  }
  if (gameState.merchantTab === 0){
    // 買う
    const stock = gameState.merchantInventory;
    if (stock.length === 0) return;
    if (consume('up'))   { gameState.subCursor = (gameState.subCursor + stock.length - 1) % stock.length; SE.cursor(); }
    if (consume('down')) { gameState.subCursor = (gameState.subCursor + 1) % stock.length; SE.cursor(); }
    if (consume('ok'))   merchantBuy(gameState.subCursor);
  } else if (gameState.merchantTab === 1){
    // 売る (道具 + 装備)
    const sellList = getSellableList();
    if (sellList.length === 0) return;
    if (consume('up'))   { gameState.subCursor = (gameState.subCursor + sellList.length - 1) % sellList.length; SE.cursor(); }
    if (consume('down')) { gameState.subCursor = (gameState.subCursor + 1) % sellList.length; SE.cursor(); }
    if (consume('ok'))   merchantSell(sellList[gameState.subCursor]);
  } else {
    // 立ち去る
    if (consume('ok')){
      SE.cancel();
      startFade(() => { gameState.scene = 'map'; gameState.merchant = null; gameState.marchPaused = false; });
    }
  }
}
function getSellableList(){
  const list = [];
  for (const k in gameState.inventory){
    if (gameState.inventory[k] > 0) list.push({ kind:'item', key:k });
  }
  for (const e of (gameState.equipInv || [])) list.push({ kind:e.slot, key:e.key });
  return list;
}
function itemPriceOf(entry){
  if (entry.kind === 'item') return ITEMS[entry.key].price;
  if (entry.kind === 'weapon') return WEAPONS[entry.key].price;
  return ARMORS[entry.key].price;
}
function itemNameOf(entry){
  if (entry.kind === 'item') return ITEMS[entry.key].name;
  if (entry.kind === 'weapon') return WEAPONS[entry.key].name + ' (武)';
  return ARMORS[entry.key].name + ' (鎧)';
}
function merchantBuy(idx){
  const stock = gameState.merchantInventory;
  const entry = stock[idx];
  const price = itemPriceOf(entry);
  if (gameState.player.gold < price){
    gameState.mapMsg = '所持金が 足りない！'; gameState.mapMsgTimer = 80; SE.cancel(); return;
  }
  gameState.player.gold -= price;
  if (entry.kind === 'item'){
    gameState.inventory[entry.key] = (gameState.inventory[entry.key] || 0) + 1;
  } else {
    if (!gameState.equipInv) gameState.equipInv = [];
    gameState.equipInv.push({ slot: entry.kind, key: entry.key });
  }
  SE.coin();
  gameState.mapMsg = itemNameOf(entry) + ' を 買った！'; gameState.mapMsgTimer = 80;
}
function merchantSell(entry){
  const price = Math.floor(itemPriceOf(entry) * 0.5);
  if (entry.kind === 'item'){
    gameState.inventory[entry.key]--;
  } else {
    const slot = entry.kind;
    if (gameState.player[slot] === entry.key){
      gameState.mapMsg = '装備中の品は 売れない。'; gameState.mapMsgTimer = 80; SE.cancel(); return;
    }
    const idx = gameState.equipInv.findIndex(e => e.slot === slot && e.key === entry.key);
    if (idx < 0) return;
    gameState.equipInv.splice(idx, 1);
  }
  gameState.player.gold += price;
  SE.coin();
  gameState.mapMsg = itemNameOf(entry) + ' を ' + price + 'G で 売った。'; gameState.mapMsgTimer = 80;
  const sellList = getSellableList();
  if (gameState.subCursor >= sellList.length) gameState.subCursor = Math.max(0, sellList.length - 1);
}
function drawMerchant(){
  clearClicks();
  const p = pal();
  fillBg();
  // 商人 + テキスト
  ctx.fillStyle = p.panel; ctx.fillRect(0, 0, W, 130);
  ctx.strokeStyle = p.border; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, 128);
  drawSprite('merchant', 100, 80, 6, '#d8a868');
  drawText('旅の 商人', 180, 30, { size:16, color:p.accent });
  drawText('「おう、旅人さん。何が 入用かね？」', 180, 60, { size:13, color:p.text });
  drawText('所持金 ' + gameState.player.gold + ' G', 180, 90, { size:13, color:p.accent });

  // タブ
  const tabs = ['買う','売る','立ち去る'];
  const tabY = 138, tabH = 30;
  for (let i = 0; i < tabs.length; i++){
    const tx = 60 + i * 180;
    const sel = (i === gameState.merchantTab);
    ctx.fillStyle = sel ? p.accent : p.panel;
    ctx.fillRect(tx, tabY, 160, tabH);
    ctx.strokeStyle = p.border; ctx.lineWidth = 1; ctx.strokeRect(tx, tabY, 160, tabH);
    drawText(tabs[i], tx + 80, tabY + 8, { size:14, align:'center', color: sel ? p.base : p.text });
    addClick(tx, tabY, 160, tabH, () => { gameState.merchantTab = i; gameState.subCursor = 0; SE.cursor(); });
  }

  // 内容
  const bx = 20, by = 178, bw = W - 40, bh = H - 220;
  drawWindow(bx, by, bw, bh);
  if (gameState.merchantTab === 0){
    const stock = gameState.merchantInventory;
    drawText('品揃え', bx + 16, by + 8, { size:12, color:p.accent });
    for (let i = 0; i < stock.length; i++){
      const e = stock[i];
      const sel = (i === gameState.subCursor);
      const yy = by + 32 + i * 26;
      if (sel){ ctx.fillStyle = 'rgba(200,181,104,0.18)'; ctx.fillRect(bx + 8, yy - 4, bw - 16, 24); }
      drawText(itemNameOf(e), bx + 30, yy, { size:13, color: sel ? p.accent : p.text });
      drawText(itemPriceOf(e) + ' G', bx + bw - 30, yy, { size:13, color:p.text, align:'right' });
      addClick(bx + 8, yy - 4, bw - 16, 24, () => { gameState.subCursor = i; merchantBuy(i); });
    }
  } else if (gameState.merchantTab === 1){
    const list = getSellableList();
    drawText('所持品 (買取 50%)', bx + 16, by + 8, { size:12, color:p.accent });
    if (list.length === 0) drawText('売れる物が ない。', bx + bw/2, by + bh/2, { size:14, align:'center', color:p.textDim });
    for (let i = 0; i < list.length; i++){
      const e = list[i];
      const sel = (i === gameState.subCursor);
      const yy = by + 32 + i * 24;
      if (sel){ ctx.fillStyle = 'rgba(200,181,104,0.18)'; ctx.fillRect(bx + 8, yy - 4, bw - 16, 22); }
      drawText(itemNameOf(e), bx + 30, yy, { size:13, color: sel ? p.accent : p.text });
      drawText(Math.floor(itemPriceOf(e) * 0.5) + ' G', bx + bw - 30, yy, { size:13, color:p.text, align:'right' });
      addClick(bx + 8, yy - 4, bw - 16, 22, () => { gameState.subCursor = i; merchantSell(e); });
    }
  } else {
    drawText('「またな、 旅人さん。」', bx + bw/2, by + bh/2 - 8, { size:16, align:'center', color:p.accent });
    addClick(bx, by, bw, bh, () => { SE.cancel(); startFade(() => { gameState.scene = 'map'; gameState.merchant = null; gameState.marchPaused = false; }); });
  }

  if (gameState.mapMsgTimer > 0){
    ctx.fillStyle = '#000'; ctx.fillRect(20, H - 38, W - 40, 26);
    ctx.strokeStyle = p.accent; ctx.lineWidth = 1; ctx.strokeRect(20, H - 38, W - 40, 26);
    drawText(gameState.mapMsg, W/2, H - 32, { size:13, align:'center', color:p.text });
    gameState.mapMsgTimer--;
  }
  drawText('←→ タブ   ↑↓ 選択   Z 確定   X 立ち去る', W/2, H - 6, { size:11, align:'center', color:'#5a5a6a' });
}

// =============================================================
// バトル
// =============================================================
function updateBattle(){
  updateBattleAnims();
  if (gameState.fade > 0) return;
  if (gameState.showTutorial){ updateTutorial(); return; }
  const phase = gameState.battlePhase;
  if (phase === 'menu'){
    if (consume('up')){   gameState.cursor = (gameState.cursor + BATTLE_CMDS.length - 1) % BATTLE_CMDS.length; SE.cursor(); }
    if (consume('down')){ gameState.cursor = (gameState.cursor + 1) % BATTLE_CMDS.length; SE.cursor(); }
    if (consume('ok')) battleCmdAction(gameState.cursor);
  } else if (phase === 'skillSelect'){
    const skills = gameState.player.skills;
    if (consume('up'))   { gameState.subCursor = (gameState.subCursor + skills.length - 1) % skills.length; SE.cursor(); }
    if (consume('down')) { gameState.subCursor = (gameState.subCursor + 1) % skills.length; SE.cursor(); }
    if (consume('cancel')){ gameState.battlePhase = 'menu'; SE.cancel(); }
    if (consume('ok')) playerUseSkill(skills[gameState.subCursor]);
  } else if (phase === 'itemSelect'){
    const list = getInventoryList();
    if (consume('cancel')){ gameState.battlePhase = 'menu'; SE.cancel(); return; }
    if (list.length === 0){ if (consume('ok')){ gameState.battlePhase = 'menu'; return; } return; }
    if (consume('up'))   { gameState.subCursor = (gameState.subCursor + list.length - 1) % list.length; SE.cursor(); }
    if (consume('down')) { gameState.subCursor = (gameState.subCursor + 1) % list.length; SE.cursor(); }
    if (consume('ok')) playerUseItemInBattle(list[gameState.subCursor]);
  } else if (phase === 'message'){
    if (gameState.msgTimer > 0) gameState.msgTimer--;
    else {
      if (gameState.enemy.hp <= 0) resolveWin();
      else if (gameState.nextPhase === 'enemyTurn') enemyTurn();
      else if (gameState.nextPhase === 'lose') startBattleLose();
      else { gameState.battlePhase = 'menu'; clearJust(); }
    }
  } else if (phase === 'win'){
    if (gameState.msgTimer > 0) gameState.msgTimer--;
    if (gameState.msgTimer <= 0){
      startFade(() => {
        // 戦闘後の進軍リセット
        gameState.enemyDist = Math.max(0, gameState.enemyDist - randF(20, 35));
        gameState.ownDist = Math.min(99, gameState.ownDist + randF(5, 10));
        gameState.scene = 'map'; gameState.cursor = 0; gameState.subScene = null; gameState.marchPaused = false;
      });
      gameState.battlePhase = 'done';
    }
  } else if (phase === 'flee'){
    if (gameState.msgTimer > 0) gameState.msgTimer--;
    else {
      startFade(() => {
        gameState.enemyDist = Math.max(0, gameState.enemyDist - randF(10, 20));
        gameState.scene = 'map'; gameState.cursor = 0; gameState.subScene = null; gameState.marchPaused = false;
      });
      gameState.battlePhase = 'done';
    }
  } else if (phase === 'lose'){
    if (gameState.msgTimer > 0) gameState.msgTimer--;
    else { startFade(() => { gameState.scene = 'ending'; gameState.endingType = 'lose'; prepareEnding(); }); gameState.battlePhase = 'done'; }
  } else if (phase === 'finalWin'){
    if (gameState.msgTimer > 0) gameState.msgTimer--;
    else { startFade(() => { gameState.scene = 'ending'; gameState.endingType = 'win'; prepareEnding(); }); gameState.battlePhase = 'done'; }
  }
}

function drawBattle(){
  clearClicks();
  const p = pal();
  if (gameState.flash > 0){
    ctx.fillStyle = 'rgba(255,255,255,' + (gameState.flash / 30) + ')'; ctx.fillRect(0,0,W,H);
  }
  let sx = 0, sy = 0;
  if (gameState.shake > 0){ sx = randInt(-3,3); sy = randInt(-2,2); }
  ctx.save(); ctx.translate(sx, sy);
  fillBg();

  ctx.fillStyle = gameState.route === 'hero' ? '#1a2848' : '#2a1428';
  ctx.fillRect(0, 0, W, 144);
  ctx.fillStyle = gameState.route === 'hero' ? '#2a3a28' : '#2a1a1a';
  ctx.fillRect(0, 144, W, 96);

  const en = gameState.enemy;
  const ex = W/2 + 80, ey = 140;
  const dotSize = gameState.scene === 'final_battle' ? 10 : 7;
  drawEnemy(ex, ey, dotSize);
  // プレイヤーは左側
  const pxx = W/2 - 110, pyy = 180;
  drawPlayer(pxx, pyy, 5);

  // エフェクト
  for (const e of gameState.effects){
    const t = e.t / 28;
    if (e.kind === 'slash'){
      ctx.strokeStyle = e.color; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ex - 20 + t * 40, ey - 30);
      ctx.lineTo(ex + 20 - t * 40, ey + 30);
      ctx.stroke();
    } else if (e.kind === 'blast'){
      ctx.fillStyle = e.color;
      const rad = 8 + t * 32;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath(); ctx.arc(ex, ey, rad, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    } else if (e.kind === 'pierce'){
      ctx.fillStyle = e.color;
      ctx.globalAlpha = 1 - t;
      for (let k = 0; k < 6; k++){
        const ang = (k / 6) * Math.PI * 2;
        const rr = 30 * t;
        ctx.fillRect(ex + Math.cos(ang) * rr - 2, ey + Math.sin(ang) * rr - 2, 4, 4);
      }
      ctx.globalAlpha = 1;
    } else if (e.kind === 'heal'){
      ctx.fillStyle = e.color;
      ctx.globalAlpha = 1 - t;
      for (let k = 0; k < 5; k++){
        const yy = pyy - 30 - t * 40 - k * 6;
        ctx.fillRect(pxx - 8 + k * 4, yy, 3, 3);
      }
      ctx.globalAlpha = 1;
    } else if (e.kind === 'hit'){
      ctx.fillStyle = e.color;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath(); ctx.arc(pxx, pyy, 10 + t * 18, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  const enX = 16, enY = 12;
  drawWindow(enX, enY, W - 32, 44);
  drawText(en.name, enX + 14, enY + 6, { size:14, color:p.accent });
  drawText('攻 ' + en.atk + ' 守 ' + en.def + ' 回避 ' + en.eva + '%', enX + 14, enY + 24, { size:11, color:p.textDim });
  drawBar(enX + 240, enY + 10, 280, 10, en.hp / en.maxHp, p.hp);
  drawText('HP', enX + 220, enY + 8, { size:11, color:p.text });
  drawText(en.hp + '/' + en.maxHp, enX + W - 32 - 14, enY + 22, { size:11, color:p.text, align:'right' });

  ctx.fillStyle = p.base; ctx.fillRect(0, 240, W, H - 240);

  const cmdX=8, cmdY=248, cmdW=168, cmdH=160;
  drawWindow(cmdX, cmdY, cmdW, cmdH);
  drawText('コマンド', cmdX + 12, cmdY + 8, { size:12, color:p.accent });
  const showCmd = (gameState.battlePhase === 'menu');
  for (let i = 0; i < BATTLE_CMDS.length; i++){
    const sel = showCmd && (i === gameState.cursor);
    const yy = cmdY + 32 + i * 22;
    if (sel){ ctx.fillStyle = p.accent; ctx.fillRect(cmdX + 14, yy + 7, 6, 4); }
    drawText(BATTLE_CMDS[i], cmdX + 28, yy, { size:14, color: sel ? p.accent : p.text });
    if (showCmd) addClick(cmdX + 8, yy - 4, cmdW - 16, 24, () => { gameState.cursor = i; battleCmdAction(i); });
  }

  const stX = 184, stY = 248, stW = W - 184 - 8, stH = 160;
  drawWindow(stX, stY, stW, stH);
  const pl = gameState.player;
  drawText(pl.name + '  Lv ' + pl.lv, stX + 12, stY + 8, { size:13, color:p.accent });
  drawText('HP', stX + 12, stY + 30, { size:11, color:p.text });
  drawBar(stX + 40, stY + 32, stW - 110, 10, pl.hp / pl.maxHp, p.hp);
  drawText(pl.hp + '/' + pl.maxHp, stX + stW - 12, stY + 30, { size:11, color:p.text, align:'right' });
  drawText('MP', stX + 12, stY + 50, { size:11, color:p.text });
  drawBar(stX + 40, stY + 52, stW - 110, 10, pl.mp / pl.maxMp, p.mp);
  drawText(pl.mp + '/' + pl.maxMp, stX + stW - 12, stY + 50, { size:11, color:p.text, align:'right' });
  drawText('攻 ' + effectiveAtk(pl) + '  守 ' + effectiveDef(pl) + '  回避 ' + pl.eva + '%', stX + 12, stY + 72, { size:11, color:p.text });
  drawText(WEAPONS[pl.weapon].name + ' / ' + ARMORS[pl.armor].name, stX + 12, stY + 90, { size:11, color:p.textDim });
  if (gameState.defending) drawText('【防御中】', stX + 12, stY + 108, { size:11, color:p.accent });

  if (gameState.battlePhase === 'skillSelect'){
    drawSubMenu('特技', gameState.player.skills.map(k => {
      const s = SKILLS[k];
      return { label: s.name + ' (MP' + s.mp + ')', desc: s.desc, disabled: pl.mp < s.mp, action: () => playerUseSkill(k) };
    }), gameState.subCursor);
  } else if (gameState.battlePhase === 'itemSelect'){
    const list = getInventoryList();
    drawSubMenu('道具', list.length === 0
      ? [{ label:'(何も 持っていない)', desc:'X で 戻る', disabled:true, action: () => { gameState.battlePhase = 'menu'; SE.cancel(); } }]
      : list.map(k => ({ label: ITEMS[k].name + ' ×' + gameState.inventory[k], desc: ITEMS[k].desc, disabled:false, action: () => playerUseItemInBattle(k) }))
    , gameState.subCursor);
  }

  const lgX = 8, lgY = 414, lgW = W - 16, lgH = H - 414 - 4;
  drawWindow(lgX, lgY, lgW, lgH);
  const visible = gameState.messages.slice(-3);
  for (let i = 0; i < visible.length; i++)
    drawText(visible[i], lgX + 14, lgY + 8 + i * 16, { size:12, color:p.text });

  for (const d of gameState.damages){
    const isEnemy = (d.side === 'enemy');
    const targetX = isEnemy ? ex : pxx;
    const targetY = (isEnemy ? ey - 30 : pyy - 30) + d.y;
    const alpha = clamp(d.life / 30, 0, 1);
    ctx.globalAlpha = alpha;
    drawText(d.text, targetX, targetY, { size:20, align:'center', color:d.color });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (gameState.showTutorial) drawTutorial();
}

function drawSubMenu(title, items, cursor){
  const p = pal();
  const x = 90, y = 130, w = W - 180, h = 230;
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
  drawWindow(x, y, w, h);
  drawText('— ' + title + ' —', x + w/2, y + 10, { size:14, align:'center', color:p.accent });
  for (let i = 0; i < items.length; i++){
    const it = items[i];
    const sel = (i === cursor);
    const yy = y + 44 + i * 32;
    if (sel){ ctx.fillStyle = p.accent; ctx.fillRect(x + 18, yy + 8, 8, 4); }
    const col = it.disabled ? p.textDim : (sel ? p.accent : p.text);
    drawText(it.label, x + 34, yy, { size:14, color: col });
    if (sel) drawText(it.desc, x + 34, yy + 16, { size:11, color:p.textDim });
    if (!it.disabled && it.action)
      addClick(x + 18, yy - 4, w - 36, 30, () => { gameState.subCursor = i; it.action(); });
  }
  drawText('Z 決定   X 戻る', x + w/2, y + h - 24, { size:11, align:'center', color:p.textDim });
}

// =============================================================
// エンディング
// =============================================================
const ENDING_TEXT = {
  hero_win: [
    '魔王ザギルは 静かに 膝をついた。',
    '「人間…よ。この刃は、いつか…」',
    '声は 風に かき消え、城は 崩れ落ちた。',
    '',
    gs => gs.player.name + 'は 故郷へと 帰り着いた。',
    '畑に 麦が 揺れ、誰もが 名を 呼んでくれる。',
    'しかし 旅の 記憶だけは、',
    'いつまでも 胸の奥で 灯っていた。',
    '',
    '― 勇者ルート  完 ―',
  ],
  demon_win: [
    '勇者リオンは 剣を 取り落とした。',
    '「ならば…俺の意志は…誰が…」',
    '聖堂の光は 翳り、王都は 黒い旗に 覆われた。',
    '',
    gs => gs.player.name + 'は 玉座に 腰を下ろす。',
    '人類は 膝を折り、長い夜が 始まった。',
    '勝利の 味は 苦く、ただ 静かだった。',
    '',
    '― 魔王軍ルート  完 ―',
  ],
  hero_lose: [
    gs => gs.player.name + 'の 意識は 闇へと 沈んでいく。',
    '世界は 救われなかった。',
    '',
    '魔王の 哄笑が どこまでも 響き渡る。',
    '',
    '― BAD END ―',
    '',
    '(Z / タップで タイトルへ)',
  ],
  demon_lose: [
    gs => gs.player.name + 'は 光の中で 砕け散った。',
    '魔王軍の 野望は 潰えた。',
    '',
    '勇者の 物語が、今 始まる。',
    '',
    '― BAD END ―',
    '',
    '(Z / タップで タイトルへ)',
  ],
};
function prepareEnding(){
  const key = gameState.route + '_' + gameState.endingType;
  gameState.endingText = ENDING_TEXT[key].map(t => typeof t === 'function' ? t(gameState) : t);
  gameState.endingLine = 0; gameState.endingChar = 0; gameState.endingDoneTimer = 0;
  if (gameState.endingType === 'win') SE.fanfare();
}
function updateEnding(){
  if (gameState.fade > 0) return;
  const fast = input.ok || input.cancel;
  const speed = fast ? 4 : 1;
  for (let s = 0; s < speed; s++){
    if (gameState.endingLine >= gameState.endingText.length){ gameState.endingDoneTimer++; break; }
    const line = gameState.endingText[gameState.endingLine];
    if (gameState.endingChar < line.length) gameState.endingChar++;
    else { gameState.endingDoneTimer++; if (gameState.endingDoneTimer > 18){ gameState.endingLine++; gameState.endingChar = 0; gameState.endingDoneTimer = 0; } }
  }
  if (gameState.endingLine >= gameState.endingText.length && gameState.endingDoneTimer > 60){
    if (consume('ok')) backToTitle();
  } else { consume('ok'); consume('cancel'); }
}
function backToTitle(){
  SE.confirm();
  startFade(() => {
    Object.assign(gameState, {
      scene:'title', route:null, player:null, zoneIndex:0,
      ownDist:0, enemyDist:0, marchTick:0, marchPaused:false,
      enemy:null, cursor:0, subCursor:0, messages:[], damages:[], effects:[], endingText:[],
      subScene:null, showTutorial:false, mapTutorialDone:false, battleTutorialDone:false,
      titleCursor:0, inventory:{ yakusou:2, mahouNoMizu:1, motheRoot:0 }, equipInv:[],
      merchant:null, merchantInventory:[],
    });
  });
}
function drawEnding(){
  clearClicks();
  ctx.fillStyle = '#000'; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = pal().accent; ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W-80, H-80);
  ctx.strokeStyle = pal().border2; ctx.lineWidth = 1;
  ctx.strokeRect(46, 46, W-92, H-92);
  const title = gameState.endingType === 'win' ? 'ENDING' : 'GAME OVER';
  drawText(title, W/2, 70, { size:20, align:'center', color:pal().accent });
  const startY = 130;
  for (let i = 0; i < gameState.endingText.length; i++){
    let t = gameState.endingText[i];
    if (i > gameState.endingLine) break;
    if (i === gameState.endingLine) t = t.slice(0, gameState.endingChar);
    drawText(t, W/2, startY + i * 24, { size:14, align:'center', color:pal().text });
  }
  if (gameState.endingLine >= gameState.endingText.length){
    if (Math.floor(performance.now() / 500) % 2 === 0)
      drawText('▼ Z / タップで タイトルへ', W/2, H - 70, { size:14, align:'center', color:pal().accent });
    addClick(0, 0, W, H, backToTitle);
  } else {
    addClick(0, 0, W, H, () => {
      gameState.endingLine = gameState.endingText.length;
      gameState.endingDoneTimer = 61;
    });
  }
}
