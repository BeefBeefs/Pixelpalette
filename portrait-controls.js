// Build 16: move EmulatorJS touch controls below the game in portrait play mode.
(() => {
  const stage = document.getElementById('emuStage');
  const screenFrame = stage?.querySelector('.screen-frame');
  if (!stage || !screenFrame) return;

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
