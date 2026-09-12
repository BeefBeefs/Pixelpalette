// Build 76: default every ROM launch to low-memory vertical play mode with a short black transition.
(()=>{
  if(window.PixelPlayerAutoPlayDefaults)return;window.PixelPlayerAutoPlayDefaults=true;
  const stage=document.getElementById('emuStage');if(!stage)return;
  const LOW_MEMORY_KEY='pixelplayer:low-memory-mode';let entering=false;
  function forceLowMemory(){try{localStorage.setItem(LOW_MEMORY_KEY,'1')}catch{}try{window.PixelPlayerLowMemory?.set?.(true)}catch{}}
  function enterPlayMode(){
    if(!stage.classList.contains('ready')||entering||document.body.classList.contains('rom-playing'))return;
    entering=true;forceLowMemory();document.body.classList.add('pp-transition-in');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      document.body.classList.add('rom-playing');try{window.scrollTo(0,0)}catch{}window.dispatchEvent(new Event('resize'));
      setTimeout(()=>{document.body.classList.remove('pp-transition-in');document.body.classList.add('pp-reveal');requestAnimationFrame(()=>setTimeout(()=>document.body.classList.remove('pp-reveal'),220));entering=false},170);
    }));
  }
  forceLowMemory();window.addEventListener('pixelplayer:rom-start',forceLowMemory);window.addEventListener('pixelplayer:system-ready',enterPlayMode);
  const observer=new MutationObserver(()=>{if(stage.classList.contains('ready'))enterPlayMode()});observer.observe(stage,{attributes:true,attributeFilter:['class']});if(stage.classList.contains('ready'))enterPlayMode();
})();