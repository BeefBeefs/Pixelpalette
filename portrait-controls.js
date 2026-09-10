// Build 16: move EmulatorJS touch controls below the game in portrait play mode.
(() => {
  const stage = document.getElementById('emuStage');
  const screenFrame = stage?.querySelector('.screen-frame');
  if (!stage || !screenFrame) return;

  const style = document.createElement('style');
  style.textContent = `
    .portrait-touch-dock{display:none;background:#000;width:100%;position:relative;overflow:visible}
    body.rom-playing.portrait-touch-layout #emuStage{display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;overflow:hidden!important}
    body.rom-playing.portrait-touch-layout #emuStage .screen-frame{width:100vw!important;max-width:100vw!important;height:auto!important;flex:0 0 auto!important;margin:0!important}
    body.rom-playing.portrait-touch-layout #game{width:100vw!important;aspect-ratio:3/2!important;height:auto!important;flex:0 0 auto!important}
    body.rom-playing.portrait-touch-layout .portrait-touch-dock{display:block!important;flex:1 1 auto!important;min-height:220px!important;width:100vw!important;background:#000!important;position:relative!important;overflow:hidden!important}
    body.rom-playing.portrait-touch-layout .portrait-touch-dock .ejs_virtualGamepad_parent{display:block!important;position:absolute!important;inset:0!important;bottom:auto!important;width:100%!important;height:100%!important;transform:none!important;background:#000!important}
    body.rom-playing.portrait-touch-layout .portrait-touch-dock .ejs_virtualGamepad_top{position:absolute!important;inset:0!important}
    @media (orientation:portrait){
      body.rom-playing.portrait-touch-layout .play-overlay-controls{top:8px!important;right:8px!important}
    }
  `;
  document.head.appendChild(style);

  const dock = document.createElement('div');
  dock.id = 'portraitTouchDock';
  dock.className = 'portrait-touch-dock';
  dock.setAttribute('aria-label', 'Touch controls');
  screenFrame.insertAdjacentElement('afterend', dock);

  let gamepad = null;
  let originalParent = null;
  let observer = null;

  function isPortraitPlayMode() {
    return document.body.classList.contains('rom-playing') &&
      !document.fullscreenElement &&
      window.matchMedia('(orientation: portrait)').matches;
  }

  function findGamepad() {
    const found = document.querySelector('#game .ejs_virtualGamepad_parent, .ejs_virtualGamepad_parent');
    if (found && found !== gamepad) {
      gamepad = found;
      originalParent = found.parentElement;
    }
    return gamepad;
  }

  function syncTouchLayout() {
    const pad = findGamepad();
    const portrait = isPortraitPlayMode();
    document.body.classList.toggle('portrait-touch-layout', portrait);
    if (!pad) return;

    if (portrait) {
      if (pad.parentElement !== dock) dock.appendChild(pad);
      pad.classList.add('pixelplayer-portrait-gamepad');
    } else {
      pad.classList.remove('pixelplayer-portrait-gamepad');
      if (originalParent && pad.parentElement !== originalParent) originalParent.appendChild(pad);
    }
  }

  if (!document.fullscreenElement && window.matchMedia('(orientation: portrait)').matches) {
    document.body.classList.add('portrait-touch-layout');
  }

  function startWatching() {
    if (observer) return;
    observer = new MutationObserver(syncTouchLayout);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  window.addEventListener('resize', syncTouchLayout, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(syncTouchLayout, 150));
  document.addEventListener('fullscreenchange', () => setTimeout(syncTouchLayout, 50));
  startWatching();

  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    syncTouchLayout();
    if (findGamepad() || attempts > 120) clearInterval(timer);
  }, 100);

  syncTouchLayout();
})();
