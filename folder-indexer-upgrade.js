// Build 71: chunked progress-aware folder indexing with GBA ZIP support.
(()=>{
  if(window.PixelPlayerFolderIndexer71)return;window.PixelPlayerFolderIndexer71=true;
  const body=document.body;
  const page=body.dataset.system||(body.classList.contains('n64-page')?'n64':body.classList.contains('ps1-page')?'ps1':body.classList.contains('snes-page')?'snes':body.classList.contains('gba-page')?'gba':null);
  const configs={
    gba:{db:'PixelPlayerLibrary',store:'roms',version:1,re:/\.(gba|zip)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,addedAt:Date.now(),blob:f}}},
    snes:{db:'PixelPlayerSnesLibrary',store:'roms',version:1,re:/\.(sfc|smc|fig|gd3|gd7|dx2|bsx|swc|zip)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,blob:f}}},
    n64:{db:'PixelPlayerN64Library',store:'games',version:1,re:/\.(z64|n64|v64|zip|7z)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,blob:f}}},
    ps1:{db:'PixelPlayerPs1Library',store:'games',version:1,re:/\.(chd|bin|cue|img|mdf|pbp|toc|cbn|m3u|ccd|zip|7z)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,blob:f}}}
  };
  function genericConfig(){
    const system=body.dataset.system;if(!system)return null;
    const ext=(body.dataset.ext||'').split(',').map(x=>x.trim().replace(/^\./,'')).filter(Boolean);if(!ext.length)return null;
    const re=new RegExp(`\\.(${ext.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})$`,'i');
    return{db:'PixelPlayerExpanded',store:'games',version:1,re,system,row:f=>({key:`${system}::${f.name}::${f.size}::${f.lastModified||0}`,system,name:f.name,size:f.size,lastModified:f.lastModified||0,lastPlayed:0,source:'library',blob:f})};
  }
  const cfg=configs[page]||genericConfig();if(!cfg)return;
  const CHUNK=40;
  function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open(cfg.db,cfg.version);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(cfg.store))d.createObjectStore(cfg.store,{keyPath:'key'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  function status(text){const el=document.getElementById('romLibraryStatus');if(el)el.textContent=text}
  const yieldPaint=()=>new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  function fmt(n){return n>=1048576?`${(n/1048576).toFixed(2)} MB`:`${Math.max(1,Math.round(n/1024))} KB`}
  async function readRows(){
    const db=await openDb();
    const rows=await new Promise((res,rej)=>{const q=db.transaction(cfg.store,'readonly').objectStore(cfg.store).getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>rej(q.error)});
    db.close();
    return rows.filter(r=>!cfg.system||(r.system===cfg.system&&r.source==='library')).sort((a,b)=>(a.path||a.name||'').localeCompare(b.path||b.name||'',undefined,{sensitivity:'base'}));
  }
  async function renderFresh(){
    const list=document.getElementById('romLibraryList'),count=document.getElementById('romLibraryCount'),search=document.getElementById('romLibrarySearch');if(!list)return;
    let rows=await readRows();const q=(search?.value||'').trim().toLowerCase();if(q)rows=rows.filter(r=>`${r.name||''} ${r.path||''}`.toLowerCase().includes(q));
    if(count)count.textContent=`${rows.length}${q?' matching':''} ${rows.length===1?'Game':'Games'}`;
    if(!rows.length){list.className='rom-library-list empty-state';list.textContent=q?'No matching games.':'Choose a folder to build your library.';return}
    list.className='rom-library-list';list.innerHTML='';
    const frag=document.createDocumentFragment();
    for(const r of rows){
      const item=document.createElement('article');item.className='rom-library-row rom-library-item';
      const info=document.createElement('div');info.className='rom-library-info';const strong=document.createElement('strong');strong.textContent=(r.name||'Game').replace(/\.(gba|zip)$/i,'');const meta=document.createElement('span');meta.textContent=`${r.path||r.name||''} • ${fmt(r.size||0)}`;info.append(strong,meta);
      const play=document.createElement('button');play.className='primary';play.type='button';play.textContent='Play';play.onclick=()=>{const file=new File([r.blob],r.name,{type:'application/octet-stream',lastModified:r.lastModified||Date.now()});if(page==='gba'&&/\.zip$/i.test(r.name||''))window.PixelPlayerGbaArchive?.open?.(file);else window.startRom?.(file)};item.append(info,play);frag.appendChild(item)
    }
    list.appendChild(frag);
  }
  async function writeChunk(chunk){
    const db=await openDb();
    await new Promise((resolve,reject)=>{const tx=db.transaction(cfg.store,'readwrite'),store=tx.objectStore(cfg.store);for(const file of chunk)store.put(cfg.row(file));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Folder indexing aborted'))});
    db.close();
  }
  async function save(files){
    const all=[...(files||[])],roms=all.filter(f=>cfg.re.test(f.name||'')),p=window.PixelPlayerFolderProgress;
    if(!roms.length){status(`No compatible games found in ${all.length.toLocaleString()} scanned files.`);p?.start(0,'No compatible games found');p?.done(0,'Folder scan complete');return}
    status(`Indexing ${roms.length.toLocaleString()} compatible games locally…`);p?.start(roms.length,'Indexing');await yieldPaint();
    let completed=0;
    try{
      for(let i=0;i<roms.length;i+=CHUNK){const chunk=roms.slice(i,i+CHUNK);await writeChunk(chunk);completed+=chunk.length;p?.update(completed,roms.length,'Indexing');status(`Indexing ${completed.toLocaleString()} / ${roms.length.toLocaleString()} compatible games…`);await yieldPaint()}
      await renderFresh();p?.done(roms.length,'Folder scan complete');status(`${roms.length.toLocaleString()} compatible games indexed.`);
    }catch(err){console.warn('Folder indexing failed',err);p?.error(completed,roms.length,'Indexing stopped');status(`Indexing stopped at ${completed.toLocaleString()} of ${roms.length.toLocaleString()}. Browser storage may be full.`);try{await renderFresh()}catch{}}
  }
  document.addEventListener('change',e=>{
    const target=e.target;if(!target||target.id!=='romFolderInput'||!target.files?.length)return;
    e.preventDefault();e.stopImmediatePropagation();const files=[...target.files];target.value='';save(files);
  },true);
  document.getElementById('romLibrarySearch')?.addEventListener('input',()=>{renderFresh().catch(()=>{})},true);
})();