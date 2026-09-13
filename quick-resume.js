// Build 123: hidden per-ROM quick resume with queued save-on-leave and automatic restore.
(()=>{
  if(window.PixelPlayerQuickResume?.build>=123)return;
  const system=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  const DB='PixelPlayerQuickResume',STORE='states';
  let checkedKey='',writeChain=Promise.resolve(),lastCaptureAt=0,lastCaptureKey='';
  const emu=()=>window.EJS_emulator||null;
  function gameName(){return String(window.EJS_gameName||document.getElementById('sessionRom')?.textContent||'').trim()}
  function key(){const g=gameName();return g&&g!=='No ROM loaded'&&g!=='No game loaded'?`${system}::${g}::quick`:''}
  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function put(row){const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=res;tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||new Error('Quick resume write aborted'))});d.close()}
  async function get(k){const d=await openDb();const row=await new Promise((res,rej)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});d.close();return row}
  function capture(reason='leave'){
    const k=key();if(!k)return null;
    try{
      const state=emu()?.gameManager?.getState?.();
      if(!state?.length)return null;
      const bytes=new Uint8Array(state); // copy synchronously while the emulator is still alive
      if(!bytes.length)return null;
      lastCaptureAt=Date.now();lastCaptureKey=k;
      return {key:k,system,game:gameName(),savedAt:lastCaptureAt,reason,blob:new Blob([bytes])};
    }catch{return null}
  }
  function queueWrite(row){
    if(!row)return Promise.resolve(false);
    writeChain=writeChain.catch(()=>{}).then(async()=>{try{await put(row);window.dispatchEvent(new CustomEvent('pixelplayer:quick-resume-saved',{detail:{system,game:row.game,reason:row.reason,savedAt:row.savedAt}}));return true}catch(e){console.warn('PixelPlayer quick save failed',e);return false}});
    return writeChain;
  }
  function quickSave(reason='leave'){
    // Capture first, synchronously, before navigation/app teardown can destroy the core.
    const row=capture(reason);if(!row)return Promise.resolve(false);
    return queueWrite(row);
  }
  async function checkAndLoadOnce(){
    const k=key(),gm=emu()?.gameManager;
    if(!k||!gm||checkedKey===k)return false;
    checkedKey=k;
    try{
      const row=await get(k);
      if(!row?.blob)return false;
      const bytes=new Uint8Array(await row.blob.arrayBuffer());
      if(!bytes.length)return false;
      gm.loadState?.(bytes);
      window.dispatchEvent(new CustomEvent('pixelplayer:quick-resume-loaded',{detail:{system,game:gameName(),savedAt:row.savedAt||0}}));
      return true;
    }catch(e){console.warn('PixelPlayer quick resume check failed',e);return false}
  }

  // Mobile/PWA app closes are normally preceded by hidden/freeze; capture on every useful lifecycle edge.
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void quickSave('hidden')});
  document.addEventListener('freeze',()=>{void quickSave('freeze')});
  window.addEventListener('pagehide',()=>{void quickSave('pagehide')});
  window.addEventListener('beforeunload',()=>{try{void quickSave('beforeunload')}catch{}});
  window.addEventListener('pixelplayer:hard-unload',e=>{void quickSave(e.detail?.reason||'hard-unload')});

  // Reset the one-load guard for each newly launched ROM, then restore only after the core is ready.
  window.addEventListener('pixelplayer:rom-start',()=>{checkedKey=''});
  window.addEventListener('pixelplayer:system-ready',()=>{void checkAndLoadOnce()});
  window.addEventListener('pixelplayer:n64-ready',()=>{void checkAndLoadOnce()});
  window.addEventListener('pixelplayer:ps1-ready',()=>{void checkAndLoadOnce()});

  window.PixelPlayerQuickResume={build:123,save:quickSave,load:checkAndLoadOnce,capture,key,lastCapture:()=>({key:lastCaptureKey,at:lastCaptureAt})};
})();