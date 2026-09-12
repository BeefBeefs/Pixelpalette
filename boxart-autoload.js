// Build 90: automatically restore previously matched box art when library cards render.
(()=>{
  if(window.PixelPlayerBoxArtAutoload90)return;window.PixelPlayerBoxArtAutoload90=true;
  const body=document.body,list=document.getElementById('romLibraryList');if(!list)return;
  const system=body.dataset.system||(body.classList.contains('n64-page')?'n64':body.classList.contains('ps1-page')?'ps1':body.classList.contains('snes-page')?'snes':'gba');
  const MAP_KEY=`pixelplayer:boxart-map:${system}`;
  const DB='PixelPlayerBoxArt',IMG_STORE='images';
  const cacheKey=title=>`${system}::${title}`;
  function getMap(){try{return JSON.parse(localStorage.getItem(MAP_KEY)||'{}')}catch{return{}}}
  function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('images'))d.createObjectStore('images',{keyPath:'key'});if(!d.objectStoreNames.contains('catalogs'))d.createObjectStore('catalogs',{keyPath:'key'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function getBlob(title){try{const d=await openDb();const row=await new Promise((res,rej)=>{const q=d.transaction(IMG_STORE,'readonly').objectStore(IMG_STORE).get(cacheKey(title));q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)});d.close();return row?.blob||null}catch{return null}}
  function ensureImage(card){const cover=card.querySelector('.rom-game-cover');if(!cover)return null;let img=cover.querySelector('img');if(!img){img=document.createElement('img');img.alt='';img.decoding='async';cover.appendChild(img)}return{cover,img}}
  function setUrl(card,url){const pair=ensureImage(card);if(!pair||!url)return;const{cover,img}=pair;img.onload=()=>cover.classList.add('has-art');img.onerror=()=>{cover.classList.remove('has-art');img.onload=img.onerror=null;img.remove()};img.src=url}
  async function restoreCard(card,map){if(!(card instanceof Element)||!card.classList.contains('rom-game-card'))return;const title=card.querySelector('.rom-game-title')?.textContent?.trim();if(!title)return;const rec=map[title],url=typeof rec==='string'?rec:rec?.url;if(!url||card.querySelector('.rom-game-cover img'))return;const blob=await getBlob(title);if(!blob){setUrl(card,url);return}const pair=ensureImage(card);if(!pair)return;const{cover,img}=pair,obj=URL.createObjectURL(blob);img.onload=()=>{cover.classList.add('has-art');setTimeout(()=>URL.revokeObjectURL(obj),0)};img.onerror=()=>{URL.revokeObjectURL(obj);img.remove();setUrl(card,url)};img.src=obj}
  async function restoreAll(){const map=getMap();const cards=[...list.querySelectorAll('.rom-game-card')];for(const card of cards)await restoreCard(card,map)}
  let scheduled=false;
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(async()=>{scheduled=false;await restoreAll()})}
  const observer=new MutationObserver(records=>{
    for(const record of records){for(const node of record.addedNodes){if(!(node instanceof Element))continue;if(node.classList?.contains('rom-game-card')||node.querySelector?.('.rom-game-card')){schedule();return}}}
  });
  observer.observe(list,{childList:true,subtree:true});
  schedule();
  window.addEventListener('pageshow',schedule);
  window.addEventListener('pixelplayer:boxart-updated',schedule);
})();
