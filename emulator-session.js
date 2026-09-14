// Build 129: shared session helpers using EmulatorJS native canvas/thread behavior for compatibility.
(() => {
  if(window.PixelPlayerSession?.build>=129)return;
  const CHANNEL='pixelplayer-emulator-session-v1',STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  if(!document.body.dataset.system)document.body.dataset.system=page;
  document.body.dataset.build='129';
  const stage=document.getElementById('emuStage');let claimed=false,shuttingDown=false,channel=null;

  if(!document.querySelector('link[href*="emulator-performance.css"]')){
    const perfCss=document.createElement('link');perfCss.rel='stylesheet';perfCss.href='emulator-performance.css?v=129';document.head.appendChild(perfCss);
  }

  // Important: do not monkey-patch canvas.getContext() and do not globally force
  // EJS_threads. EmulatorJS/core-specific code owns those decisions. The old
  // shared overrides could produce a successfully initialized core with a dead
  // or black renderer on desktop Chromium/GPU combinations.

  const compact=document.createElement('style');compact.id='pixelplayer-build129-compact';compact.textContent='.emulator-page .emulator-hero{display:none!important}.emulator-page .tool-tabs{margin-bottom:0}.rom-game-cover{overflow:hidden!important}.rom-game-cover img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:fill!important;display:block!important;margin:0!important}';document.head.appendChild(compact);
  function inject(src,version=129){if(document.querySelector(`script[src*="${src}"]`))return;const s=document.createElement('script');s.src=`${src}?v=${version}`;s.defer=true;document.body.appendChild(s)}
  inject('version-check.js',129);inject('nav.js',129);inject('pwa.js',129);inject('touch-guard.js',129);inject('core-selector.js',129);inject('folder-scan-progress.js',129);if(page==='gba')inject('gba-zip-support.js',129);inject('folder-indexer-upgrade.js',129);inject('game-art.js',129);inject('boxart-progress.js',129);inject('boxart-autoload.js',129);inject('offline-core-manager.js',129);inject('ui-cleanup.js',129);inject('layout-tweaks.js',129);
  inject('menu-motion.js',129);inject('auto-play-defaults.js',129);inject('direct-recent-launch.js',129);
  inject('controller-themes.js',129);inject('control-layout.js',129);inject('quick-resume.js',129);
  inject('overlay-state-menu.js',129);inject('performance-display.js',129);
  inject('shared-state-thumbnails.js',129);inject('portrait-hitbox-fix.js',129);

  document.querySelectorAll('.pixelplayer-build-id').forEach(x=>x.remove());
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='PixelPlayer • Build 129';

  const legacyDb={gba:'PixelPlayerGbaStates',snes:'PixelPlayerSNESStates',ps1:'PixelPlayerPs1States',n64:'PixelPlayerN64States'}[page];
  if(legacyDb){
    const cleanupKey=`pixelplayer:migration101:${page}:legacy-state-cleared`;
    try{if(!localStorage.getItem(cleanupKey)){indexedDB.deleteDatabase(legacyDb);localStorage.setItem(cleanupKey,'1')}}catch{}
  }

  const stopButton=document.getElementById('chooseAnotherBtn');if(stopButton)stopButton.textContent='Stop Emulation';
  function hasActiveRuntime(){return claimed||!!window.EJS_emulator||!!stage?.classList.contains('ready')}
  function teardown(reason='navigate'){window.dispatchEvent(new CustomEvent('pixelplayer:hard-unload',{detail:{reason,page}}));try{window.PixelPlayerQuickResume?.save?.(reason)}catch{}const e=window.EJS_emulator,gm=e?.gameManager;try{gm?.toggleFastForward?.(false)}catch{}try{gm?.toggleMainLoop?.(0)}catch{}try{e?.pause?.()}catch{}for(const fn of ['quit','exit','destroy','close']){try{gm?.[fn]?.()}catch{}try{e?.[fn]?.()}catch{}}try{document.getElementById('game')?.replaceChildren()}catch{}try{document.querySelectorAll('#game canvas,#game video,#game audio').forEach(x=>{try{x.pause?.()}catch{}try{x.remove()}catch{}})}catch{}try{delete window.EJS_emulator}catch{window.EJS_emulator=null}try{window.EJS_gameUrl=null;window.EJS_biosUrl=null}catch{}}
  function cleanStoppedUrl(){const u=new URL(location.href);u.searchParams.delete('play');u.searchParams.delete('resume');u.searchParams.delete('game');u.searchParams.set('build','129');u.searchParams.set('stopped','1');return `${u.pathname}${u.search}${u.hash}`}
  function stopEmulation(event){event?.preventDefault?.();event?.stopImmediatePropagation?.();if(shuttingDown)return;shuttingDown=true;document.body.classList.remove('rom-playing','pp-transition-in','pp-reveal');teardown('stop-emulation');claimed=false;try{localStorage.removeItem(STORAGE_KEY)}catch{}requestAnimationFrame(()=>location.replace(cleanStoppedUrl()))}
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
    window.PixelPlayerPerf={build:129,page,threaded:window.EJS_threads===true,crossOriginIsolated:window.crossOriginIsolated===true,webgl,canvas:canvas?{width:canvas.width,height:canvas.height,clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight}:null};
    console.info('[PixelPlayer Build 129]',window.PixelPlayerPerf);
  },{once:true});

  window.PixelPlayerSession={build:129,claim,hardNavigate,teardown,stopEmulation,tabId,page};
})();