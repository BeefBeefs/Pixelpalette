// Build 69: progress-aware folder indexing for generic and legacy PixelPlayer libraries.
(()=>{
  if(window.PixelPlayerFolderIndexer69)return;window.PixelPlayerFolderIndexer69=true;
  const body=document.body;
  const page=body.dataset.system||(body.classList.contains('n64-page')?'n64':body.classList.contains('ps1-page')?'ps1':body.classList.contains('snes-page')?'snes':body.classList.contains('gba-page')?'gba':null);
  const configs={
    gba:{db:'PixelPlayerLibrary',store:'roms',version:1,re:/\.gba$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,addedAt:Date.now(),blob:f}}},
    snes:{db:'PixelPlayerSnesLibrary',store:'roms',version:1,re:/\.(sfc|smc|fig|gd3|gd7|dx2|bsx|swc|zip)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,blob:f}}},
    n64:{db:'PixelPlayerN64Library',store:'games',version:1,re:/\.(z64|n64|v64|zip|7z)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,blob:f}}},
    ps1:{db:'PixelPlayerPs1Library',store:'games',version:1,re:/\.(chd|bin|cue|img|mdf|pbp|toc|cbn|m3u|ccd|zip|7z)$/i,row:f=>{const path=f.webkitRelativePath||f.name;return{key:`${path}:${f.size}:${f.lastModified||0}`,name:f.name,path,size:f.size,lastModified:f.lastModified||0,blob:f}}}
  };
  function genericConfig(){
    const system=body.dataset.system;if(!system)return null;
    const ext=(body.dataset.ext||'').split(',').map(x=>x.trim().replace(/^\./,'')).filter(Boolean);
    if(!ext.length)return null;
    const re=new RegExp(`\\.(${ext.map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})$`,'i');
    return{db:'PixelPlayerExpanded',store:'games',version:1,re,row:f=>({key:`${system}::${f.name}::${f.size}::${f.lastModified||0}`,system,name:f.name,size:f.size,lastModified:f.lastModified||0,lastPlayed:0,source:'library',blob:f})};
  }
  const cfg=configs[page]||genericConfig();if(!cfg)return;
  function openDb(){return new Promise((res,rej)=>{const r=indexedDB.open(cfg.db,cfg.version);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(cfg.store))d.createObjectStore(cfg.store,{keyPath:'key'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  function status(text){const el=document.getElementById('romLibraryStatus');if(el)el.textContent=text}
  function refreshList(){const search=document.getElementById('romLibrarySearch');search?.dispatchEvent(new Event('input',{bubbles:true}))}
  async function save(files){
    const all=[...(files||[])],roms=all.filter(f=>cfg.re.test(f.name||'')),p=window.PixelPlayerFolderProgress;
    if(!roms.length){status(`No compatible games found in ${all.length.toLocaleString()} scanned files.`);p?.start(0,'No compatible games found');p?.done(0,'Folder scan complete');return}
    status(`Indexing ${roms.length.toLocaleString()} compatible games locally…`);p?.start(roms.length,'Indexing');
    let completed=0,db;
    try{
      db=await openDb();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(cfg.store,'readwrite'),store=tx.objectStore(cfg.store);
        for(const file of roms){
          const req=store.put(cfg.row(file));
          req.onsuccess=()=>{completed++;if(completed===roms.length||completed%10===0)p?.update(completed,roms.length,'Indexing')};
        }
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Folder indexing aborted'));
      });
      db.close();db=null;
      p?.done(roms.length,'Folder scan complete');status(`${roms.length.toLocaleString()} compatible games indexed.`);refreshList();
    }catch(err){try{db?.close()}catch{};console.warn('Folder indexing failed',err);p?.error(completed,roms.length,'Indexing stopped');status(`Indexing stopped at ${completed.toLocaleString()} of ${roms.length.toLocaleString()}. Browser storage may be full.`);refreshList()}
  }
  document.addEventListener('change',e=>{
    const target=e.target;if(!target||target.id!=='romFolderInput'||!target.files?.length)return;
    e.preventDefault();e.stopImmediatePropagation();
    const files=target.files;save(files);target.value='';
  },true);
})();