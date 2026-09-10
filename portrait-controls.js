// Build 17: robust portrait touch-control docking for EmulatorJS.
(() => {
  const stage = document.getElementById('emuStage');
  const screenFrame = stage?.querySelector('.screen-frame');
  if (!stage || !screenFrame) return;

  const style = document.createElement('style');
  style.id = 'pixelplayer-portrait-controls-style';
  style.textContent = `
    .portrait-touch-dock{display:none;background:#000;width:100vw;position:relative;overflow:hidden;flex:1 1 auto;min-height:0}

    body.rom-playing.portrait-touch-layout #emuStage{
      display:flex!important;
      flex-direction:column!important;
      justify-content:flex-start!important;
      align-items:center!important;
      overflow:hidden!important;
      background:#000!important;
    }

    body.rom-playing.portrait-touch-layout #emuStage .screen-frame{
      width:100vw!important;
      max-width:100vw!important;
      height:auto!important;
      aspect-ratio:3/2!important;
      flex:0 0 auto!important;
      margin:0!important;
      padding:0!important;
      position:relative!important;
      overflow:hidden!important;
      background:#000!important;
    }

    body.rom-playing.portrait-touch-layout #game{
      width:100vw!important;
      height:auto!important;
      min-height:0!important;
      aspect-ratio:3/2!important;
      flex:0 0 auto!important;
      position:relative!important;
      overflow:hidden!important;
    }

    body.rom-playing.portrait-touch-layout .portrait-touch-dock{
      display:block!important;
      width:100vw!important;
      height:calc(100dvh - (100vw * 2 / 3))!important;
      min-height:180px!important;
      max-height:none!important;
      flex:1 1 auto!important;
      background:#000!important;
      position:relative!important;
      overflow:hidden!important;
    }

    /* Override EmulatorJS's built-in absolute overlay positioning in portrait. */
    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_parent{
      display:block!important;
      position:absolute!important;
      left:0!important;
      right:0!important;
      top:0!important;
      bottom:0!important;
      width:100%!important;
      height:100%!important;
      min-height:180px!important;
      margin:0!important;
      transform:none!important;
      z-index:5!important;
      background:#000!important;
      pointer-events:auto!important;
    }

    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_top,
    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_bottom{
      position:absolute!important;
      left:0!important;
      right:0!important;
      width:100%!important;
      transform:none!important;
    }

    body.rom-playing.portrait-touch-layout .play-overlay-controls{
      top:8px!important;
      right:8px!important;
    }
  `;
  document.head.appendChild(style);

  const dock = document.createElement('div');
  dock.id = 'portraitTouchDock';
  dock.className = 'portrait-touch-dock';
  dock.setAttribute('aria-label', 'Touch controls');
  screenFrame.insertAdjacentElement('afterend', dock);

  const originalParents = new WeakMap();
  let syncing = false;

  function isPortraitPlayMode() {
    const portrait = window.innerHeight >= window.innerWidth || window.matchMedia('(orientation: portrait)').matches;
    return document.body.classList.contains('rom-playing') && !document.fullscreenElement && portrait;
  }

  function getPads() {
    return [...document.querySelectorAll('.ejs_virtualGamepad_parent')];
  }

  function syncTouchLayout() {
    if (syncing) return;
    syncing = true;
    try {
      const portrait = isPortraitPlayMode();
      document.body.classList.toggle('portrait-touch-layout', portrait);
      const pads = getPads();

      for (const pad of pads) {
        if (!originalParents.has(pad) && pad.parentElement !== dock) originalParents.set(pad, pad.parentElement);

        if (portrait) {
          if (pad.parentElement !== dock) dock.appendChild(pad);
          pad.classList.add('pixelplayer-portrait-gamepad');
          // EmulatorJS may write inline placement values after creation; these neutralize them.
          pad.style.setProperty('position', 'absolute', 'important');
          pad.style.setProperty('left', '0', 'important');
          pad.style.setProperty('right', '0', 'important');
          pad.style.setProperty('top', '0', 'important');
          pad.style.setProperty('bottom', '0', 'important');
          pad.style.setProperty('width', '100%', 'important');
          pad.style.setProperty('height', '100%', 'important');
          pad.style.setProperty('transform', 'none', 'important');
        } else {
          pad.classList.remove('pixelplayer-portrait-gamepad');
          for (const prop of ['position','left','right','top','bottom','width','height','transform']) pad.style.removeProperty(prop);
          const parent = originalParents.get(pad);
          if (parent && parent.isConnected && pad.parentElement !== parent) parent.appendChild(pad);
        }
      }
    } finally {
      syncing = false;
    }
  }

  const observer = new MutationObserver(() => requestAnimationFrame(syncTouchLayout));
  observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class','style'] });

  window.addEventListener('resize', () => requestAnimationFrame(syncTouchLayout), { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(syncTouchLayout, 100));
  document.addEventListener('fullscreenchange', () => setTimeout(syncTouchLayout, 50));

  // Keep checking briefly after the emulator starts because EmulatorJS can construct
  // or replace its virtual gamepad after the ROM/core has already begun running.
  let attempts = 0;
  const timer = setInterval(() => {
    syncTouchLayout();
    attempts++;
    if (attempts >= 150) clearInterval(timer);
  }, 100);

  syncTouchLayout();
})();
