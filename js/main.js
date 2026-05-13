'use strict';
// =============================================================
// main.js — メインループ
// =============================================================

function update(){
  updateFade();
  switch (gameState.scene){
    case 'title':        updateTitle(); break;
    case 'settings':     updateSettings(); break;
    case 'route_select': updateRouteSelect(); break;
    case 'prologue':     updatePrologue(); break;
    case 'name_input':   updateNameInput(); break;
    case 'map':          updateMap(); break;
    case 'merchant':     updateMerchant(); break;
    case 'battle':
    case 'final_battle': updateBattle(); break;
    case 'ending':       updateEnding(); break;
  }
  for (const k in justPressed) justPressed[k] = false;
}
function draw(){
  switch (gameState.scene){
    case 'title':        drawTitle(); break;
    case 'settings':     drawSettings(); break;
    case 'route_select': drawRouteSelect(); break;
    case 'prologue':     drawPrologue(); break;
    case 'name_input':   drawNameInput(); break;
    case 'map':          drawMap(); break;
    case 'merchant':     drawMerchant(); break;
    case 'battle':
    case 'final_battle': drawBattle(); break;
    case 'ending':       drawEnding(); break;
  }
  drawFade();
  drawScanlines();
}
function loop(){ update(); draw(); requestAnimationFrame(loop); }

cvs.focus();
loop();
