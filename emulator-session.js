// Build 103: shared session helpers + unified emulator runtime fixes.
(() => {
  if(window.PixelPlayerSession?.build>=103)return;
  const CHANNEL='pixelplayer-emulator-session-v1',STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  if(!document.body.dataset.system)document.body.dataset.system=page;
  document.body.dataset.build='103';
  const stage=document.getElementById('emuStage');let claimed=false,shuttingDown=false,channel=null;

  if(!document.querySelector('link[href*="emulator-performance.css"]')){
    const perfCss=document.createElement('link');perfCss.rel='stylesheet';perfCss.href='emulator-performance.css?v=103';document.head.appendChild(perfCss);
  }

  const canvasProto=HTMLCanvasElement.prototype;
  if(!canvasProto.__pixelPlayerOpaqueWebGL){
    const originalGetContext=canvasProto.getContext;
    Object.defineProperty(canvasProto,'__pixelPlayerOpaqueWebGL',{value:true,configurable:false});
    canvasProto.getContext=function(type,attrs){
      if(type==='webgl'||type==='webgl2'||type==='experimental-webgl')attrs=Object.assign({},attrs||{},{alpha:false,premultipliedAlpha:false});
      return originalGetContext.call(this,type,attrs);
    };
  }

  if(window.crossOriginIsolated && typeof SharedArrayBuffer!=='undefined') window.EJS_threads=true;

  const compact=document.createElement('style');compact.id='pixelplayer-build103-compact';compact.textContent='.emulator-page .emulator-hero{display:none!important}.emulator-page .tool-tabs{margin-bottom:0}.rom-game-cover{overflow:hidden!important}.rom-game-cover img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:fill!important;display:block!important;margin:0!important}';document.head.appendChild(compact);
  function inject(src,version=103){if(document.querySelector(`script[src*="${src}"]`))return;const s=document.createElement('script');s.src=`${src}?v=${version}`;s.defer=true;document.body.appendChild(s)}
  inject('version-check.js',103);inject('nav.js',103);inject('pwa.js',103);inject('touch-guard.js',97);inject('core-selector.js',69);inject('folder-scan-progress.js',69);if(page==='gba')inject('gba-zip-support.js',71);inject('folder-indexer-upgrade.js',91);inject('game-art.js',94);inject('boxart-progress.js',86);inject('boxart-autoload.js',94);inject('offline-core-manager.js',92);inject('ui-cleanup.js',93);inject('layout-tweaks.js',95);
  if(!document.querySelector('script[src*="low-memory.js"]')){const s=document.createElement('script');s.src='low-memory.js?v=80';s.defer=true;document.body.appendChild(s)}
  inject('menu-motion.js',76);inject('auto-play-defaults.js',76);inject('direct-recent-launch.js',80);
  inject('controller-themes.js',48);inject('control-layout.js',51);inject('quick-resume.js',53);
  inject('overlay-state-menu.js',62);inject('performance-display.js',60);
  inject('shared-state-thumbnails.js',102);inject('portrait-hitbox-fix.js',102);

  document.querySelectorAll('.pixelplayer-build-id').forEach(x=>x.remove());
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='PixelPlayer • Build 103';

  const legacyDb={gba:'PixelPlayerGbaStates',snes:'PixelPlayerSNESStates',ps1:'PixelPlayerPs1States',n64:'PixelPlayerN64States'}[page];
  if(legacyDb){
    const cleanupKey=`pixelplayer:migration101:${page}:legacy-state-cleared`;
    try{if(!localStorage.getItem(cleanupKey)){indexedDB.deleteDatabase(legacyDb);localStorage.setItem(cleanupKey,'1')}}catch{}
  }

  const stopButton=document.getElementById('chooseAnotherBtn');if(stopButton)stopButton.textContent='Stop Emulation';
  function hasActiveRuntime(){return claimed||!!window.EJS_emulator||!!stage?.classList.contains('ready')}
  function teardown(reason='navigate'){window.dispatchEvent(new CustomEvent('pixelplayer:hard-unload',{detail:{reason,page}}));try{window.PixelPlayerQuickResume?.save?.(reason)}catch{}const e=window.EJS_emulator,gm=e?.gameManager;try{gm?.toggleFastForward?.(false)}catch{}try{gm?.toggleMainLoop?.(0)}catch{}try{e?.pause?.()}catch{}for(const fn of ['quit','exit','destroy','close']){try{gm?.[fn]?.()}catch{}try{e?.[fn]?.()}catch{}}try{document.getElementById('game')?.replaceChildren()}catch{}try{document.querySelectorAll('canvas,video,audio').forEach(x=>{try{x.pause?.()}catch{}try{x.remove()}catch{}})}catch{}try{delete window.EJS_emulator}catch{window.EJS_emulator=null}try{window.EJS_gameUrl=null;window.EJS_biosUrl=null}catch{}}
  function cleanStoppedUrl(){const u=new URL(location.href);u.searchParams.delete('play');u.searchParams.delete('resume');u.searchParams.delete('game');u.searchParams.set('build','103');u.searchParams.set('stopped','1');return `${u.pathname}${u.search}${u.hash}`}
  function stopEmulation(event){event?.preventDefault?.();event?.stopImmediatePropagation?.();if(shuttingDown)return;shuttingDown=true;document.body.classList.remove('rom-playing','pp-transition-in','pp-reveal','low-memory-running');teardown('stop-emulation');claimed=false;try{localStorage.removeItem(STORAGE_KEY)}catch{}requestAnimationFrame(()=>location.replace(cleanStoppedUrl()))}
  if(stopButton)stopButton.addEventListener('click',stopEmulation,true);
  function hardNavigate(href){if(shuttingDown)return;shuttingDown=true;teardown('system-switch');requestAnimationFrame(()=>location.assign(href))}
  function unloadForOtherSession(){if(shuttingDown||!hasActiveRuntime())return;shuttingDown=true;teardown('other-session');setTimeout(()=>location.reload(),50)}
  function receive(message){if(!message||message.type!=='claim'||message.tabId===tabId)return;unloadForOtherSession()}
  try{channel=new BroadcastChannel(CHANNEL);channel.addEventListener('message',event=>receive(event.data))}catch{}
  window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY||!event.newValue)return;try{receive(JSON.parse(event.newValue))}catch{}});
  function claim(){if(shuttingDown)return;claimed=true;const message={type:'claim',tabId,page,at:Date.now()};try{channel?.postMessage(message)}catch{}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(message))}catch{}}
  document.getElementById('romInput')?.addEventListener('change',event=>{if(event.target?.files?.length)claim()},true);
  document.getElementById('romDrop')?.addEventListener('drop',event=>{if(event.dataTransfer?.files?.length)claim()},true);
  if(stage){const sync=()=>{if(stage.classList.contains('ready')&&!claimed)claim()};new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['class']});sync()}

  window.addEventListener('pixelplayer:system-ready',()=>{
    const canvas=document.querySelector('#game canvas');let webgl=null;
    try{const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');webgl=gl?.getContextAttributes?.()||null}catch{}
    window.PixelPlayerPerf={build:103,page,threaded:window.EJS_threads===true,crossOriginIsolated:window.crossOriginIsolated===true,webgl};
    console.info('[PixelPlayer Build 103]',window.PixelPlayerPerf);
  },{once:true});

  window.PixelPlayerSession={build:103,claim,hardNavigate,teardown,stopEmulation,tabId,page};
})();