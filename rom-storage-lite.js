// Build 124: device-aware ROM storage. Desktop browsers may persist directory handles; mobile keeps metadata + relink.
(()=>{
  if(window.PixelPlayerRomStorage?.build>=124)return;
  const body=document.body,system=body.dataset.system||'unknown';
  const liveByName=new Map(),liveByPath=new Map();let pendingName='';
  const clean=n=>(n||'').replace(/\.[^.]+$/,'').trim().toLowerCase();
  const ua=navigator.userAgent||'';
  const mobile=!!navigator.userAgentData?.mobile||/Android|iPhone|iPad|iPod|Mobile/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const desktopHandles=!mobile&&typeof window.showDirectoryPicker==='function';
  const HANDLE_DB='PixelPlayerDirectoryHandles',HANDLE_STORE='handles',HANDLE_KEY=`rom-root:${system}`;

  function remember(file,path=''){
    if(!(file instanceof Blob)||!file.name)return;
    const rel=path||file.webkitRelativePath||file.name;
    liveByName.set(file.name,file);liveByName.set(clean(file.name),file);liveByPath.set(rel,file);
  }
  function rememberMany(files){for(const f of files||[])remember(f)}
  function findFile(name,path=''){return (path&&liveByPath.get(path))||liveByName.get(name)||liveByName.get(clean(name))||null}
  function status(msg){const el=document.getElementById('romLibraryStatus')||document.getElementById('emuStatus');if(el)el.textContent=msg}

  function openHandleDb(){return new Promise((res,rej)=>{const r=indexedDB.open(HANDLE_DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(HANDLE_STORE))r.result.createObjectStore(HANDLE_STORE,{keyPath:'key'})};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
  async function saveHandle(handle){if(!desktopHandles||!handle)return false;try{const d=await openHandleDb();await new Promise((res,rej)=>{const tx=d.transaction(HANDLE_STORE,'readwrite');tx.objectStore(HANDLE_STORE).put({key:HANDLE_KEY,system,handle,savedAt:Date.now()});tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});d.close();return true}catch(e){console.warn('Could not remember ROM folder handle',e);return false}}
  async function getHandle(){if(!desktopHandles)return null;try{const d=await openHandleDb(),row=await new Promise((res,rej)=>{const q=d.transaction(HANDLE_STORE,'readonly').objectStore(HANDLE_STORE).get(HANDLE_KEY);q.onsuccess=()=>res(q.result||null);q.onerror=()=>rej(q.error)});d.close();return row?.handle||null}catch{return null}}
  async function permission(handle,request=false){if(!handle)return'denied';try{let p=await handle.queryPermission?.({mode:'read'})||'prompt';if(p!=='granted'&&request)p=await handle.requestPermission?.({mode:'read'})||p;return p}catch{return'denied'}}

  async function walk(handle,prefix='',collect=null,target=''){
    for await(const [name,entry] of handle.entries()){
      const path=prefix?`${prefix}/${name}`:name;
      if(entry.kind==='file'){
        if(target&&name!==target&&clean(name)!==clean(target))continue;
        const file=await entry.getFile();
        try{Object.defineProperty(file,'webkitRelativePath',{value:path,configurable:true})}catch{}
        remember(file,path);
        if(collect)collect.push(file);
        if(target&&(name===target||clean(name)===clean(target)))return file;
      }else if(entry.kind==='directory'){
        const hit=await walk(entry,path,collect,target);if(hit&&target)return hit;
      }
    }
    return null;
  }
  async function fileFromSavedHandle(name,request=false){
    if(!desktopHandles||!name)return null;
    const handle=await getHandle();if(!handle)return null;
    if(await permission(handle,request)!=='granted')return null;
    status(`Reconnecting ${name} from your saved game folder…`);
    return walk(handle,'',null,name);
  }
  async function pickDesktopFolder(){
    if(!desktopHandles)return false;
    try{
      const handle=await showDirectoryPicker({id:`pixelplayer-${system}-roms`,mode:'read'});if(!handle)return false;
      await saveHandle(handle);status('Scanning selected game folder…');
      const files=[];await walk(handle,'',files,'');
      const input=document.getElementById('romFolderInput');
      if(input&&typeof DataTransfer!=='undefined'){
        const dt=new DataTransfer();files.forEach(f=>dt.items.add(f));input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
      }else rememberMany(files);
      status(`${files.length.toLocaleString()} files linked. PixelPlayer will remember this folder on this computer.`);return true;
    }catch(e){if(e?.name!=='AbortError')console.warn('Desktop folder selection failed',e);return false}
  }

  // Guard IndexedDB at the source: game-library/recent stores keep metadata only.
  const proto=window.IDBObjectStore?.prototype;
  if(proto&&!proto.__pixelPlayerRomLite){
    const put=proto.put,add=proto.add;
    const strip=function(value){
      try{
        const db=this.transaction?.db?.name||'',store=this.name||'';
        const romDb=/PixelPlayer(?:Expanded|.*Library|.*Recents|ROMs)/i.test(db);
        if(romDb&&/^(games|roms)$/i.test(store)&&value&&typeof value==='object'&&value.blob instanceof Blob){
          remember(value.blob,value.path||'');const copy={...value};delete copy.blob;copy.storage='metadata';return copy;
        }
      }catch{}
      return value;
    };
    proto.put=function(value,...rest){return put.call(this,strip.call(this,value),...rest)};
    proto.add=function(value,...rest){return add.call(this,strip.call(this,value),...rest)};
    Object.defineProperty(proto,'__pixelPlayerRomLite',{value:true});
  }

  document.addEventListener('click',e=>{
    if(!desktopHandles||!e.target.closest?.('#chooseRomFolderBtn'))return;
    e.preventDefault();e.stopImmediatePropagation();void pickDesktopFolder();
  },true);
  document.addEventListener('change',e=>{
    const t=e.target;if(!t?.files?.length)return;
    if(t.id==='romFolderInput'){
      rememberMany(t.files);
      if(pendingName){const f=findFile(pendingName);if(f){const name=pendingName;pendingName='';setTimeout(()=>launchFile(f,name),0)}else status(`Folder reconnected, but ${pendingName} was not found there.`)}
    }else if(t.id==='romInput')rememberMany(t.files);
  },true);
  document.addEventListener('drop',e=>{if(e.dataTransfer?.files?.length)rememberMany(e.dataTransfer.files)},true);

  function launchFile(file,name=''){
    if(!file)return false;try{window.PixelPlayerSession?.claim?.()}catch{}
    if(system==='gba'&&/\.zip$/i.test(file.name||'')&&window.PixelPlayerGbaArchive?.open){window.PixelPlayerGbaArchive.open(file);return true}
    if(typeof window.startRom==='function'){window.startRom(file);return true}
    status(`${name||file.name} is linked, but the emulator is not ready yet.`);return false;
  }
  async function reconnectAndLaunch(name,allowPrompt=true){
    let file=findFile(name);if(!file&&desktopHandles)file=await fileFromSavedHandle(name,allowPrompt);
    if(file){pendingName='';launchFile(file,name);return true}return false;
  }
  async function requestRelink(name){
    pendingName=name||'';
    if(await reconnectAndLaunch(pendingName,true))return;
    status(`PixelPlayer remembers ${name||'this game'}, but needs its game folder reconnected.`);
    document.getElementById('romFolderInput')?.click();
  }

  document.addEventListener('click',e=>{
    const play=e.target.closest?.('.rom-game-card .primary,.rom-library-item .primary,.pp-lib-play,.recent-dashboard-card .play');if(!play)return;
    let name='';const card=play.closest('.rom-game-card');
    if(card)name=card.dataset.name||card.querySelector('.rom-game-title')?.textContent||'';
    else if(play.classList.contains('pp-lib-play'))name=document.querySelector('.pp-lib-name')?.textContent||'';
    else if(play.closest('.recent-dashboard-card'))name=play.closest('.recent-dashboard-card')?.querySelector('.recent-dashboard-copy strong')?.textContent||'';
    else name=play.closest('.rom-library-item')?.querySelector('strong')?.textContent||'';
    e.preventDefault();e.stopImmediatePropagation();void requestRelink(name);
  },true);

  const requested=new URLSearchParams(location.search).get('play');
  if(requested){
    pendingName=requested;
    const prepare=async()=>{
      if(desktopHandles&&await reconnectAndLaunch(requested,false))return;
      if(document.getElementById('ppReconnectRom'))return;
      const host=document.querySelector('.stage-actions')||document.querySelector('[data-panel="roms"]');if(!host)return;
      const b=document.createElement('button');b.id='ppReconnectRom';b.type='button';b.className='primary';b.textContent=desktopHandles?'Reconnect Saved Game Folder':'Reconnect Game Folder';b.addEventListener('click',()=>void requestRelink(requested));host.appendChild(b);
      status(desktopHandles?`PixelPlayer remembers ${requested}. Click once if your browser needs folder permission again.`:`PixelPlayer remembers ${requested}. Reconnect the game folder to launch it without storing a ROM copy.`);
    };
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void prepare(),{once:true});else void prepare();
  }

  // Silently warm an already-granted desktop handle; never prompt during startup.
  if(desktopHandles)getHandle().then(async h=>{if(h&&await permission(h,false)==='granted')status('Saved game folder access is ready on this computer.')}).catch(()=>{});

  window.PixelPlayerRomStorage={build:124,mode:desktopHandles?'desktop-handle':'mobile-relink',mobile,remember,rememberMany,find:findFile,relink:requestRelink,pickDesktopFolder,stats:()=>({files:Math.floor(liveByName.size/2),paths:liveByPath.size,mode:desktopHandles?'desktop-handle':'mobile-relink'})};
})();