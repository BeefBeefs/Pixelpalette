// Build 33: persist SNES recent ROM blobs so Recently Played entries can relaunch directly.
(()=>{
  const recentRoms=document.getElementById('recentRoms');
  const clearBtn=document.getElementById('clearRecentRomsBtn');
  const romInput=document.getElementById('romInput');
  const romDrop=document.getElementById('romDrop');
  const RECENT_KEY='pixelplayer:snes:recent';
  const DB_NAME='PixelPlayerSnesRecents';
  const STORE='roms';
  const EXT=/\.(sfc|smc|fig|gd3|gd7|dx2|bsx|swc|zip)$/i;
  const MAX=12;

  function openDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(DB_NAME,1);
      req.onupgradeneeded=()=>{
        const db=req.result;
        if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'name'});
      };
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error);
    });
  }

  function readMeta(){
    try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');}catch{return[];}
  }

  function writeMeta(rows){
    try{localStorage.setItem(RECENT_KEY,JSON.stringify(rows.slice(0,MAX)));}catch{}
  }

  async function saveFile(file){
    if(!file||!EXT.test(file.name||''))return;
    const playedAt=Date.now();
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).put({name:file.name,size:file.size,lastModified:file.lastModified||0,playedAt,blob:file});
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch(error){console.warn('Could not save SNES recent ROM blob',error);}
    const rows=readMeta().filter(row=>row.name!==file.name);
    rows.unshift({name:file.name,size:file.size,playedAt});
    writeMeta(rows);
    render();
  }

  async function getSaved(name){
    try{
      const db=await openDb();
      const row=await new Promise((resolve,reject)=>{
        const req=db.transaction(STORE,'readonly').objectStore(STORE).get(name);
        req.onsuccess=()=>resolve(req.result||null);
        req.onerror=()=>reject(req.error);
      });
      db.close();
      return row;
    }catch{return null;}
  }

  async function remove(name){
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).delete(name);
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch{}
    writeMeta(readMeta().filter(row=>row.name!==name));
    render();
  }

  async function clearAll(){
    try{
      const db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(STORE,'readwrite');
        tx.objectStore(STORE).clear();
        tx.oncomplete=resolve;
        tx.onerror=()=>reject(tx.error);
      });
      db.close();
    }catch{}
    writeMeta([]);
    render();
  }

  function fmtSize(n){
    return n>=1048576?`${(n/1048576).toFixed(2)} MB`:`${Math.max(1,Math.round(n/1024))} KB`;
  }

  async function render(){
    if(!recentRoms)return;
    const rows=readMeta();
    if(!rows.length){
      recentRoms.className='recent-roms empty-state';
      recentRoms.textContent='No recent SNES ROMs yet.';
      return;
    }
    recentRoms.className='recent-roms';
    recentRoms.innerHTML='';
    for(const row of rows.slice(0,MAX)){
      const card=document.createElement('article');
      card.className='recent-rom-card';
      const info=document.createElement('div');
      info.className='recent-rom-info';
      const title=document.createElement('strong');
      title.textContent=row.name.replace(EXT,'');
      const meta=document.createElement('span');
      meta.textContent=`${fmtSize(row.size||0)} • ${new Date(row.playedAt||Date.now()).toLocaleString()}`;
      info.append(title,meta);

      const actions=document.createElement('div');
      actions.className='recent-rom-actions';
      const play=document.createElement('button');
      play.className='primary';
      play.textContent='Play';
      play.addEventListener('click',async()=>{
        play.disabled=true;
        play.textContent='Loading…';
        const saved=await getSaved(row.name);
        if(!saved?.blob){
          play.disabled=false;
          play.textContent='Play';
          meta.textContent='ROM data unavailable — open it once more to refresh this entry.';
          return;
        }
        const file=new File([saved.blob],saved.name,{type:'application/octet-stream',lastModified:saved.lastModified||Date.now()});
        saveFile(file);
        if(typeof window.startRom==='function')window.startRom(file);
      });
      const removeBtn=document.createElement('button');
      removeBtn.className='secondary';
      removeBtn.textContent='Remove';
      removeBtn.addEventListener('click',()=>remove(row.name));
      actions.append(play,removeBtn);
      card.append(info,actions);
      recentRoms.append(card);
    }
  }

  // Direct picker/drop launches in snes.js use its local startRom binding, so capture the file here too.
  romInput?.addEventListener('change',()=>{const file=romInput.files?.[0];if(file)saveFile(file);},true);
  romDrop?.addEventListener('drop',event=>{const file=event.dataTransfer?.files?.[0];if(file)saveFile(file);},true);

  // Folder Library launches through window.startRom; wrap that path so those ROMs become playable recents too.
  const originalStart=window.startRom;
  if(typeof originalStart==='function'){
    window.startRom=function(file){saveFile(file);return originalStart(file);};
  }

  clearBtn?.addEventListener('click',clearAll);
  // snes.js renders its metadata-only version first; replace it after all synchronous page setup finishes.
  setTimeout(render,0);
})();
