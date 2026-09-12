// Build 102: refresh EmulatorJS touch geometry after PixelPlayer moves the virtual pad.
(()=>{
  if(window.__pixelPlayerPortraitHitbox102)return;window.__pixelPlayerPortraitHitbox102=true;
  let queued=false,lastPad=null;
  function portrait(){return document.body.classList.contains('rom-playing')&&(window.innerHeight>=window.innerWidth||matchMedia('(orientation: portrait)').matches)&&!document.fullscreenElement}
  function pad(){return document.querySelector('#portraitTouchDock .ejs_virtualGamepad_parent')}
  function refresh(){queued=false;if(!portrait())return;const p=pad();if(!p)return;const moved=p!==lastPad;lastPad=p;
    // Force the browser to commit the pad's new geometry before EmulatorJS recomputes its touch zones.
    p.getBoundingClientRect();
    p.querySelectorAll('.ejs_virtualGamepad_left,.ejs_virtualGamepad_right,.ejs_virtualGamepad_top,.ejs_virtualGamepad_bottom,.ejs_virtualGamepad_button,[class*="dpad"],[class*="joystick"],[class*="zone"]').forEach(el=>{try{el.getBoundingClientRect()}catch{}});
    window.dispatchEvent(new Event('resize'));
    // Older/stable EmulatorJS builds can update their cached zones one frame later.
    if(moved)setTimeout(()=>{if(p.isConnected&&portrait()){try{p.getBoundingClientRect()}catch{}window.dispatchEvent(new Event('resize'))}},80);
  }
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(refresh))}
  const dockObserver=new MutationObserver(m=>{if(m.some(x=>x.addedNodes.length||x.removedNodes.length))queue()});
  function watchDock(){const d=document.getElementById('portraitTouchDock');if(d&&!d.__ppHitboxWatch){d.__ppHitboxWatch=true;dockObserver.observe(d,{childList:true})}}
  const bodyObserver=new MutationObserver(()=>{watchDock();queue()});bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  const treeObserver=new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n.nodeType===1&&(n.id==='portraitTouchDock'||n.querySelector?.('#portraitTouchDock'))))){watchDock();queue()}});treeObserver.observe(document.body,{childList:true,subtree:true});
  addEventListener('orientationchange',()=>setTimeout(queue,100));document.addEventListener('fullscreenchange',()=>setTimeout(queue,50));
  watchDock();queue();
})();