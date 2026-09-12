// Build 92: EmulatorJS offline-core manager. Caches stable runtime/core assets for true offline launches.
(()=>{
  if(window.PixelPlayerOfflineCores)return;
  const CDN='https://cdn.emulatorjs.org/stable/data/',CACHE='pixelplayer-ejs-offline-v1';
  const body=document.body;
  const system=body.dataset.system||(body.classList.contains('n64-page')?'n64':body.classList.contains('ps1-page')?'ps1':body.classList.contains('snes-page')?'snes':'gba');
  const FIRST=new Set(['gba','nes','snes','gbc','genesis','mastersystem','gamegear']);
  const CORE={
    gba:'mgba',nes:'fceumm',snes:'snes9x',gbc:'gambatte',genesis:'genesis_plus_gx',mastersystem:'genesis_plus_gx',gamegear:'genesis_plus_gx',
    atari2600:'stella2014',atari5200:'a5200',atari7800:'prosystem',jaguar:'virtualjaguar',lynx:'handy',cdi:'same_cdi',coleco:'gearcoleco',
    commodore:'vice_x64',doom:'prboom',arcade:'fbneo',mame:'mame2003_plus',ngp:'mednafen_ngp',n64:'mupen64plus_next',nds:'desmume',
    ps1:'pcsx_rearmed',psp:'ppsspp',sega32x:'picodrive',segacd:'genesis_plus_gx',saturn:'yabause',turbografx:'mednafen_pce',
    virtualboy:'beetle_vb',wonderswan:'mednafen_wswan',zx81:'81',zxspectrum:'fuse',amiga:'puae',amstrad:'cap32','3do':'opera'
  };
  const ALIAS={gba:'mgba',nes:'fceumm',snes:'snes9x',gb:'gambatte',gbc:'gambatte',segaMD:'genesis_plus_gx',segaMS:'genesis_plus_gx',segaGG:'genesis_plus_gx',genesis_plus_gx:'genesis_plus_gx',mupen64plus_next:'mupen64plus_next',pcsx_rearmed:'pcsx_rearmed'};
  const COMMON=['loader.js','emulator.min.js','emulator.min.css','version.json','localization/en.json','compression/extractzip.js','compression/extract7z.js'];
  const threaded=body.dataset.threads==='true';
  const selected=()=>{const c=window.PixelPlayerCore?.get?.();return ALIAS[c]||CORE[system]||c||null};
  const urlsFor=(core=selected())=>{if(!core)return[];const variants=threaded?[`${core}-thread-wasm.data`,`${core}-thread-legacy-wasm.data`]:[`${core}-wasm.data`,`${core}-legacy-wasm.data`];return [...COMMON.map(x=>CDN+x),...variants.map(x=>CDN+'cores/'+x)]};
  const primary=(core=selected())=>core?CDN+'cores/'+core+(threaded?'-thread-wasm.data':'-wasm.data'):'';
  async function cacheOpen(){return caches.open(CACHE)}
  async function ready(core=selected()){
    if(!('caches'in window)||!core)return false;
    const c=await cacheOpen();
    return !!(await c.match(CDN+'loader.js'))&&!!(await c.match(CDN+'emulator.min.js'))&&!!(await c.match(primary(core)));
  }
  async function download(core=selected(),onProgress){
    if(!core)throw new Error('No offline core mapping is available for this system.');
    if(!navigator.onLine)throw new Error('Connect to the internet before downloading this core.');
    const c=await cacheOpen(),urls=urlsFor(core);let done=0,required=false;
    for(const url of urls){
      try{
        const r=await fetch(url,{cache:'no-cache',mode:'cors'});
        if(!r.ok)throw new Error(String(r.status));
        await c.put(url,r.clone());
        if(url===primary(core))required=true;
      }catch(e){if(url===primary(core))throw new Error(`Core download failed (${e?.message||'network error'}).`)}
      done++;onProgress?.(done,urls.length);
    }
    if(!required)throw new Error('Core package was not downloaded.');
    localStorage.setItem(`pixelplayer:offline-core:${core}`,String(Date.now()));
    return true;
  }
  async function remove(core=selected()){
    if(!core)return;const c=await cacheOpen();for(const url of urlsFor(core).filter(u=>u.includes('/cores/')))await c.delete(url);
    localStorage.removeItem(`pixelplayer:offline-core:${core}`);
  }
  function labelForCore(core){return (core||'core').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase())}
  function makeUi(){
    if(document.getElementById('pixelplayerOfflineCoreCard'))return;
    const info=document.querySelector('[data-panel="info"]')||document.getElementById('romLibraryPanel')?.parentElement;if(!info)return;
    const card=document.createElement('div');card.id='pixelplayerOfflineCoreCard';card.className='tab-card pp-offline-core-card';
    card.innerHTML='<div class="card-heading"><h2>Offline Emulator Core</h2><span id="ppOfflineCoreBadge">Checking…</span></div><p class="section-note" id="ppOfflineCoreText">Checking local offline files…</p><div class="pp-offline-core-actions"><button id="ppOfflineCoreDownload" class="primary" type="button">Download Core for Offline Use</button><button id="ppOfflineCoreRemove" class="secondary" type="button" hidden>Remove Offline Core</button></div><div class="pp-offline-progress" id="ppOfflineProgress" hidden><span></span></div>';
    info.appendChild(card);
    const style=document.createElement('style');style.textContent='.pp-offline-core-actions{display:flex;gap:8px;flex-wrap:wrap}.pp-offline-progress{height:7px;margin-top:10px;border:1px solid #2b382d;border-radius:999px;overflow:hidden;background:#090d0a}.pp-offline-progress span{display:block;height:100%;width:0;background:#8fdf4d;transition:width .12s ease}.pp-offline-core-card .card-heading span.ready{color:#9be66a}.pp-offline-core-card .card-heading span.missing{color:#e7b15b}';document.head.appendChild(style);
    const dl=card.querySelector('#ppOfflineCoreDownload'),rm=card.querySelector('#ppOfflineCoreRemove'),badge=card.querySelector('#ppOfflineCoreBadge'),text=card.querySelector('#ppOfflineCoreText'),progress=card.querySelector('#ppOfflineProgress'),fill=progress.querySelector('span');
    async function refresh(){
      const core=selected();if(!core){badge.textContent='Unavailable';badge.className='missing';text.textContent='This system does not have an offline core mapping yet.';dl.disabled=true;return}
      const ok=await ready(core);badge.textContent=ok?'Offline Ready':FIRST.has(system)?'Preparing':'Online Only';badge.className=ok?'ready':'missing';rm.hidden=!ok;dl.hidden=ok;dl.disabled=false;
      text.textContent=ok?`${labelForCore(core)} is stored on this device and can launch without internet.`:FIRST.has(system)?`${labelForCore(core)} is part of PixelPlayer's default offline pack. If setup did not finish automatically, tap below to complete it.`:`${labelForCore(core)} currently uses the EmulatorJS CDN. Download it once to make this system available offline.`;
      if(!ok)dl.textContent=FIRST.has(system)?'Finish Offline Setup':'Download Core for Offline Use';
    }
    dl.onclick=async()=>{const core=selected();dl.disabled=true;rm.disabled=true;progress.hidden=false;fill.style.width='0';badge.textContent='Downloading…';text.textContent=`Downloading ${labelForCore(core)} and required EmulatorJS runtime files…`;try{await download(core,(n,t)=>fill.style.width=`${Math.round(n/t*100)}%`);badge.textContent='Offline Ready';text.textContent='Download complete. This emulator can now launch while PixelPlayer is offline.'}catch(e){badge.textContent='Download Failed';text.textContent=e?.message||'Offline core download failed.'}finally{progress.hidden=true;dl.disabled=false;rm.disabled=false;refresh()}};
    rm.onclick=async()=>{rm.disabled=true;await remove(selected());rm.disabled=false;refresh()};
    refresh();navigator.serviceWorker?.ready?.then(()=>setTimeout(refresh,1200)).catch(()=>{});setTimeout(refresh,3500);
  }
  window.PixelPlayerOfflineCores={ready,download,remove,urlsFor,cacheName:CACHE,system,core:selected};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',makeUi,{once:true});else makeUi();
})();