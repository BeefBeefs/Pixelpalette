// Game Boy / Color mobile rendering performance patch.
// EmulatorJS currently creates its Emscripten WebGL context with alpha enabled.
// On mobile browsers that forces full-canvas compositor blending and can cause
// severe frame pacing loss while touch controls are active. GBC output is fully
// opaque, so force an opaque context for this page.
(()=>{
  if(document.body?.dataset?.system !== 'gbc') return;
  const proto=HTMLCanvasElement.prototype;
  if(proto.__pixelPlayerOpaqueWebGL) return;
  const original=proto.getContext;
  Object.defineProperty(proto,'__pixelPlayerOpaqueWebGL',{value:true,configurable:false});
  proto.getContext=function(type,attrs){
    if(type==='webgl'||type==='webgl2'||type==='experimental-webgl'){
      attrs=Object.assign({},attrs||{},{alpha:false,premultipliedAlpha:false});
    }
    return original.call(this,type,attrs);
  };
})();
