// Build 32: only one PixelPlayer emulator runtime may remain active across browser tabs.
(() => {
  const CHANNEL='pixelplayer-emulator-session-v1';
  const STORAGE_KEY='pixelplayer:emulator:active-session';
  const tabId=(crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const page=document.body.classList.contains('snes-page')?'snes':'gba';
  const stage=document.getElementById('emuStage');
  let claimed=false;
  let shuttingDown=false;
  let channel=null;

  function hasActiveRuntime(){
    return claimed || !!window.EJS_emulator || !!stage?.classList.contains('ready');
  }

  function unloadForOtherSession(){
    if(shuttingDown || !hasActiveRuntime())return;
    shuttingDown=true;
    try{document.body.classList.remove('rom-playing');}catch{}
    try{
      const gm=window.EJS_emulator?.gameManager;
      gm?.toggleMainLoop?.(0);
    }catch{}
    // Reloading tears down EmulatorJS/WebAssembly, ROM blobs, canvases and audio contexts.
    setTimeout(()=>location.reload(),40);
  }

  function receive(message){
    if(!message || message.type!=='claim' || message.tabId===tabId)return;
    unloadForOtherSession();
  }

  try{
    channel=new BroadcastChannel(CHANNEL);
    channel.addEventListener('message',event=>receive(event.data));
  }catch{}

  window.addEventListener('storage',event=>{
    if(event.key!==STORAGE_KEY || !event.newValue)return;
    try{receive(JSON.parse(event.newValue));}catch{}
  });

  function claim(){
    if(shuttingDown)return;
    claimed=true;
    const message={type:'claim',tabId,page,at:Date.now()};
    try{channel?.postMessage(message);}catch{}
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(message));}catch{}
  }

  // Claim as soon as the user attempts to launch a ROM.
  document.getElementById('romInput')?.addEventListener('change',event=>{
    if(event.target?.files?.length)claim();
  },true);
  document.getElementById('romDrop')?.addEventListener('drop',event=>{
    if(event.dataTransfer?.files?.length)claim();
  },true);

  // Covers launches from Recent ROMs / Folder Library and any future launch path.
  if(stage){
    const sync=()=>{
      if(stage.classList.contains('ready') && !claimed)claim();
    };
    new MutationObserver(sync).observe(stage,{attributes:true,attributeFilter:['class']});
    sync();
  }

  window.PixelPlayerSession={claim,tabId,page};
})();
