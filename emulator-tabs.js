// Build 26: reliable compact tab navigation for PixelPlayer.
(() => {
  const tabs=[...document.querySelectorAll('.emulator-subtab')];
  const panels=[...document.querySelectorAll('.emulator-tab-panel')];
  const stage=document.getElementById('emuStage');
  if(!tabs.length||!panels.length)return;

  function activate(name){
    if(!tabs.some(tab=>tab.dataset.tab===name))return;
    tabs.forEach(tab=>{
      const active=tab.dataset.tab===name;
      tab.classList.toggle('active',active);
      tab.setAttribute('aria-selected',active?'true':'false');
      tab.tabIndex=active?0:-1;
    });
    panels.forEach(panel=>{
      const active=panel.dataset.panel===name;
      panel.classList.toggle('active',active);
      panel.hidden=!active;
      panel.setAttribute('aria-hidden',active?'false':'true');
    });
    try{sessionStorage.setItem('pixelplayer-active-tab',name);}catch{}
  }

  window.PixelPlayerTabs={activate};

  const handleTab=(event)=>{
    const tab=event.target.closest?.('.emulator-subtab');
    if(!tab)return;
    event.preventDefault();
    event.stopPropagation();
    activate(tab.dataset.tab);
  };

  document.querySelector('.emulator-subtabs')?.addEventListener('click',handleTab,true);
  document.querySelector('.emulator-subtabs')?.addEventListener('pointerup',handleTab,true);

  tabs.forEach(tab=>tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    let index=tabs.indexOf(tab);
    if(event.key==='ArrowLeft')index=(index-1+tabs.length)%tabs.length;
    if(event.key==='ArrowRight')index=(index+1)%tabs.length;
    if(event.key==='Home')index=0;
    if(event.key==='End')index=tabs.length-1;
    tabs[index].focus();
    activate(tabs[index].dataset.tab);
  }));

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
