// Build 19 UI behavior: focused play mode, latched fast-forward, recent ROMs, auto-resume, and re-enter portrait play mode.
(() => {
  const ffButton=document.getElementById('fastForwardBtn');
  const playFfButton=document.getElementById('playFastForwardBtn');
  const playExitBtn=document.getElementById('playExitBtn');
  const enterPortraitBtn=document.getElementById('enterPortraitBtn');
  const resetButton=document.getElementById('resetBtn');
  const controlStatus=document.getElementById('controlStatus');
  const emuStage=document.getElementById('emuStage');
  const romInput=document.getElementById('romInput');
  const romDrop=document.getElementById('romDrop');
  const recentRoms=document.getElementById('recentRoms');
  const clearRecentRomsBtn=document.getElementById('clearRecentRomsBtn');
  let latchedFastForward=false;
  let activeRomKey='';
  let activeRomName='';
  let autoRestoreAttempted=false;
  let autoSaveBusy=false;
  let checkpointTimer=null;

  function status(message,kind='good'){
    if(!controlStatus)return;
    controlStatus.textContent=message;
    controlStatus.className=`status ${kind}`;
  }

  function setCoreFastForward(active){
    const emulator=window.EJS_emulator;
    if(!emulator?.gameManager)return false;
    emulator.gameManager.setFastForwardRatio?.(3);
    emulator.gameManager.toggleFastForward?.(active);
    return true;
  }

  function renderFastForward(){
    [ffButton,playFfButton].forEach(button=>{
      if(!button)return;
      button.classList.toggle('active-toggle',latchedFastForward);
      button.setAttribute('aria-pressed',latchedFastForward?'true':'false');
    });
    if(ffButton){
      const title=ffButton.querySelector('span');
      const note=ffButton.querySelector('small');
      if(title)title.textContent=latchedFastForward?'⏩ Fast Forward: ON':'⏩ Fast Forward: OFF';
      if(note)note.textContent=latchedFastForward?'Tap to return to 1×':'Tap to toggle 3×';
    }
    if(playFfButton)playFfButton.textContent=latchedFastForward?'⏩ FF: ON':'⏩ FF: OFF';
  }

  function toggleFastForward(event){
    event?.preventDefault();
    event?.stopImmediatePropagation();
    try{
      const next=!latchedFastForward;
      if(!setCoreFastForward(next))return;
      latchedFastForward=next;
      renderFastForward();
      status(latchedFastForward?'Fast forward locked ON at 3×. Tap again to turn it off.':'Fast forward turned OFF. Running at normal speed.');
    }catch(error){
      console.error(error);
      latchedFastForward=false;
      renderFastForward();
      status('Fast forward could not be changed.','warn');
    }
  }

  ffButton?.addEventListener('click',toggleFastForward,true);
  playFfButton?.addEventListener('click',toggleFastForward,true);
  ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'].forEach(type=>{
    playFfButton?.addEventListener(type,e=>{e.stopPropagation();},true);
  });
  resetButton?.addEventListener('click',()=>{latchedFastForward=false;renderFastForward();},true);

  function enterPlayMode(){
    if(!emuStage?.classList.contains('ready'))return;
    document.body.classList.add('rom-playing');
    window.scrollTo(0,0);
    startCheckpointing();
    scheduleAutoRestore();
    window.dispatchEvent(new Event('resize'));
  }
  function exitPlayMode(){saveAutoState('menu');document.body.classList.remove('rom-playing');window.dispatchEvent(new Event('resize'));}
  playExitBtn?.addEventListener('click',exitPlayMode);
  enterPortraitBtn?.addEventListener('click',enterPlayMode);
  if(emuStage){
    const sync=()=>{if(emuStage.classList.contains('ready'))enterPlayMode();};
    new MutationObserver(sync).observe(emuStage,{attributes:true,attributeFilter:['class']});
    sync();
  }

  const DB_NAME='PixelPlayerROMs',ROM_STORE='roms',AUTO_STORE='autoStates',DB_VERSION=2,MAX_RECENTS=6;
  function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(ROM_STORE)){const store=db.createObjectStore(ROM_STORE,{keyPath:'key'});store.createIndex('lastPlayed','lastPlayed');}if(!db.objectStoreNames.contains(AUTO_STORE))db.createObjectStore(AUTO_STORE,{keyPath:'key'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  function romKeyFor(file){return `${file.name}:${file.size}:${file.lastModified||0}`;}

  async function saveRecentRom(file){
    if(!file||!/\.gba$/i.test(file.name))return;
    activeRomKey=romKeyFor(file);activeRomName=file.name;autoRestoreAttempted=false;
    try{
      const db=await openDb();
      const key=activeRomKey;
      await new Promise((resolve,reject)=>{const tx=db.transaction(ROM_STORE,'readwrite');tx.objectStore(ROM_STORE).put({key,name:file.name,size:file.size,lastModified:file.lastModified||0,lastPlayed:Date.now(),blob:file});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      const rows=await getRecentRows();
      if(rows.length>MAX_RECENTS){
        await new Promise((resolve,reject)=>{const tx=db.transaction(ROM_STORE,'readwrite'),store=tx.objectStore(ROM_STORE);rows.slice(MAX_RECENTS).forEach(r=>store.delete(r.key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      }
      db.close();
      renderRecentRoms();
    }catch(error){console.warn('Could not save recent ROM',error);}
  }
  async function getRecentRows(){
    try{
      const db=await openDb();
      const rows=await new Promise((resolve,reject)=>{const req=db.transaction(ROM_STORE,'readonly').objectStore(ROM_STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});
      db.close();
      return rows.sort((a,b)=>b.lastPlayed-a.lastPlayed);
    }catch{return[];}
  }
  async function deleteRecent(key){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction([ROM_STORE,AUTO_STORE],'readwrite');tx.objectStore(ROM_STORE).delete(key);tx.objectStore(AUTO_STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();renderRecentRoms();}catch{}}
  async function clearRecent(){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction([ROM_STORE,AUTO_STORE],'readwrite');tx.objectStore(ROM_STORE).clear();tx.objectStore(AUTO_STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();renderRecentRoms();}catch{}}
  function fmtSize(n){return n>=1048576?`${(n/1048576).toFixed(2)} MB`:`${Math.max(1,Math.round(n/1024))} KB`;}
  async function renderRecentRoms(){
    if(!recentRoms)return;
    const rows=await getRecentRows();
    if(!rows.length){recentRoms.className='recent-roms empty-state';recentRoms.textContent='No recent ROMs yet.';return;}
    recentRoms.className='recent-roms';
    recentRoms.innerHTML='';
    rows.slice(0,MAX_RECENTS).forEach(row=>{
      const card=document.createElement('article');card.className='recent-rom-card';
      const info=document.createElement('div');info.className='recent-rom-info';
      const title=document.createElement('strong');title.textContent=row.name;
      const meta=document.createElement('span');meta.textContent=`${fmtSize(row.size)} • ${new Date(row.lastPlayed).toLocaleString()}`;
      info.append(title,meta);
      const actions=document.createElement('div');actions.className='recent-rom-actions';
      const play=document.createElement('button');play.className='primary';play.textContent='Play';
      play.addEventListener('click',()=>{activeRomKey=row.key;activeRomName=row.name;autoRestoreAttempted=false;const file=new File([row.blob],row.name,{type:'application/octet-stream',lastModified:row.lastModified||Date.now()});saveRecentRom(file);if(typeof window.startRom==='function')window.startRom(file);else location.reload();});
      const remove=document.createElement('button');remove.className='secondary';remove.textContent='Remove';remove.addEventListener('click',()=>deleteRecent(row.key));
      actions.append(play,remove);card.append(info,actions);recentRoms.append(card);
    });
  }

  async function saveAutoState(reason='checkpoint'){
    if(autoSaveBusy||!activeRomKey)return false;
    const gm=window.EJS_emulator?.gameManager;
    if(!gm?.getState)return false;
    autoSaveBusy=true;
    try{
      const state=gm.getState();
      if(!state)return false;
      const bytes=state instanceof Uint8Array?state:new Uint8Array(state);
      const copy=bytes.slice().buffer;
      const db=await openDb();
      await new Promise((resolve,reject)=>{const tx=db.transaction(AUTO_STORE,'readwrite');tx.objectStore(AUTO_STORE).put({key:activeRomKey,name:activeRomName,savedAt:Date.now(),reason,state:copy});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      db.close();
      return true;
    }catch(error){console.warn('Auto-save state failed',error);return false;}
    finally{autoSaveBusy=false;}
  }

  async function loadAutoState(){
    if(!activeRomKey)return null;
    try{const db=await openDb();const row=await new Promise((resolve,reject)=>{const req=db.transaction(AUTO_STORE,'readonly').objectStore(AUTO_STORE).get(activeRomKey);req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);});db.close();return row;}catch{return null;}
  }

  async function restoreAutoState(){
    if(autoRestoreAttempted||!activeRomKey)return;
    const gm=window.EJS_emulator?.gameManager;
    if(!gm?.loadState)return;
    autoRestoreAttempted=true;
    const saved=await loadAutoState();
    if(!saved?.state)return;
    try{
      gm.loadState(new Uint8Array(saved.state));
      const when=saved.savedAt?new Date(saved.savedAt).toLocaleString():'last session';
      status(`Auto-resumed ${activeRomName||'ROM'} from ${when}.`,'good');
    }catch(error){console.warn('Auto-resume failed',error);status('A previous auto-save was found, but it could not be restored.','warn');}
  }

  function scheduleAutoRestore(){
    if(autoRestoreAttempted)return;
    let attempts=0;
    const timer=setInterval(()=>{
      attempts++;
      const gm=window.EJS_emulator?.gameManager;
      if(gm?.loadState&&activeRomKey){clearInterval(timer);setTimeout(restoreAutoState,350);}
      else if(attempts>=100)clearInterval(timer);
    },100);
  }

  function startCheckpointing(){
    if(checkpointTimer)return;
    checkpointTimer=setInterval(()=>{if(document.body.classList.contains('rom-playing')&&!document.hidden)saveAutoState('checkpoint');},10000);
  }

  window.addEventListener('pagehide',()=>{saveAutoState('pagehide');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)saveAutoState('hidden');});
  window.addEventListener('beforeunload',()=>{saveAutoState('beforeunload');});

  romInput?.addEventListener('change',()=>{const f=romInput.files?.[0];if(f)saveRecentRom(f);},true);
  romDrop?.addEventListener('drop',e=>{const f=[...(e.dataTransfer?.files||[])].find(x=>/\.gba$/i.test(x.name));if(f)saveRecentRom(f);},true);
  clearRecentRomsBtn?.addEventListener('click',clearRecent);

  renderFastForward();
  renderRecentRoms();
})();
