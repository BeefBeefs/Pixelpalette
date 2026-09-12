// Build 50: invisible per-ROM quick save slot, separate from visible manual slots.
(()=>{
  const system=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  const DB='PixelPlayerQuickResume',STORE='states';
  let restoring=false,restoredKey='',saveBusy=false,pendingSave=false,lastSave=0;
  const emu=()=>window.EJS_emulator||null;
  function gameName(){return String(window.EJS_gameName||document.getElementById('sessionRom')?.textContent||'').trim()}
  function key(){const g=gameName();return g&&g!=='No ROM loaded'&&g!=='No game loaded'?`${system}::${g}::quick`:''}
  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function put(row){const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});d.close()}
  async function get(k){const d=await openDb();const row=await new Promise((res,rej)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(k);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});d.close();return row}
  function stateBytes(){try{const s=emu()?.gameManager?.getState?.();return s&&s.length?new Uint8Array(s):null}catch{return null}}
  async function quickSave(reason='auto'){
    const k=key();if(!k||restoring)return false;
    if(saveBusy){pendingSave=true;return false}
    const bytes=stateBytes();if(!bytes)return false;
    saveBusy=true;
    try{await put({key:k,system,game:gameName(),savedAt:Date.now(),reason,blob:new Blob([bytes])});lastSave=Date.now();window.dispatchEvent(new CustomEvent('pixelplayer:quick-saved',{detail:{system,reason}}));return true}
    catch(e){console.warn('PixelPlayer quick save failed',e);return false}
    finally{saveBusy=false;if(pendingSave){pendingSave=false;setTimeout(()=>quickSave('queued'),0)}}
  }
  async function quickLoad(){
    const k=key(),gm=emu()?.gameManager;if(!k||!gm||restoredKey===k||restoring)return false;
    restoredKey=k;restoring=true;
    try{const row=await get(k);if(!row?.blob)return false;const bytes=new Uint8Array(await row.blob.arrayBuffer());if(!bytes.length)return false;gm.loadState?.(bytes);window.dispatchEvent(new CustomEvent('pixelplayer:quick-loaded',{detail:{system,savedAt:row.savedAt}}));return true}
    catch(e){console.warn('PixelPlayer quick load failed',e);return false}
    finally{setTimeout(()=>{restoring=false},250)}
  }
  async function waitAndLoad(){
    for(let i=0;i<180;i++){if(emu()?.gameManager?.FS&&key()){await new Promise(r=>setTimeout(r,350));await quickLoad();return}await new Promise(r=>setTimeout(r,100))}
  }
  // Android reliably backgrounds pages before killing them; save as soon as that happens.
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')quickSave('hidden')});
  window.addEventListener('pagehide',()=>quickSave('pagehide'));
  window.addEventListener('beforeunload',()=>{try{quickSave('unload')}catch{}});
  // Layout/theme edits are meaningful user changes and are also a useful checkpoint moment.
  window.addEventListener('pixelplayer:control-layout-saved',()=>quickSave('control-layout'));
  window.addEventListener('pixelplayer:controller-theme-changed',()=>quickSave('controller-theme'));
  window.addEventListener('pixelplayer:rom-start',()=>{restoredKey='';setTimeout(waitAndLoad,0)});
  window.addEventListener('pixelplayer:system-ready',()=>setTimeout(quickLoad,350));
  window.addEventListener('pixelplayer:n64-ready',()=>setTimeout(quickLoad,350));
  // Legacy GBA/SNES/PS1 pages may not emit the shared ready event; stage becoming ready starts a guarded restore poll.
  const stage=document.getElementById('emuStage');if(stage)new MutationObserver(()=>{if(stage.classList.contains('ready'))setTimeout(waitAndLoad,0)}).observe(stage,{attributes:true,attributeFilter:['class']});
  // Quiet periodic safety checkpoint while actively playing. This protects against abrupt Android tab/process kills.
  setInterval(()=>{if(document.visibilityState==='visible'&&emu()?.gameManager?.FS&&Date.now()-lastSave>30000)quickSave('interval')},30000);
  window.PixelPlayerQuickResume={save:quickSave,load:quickLoad,key};
})();