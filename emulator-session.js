// Build 130: shared session helpers with protected EmulatorJS renderer diagnostics.
(() => {
  if(window.PixelPlayerSession?.build>=130)return;
  const CHANNEL='pixelplayer-emulator-session-v1',STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  if(!document.body.dataset.system)document.body.dataset.system=page;
  document.body.dataset.build='130';
  const stage=document.getElementById('emuStage');let claimed=false,shuttingDown=false,channel=null;

  if(!document.querySelector('link[href*="emulator-performance.css"]')){
    const perfCss=document.createElement('link');perfCss.rel='stylesheet';perfCss.href='emulator-performance.css?v=130';document.head.appendChild(perfCss);
  }

  const compact=document.createElement('style');compact.id='pixelplayer-build130-compact';compact.textContent='.emulator-page .emulator-hero{display:none!important}.emulator-page .tool-tabs{margin-bottom:0}.rom-game-cover{overflow:hidden!important}.rom-game-cover img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:fill!important;display:block!important;margin:0!important}';document.head.appendChild(compact);
  function inject(src,version=130){if(document.querySelector(`script[src*="${src}"]`))return;const s=document.createElement('script');s.src=`${src}?v=${version}`;s.defer=true;document.body.appendChild(s)}
  inject('version-check.js',130);inject('nav.js',130);inject('pwa.js',130);inject('touch-guard.js',130);inject('core-selector.js',130);inject('folder-scan-progress.js',130);if(page==='gba')inject('gba-zip-support.js',130);inject('folder-indexer-upgrade.js',130);inject('game-art.js',130);inject('boxart-progress.js',130);inject('boxart-autoload.js',130);inject('offline-core-manager.js',130);inject('ui-cleanup.js',130);inject('layout-tweaks.js',130);
  inject('menu-motion.js',130);inject('auto-play-defaults.js',130);inject('direct-recent-launch.js',130);
  inject('controller-themes.js',130);inject('control-layout.js',130);inject('quick-resume.js',130);
  inject('overlay-state-menu.js',130);inject('performance-display.js',130);
  inject('shared-state-thumbnails.js',130);inject('portrait-hitbox-fix.js',130);

  document.querySelectorAll('.pixelplayer-build-id').forEach(x=>x.remove());
  const footer=document.querySelector('footer');
  if(footer)footer.textContent='PixelPlayer • Build 130';

  const legacyDb={gba:'PixelPlayerGbaStates',snes:'PixelPlayerSNESStates',ps1:'PixelPlayerPs1States',n64:'PixelPlayerN64States'}[page];
  if(legacyDb){
    const cleanupKey=`pixelplayer:migration101:${page}:legacy-state-cleared`;
    try{if(!localStorage.getItem(cleanupKey)){indexedDB.deleteDatabase(legacyDb);localStorage.setItem(cleanupKey,'1')}}catch{}
  }

  const stopButton=document.getElementById('chooseAnotherBtn');if(stopButton)stopButton.textContent='Stop Emulation';
  function hasActiveRuntime(){return claimed||!!window.EJS_emulator||!!stage?.classList.contains('ready')}
  function teardown(reason='navigate'){window.dispatchEvent(new CustomEvent('pixelplayer:hard-unload',{detail:{reason,page}}));try{window.PixelPlayerQuickResume?.save?.(reason)}catch{}const e=window.EJS_emulator,gm=e?.gameManager;try{gm?.toggleFastForward?.(false)}catch{}try{gm?.toggleMainLoop?.(0)}catch{}try{e?.pause?.()}catch{}for(const fn of ['quit','exit','destroy','close']){try{gm?.[fn]?.()}catch{}try{e?.[fn]?.()}catch{}}try{document.getElementById('game')?.replaceChildren()}catch{}try{document.querySelectorAll('#game canvas,#game video,#game audio').forEach(x=>{try{x.pause?.()}catch{}try{x.remove()}catch{}})}catch{}try{delete window.EJS_emulator}catch{window.EJS_emulator=null}try{window.EJS_gameUrl=null;window.EJS_biosUrl=null}catch{}}
  function cleanStoppedUrl(){const u=new URL(location.href);u.searchParams.delete('play');u.searchParams.delete('resume');u.searchParams.delete('game');u.searchParams.set('build','130');u.searchParams.set('stopped','1');return `${u.pathname}${u.search}${u.hash}`}
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
    const canvas=document.querySelector('#game .ejs_canvas')||document.querySelector('#game canvas');
    const game=document.getElementById('game');
    const pad=document.querySelector('#game .ejs_virtualGamepad_parent');
    let webgl=null,glType=null;
    try{const gl2=canvas?.getContext('webgl2');const gl=gl2||canvas?.getContext('webgl');glType=gl2?'webgl2':gl?'webgl':null;webgl=gl?.getContextAttributes?.()||null}catch{}
    const cs=canvas?getComputedStyle(canvas):null,gs=game?getComputedStyle(game):null,ps=pad?getComputedStyle(pad):null;
    window.PixelPlayerPerf={build:130,page,threaded:window.EJS_threads===true,crossOriginIsolated:window.crossOriginIsolated===true,glType,webgl,canvas:canvas?{className:canvas.className,width:canvas.width,height:canvas.height,clientWidth:canvas.clientWidth,clientHeight:canvas.clientHeight,display:cs?.display,visibility:cs?.visibility,opacity:cs?.opacity,zIndex:cs?.zIndex}:null,game:game?{clientWidth:game.clientWidth,clientHeight:game.clientHeight,display:gs?.display,visibility:gs?.visibility}:null,gamepad:pad?{display:ps?.display,background:ps?.backgroundColor,clientWidth:pad.clientWidth,clientHeight:pad.clientHeight,zIndex:ps?.zIndex}:null};
    console.info('[PixelPlayer Build 130 Renderer]',window.PixelPlayerPerf);
  },{once:true});

  window.PixelPlayerSession={build:130,claim,hardNavigate,teardown,stopEmulation,tabId,page};
})();