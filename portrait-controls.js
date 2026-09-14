// Build 127: portrait touch layout without destroying EmulatorJS native desktop/landscape styles.
(() => {
  const stage = document.getElementById('emuStage');
  const screenFrame = stage?.querySelector('.screen-frame');
  if (!stage || !screenFrame) return;

  const style = document.createElement('style');
  style.id = 'pixelplayer-portrait-controls-style';
  style.textContent = `
    .portrait-touch-dock{display:none;background:#000;width:100vw;position:relative;overflow:hidden;flex:0 0 auto;min-height:0}

    body.rom-playing.portrait-touch-layout #emuStage{
      display:flex!important;
      flex-direction:column!important;
      justify-content:flex-start!important;
      align-items:center!important;
      overflow:hidden!important;
      background:#000!important;
      padding-top:max(0px,calc(40dvh - (100vw / 3)))!important;
      box-sizing:border-box!important;
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
      height:max(180px,calc(60dvh - (100vw / 3)))!important;
      min-height:180px!important;
      max-height:none!important;
      flex:0 0 auto!important;
      background:#000!important;
      position:relative!important;
      overflow:hidden!important;
      margin-top:0!important;
    }

    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_parent{
      display:block!important;
      position:absolute!important;
      left:0!important;
      right:0!important;
      top:-18px!important;
      bottom:auto!important;
      width:100%!important;
      height:calc(100% + 18px)!important;
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

    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_button.pixelplayer-start-button,
    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_button.pixelplayer-select-button{
      position:fixed!important;
      top:calc(max(0px,calc(40dvh - (100vw / 3))) + (100vw * 2 / 3) + 12px)!important;
      bottom:auto!important;
      right:auto!important;
      z-index:1150!important;
      margin:0!important;
    }

    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_button.pixelplayer-select-button{
      left:calc(50vw - 8px)!important;
      transform:translateX(-100%)!important;
    }

    body.rom-playing.portrait-touch-layout .ejs_virtualGamepad_button.pixelplayer-start-button{
      left:calc(50vw + 8px)!important;
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
  const originalInline = new WeakMap();
  let syncing = false;
  let syncQueued = false;

  const MANAGED_PROPS = ['position','left','right','top','bottom','width','height','transform'];

  function queueSync() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => {
      syncQueued = false;
      syncTouchLayout();
    });
  }

  function isPortraitPlayMode() {
    const portrait = window.innerHeight >= window.innerWidth || window.matchMedia('(orientation: portrait)').matches;
    return document.body.classList.contains('rom-playing') && !document.fullscreenElement && portrait;
  }

  function getPads() {
    return [...document.querySelectorAll('.ejs_virtualGamepad_parent')];
  }

  function snapshotInline(pad) {
    if (originalInline.has(pad)) return;
    const snap = {};
    for (const prop of MANAGED_PROPS) {
      snap[prop] = {
        value: pad.style.getPropertyValue(prop),
        priority: pad.style.getPropertyPriority(prop)
      };
    }
    originalInline.set(pad, snap);
  }

  function restoreInline(pad) {
    const snap = originalInline.get(pad);
    if (!snap) return;
    for (const prop of MANAGED_PROPS) {
      const rec = snap[prop];
      if (rec?.value) pad.style.setProperty(prop, rec.value, rec.priority || '');
      else pad.style.removeProperty(prop);
    }
    originalInline.delete(pad);
  }

  function tagStartSelectButtons(pad, portrait) {
    const buttons = [...pad.querySelectorAll('.ejs_virtualGamepad_button')];
    for (const button of buttons) {
      const label = (button.textContent || '').trim().toUpperCase();
      if (portrait && label === 'START') button.classList.add('pixelplayer-start-button');
      else button.classList.remove('pixelplayer-start-button');

      if (portrait && label === 'SELECT') button.classList.add('pixelplayer-select-button');
      else button.classList.remove('pixelplayer-select-button');
    }
  }

  function syncTouchLayout() {
    if (syncing) return;
    syncing = true;
    try {
      const portrait = isPortraitPlayMode();
      document.body.classList.toggle('portrait-touch-layout', portrait);
      const pads = getPads();

      for (const pad of pads) {
        if (portrait) {
          if (!originalParents.has(pad)) originalParents.set(pad, pad.parentElement);
          snapshotInline(pad);
          if (pad.parentElement !== dock) dock.appendChild(pad);
          pad.classList.add('pixelplayer-portrait-gamepad');
          pad.style.setProperty('position', 'absolute', 'important');
          pad.style.setProperty('left', '0', 'important');
          pad.style.setProperty('right', '0', 'important');
          pad.style.setProperty('top', '-18px', 'important');
          pad.style.setProperty('bottom', 'auto', 'important');
          pad.style.setProperty('width', '100%', 'important');
          pad.style.setProperty('height', 'calc(100% + 18px)', 'important');
          pad.style.setProperty('transform', 'none', 'important');
        } else if (pad.classList.contains('pixelplayer-portrait-gamepad') || originalInline.has(pad)) {
          // Only undo styles PixelPlayer itself changed. Never strip EmulatorJS's
          // native inline desktop/landscape positioning from a newly-created pad.
          pad.classList.remove('pixelplayer-portrait-gamepad');
          restoreInline(pad);
          const parent = originalParents.get(pad);
          if (parent && parent.isConnected && pad.parentElement !== parent) parent.appendChild(pad);
          originalParents.delete(pad);
        }

        tagStartSelectButtons(pad, portrait);
      }
    } finally {
      syncing = false;
    }
  }

  const treeObserver = new MutationObserver(mutations => {
    if (mutations.some(m => m.addedNodes.length || m.removedNodes.length)) queueSync();
  });
  treeObserver.observe(document.body, { childList:true, subtree:true });

  const bodyClassObserver = new MutationObserver(queueSync);
  bodyClassObserver.observe(document.body, { attributes:true, attributeFilter:['class'] });

  window.addEventListener('resize', queueSync, { passive:true });
  window.addEventListener('orientationchange', () => setTimeout(queueSync, 100));
  document.addEventListener('fullscreenchange', () => setTimeout(queueSync, 50));

  let attempts = 0;
  const timer = setInterval(() => {
    syncTouchLayout();
    attempts++;
    if (getPads().length || attempts >= 25) clearInterval(timer);
  }, 400);

  syncTouchLayout();
})();