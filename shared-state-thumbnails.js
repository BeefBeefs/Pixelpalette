// Build 102: shared save-state thumbnails for every system using PixelPlayerExpanded.
(()=>{
  if(window.__pixelPlayerStateThumbs102)return;window.__pixelPlayerStateThumbs102=true;
  const DB='PixelPlayerExpanded',STORE='states',urls=new Map();
  const system=(document.body.dataset.system||'').toLowerCase();
  const current=()=>String(document.getElementById('sessionRom')?.textContent||window.EJS_gameName||'game').trim()||'game';
  const key=n=>`${system}::${current()}::slot-${n}`;
  function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('games'))d.createObjectStore('games',{keyPath:'key'});if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'key'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
  async function get(n){const d=await openDb();const row=await new Promise((res,rej)=>{const r=d.transaction(STORE,'readonly').objectStore(STORE).get(key(n));r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)});d.close();return row}
  async function put(row){const d=await openDb();await new Promise((res,rej)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});d.close()}
  function asBlob(data){if(!data)return null;if(data instanceof Blob)return data;if(data instanceof ArrayBuffer)return new Blob([data],{type:'image/png'});if(ArrayBuffer.isView(data))return new Blob([data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)],{type:'image/png'});return null}
  async function canvasBlob(){const canvas=document.querySelector('#game canvas');if(!canvas)return null;try{return await new Promise(res=>canvas.toBlob?.(res,'image/png'))}catch{return null}}
  async function capture(){try{const shot=await window.EJS_emulator?.gameManager?.screenshot?.();const blob=asBlob(shot);if(blob?.size)return blob}catch(e){console.warn('State thumbnail screenshot unavailable',e)}return await canvasBlob()}
  function paint(card,row,n){const thumb=card?.querySelector('.state-thumb');if(!thumb)return;const id=`${system}:${current()}:${n}`,old=urls.get(id);if(old){URL.revokeObjectURL(old);urls.delete(id)}if(row?.thumbnail instanceof Blob&&row.thumbnail.size){const u=URL.createObjectURL(row.thumbnail);urls.set(id,u);thumb.className='state-thumb';thumb.replaceChildren();const img=document.createElement('img');img.src=u;img.alt=`Slot ${n} screenshot`;thumb.appendChild(img)}else{thumb.className='state-thumb empty';thumb.innerHTML=`<span>Slot ${n}</span>`}}
  async function render(){for(const card of document.querySelectorAll('.generic-state-slot')){const n=card.dataset.slot;try{paint(card,await get(n),n)}catch{}}}
  async function attach(n){try{const row=await get(n);if(!row)return;const thumbnail=await capture();if(!thumbnail?.size)return;row.thumbnail=thumbnail;await put(row);paint(document.querySelector(`.generic-state-slot[data-slot="${n}"]`),row,n)}catch(e){console.warn('Could not attach state thumbnail',e)}}
  window.addEventListener('pixelplayer:manual-state-saved',e=>{if(!e.detail||e.detail.system===system)attach(e.detail?.slot)});
  window.addEventListener('pixelplayer:system-ready',render);
  document.querySelector('[data-tab="saves"]')?.addEventListener('click',()=>setTimeout(render,0));
  window.addEventListener('pixelplayer:manual-state-loaded',render);
  window.addEventListener('pixelplayer:hard-unload',()=>{for(const u of urls.values())URL.revokeObjectURL(u);urls.clear()});
  render();
})();