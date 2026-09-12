// Build 101: small per-system runtime overrides on top of the shared emulator handler.
(()=>{
  const system=(document.body.dataset.system||'').toLowerCase();
  if(window.__pixelPlayerSystemProfile101)return;
  window.__pixelPlayerSystemProfile101=true;

  function apply(){
    if(system==='n64'){
      window.EJS_defaultOptions=Object.assign({},window.EJS_defaultOptions||{}, {
        'mupen64plus-43screensize':'320x240',
        'mupen64plus-aspect':'4:3',
        'mupen64plus-MultiSampling':'0'
      });
    }
  }

  // system-emulator dispatches this event immediately before it assigns the
  // generic EmulatorJS options. Queue the profile so it runs right after that
  // synchronous setup but before loader.js executes, regardless of whether the
  // launch came from the file picker, recent list, or folder library.
  window.addEventListener('pixelplayer:rom-start',()=>queueMicrotask(apply));
})();
