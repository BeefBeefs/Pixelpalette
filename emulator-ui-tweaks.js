// Build 12 UI behavior tweaks: latched fast-forward and top-stage polish.
(() => {
  const ffButton = document.getElementById('fastForwardBtn');
  const resetButton = document.getElementById('resetBtn');
  const controlStatus = document.getElementById('controlStatus');
  if (!ffButton) return;

  let latchedFastForward = false;

  function status(message, kind = 'good') {
    if (!controlStatus) return;
    controlStatus.textContent = message;
    controlStatus.className = `status ${kind}`;
  }

  function renderFastForward() {
    ffButton.classList.toggle('active-toggle', latchedFastForward);
    ffButton.setAttribute('aria-pressed', latchedFastForward ? 'true' : 'false');
    const title = ffButton.querySelector('span');
    const note = ffButton.querySelector('small');
    if (title) title.textContent = latchedFastForward ? '⏩ Fast Forward: ON' : '⏩ Fast Forward: OFF';
    if (note) note.textContent = latchedFastForward ? 'Tap to return to 1×' : 'Tap to toggle 3×';
  }

  // Capture-phase listener prevents the older Build 10/11 click handler from also firing.
  ffButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const emulator = window.EJS_emulator;
    if (!emulator?.gameManager || ffButton.disabled) return;

    try {
      latchedFastForward = !latchedFastForward;
      emulator.gameManager.setFastForwardRatio?.(3);
      emulator.gameManager.toggleFastForward?.(latchedFastForward);
      renderFastForward();
      status(latchedFastForward ? 'Fast forward locked ON at 3×. Tap again to turn it off.' : 'Fast forward turned OFF. Running at normal speed.');
    } catch (error) {
      console.error(error);
      latchedFastForward = false;
      renderFastForward();
      status('Fast forward could not be changed.', 'warn');
    }
  }, true);

  resetButton?.addEventListener('click', () => {
    latchedFastForward = false;
    renderFastForward();
  }, true);

  renderFastForward();
})();
