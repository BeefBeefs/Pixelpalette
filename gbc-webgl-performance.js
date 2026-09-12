// Build 99: Game Boy / Color rendering + runtime performance patch.
(()=>{
  if(document.body?.dataset?.system !== 'gbc') return;

  // Keep the currently deployed GBC build visible so mobile/PWA cache state is
  // obvious during testing. system-shell.js has already created the footer.
  const footer=document.querySelector('footer');
  if(footer) footer.textContent='PixelPlayer • Build 99';

  // EmulatorJS supports threaded cores when SharedArrayBuffer is available.
  // Enable it only on an actually cross-origin-isolated page; otherwise leave
  // the normal single-threaded Gambatte path untouched.
  if(window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined'){
    window.EJS_threads=true;
    document.documentElement.dataset.gbcThreads='on';
  }else{
    document.documentElement.dataset.gbcThreads='off';
  }

  // EmulatorJS stable currently creates its Emscripten WebGL context with alpha
  // enabled. GBC output is opaque, so force an opaque context and avoid full-
  // canvas compositor blending on every frame.
  const proto=HTMLCanvasElement.prototype;
  if(!proto.__pixelPlayerOpaqueWebGL){
    const original=proto.getContext;
    Object.defineProperty(proto,'__pixelPlayerOpaqueWebGL',{value:true,configurable:false});
    proto.getContext=function(type,attrs){
      if(type==='webgl'||type==='webgl2'||type==='experimental-webgl'){
        attrs=Object.assign({},attrs||{},{alpha:false,premultipliedAlpha:false});
      }
      return original.call(this,type,attrs);
    };
  }

  // Record useful diagnostics without adding a frame/timer loop. These can be
  // inspected from DevTools if a device still underperforms.
  window.addEventListener('pixelplayer:system-ready',()=>{
    const canvas=document.querySelector('#game canvas');
    let glAttrs=null;
    try{
      const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
      glAttrs=gl?.getContextAttributes?.()||null;
    }catch{}
    window.PixelPlayerGbcPerf={
      build:99,
      threaded:window.EJS_threads===true,
      crossOriginIsolated:window.crossOriginIsolated===true,
      webgl:glAttrs
    };
    console.info('[PixelPlayer GBC Build 99]',window.PixelPlayerGbcPerf);
  },{once:true});
})();
