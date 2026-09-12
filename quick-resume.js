// Build 53: lightweight invisible per-ROM quick resume slot.
(()=>{
  const system=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  const DB='PixelPlayerQuickResume',STORE='states';
  let checkedKey='',saveBusy=false;
  const emu=()=>window.EJS_emulator||null;
  function gameName(){return String(window.EJS_gameName||document.getElementById('sessionRom')?.textContent||'').trim()}
  function key(){const g=gameName();return g&&g!=='No ROM loaded'&&g!=='No game loaded'?`${system}::${g}::quick`:''}
  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function put(row){const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});d.close()}
  async function get(k){const d=await openDb();const row=await new Promise((res,rej)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});d.close();return row}
  function stateBytes(){try{const s=emu()?.gameManager?.getState?.();return s&&s.length?new Uint8Array(s):null}catch{return null}}
  async function quickSave(reason='pagehide'){
    const k=key();if(!k||saveBusy)return false;
    const bytes=stateBytes();if(!bytes)return false;
    saveBusy=true;
    try{await put({key:k,system,game:gameName(),savedAt:Date.now(),reason,blob:new Blob([bytes])});return true}
    catch(e){console.warn('PixelPlayer quick save failed',e);return false}
    finally{saveBusy=false}
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
      return true;
    }catch(e){console.warn('PixelPlayer quick resume check failed',e);return false}
  }
  // Save only when the page/session is actually leaving or being backgrounded.
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')quickSave('hidden')});
  window.addEventListener('pagehide',()=>quickSave('pagehide'));
  window.addEventListener('beforeunload',()=>{try{quickSave('unload')}catch{}});

  // Exactly one resume lookup after a successful ROM/core start. No polling, timers, or stage observers.
  window.addEventListener('pixelplayer:rom-start',()=>{checkedKey=''});
  window.addEventListener('pixelplayer:system-ready',()=>{void checkAndLoadOnce()});
  window.addEventListener('pixelplayer:n64-ready',()=>{void checkAndLoadOnce()});

  window.PixelPlayerQuickResume={save:quickSave,load:checkAndLoadOnce,key};
})();