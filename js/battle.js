'use strict';
// =============================================================
// battle.js — 戦闘ロジック / 計算式 / 敵AI / エフェクト
// =============================================================

const BATTLE_CMDS = ['攻撃', '特技', '防御', '道具', '逃げる'];

function effectiveAtk(pl){ return pl.atk + (pl.weapon ? (WEAPONS[pl.weapon].atk || 0) : 0); }
function effectiveDef(pl){ return pl.def + (pl.armor ? (ARMORS[pl.armor].def || 0) : 0); }

function pushMsg(text){
  gameState.messages.push(text);
  while (gameState.messages.length > 4) gameState.messages.shift();
}
function spawnDamage(text, side, color){
  gameState.damages.push({ text, side, y:0, vy:-1.5, life:50, color });
}
function spawnEffect(kind, x, y, color){
  gameState.effects.push({ kind, x, y, color, life: 28, t: 0 });
}

function calcAttackHit(_attacker, defender){
  return Math.random() * 100 >= defender.eva;
}
function calcDamage(atkVal, defVal, mul, isCrit, pierce){
  const def = pierce ? Math.floor(defVal / 2) : defVal;
  let base = atkVal * (mul || 1) - def;
  base += randInt(-2, 2);
  if (isCrit) base = Math.floor(base * 1.6);
  return Math.max(1, Math.floor(base));
}

function startBattle(enemyKey, isFinal){
  const tpl = ENEMIES[enemyKey];
  gameState.enemy = Object.assign({}, tpl);
  gameState.enemy.maxHp = tpl.hp;
  gameState.enemy.key = enemyKey;
  gameState.scene = isFinal ? 'final_battle' : 'battle';
  gameState.battlePhase = 'menu';
  gameState.cursor = 0;
  gameState.subCursor = 0;
  gameState.messages = [];
  gameState.damages = [];
  gameState.effects = [];
  gameState.shake = 0;
  gameState.flash = 0;
  gameState.defending = false;
  gameState.playerAnim = 'idle'; gameState.playerAnimTime = 0;
  gameState.enemyAnim = 'idle';  gameState.enemyAnimTime = 0;
  pushMsg(tpl.name + ' が あらわれた！');
  SE.encounter();
  if (!gameState.battleTutorialDone && !isFinal){
    gameState.showTutorial = true; gameState.tutorialPage = 1;
    gameState.battleTutorialDone = true;
  }
}

function playerNormalAttack(){
  const pl = gameState.player, en = gameState.enemy;
  pushMsg(pl.name + 'の こうげき！');
  gameState.playerAnim = 'attack'; gameState.playerAnimTime = 0;
  if (!calcAttackHit(pl, en)){
    pushMsg('しかし ' + en.name + 'は かわした！');
    SE.miss();
    gameState.battlePhase = 'message'; gameState.msgTimer = 40; gameState.nextPhase = 'enemyTurn';
    return;
  }
  const isCrit = Math.random() < 0.10;
  const dmg = calcDamage(effectiveAtk(pl), effectiveDef(en), 1, isCrit, false);
  en.hp = Math.max(0, en.hp - dmg);
  spawnDamage(String(dmg), 'enemy', isCrit ? '#ffcc66' : '#ffffff');
  spawnEffect('slash', 0, 0, '#ffffff');
  gameState.shake = 12;
  gameState.enemyAnim = 'hurt'; gameState.enemyAnimTime = 0;
  if (isCrit){ pushMsg('会心の 一撃！'); SE.crit(); } else SE.hit();
  pushMsg(en.name + 'に ' + dmg + ' の ダメージ！');
  gameState.battlePhase = 'message'; gameState.msgTimer = 50; gameState.nextPhase = 'enemyTurn';
}

function playerUseSkill(skillKey){
  const pl = gameState.player, en = gameState.enemy;
  const sk = SKILLS[skillKey];
  if (pl.mp < sk.mp){
    pushMsg('MPが 足りない！'); SE.cancel();
    gameState.battlePhase = 'message'; gameState.msgTimer = 40; gameState.nextPhase = 'menu';
    return;
  }
  pl.mp -= sk.mp;
  pushMsg(pl.name + 'は ' + sk.name + ' を 放った！');
  gameState.playerAnim = 'cast'; gameState.playerAnimTime = 0;
  SE.cast();
  if (sk.type === 'heal'){
    const before = pl.hp;
    pl.hp = Math.min(pl.maxHp, pl.hp + sk.heal);
    const healed = pl.hp - before;
    spawnDamage('+' + healed, 'self', '#66cc88');
    spawnEffect('heal', 0, 0, '#66cc88');
    pushMsg('HPが ' + healed + ' 回復した！'); SE.heal();
    gameState.battlePhase = 'message'; gameState.msgTimer = 50; gameState.nextPhase = 'enemyTurn';
    return;
  }
  if (!sk.sure && !calcAttackHit(pl, en)){
    pushMsg('しかし ' + en.name + 'に かわされた！'); SE.miss();
    gameState.battlePhase = 'message'; gameState.msgTimer = 40; gameState.nextPhase = 'enemyTurn';
    return;
  }
  const isCrit = Math.random() < 0.08;
  const dmg = calcDamage(effectiveAtk(pl), effectiveDef(en), sk.mul, isCrit, sk.type === 'pierce');
  en.hp = Math.max(0, en.hp - dmg);
  spawnDamage(String(dmg), 'enemy', isCrit ? '#ffcc66' : '#aaccff');
  spawnEffect(sk.type === 'pierce' ? 'pierce' : 'blast', 0, 0, gameState.route === 'hero' ? '#c8e0ff' : '#e088a0');
  gameState.shake = 14;
  gameState.enemyAnim = 'hurt'; gameState.enemyAnimTime = 0;
  if (isCrit) SE.crit(); else SE.hit();
  pushMsg(en.name + 'に ' + dmg + ' の ダメージ！');
  if (sk.type === 'drain'){
    const heal = Math.floor(dmg / 2);
    pl.hp = Math.min(pl.maxHp, pl.hp + heal);
    spawnDamage('+' + heal, 'self', '#66cc88');
    pushMsg('生命力を ' + heal + ' 吸い取った！');
  }
  gameState.battlePhase = 'message'; gameState.msgTimer = 55; gameState.nextPhase = 'enemyTurn';
}

function playerUseItemInBattle(itemKey){
  const pl = gameState.player; const it = ITEMS[itemKey];
  if (gameState.inventory[itemKey] <= 0) return;
  gameState.inventory[itemKey]--;
  if (it.type === 'heal'){
    const before = pl.hp;
    pl.hp = Math.min(pl.maxHp, pl.hp + it.amount);
    pushMsg(pl.name + 'は ' + it.name + 'を 使った。');
    pushMsg('HPが ' + (pl.hp - before) + ' 回復！');
    spawnDamage('+' + (pl.hp - before), 'self', '#66cc88'); SE.heal();
  } else if (it.type === 'mp'){
    const before = pl.mp;
    pl.mp = Math.min(pl.maxMp, pl.mp + it.amount);
    pushMsg(pl.name + 'は ' + it.name + 'を 使った。');
    pushMsg('MPが ' + (pl.mp - before) + ' 回復！'); SE.heal();
  } else if (it.type === 'fullHp'){
    pl.hp = pl.maxHp; pushMsg(it.name + ' HP全回復！'); SE.fanfare();
  }
  gameState.battlePhase = 'message'; gameState.msgTimer = 50; gameState.nextPhase = 'enemyTurn';
}

function enemyTurn(){
  const pl = gameState.player, en = gameState.enemy;
  if (en.hp <= 0){ resolveWin(); return; }
  pushMsg(en.name + 'の こうげき！');
  gameState.enemyAnim = 'attack'; gameState.enemyAnimTime = 0;
  const evaBonus = gameState.defending ? 10 : 0;
  if (Math.random() * 100 < pl.eva + evaBonus){
    pushMsg(pl.name + 'は すばやく かわした！');
    SE.miss();
    gameState.defending = false;
    gameState.battlePhase = 'message'; gameState.msgTimer = 40; gameState.nextPhase = 'menu';
    return;
  }
  const isCrit = Math.random() < 0.08;
  const defMul = gameState.defending ? 2 : 1;
  let base = en.atk - effectiveDef(pl) * defMul;
  base += randInt(-2, 2);
  if (isCrit) base = Math.floor(base * 1.5);
  if (gameState.defending) base = Math.floor(base / 2);
  const dmg = Math.max(1, Math.floor(base));
  pl.hp = Math.max(0, pl.hp - dmg);
  if (isCrit){ pushMsg('痛恨の 一撃！'); SE.crit(); } else SE.damage();
  pushMsg(pl.name + 'は ' + dmg + ' の ダメージを 受けた！');
  spawnDamage(String(dmg), 'self', isCrit ? '#ff6644' : '#ffaaaa');
  spawnEffect('hit', 0, 0, '#ff8844');
  gameState.shake = 10;
  gameState.playerAnim = 'hurt'; gameState.playerAnimTime = 0;
  gameState.defending = false;
  gameState.battlePhase = 'message'; gameState.msgTimer = 50;
  gameState.nextPhase = pl.hp <= 0 ? 'lose' : 'menu';
}

// 戦闘後ドロップ: 道具 or 装備
function rollDrop(en){
  if (Math.random() < 0.55){
    // 道具
    const drops = ['yakusou','yakusou','yakusou','mahouNoMizu'];
    const k = drops[randInt(0, drops.length - 1)];
    gameState.inventory[k] = (gameState.inventory[k] || 0) + 1;
    pushMsg(ITEMS[k].name + 'を 手に入れた！');
    SE.item();
    return;
  }
  if (Math.random() < 0.35){
    // 装備
    const route = gameState.route;
    const pl = gameState.player;
    const pool = [];
    const lv = pl.lv;
    for (const k in WEAPONS){ const w = WEAPONS[k]; if (w.route === route && w.atk > 0 && w.atk <= 2 + lv * 2) pool.push({ slot:'weapon', key:k }); }
    for (const k in ARMORS){  const a = ARMORS[k];  if (a.route === route && a.def <= 1 + lv * 2) pool.push({ slot:'armor', key:k }); }
    if (pool.length === 0) return;
    const pick = pool[randInt(0, pool.length - 1)];
    // 持ち物追加 (gameState.inventory.equips)
    if (!gameState.equipInv) gameState.equipInv = [];
    gameState.equipInv.push(pick);
    const nm = pick.slot === 'weapon' ? WEAPONS[pick.key].name : ARMORS[pick.key].name;
    pushMsg(nm + 'を 手に入れた！');
    SE.item();
  }
}

function checkSkillLearn(pl){
  const tbl = SKILL_LEARN[gameState.route];
  for (const lvStr in tbl){
    const lv = +lvStr;
    if (pl.lv >= lv){
      for (const sk of tbl[lv]){
        if (!pl.skills.includes(sk)){
          pl.skills.push(sk);
          pushMsg(SKILLS[sk].name + ' を 習得した！');
          SE.fanfare();
        }
      }
    }
  }
}

function resolveWin(){
  const pl = gameState.player, en = gameState.enemy;
  pushMsg(en.name + 'を 倒した！');
  SE.victory();
  if (gameState.scene === 'final_battle'){
    gameState.battlePhase = 'finalWin'; gameState.msgTimer = 90; gameState.flash = 30; return;
  }
  pl.exp += en.exp;
  pl.gold += en.gold || 0;
  pushMsg(en.exp + ' EXP / ' + (en.gold||0) + ' G を 得た！');
  rollDrop(en);
  let leveled = false;
  while (pl.exp >= requiredExp(gameState.route, pl.lv)){
    pl.exp -= requiredExp(gameState.route, pl.lv);
    pl.lv++;
    const g = LEVEL_GAIN[gameState.route];
    pl.maxHp += g.hp; pl.hp = pl.maxHp;
    pl.maxMp += g.mp; pl.mp = pl.maxMp;
    pl.atk += g.atk; pl.def += g.def; pl.eva += g.eva;
    pl.pointsAvail += g.points;
    leveled = true;
  }
  if (leveled){
    pushMsg('レベルが ' + pl.lv + ' に 上がった！');
    if (gameState.route === 'hero') pushMsg('ステ振り ' + LEVEL_GAIN.hero.points + ' pt 獲得！');
    SE.levelup();
    checkSkillLearn(pl);
  }
  gameState.battlePhase = 'win'; gameState.msgTimer = 110;
}

function startBattleLose(){
  gameState.battlePhase = 'lose'; gameState.msgTimer = 100;
  pushMsg(gameState.player.name + 'は 倒れた…');
  SE.defeat();
}

function battleCmdAction(c){
  SE.confirm();
  if (c === 0) playerNormalAttack();
  else if (c === 1){ gameState.battlePhase = 'skillSelect'; gameState.subCursor = 0; }
  else if (c === 2){
    gameState.defending = true;
    pushMsg(gameState.player.name + 'は 身を かまえた！');
    gameState.battlePhase = 'message'; gameState.msgTimer = 30; gameState.nextPhase = 'enemyTurn';
  } else if (c === 3){ gameState.battlePhase = 'itemSelect'; gameState.subCursor = 0; }
  else if (c === 4){
    if (gameState.scene === 'final_battle'){
      pushMsg('逃げられない！');
      gameState.battlePhase = 'message'; gameState.msgTimer = 30; gameState.nextPhase = 'enemyTurn';
    } else if (Math.random() < 0.55){
      pushMsg('うまく 逃げ切れた！');
      gameState.battlePhase = 'flee'; gameState.msgTimer = 50;
      // 逃げ成功時は 進軍状態に戻る (敵を少し後退)
    } else {
      pushMsg('しかし 回り込まれた！');
      gameState.battlePhase = 'message'; gameState.msgTimer = 30; gameState.nextPhase = 'enemyTurn';
    }
  }
}

function updateBattleAnims(){
  gameState.animTime++;
  if (gameState.playerAnim !== 'idle'){
    gameState.playerAnimTime++;
    if (gameState.playerAnimTime > 18) { gameState.playerAnim = 'idle'; gameState.playerAnimTime = 0; }
  }
  if (gameState.enemyAnim !== 'idle'){
    gameState.enemyAnimTime++;
    if (gameState.enemyAnimTime > 18) { gameState.enemyAnim = 'idle'; gameState.enemyAnimTime = 0; }
  }
  for (const d of gameState.damages){ d.y += d.vy; d.life--; }
  gameState.damages = gameState.damages.filter(d => d.life > 0);
  for (const e of gameState.effects){ e.t++; e.life--; }
  gameState.effects = gameState.effects.filter(e => e.life > 0);
  if (gameState.shake > 0) gameState.shake--;
  if (gameState.flash > 0) gameState.flash--;
}
