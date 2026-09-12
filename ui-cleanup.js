// Build 93: shared PixelPlayer emulator UI cleanup and session-action placement.
(()=>{
  if(window.PixelPlayerUiCleanup93)return;window.PixelPlayerUiCleanup93=true;
  const body=document.body,shell=document.querySelector('.emulator-shell');if(!shell)return;
  const playPanel=document.querySelector('.emulator-tab-panel[data-panel="play"]');
  const stageActions=document.querySelector('#emuStage .stage-action-buttons');
  if(playPanel&&stageActions){
    let card=document.getElementById('sessionActionsCard');
    if(!card){
      card=document.createElement('div');card.id='sessionActionsCard';card.className='tab-card session-actions-card';
      card.innerHTML='<div class="card-heading"><h2>Session</h2><span>Display and session controls</span></div><div class="session-actions"></div>';
      playPanel.appendChild(card);
    }
    const host=card.querySelector('.session-actions');
    [...stageActions.children].forEach(btn=>host.appendChild(btn));
    stageActions.remove();
  }
  const enter=document.getElementById('enterPortraitBtn');if(enter)enter.textContent='Vertical Full Screen';
  const stop=document.getElementById('chooseAnotherBtn');if(stop)stop.textContent='Stop Emulation';
  const folder=document.getElementById('chooseRomFolderBtn');if(folder)folder.textContent='📁 Choose Game Folder';
  const clear=document.getElementById('clearRomLibraryBtn');if(clear)clear.textContent='Clear Games';
  const search=document.getElementById('romLibrarySearch');if(search)search.placeholder='Search games or folders…';
  const inputLabel=document.querySelector('#romDrop .rom-title');if(inputLabel&&/rom/i.test(inputLabel.textContent||''))inputLabel.textContent=inputLabel.textContent.replace(/ROM/gi,'game');
  const sub=document.querySelector('#romDrop .rom-subtitle');if(sub)sub.textContent='Tap here or drop a supported game file.';
  const meta=document.querySelector('.rom-loader .rom-meta');if(meta)meta.remove();
  const libSummary=document.querySelector('.rom-library-summary span:last-child');if(libSummary&&/subfolders/i.test(libSummary.textContent||''))libSummary.remove();
  const recentHeading=document.querySelector('#recentRomsPanel .card-heading h2');if(recentHeading)recentHeading.textContent='Recently Played';
  const archive=document.getElementById('archiveTools');if(archive)archive.remove();
  const replacements=[
    ['Folder Library','Game Library'],['Open ROM','Open Game'],['Open Rom','Open Game'],['ROM Library','Game Library'],['ROMs','Games'],['ROM','Game']
  ];
  const walker=document.createTreeWalker(shell,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const n of nodes){let t=n.nodeValue;if(!t||!t.trim())continue;for(const [a,b] of replacements)t=t.replace(new RegExp(`\\b${a}\\b`,'g'),b);n.nodeValue=t}
  const style=document.createElement('style');style.id='pixelplayer-ui-cleanup-93';style.textContent=`
    .emulator-shell{gap:9px!important}.emulator-workbench{padding:10px!important}.emulator-subtabs{gap:4px!important;margin-bottom:8px!important}.emulator-subtab{padding:8px 10px!important;min-height:36px!important}.emulator-tab-panels{gap:8px!important}.tab-card{padding:11px!important;margin-bottom:8px!important}.card-heading{margin-bottom:8px!important}.card-heading h2{font-size:.9rem!important}.card-heading span{font-size:.62rem!important}.rom-library-toolbar{gap:7px!important}.rom-library-summary{margin:7px 0!important}.recent-roms-panel{margin-top:8px!important}.stage-actions{padding-top:7px!important}.emu-status{font-size:.68rem!important}.session-actions-card{margin-top:8px!important}.session-actions{display:flex;gap:8px;flex-wrap:wrap}.session-actions button{flex:1;min-width:140px}.control-grid{gap:7px!important}.control-grid button{min-height:54px!important;padding:9px!important}.section-note{margin:6px 0!important}.info-grid{gap:7px!important}.save-center,.state-section{margin-bottom:8px!important}.emulator-page footer{margin-top:6px!important}.archive-tools{display:none!important}
    @media(max-width:620px){.emulator-shell{gap:7px!important}.emulator-workbench{padding:8px!important}.tab-card{padding:9px!important}.session-actions{display:grid;grid-template-columns:1fr 1fr}.session-actions button{min-width:0}.stage-actions{padding-top:5px!important}}
  `;document.head.appendChild(style);
})();