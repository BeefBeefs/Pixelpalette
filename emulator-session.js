// Build 60: shared PixelPlayer session helpers, FPS display, and one-active-emulator enforcement.
(() => {
  const CHANNEL='pixelplayer-emulator-session-v1',STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  const stage=document.getElementById('emuStage');let claimed=false,shuttingDown=false,channel=null;
  function inject(src,version=60){if(document.querySelector(`script[src*="${src}"]`))return;const s=document.createElement('script');s.src=`${src}?v=${version}`;s.defer=true;document.body.appendChild(s)}
  inject('nav.js',55);inject('core-selector.js',47);
  if(!document.querySelector('script[src*="low-memory.js"]')){const s=document.createElement('script');s.src='low-memory.js?v=45';s.defer=true;document.body.appendChild(s)}
  inject('archive-tools.js',55);inject('controller-themes.js',48);inject('control-layout.js',51);inject('quick-resume.js',53);
  if(page==='gba')inject('gba-indexeddb-states.js',57);
  inject('overlay-state-menu.js',54);inject('performance-display.js',60);
  function hasActiveRuntime(){return claimed||!!window.EJS_emulator||!!stage?.classList.contains('ready')}
  function unloadForOtherSession(){if(shuttingDown||!hasActiveRuntime())return;shuttingDown=true;try{window.PixelPlayerQuickResume?.save?.('other-session')}catch{}try{document.body.classList.remove('rom-playing')}catch{}try{window.EJS_emulator?.gameManager?.toggleMainLoop?.(0)}catch{}setTimeout(()=>location.reload(),80)}
  function receive(message){if(!message||message.type!=='claim'||message.tabId===tabId)return;unloadForOtherSession()}
  try{channel=new BroadcastChannel(CHANNEL);channel.addEventListener('message',event=>receive(event.data))}catch{}
  window.addEventListener('storage',event=>{if(event.key!==STORAGE_KEY||!event.newValue)return;try{receive(JSON.parse(event.newValue))}catch{}});
  function claim(){if(shuttingDown)return;claimed=true;const message={type:'claim',tabId,page,at:Date.now()};try{channel?.postMessage(message)}catch{}try{localStorage.setItem(STORAGE_KEY,JSON.stringify(message))}catch{}}
  document.getElementById('romInput')?.addEventListener('change',event=>{if(event.target?.files?.length)claim()},true);
  document.getElementById('romDrop')?.addEventListener('drop',event=>{if(event.dataTransfer?.files?.length)claim()},true);
  if(stage){const sync=()=>{if(stage.classList.contains('ready')&&!claimed)claim()};new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['class']});sync()}
  window.PixelPlayerSession={claim,tabId,page};
})();