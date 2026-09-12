// Build 80: one-tap Continue Playing launcher backed by local IndexedDB ROM blobs.
(()=>{
  const params=new URLSearchParams(location.search),name=params.get('play');if(!name)return;
  const body=document.body,system=body.dataset.system||(body.classList.contains('n64-page')?'n64':body.classList.contains('ps1-page')?'ps1':body.classList.contains('snes-page')?'snes':'gba');
  const status=document.getElementById('emuStatus');
  function open(name,version=1){return new Promise((res,rej)=>{const r=indexedDB.open(name,version);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onupgradeneeded=()=>{try{r.transaction.abort()}catch{}}})}
  async function getKey(dbName,store,key,version=1){try{const db=await open(dbName,version);if(!db.objectStoreNames.contains(store)){db.close();return null}const row=await new Promise((res,rej)=>{const q=db.transaction(store,'readonly').objectStore(store).get(key);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)});db.close();return row}catch{return null}}
  async function findByName(dbName,store,target,filter,version=1){try{const db=await open(dbName,version);if(!db.objectStoreNames.contains(store)){db.close();return null}const row=await new Promise((res,rej)=>{const req=db.transaction(store,'readonly').objectStore(store).openCursor();req.onsuccess=()=>{const c=req.result;if(!c){res(null);return}const v=c.value;if(v?.name===target&&(!filter||filter(v))){res(v);return}c.continue()};req.onerror=()=>rej(req.error)});db.close();return row}catch{return null}}
  async function locate(){
    if(system==='n64')return await getKey('PixelPlayerN64Recents','games',name)||await findByName('PixelPlayerN64Library','games',name);
    if(system==='ps1')return await getKey('PixelPlayerPs1Recents','games',name)||await findByName('PixelPlayerPs1Library','games',name);
    if(system==='snes')return await getKey('PixelPlayerSnesRecents','roms',name)||await findByName('PixelPlayerSnesLibrary','roms',name);
    if(system==='gba')return await findByName('PixelPlayerROMs','roms',name,null,2)||await findByName('PixelPlayerLibrary','roms',name);
    return await findByName('PixelPlayerExpanded','games',name,v=>v.system===system);
  }
  function launch(row){
    if(!row?.blob)return false;
    const file=new File([row.blob],row.name||name,{type:'application/octet-stream',lastModified:row.lastModified||Date.now()});
    try{window.PixelPlayerSession?.claim?.()}catch{}
    if(system==='gba'&&/\.zip$/i.test(file.name)&&window.PixelPlayerGbaArchive?.open){window.PixelPlayerGbaArchive.open(file);return true}
    if(typeof window.startRom==='function'){window.startRom(file);return true}
    return false;
  }
  async function run(){
    if(status)status.textContent=`Loading ${name}…`;
    const row=await locate();
    if(!row?.blob){if(status)status.textContent='Recent ROM data is no longer available on this device. Open the game once from its library to refresh it.';return}
    let tries=0;const attempt=()=>{if(launch(row))return;if(++tries<30)setTimeout(attempt,50);else if(status)status.textContent='ROM found, but the emulator was not ready to start it.'};attempt();
  }
  run();
})();