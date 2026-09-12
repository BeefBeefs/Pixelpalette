// Build 82: shared session helpers with direct Continue Playing launch and non-recursive box-art helper.
(() => {
  if(window.PixelPlayerSession?.build>=82)return;
  const CHANNEL='pixelplayer-emulator-session-v1',STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  if(!document.body.dataset.system)document.body.dataset.system=page;
  const stage=document.getElementById('emuStage');let claimed=false,shuttingDown=false,channel=null;
  const compact=document.createElement('style');compact.id='pixelplayer-build82-compact';compact.textContent='.emulator-page .emulator-hero{display:none!important}.emulator-page .emulator-shell{gap:13px}.emulator-page .tool-tabs{margin-bottom:0}';document.head.appendChild(compact);
  function inject(src,version=82){if(document.querySelector(`script[src*="${src}"]`))return;const s=document.createElement('script');s.src=`${src}?v=${version}`;s.defer=true;document.body.appendChild(s)}
  inject('nav.js',82);inject('core-selector.js',69);inject('folder-scan-progress.js',69);if(page==='gba')inject('gba-zip-support.js',71);inject('folder-indexer-upgrade.js',77);inject('boxart-progress.js',82);
  if(!document.querySelector('script[src*="low-memory.js"]')){const s=document.createElement('script');s.src='low-memory.js?v=80';s.defer=true;document.body.appendChild(s)}
  inject('menu-motion.js',76);inject('auto-play-defaults.js',76);inject('direct-recent-launch.js',80);
  inject('archive-tools.js',55);inject('controller-themes.js',48);inject('control-layout.js',51);inject('quick-resume.js',53);
  if(page==='gba')inject('gba-indexeddb-states.js',57);
  inject('overlay-state-menu.js',62);inject('performance-display.js',60);
  function hasActiveRuntime(){return claimed||!!window.EJS_emulator||!!stage?.classList.contains('ready')}
  function teardown(reason='navigate'){
    window.dispatchEvent(new CustomEvent('pixelplayer:hard-unload',{detail:{reason,page}}));
    try{window.PixelPlayerQuickResume?.save?.(reason)}catch{}
    const e=window.EJS_emulator,gm=e?.gameManager;
    try{gm?.toggleFastForward?.(false)}catch{}
    try{gm?.toggleMainLoop?.(0)}catch{}
    try{e?.pause?.()}catch{}
    for(const fn of ['quit','exit','destroy','close']){try{gm?.[fn]?.()}catch{}try{e?.[fn]?.()}catch{}}
    try{document.getElementById('game')?.replaceChildren()}catch{}
    try{document.querySelectorAll('canvas,video,audio').forEach(x=>{try{x.pause?.()}catch{}try{x.remove()}catch{}})}catch{}
    try{delete window.EJS_emulator}catch{window.EJS_emulator=null}
    try{window.EJS_gameUrl=null;window.EJS_biosUrl=null}catch{}
  }
  function hardNavigate(href){if(shuttingDown)return;shuttingDown=true;teardown('system-switch');requestAnimationFrame(()=>location.assign(href))}
  function unloadForOtherSession(){if(shuttingDown||!hasActiveRuntime())return;shuttingDown=true;teardown('other-session');setTimeout(()=>location.reload(),50)}
  function receive(message){if(!message||message.type!=='claim'||message.tabId===tabId)return;unloadForOtherSession()}
  try{channel=new BroadcastChannel(CHANNEL);channel.addEventListener('message',event=>receive(event.data))}catch{}
  window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY||!event.newValue)return;try{receive(JSON.parse(event.newValue))}catch{}});
  function claim(){if(shuttingDown)return;claimed=true;const message={type:'claim',tabId,page,at:Date.now()};try{channel?.postMessage(message)}catch{}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(message))}catch{}}
  document.getElementById('romInput')?.addEventListener('change',event=>{if(event.target?.files?.length)claim()},true);
  document.getElementById('romDrop')?.addEventListener('drop',event=>{if(event.dataTransfer?.files?.length)claim()},true);
  if(stage){const sync=()=>{if(stage.classList.contains('ready')&&!claimed)claim()};new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['class']});sync()}
  window.PixelPlayerSession={build:82,claim,hardNavigate,teardown,tabId,page};
})();