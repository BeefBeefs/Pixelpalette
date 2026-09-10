// Build 25: compact tab navigation for PixelPlayer.
(() => {
  const tabs=[...document.querySelectorAll('.emulator-subtab')];
  const panels=[...document.querySelectorAll('.emulator-tab-panel')];
  const stage=document.getElementById('emuStage');
  if(!tabs.length||!panels.length)return;

  function activate(name){
    tabs.forEach(tab=>{
      const active=tab.dataset.tab===name;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
    });
    panels.forEach(panel=>{
      const active=panel.dataset.panel===name;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
    });
    try{sessionStorage.setItem('pixelplayer-active-tab',name);}catch{}
  }

  tabs.forEach(tab=>tab.addEventListener('click',()=>activate(tab.dataset.tab)));

  let initial='roms';
  try{
    const saved=sessionStorage.getItem('pixelplayer-active-tab');
    if(saved&&tabs.some(t=>t.dataset.tab===saved))initial=saved;
  }catch{}
  if(stage?.classList.contains('ready'))initial='play';
  activate(initial);

  if(stage){
    let wasReady=stage.classList.contains('ready');
    new MutationObserver(()=>{
      const ready=stage.classList.contains('ready');
      if(ready&&!wasReady)activate('play');
      wasReady=ready;
    }).observe(stage,{attributes:true,attributeFilter:['class']});
  }
})();
