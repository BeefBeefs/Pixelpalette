// Build 95: final control ordering refinements for Play and Games tabs.
(()=>{
  if(window.PixelPlayerLayoutTweaks95)return;window.PixelPlayerLayoutTweaks95=true;

  function moveSessionActions(){
    const playPanel=document.querySelector('.emulator-tab-panel[data-panel="play"]');
    const session=document.getElementById('sessionActionsCard');
    const controls=document.getElementById('controlCenter');
    if(playPanel&&session&&controls&&session.nextElementSibling!==controls){
      playPanel.insertBefore(session,controls);
    }
    return !!(playPanel&&session&&controls);
  }

  function moveSort(){
    const search=document.getElementById('romLibrarySearch');
    const toolbar=search?.closest('.rom-library-toolbar');
    const select=document.getElementById('romLibrarySort');
    const label=select?.closest('label');
    if(!search||!toolbar||!label)return false;
    let row=document.getElementById('romLibrarySortRow');
    if(!row){row=document.createElement('div');row.id='romLibrarySortRow';row.className='rom-library-sort-row';search.insertAdjacentElement('afterend',row)}
    if(label.parentElement!==row)row.appendChild(label);
    label.firstChild&&(label.firstChild.nodeValue='Sort by ');
    return true;
  }

  function arrange(){moveSessionActions();moveSort()}
  arrange();

  // Controls can be added by the shared library/UI scripts after this file executes.
  // Disconnect as soon as both targets exist so this never becomes a permanent page observer.
  if(!moveSessionActions()||!moveSort()){
    const host=document.querySelector('.emulator-workbench')||document.body;
    const once=new MutationObserver(()=>{const a=moveSessionActions(),b=moveSort();if(a&&b)once.disconnect()});
    once.observe(host,{childList:true,subtree:true});
    setTimeout(()=>once.disconnect(),8000);
  }

  const style=document.createElement('style');style.id='pixelplayer-layout-tweaks-95';style.textContent=`
    .emulator-tab-panel[data-panel="play"] #sessionActionsCard{margin-top:0!important;margin-bottom:8px!important}
    .emulator-tab-panel[data-panel="play"] #controlCenter{margin-top:0!important}
    .rom-library-sort-row{display:flex;align-items:center;justify-content:flex-end;width:100%;margin-top:6px}
    .rom-library-sort-row label{display:flex!important;align-items:center;gap:7px;margin:0!important;color:var(--muted,#98a59c);font-size:.72rem}
    .rom-library-sort-row select{min-width:155px;border:1px solid var(--border2,#344039);background:#0d120f;color:#eef6ef;border-radius:9px;padding:8px}
    #romLibraryDisplayControls>label{display:none!important}
    @media(max-width:620px){.rom-library-sort-row{justify-content:stretch}.rom-library-sort-row label{width:100%;justify-content:space-between}.rom-library-sort-row select{flex:1}}
  `;document.head.appendChild(style);
})();