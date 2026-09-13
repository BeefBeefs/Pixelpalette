// Build 121: lightweight ROM storage. Persist metadata; keep ROM File objects only for the live session.
(()=>{
  if(window.PixelPlayerRomStorage?.build>=121)return;
  const body=document.body,system=body.dataset.system||'unknown';
  const liveByName=new Map(),liveByPath=new Map();let pendingName='';
  const clean=n=>(n||'').replace(/\.[^.]+$/,'').trim().toLowerCase();
  function remember(file){if(!(file instanceof Blob)||!file.name)return;const path=file.webkitRelativePath||file.name;liveByName.set(file.name,file);liveByName.set(clean(file.name),file);liveByPath.set(path,file)}
  function rememberMany(files){for(const f of files||[])remember(f)}
  function findFile(name,path=''){return (path&&liveByPath.get(path))||liveByName.get(name)||liveByName.get(clean(name))||null}
  function status(msg){const el=document.getElementById('romLibraryStatus')||document.getElementById('emuStatus');if(el)el.textContent=msg}

  // Guard IndexedDB at the source: game-library/recent stores keep metadata only.
  const proto=window.IDBObjectStore?.prototype;
  if(proto&&!proto.__pixelPlayerRomLite){
    const put=proto.put,add=proto.add;
    const strip=function(value){
      try{
        const db=this.transaction?.db?.name||'',store=this.name||'';
        const romDb=/PixelPlayer(?:Expanded|.*Library|.*Recents|ROMs)/i.test(db);
        if(romDb&&/^(games|roms)$/i.test(store)&&value&&typeof value==='object'&&value.blob instanceof Blob){
          remember(value.blob);
          const copy={...value};delete copy.blob;copy.storage='metadata';return copy;
        }
      }catch{}
      return value;
    };
    proto.put=function(value,...rest){return put.call(this,strip.call(this,value),...rest)};
    proto.add=function(value,...rest){return add.call(this,strip.call(this,value),...rest)};
    Object.defineProperty(proto,'__pixelPlayerRomLite',{value:true});
  }

  // Capture files chosen for a library before legacy indexers discard the FileList.
  document.addEventListener('change',e=>{
    const t=e.target;if(!t?.files?.length)return;
    if(t.id==='romFolderInput'){rememberMany(t.files);if(pendingName){const f=findFile(pendingName);if(f){const name=pendingName;pendingName='';setTimeout(()=>launchFile(f,name),0)}}}
    else if(t.id==='romInput')rememberMany(t.files);
  },true);
  document.addEventListener('drop',e=>{if(e.dataTransfer?.files?.length)rememberMany(e.dataTransfer.files)},true);

  function launchFile(file,name=''){
    if(!file)return false;
    try{window.PixelPlayerSession?.claim?.()}catch{}
    if(system==='gba'&&/\.zip$/i.test(file.name||'')&&window.PixelPlayerGbaArchive?.open){window.PixelPlayerGbaArchive.open(file);return true}
    if(typeof window.startRom==='function'){window.startRom(file);return true}
    status(`${name||file.name} is linked, but the emulator is not ready yet.`);return false;
  }
  function requestRelink(name){
    pendingName=name||'';
    status(`PixelPlayer remembers ${name||'this game'}, but not a copy of the ROM. Re-select its game folder to reconnect it.`);
    document.getElementById('romFolderInput')?.click();
  }

  // Library card Play buttons: use the live File reference if available; otherwise one folder re-select reconnects it.
  document.addEventListener('click',e=>{
    const play=e.target.closest?.('.rom-game-card .primary,.pp-lib-play,.recent-dashboard-card .play');if(!play)return;
    let name='';
    const card=play.closest('.rom-game-card');if(card)name=card.dataset.name||card.querySelector('.rom-game-title')?.textContent||'';
    else if(play.classList.contains('pp-lib-play'))name=document.querySelector('.pp-lib-name')?.textContent||'';
    else name=play.closest('.recent-dashboard-card')?.querySelector('.recent-dashboard-copy strong')?.textContent||'';
    const file=findFile(name);
    e.preventDefault();e.stopImmediatePropagation();
    if(file)launchFile(file,name);else requestRelink(name);
  },true);

  // A normal ROM launch also becomes available to recent/library controls for the rest of this session.
  window.addEventListener('pixelplayer:rom-start',()=>{const f=document.getElementById('romInput')?.files?.[0];if(f)remember(f)});

  window.PixelPlayerRomStorage={build:121,remember,rememberMany,find:findFile,relink:requestRelink,stats:()=>({files:Math.floor(liveByName.size/2),paths:liveByPath.size})};
})();