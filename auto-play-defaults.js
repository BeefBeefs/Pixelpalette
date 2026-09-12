// Build 74: default every ROM launch to low-memory vertical play mode.
(()=>{
  if(window.PixelPlayerAutoPlayDefaults)return;window.PixelPlayerAutoPlayDefaults=true;
  const stage=document.getElementById('emuStage');if(!stage)return;
  const LOW_MEMORY_KEY='pixelplayer:low-memory-mode';
  function forceLowMemory(){
    try{localStorage.setItem(LOW_MEMORY_KEY,'1')}catch{}
    try{window.PixelPlayerLowMemory?.set?.(true)}catch{}
  }
  function enterPlayMode(){
    if(!stage.classList.contains('ready'))return;
    forceLowMemory();
    if(document.body.classList.contains('rom-playing'))return;
    document.body.classList.add('rom-playing');
    try{window.scrollTo(0,0)}catch{}
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
  // Make Low Memory Mode the default before the emulator starts.
  forceLowMemory();
  window.addEventListener('pixelplayer:rom-start',forceLowMemory);
  window.addEventListener('pixelplayer:system-ready',enterPlayMode);
  const observer=new MutationObserver(()=>{if(stage.classList.contains('ready'))enterPlayMode()});
  observer.observe(stage,{attributes:true,attributeFilter:['class']});
  if(stage.classList.contains('ready'))enterPlayMode();
})();