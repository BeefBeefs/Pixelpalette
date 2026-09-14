// Gecko browser test: load the upstream WebAssembly/WebGPU build without EmulatorJS.
(() => {
  const REMOTE_MODULE = 'https://gecko.layle.dev/pkg/gecko_web.js';
  const $ = id => document.getElementById(id);
  const romInput = $('geckoRomInput');
  const dspInput = $('geckoDspInput');
  const startButton = $('geckoStartBtn');
  const status = $('geckoStatus');
  const requirements = $('geckoRequirements');
  const runtime = $('geckoRuntime');
  const runtimeState = $('geckoRuntimeState');
  let romData = null;
  let romName = '';
  let dspData = null;
  let gecko = null;
  let started = false;

  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = `gecko-status${kind ? ` ${kind}` : ''}`;
  }

  function renderRequirements() {
    const checks = [
      ['WebGPU', !!navigator.gpu, 'Required by Gecko’s browser renderer.'],
      ['Secure context', window.isSecureContext, 'GitHub Pages and localhost are supported.'],
      ['WebAssembly', typeof WebAssembly !== 'undefined', 'Required to load Gecko.']
    ];
    requirements.innerHTML = checks.map(([name, ok, detail]) => `<div class="gecko-requirement ${ok ? 'ok' : 'fail'}"><i>${ok ? '✓' : '!'}</i><span><strong>${name}</strong> · ${detail}</span></div>`).join('');
    if (checks.some(([, ok]) => !ok)) setStatus('This browser does not meet Gecko’s minimum requirements.', 'warn');
    else setStatus('Choose an IPL or DOL file to enable the test.');
    updateButton();
  }

  function updateButton() {
    startButton.disabled = started || !romData || !navigator.gpu || !window.isSecureContext || typeof WebAssembly === 'undefined';
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = () => reject(reader.error || new Error('File could not be read.'));
      reader.readAsArrayBuffer(file);
    });
  }

  function moveRuntimeCanvas() {
    document.querySelectorAll('body > canvas').forEach(canvas => {
      if (canvas.parentElement !== runtime) runtime.appendChild(canvas);
    });
  }

  romInput.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStatus(`Reading ${file.name}…`);
      romData = await readFile(file);
      romName = file.name;
      setStatus(`${file.name} is ready. Add DSP IROM if needed, then start Gecko.`, 'good');
    } catch (error) {
      romData = null;
      setStatus(error.message || 'The IPL/DOL file could not be read.', 'error');
    }
    updateButton();
  });

  dspInput.addEventListener('change', async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      dspData = await readFile(file);
      setStatus(`${romName || 'IPL/DOL'} and ${file.name} are ready.`, 'good');
    } catch (error) {
      dspData = null;
      setStatus(error.message || 'The DSP file could not be read.', 'error');
    }
  });

  async function startGecko() {
    if (!romData || started) return;
    started = true;
    startButton.disabled = true;
    runtimeState.textContent = 'Loading';
    setStatus('Loading Gecko’s WebAssembly module and WebGPU runtime…');
    try {
      gecko ||= await import(REMOTE_MODULE);
      if (typeof gecko.default === 'function') await gecko.default();
      if (typeof gecko.start_emulator !== 'function') throw new Error('The Gecko browser build did not expose start_emulator.');
      await gecko.start_emulator(romData, romName, dspData || undefined);
      moveRuntimeCanvas();
      requestAnimationFrame(moveRuntimeCanvas);
      setTimeout(moveRuntimeCanvas, 100);
      document.body.classList.add('gecko-running');
      runtimeState.textContent = 'Running';
      setStatus('Gecko started. If the runtime does not render, use the official test link for a clean diagnostic.', 'good');
      runtime.querySelector('.gecko-runtime-placeholder')?.remove();
    } catch (error) {
      started = false;
      runtimeState.textContent = 'Error';
      startButton.disabled = false;
      const message = error?.message || String(error);
      setStatus(`Gecko could not start: ${message}`, 'error');
      console.error('[PixelPlayer Gecko test]', error);
    }
  }

  startButton.addEventListener('click', startGecko);
  window.addEventListener('error', event => {
    if (started) setStatus(`Gecko reported an error: ${event.message || 'unknown browser error'}`, 'error');
  });
  window.addEventListener('unhandledrejection', event => {
    if (started) setStatus(`Gecko reported an error: ${event.reason?.message || event.reason || 'unknown promise error'}`, 'error');
  });
  renderRequirements();
})();
