// Build 42: reliable compact tab navigation plus shared Load Different ROM -> ROMs behavior.
(() => {
  if(document.body.classList.contains('snes-page')){
    const style=document.createElement('style');
    style.id='snesPortraitLayout';
    style.textContent=`
      @media (orientation: portrait) and (max-width: 900px){
        body.snes-page.rom-playing #emuStage{display:block!important;position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100vh!important;overflow:hidden!important;background:#000!important}
        body.snes-page.rom-playing #emuStage .screen-frame{position:fixed!important;inset:0!important;width:100vw!important;max-width:none!important;height:100dvh!important;min-height:100vh!important;margin:0!important;overflow:visible!important}
        body.snes-page.rom-playing #game{position:relative!important;width:100vw!important;height:100dvh!important;min-height:100vh!important;aspect-ratio:auto!important;overflow:visible!important}
        body.snes-page.rom-playing #game .ejs_canvas{position:absolute!important;left:50%!important;top:40%!important;width:100vw!important;height:auto!important;max-width:100vw!important;max-height:46vh!important;object-fit:contain!important;object-position:center!important;transform:translate(-50%,-50%)!important}
        body.snes-page.rom-playing #game .ejs_virtualGamepad_parent{position:absolute!important;left:0!important;right:0!important;bottom:max(28px,env(safe-area-inset-bottom))!important;width:100%!important;z-index:20!important}
        body.snes-page.rom-playing #game .ejs_virtualGamepad_bottom{position:fixed!important;left:50%!important;top:calc(40dvh + min(23vh,43.75vw) + 12px)!important;bottom:auto!important;margin-left:0!important;transform:translateX(-50%)!important;z-index:30!important}
        body.snes-page.rom-playing .play-overlay-controls{top:max(8px,env(safe-area-inset-top))!important}
      }
    `;
    document.head.appendChild(style);
  }

  const nav=document.querySelector('.tool-tabs');
  if(nav&&!nav.querySelector('[href="snes.html"]')){
    const link=document.createElement('a');link.className='tool-tab';link.href='snes.html';const dot=document.createElement('span');dot.className='tab-dot';link.append(dot,document.createTextNode('SNES Emulator'));nav.appendChild(link);
  }

  const tabs=[...document.querySelectorAll('.emulator-subtab')];
  const panels=[...document.querySelectorAll('.emulator-tab-panel')];
  const stage=document.getElementById('emuStage');
  if(!tabs.length||!panels.length)return;

  function activate(name){
    if(!tabs.some(tab=>tab.dataset.tab===name))return;
    tabs.forEach(tab=>{const active=tab.dataset.tab===name;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',active?'true':'false');tab.tabIndex=active?0:-1;});
    panels.forEach(panel=>{const active=panel.dataset.panel===name;panel.classList.toggle('active',active);panel.hidden=!active;panel.setAttribute('aria-hidden',active?'false':'true');});
    try{sessionStorage.setItem('pixelplayer-active-tab',name);}catch{}
  }

  window.PixelPlayerTabs={activate};

  // Always land on the ROM/game picker when the running emulator is unloaded.
  // Saving the selection first also survives emulator pages that reload to tear down EmulatorJS.
  document.getElementById('chooseAnotherBtn')?.addEventListener('click',()=>{
    try{sessionStorage.setItem('pixelplayer-active-tab','roms');}catch{}
    activate('roms');
    document.body.classList.remove('rom-playing');
    setTimeout(()=>activate('roms'),0);
  },true);

  // Use only click. Mobile browsers synthesize click after pointerup; handling both caused duplicate tab activations.
  document.querySelector('.emulator-subtabs')?.addEventListener('click',event=>{
    const tab=event.target.closest?.('.emulator-subtab');
    if(!tab)return;
    event.preventDefault();
    event.stopPropagation();
    activate(tab.dataset.tab);
  },true);

  tabs.forEach(tab=>tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    let index=tabs.indexOf(tab);
    if(event.key==='ArrowLeft')index=(index-1+tabs.length)%tabs.length;
    if(event.key==='ArrowRight')index=(index+1)%tabs.length;
    if(event.key==='Home')index=0;
    if(event.key==='End')index=tabs.length-1;
    tabs[index].focus();activate(tabs[index].dataset.tab);
  }));

  let initial='roms';
  try{const saved=sessionStorage.getItem('pixelplayer-active-tab');if(saved&&tabs.some(t=>t.dataset.tab===saved))initial=saved;}catch{}
  if(stage?.classList.contains('ready'))initial='play';
  activate(initial);

  if(stage){
    let wasReady=stage.classList.contains('ready');
    new MutationObserver(()=>{const ready=stage.classList.contains('ready');if(ready&&!wasReady)activate('play');wasReady=ready;}).observe(stage,{attributes:true,attributeFilter:['class']});
  }
})();