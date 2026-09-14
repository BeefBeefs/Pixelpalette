// Build 135: shared session helpers using EmulatorJS native renderer layout with flat diagnostics.
(() => {
  if(window.PixelPlayerSession?.build>=135)return;
  const CHANNEL='pixelplayer-emulator-session-v1',STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  if(!document.body.dataset.system)document.body.dataset.system=page;
  const stage=document.getElementById('emuStage');let claimed=false,shuttingDown=false,channel=null;

  if(!document.querySelector('link[href*="emulator-performance.css"]')){
    const perfCss=document.createElement('link');perfCss.rel='stylesheet';perfCss.href='emulator-performance.css?v=135';document.head.appendChild(perfCss);
  }

  const compact=document.createElement('style');compact.id='pixelplayer-build135-compact';compact.textContent='.emulator-page .emulator-hero{display:none!important}.emulator-page .tool-tabs{margin-bottom:0}.rom-game-cover{overflow:hidden!important}.rom-game-cover img{width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:fill!important;display:block!important;margin:0!important}';document.head.appendChild(compact);
  function inject(src,version=135){if(document.querySelector(`script[src*="${src}"]`))return;const s=document.createElement('script');s.src=`${src}?v=${version}`;s.defer=true;document.body.appendChild(s)}
  inject('version-check.js');inject('nav.js');inject('pwa.js');inject('touch-guard.js');inject('core-selector.js');inject('folder-scan-progress.js');if(page==='gba')inject('gba-zip-support.js');inject('folder-indexer-upgrade.js');inject('game-art.js');inject('boxart-progress.js');inject('boxart-autoload.js');inject('offline-core-manager.js');inject('ui-cleanup.js');inject('layout-tweaks.js');
  inject('menu-motion.js');inject('auto-play-defaults.js');inject('direct-recent-launch.js');
  inject('controller-themes.js');inject('control-layout.js');inject('quick-resume.js');
  inject('overlay-state-menu.js');inject('performance-display.js');
  inject('shared-state-thumbnails.js');inject('portrait-hitbox-fix.js');

  document.querySelectorAll('.pixelplayer-build-id').forEach(x=>x.remove());

  const legacyDb={gba:'PixelPlayerGbaStates',snes:'PixelPlayerSNESStates',ps1:'PixelPlayerPs1States',n64:'PixelPlayerN64States'}[page];
  if(legacyDb){
    const cleanupKey=`pixelplayer:migration101:${page}:legacy-state-cleared`;
    try{if(!localStorage.getItem(cleanupKey)){indexedDB.deleteDatabase(legacyDb);localStorage.setItem(cleanupKey,'1')}}catch{}
  }

  const stopButton=document.getElementById('chooseAnotherBtn');if(stopButton)stopButton.textContent='Stop Emulation';
  function hasActiveRuntime(){return claimed||!!window.EJS_emulator||!!stage?.classList.contains('ready')}
  function teardown(reason='navigate'){window.dispatchEvent(new CustomEvent('pixelplayer:hard-unload',{detail:{reason,page}}));try{window.PixelPlayerQuickResume?.save?.(reason)}catch{}const e=window.EJS_emulator,gm=e?.gameManager;try{gm?.toggleFastForward?.(false)}catch{}try{gm?.toggleMainLoop?.(0)}catch{}try{e?.pause?.()}catch{}for(const fn of ['quit','exit','destroy','close']){try{gm?.[fn]?.()}catch{}try{e?.[fn]?.()}catch{}}try{document.getElementById('game')?.replaceChildren()}catch{}try{document.querySelectorAll('#game canvas,#game video,#game audio').forEach(x=>{try{x.pause?.()}catch{}try{x.remove()}catch{}})}catch{}try{delete window.EJS_emulator}catch{window.EJS_emulator=null}try{window.EJS_gameUrl=null;window.EJS_biosUrl=null}catch{}}
  function cleanStoppedUrl(){const u=new URL(location.href);u.searchParams.delete('play');u.searchParams.delete('resume');u.searchParams.delete('game');u.searchParams.set('build','135');u.searchParams.set('stopped','1');return `${u.pathname}${u.search}${u.hash}`}
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

  function rendererReport(){
    const game=document.getElementById('game');
    const root=game?.querySelector('.ejs_parent');
    const canvasParent=game?.querySelector('.ejs_canvas_parent,.ejs_game');
    const canvas=game?.querySelector('.ejs_canvas')||game?.querySelector('canvas');
    const pad=game?.querySelector('.ejs_virtualGamepad_parent');
    let gl=null,glType=null,webgl=null,viewport=null,pixelSample=null;
    try{gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');glType=typeof WebGL2RenderingContext!=='undefined'&&gl instanceof WebGL2RenderingContext?'webgl2':gl?'webgl':null;webgl=gl?.getContextAttributes?.()||null;viewport=gl?Array.from(gl.getParameter(gl.VIEWPORT)||[]):null;if(gl&&viewport?.length===4){const p=new Uint8Array(4);gl.readPixels(Math.max(0,Math.floor(viewport[2]/2)),Math.max(0,Math.floor(viewport[3]/2)),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);pixelSample=Array.from(p)}}catch{}
    const info=el=>{if(!el)return null;const r=el.getBoundingClientRect(),s=getComputedStyle(el);return{w:Math.round(r.width),h:Math.round(r.height),clientW:el.clientWidth,clientH:el.clientHeight,display:s.display,visibility:s.visibility,opacity:s.opacity,position:s.position,z:s.zIndex,background:s.backgroundColor}};
    const gameRect=game?.getBoundingClientRect(),front=gameRect?document.elementFromPoint(gameRect.left+gameRect.width/2,gameRect.top+gameRect.height/2):null;
    window.PixelPlayerPerf={build:135,page,core:window.EJS_core||null,forceLegacyCores:window.EJS_forceLegacyCores===true,threaded:window.EJS_threads===true,crossOriginIsolated:window.crossOriginIsolated===true,glType,viewport,pixelSample,frontElement:front?{tag:front.tagName,id:front.id,className:front.className}:null,webgl,canvas:canvas?{bufferW:canvas.width,bufferH:canvas.height,...info(canvas)}:null,canvasParent:info(canvasParent),root:info(root),game:info(game),gamepad:info(pad)};
    console.info('[PixelPlayer Build 135 Renderer JSON] '+JSON.stringify(window.PixelPlayerPerf));
  }
  window.addEventListener('pixelplayer:system-ready',()=>{
    requestAnimationFrame(()=>requestAnimationFrame(rendererReport));
    setTimeout(rendererReport,500);
  },{once:true});

  window.PixelPlayerSession={build:135,claim,hardNavigate,teardown,stopEmulation,tabId,page,rendererReport};
})();
