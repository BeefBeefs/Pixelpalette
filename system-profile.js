// Build 101: small per-system runtime overrides on top of the shared emulator handler.
(()=>{
  const body=document.body;
  const system=(body.dataset.system||'').toLowerCase();
  const original=window.startRom;
  if(typeof original!=='function'||window.__pixelPlayerSystemProfile101)return;
  window.__pixelPlayerSystemProfile101=true;
  window.startRom=function(file){
    const result=original(file);
    if(system==='n64'){
      window.EJS_defaultOptions=Object.assign({},window.EJS_defaultOptions||{}, {
        'mupen64plus-43screensize':'320x240',
        'mupen64plus-aspect':'4:3',
        'mupen64plus-MultiSampling':'0'
      });
    }
    return result;
  };
})();
