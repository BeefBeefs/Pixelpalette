// Build 14 UI behavior: focused play mode, true latched fast-forward, and recent ROM library.
(() => {
  const ffButton=document.getElementById('fastForwardBtn');
  const playFfButton=document.getElementById('playFastForwardBtn');
  const playExitBtn=document.getElementById('playExitBtn');
  const resetButton=document.getElementById('resetBtn');
  const controlStatus=document.getElementById('controlStatus');
  const emuStage=document.getElementById('emuStage');
  const romInput=document.getElementById('romInput');
  const romDrop=document.getElementById('romDrop');
  const recentRoms=document.getElementById('recentRoms');
  const clearRecentRomsBtn=document.getElementById('clearRecentRomsBtn');
  let latchedFastForward=false;

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
  // Swallow press/release semantics so this control can never behave as hold-to-fast-forward.
  ['pointerdown','pointerup','touchstart','touchend','mousedown','mouseup'].forEach(type=>{
    playFfButton?.addEventListener(type,e=>{e.stopPropagation();},true);
  });
  resetButton?.addEventListener('click',()=>{latchedFastForward=false;renderFastForward();},true);

  function enterPlayMode(){document.body.classList.add('rom-playing');window.scrollTo(0,0);}
  function exitPlayMode(){document.body.classList.remove('rom-playing');}
  playExitBtn?.addEventListener('click',exitPlayMode);
  if(emuStage){
    const sync=()=>{if(emuStage.classList.contains('ready'))enterPlayMode();};
    new MutationObserver(sync).observe(emuStage,{attributes:true,attributeFilter:['class']});
    sync();
  }

  const DB_NAME='PixelPlayerROMs',STORE='roms',MAX_RECENTS=6;
  function openDb(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE)){const store=db.createObjectStore(STORE,{keyPath:'key'});store.createIndex('lastPlayed','lastPlayed');}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function saveRecentRom(file){
    if(!file||!/\.gba$/i.test(file.name))return;
    try{
      const db=await openDb();
      const key=`${file.name}:${file.size}:${file.lastModified||0}`;
      await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({key,name:file.name,size:file.size,lastModified:file.lastModified||0,lastPlayed:Date.now(),blob:file});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      const rows=await getRecentRows();
      if(rows.length>MAX_RECENTS){
        await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);rows.slice(MAX_RECENTS).forEach(r=>store.delete(r.key));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
      }
      db.close();
      renderRecentRoms();
    }catch(error){console.warn('Could not save recent ROM',error);}
  }
  async function getRecentRows(){
    try{
      const db=await openDb();
      const rows=await new Promise((resolve,reject)=>{const req=db.transaction(STORE,'readonly').objectStore(STORE).getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);});
      db.close();
      return rows.sort((a,b)=>b.lastPlayed-a.lastPlayed);
    }catch{return[];}
  }
  async function deleteRecent(key){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();renderRecentRoms();}catch{}}
  async function clearRecent(){try{const db=await openDb();await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();renderRecentRoms();}catch{}}
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
      play.addEventListener('click',()=>{const file=new File([row.blob],row.name,{type:'application/octet-stream',lastModified:row.lastModified||Date.now()});saveRecentRom(file);if(typeof window.startRom==='function')window.startRom(file);else location.reload();});
      const remove=document.createElement('button');remove.className='secondary';remove.textContent='Remove';remove.addEventListener('click',()=>deleteRecent(row.key));
      actions.append(play,remove);card.append(info,actions);recentRoms.append(card);
    });
  }

  romInput?.addEventListener('change',()=>{const f=romInput.files?.[0];if(f)saveRecentRom(f);},true);
  romDrop?.addEventListener('drop',e=>{const f=[...(e.dataTransfer?.files||[])].find(x=>/\.gba$/i.test(x.name));if(f)saveRecentRom(f);},true);
  clearRecentRomsBtn?.addEventListener('click',clearRecent);

  renderFastForward();
  renderRecentRoms();
})();
