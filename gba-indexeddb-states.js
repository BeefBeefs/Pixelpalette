// Build 57: GBA manual save states in IndexedDB with one-time migration from legacy localStorage.
(()=>{
  const slots=[...document.querySelectorAll('.state-slot[data-slot]')];
  if(!slots.length||document.body.classList.contains('snes-page')||document.body.classList.contains('ps1-page')||document.body.classList.contains('n64-page'))return;
  const DB='PixelPlayerGbaStates',STORE='states';
  let busy=false;
  const objectUrls=new Map();
  const gm=()=>window.EJS_emulator?.gameManager||null;
  const ready=()=>!!gm()?.FS;
  const gameName=()=>String(window.EJS_gameName||document.getElementById('sessionRom')?.textContent||'game').trim()||'game';
  const key=slot=>`${gameName()}::slot-${slot}`;
  const legacyKey=slot=>`pixelplayer:${gameName()}:state:${slot}`;
  const status=(text,kind='info')=>{const el=document.getElementById('controlStatus');if(el){el.textContent=text;el.className=`status ${kind}`}};
  function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:'key'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function get(slot){const d=await openDb();const row=await new Promise((res,rej)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(key(slot));r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});d.close();return row}
  async function put(slot,bytes,thumbnail=null,savedAt=Date.now()){const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put({key:key(slot),game:gameName(),slot:+slot,savedAt,blob:new Blob([bytes],{type:'application/octet-stream'}),thumbnail});tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});d.close()}
  function base64ToBytes(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u}
  async function dataUrlToBlob(url){if(!url)return null;try{return await (await fetch(url)).blob()}catch{return null}}
  async function migrate(slot){if(await get(slot))return;const raw=localStorage.getItem(legacyKey(slot));if(!raw)return;try{const data=JSON.parse(raw);if(!data?.state)return;await put(slot,base64ToBytes(data.state),await dataUrlToBlob(data.thumb),data.savedAt||Date.now());localStorage.removeItem(legacyKey(slot))}catch(e){console.warn('GBA state migration failed',e)}}
  async function captureThumb(){try{const bytes=await gm()?.screenshot?.();return bytes?.length?new Blob([bytes],{type:'image/png'}):null}catch{return null}}
  function renderThumb(card,row,slot){const thumb=card.querySelector('.state-thumb');if(!thumb)return;const old=objectUrls.get(slot);if(old){URL.revokeObjectURL(old);objectUrls.delete(slot)}if(row?.thumbnail instanceof Blob&&row.thumbnail.size){const url=URL.createObjectURL(row.thumbnail);objectUrls.set(slot,url);thumb.className='state-thumb';thumb.innerHTML='';const img=document.createElement('img');img.src=url;img.alt=`Slot ${slot} screenshot`;thumb.appendChild(img)}else{thumb.className='state-thumb empty';thumb.innerHTML=`<span>Slot ${slot}</span>`}}
  async function render(){for(const card of slots){const slot=card.dataset.slot;await migrate(slot);const row=await get(slot);renderThumb(card,row,slot);const time=card.querySelector('.state-time'),save=card.querySelector('.save-state-btn'),load=card.querySelector('.load-state-btn');if(time)time.textContent=row?.savedAt?new Date(row.savedAt).toLocaleString():'Empty';if(save)save.disabled=!ready()||busy;if(load)load.disabled=!ready()||busy||!row}}
  async function save(slot){if(busy||!ready())return false;busy=true;await render();status(`Saving state to Slot ${slot}…`);try{const state=gm()?.getState?.();if(!state?.length)throw new Error('No state data returned');await put(slot,state,await captureThumb());status(`Saved state to Slot ${slot}.`,'good');return true}catch(e){console.warn('GBA save-state failed',e);status('Could not save state.','warn');return false}finally{busy=false;await render()}}
  async function load(slot){if(busy||!ready())return false;busy=true;await render();status(`Loading Slot ${slot}…`);try{const row=await get(slot);if(!row?.blob){status(`Slot ${slot} is empty.`,'warn');return false}gm()?.loadState?.(new Uint8Array(await row.blob.arrayBuffer()));status(`Loaded state from Slot ${slot}.`,'good');return true}catch(e){console.warn('GBA load-state failed',e);status('Could not load that save state.','warn');return false}finally{busy=false;await render()}}
  document.addEventListener('click',e=>{const b=e.target.closest?.('.save-state-btn,.load-state-btn');if(!b)return;const card=b.closest('.state-slot[data-slot]');if(!card)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();b.classList.contains('save-state-btn')?save(card.dataset.slot):load(card.dataset.slot)},true);
  window.PixelPlayerManualStates={save,load,render,backend:'indexeddb'};
  window.addEventListener('pixelplayer:system-ready',render);
  window.addEventListener('beforeunload',()=>{for(const url of objectUrls.values())URL.revokeObjectURL(url)});
  async function refreshWhenReady(){for(let i=0;i<80;i++){if(ready()){await render();window.dispatchEvent(new CustomEvent('pixelplayer:system-ready',{detail:{system:'gba'}}));return}await new Promise(r=>setTimeout(r,125))}}
  const stage=document.getElementById('emuStage');if(stage)new MutationObserver(()=>{if(stage.classList.contains('ready'))refreshWhenReady()}).observe(stage,{attributes:true,attributeFilter:['class']});
  render();
})();