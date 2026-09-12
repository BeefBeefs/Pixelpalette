(()=>{
  const search=document.getElementById('systemSearch');
  const cards=[...document.querySelectorAll('.system-card[data-system-card]')];
  const empty=document.getElementById('emptySearch');
  const count=document.getElementById('visibleSystemCount');
  const recentWrap=document.getElementById('continueSection');
  const recentList=document.getElementById('continueList');
  const recentMeta=document.getElementById('continueMeta');

  const systems={
    threeDO:{label:'3DO',href:'3do.html',icon:'💿'},amiga:{label:'Amiga',href:'amiga.html',icon:'🖥️'},amstrad:{label:'Amstrad CPC',href:'amstrad.html',icon:'⌨️'},arcade:{label:'Arcade / FBNeo',href:'arcade.html',icon:'🕹️'},
    atari2600:{label:'Atari 2600',href:'atari.html',icon:'🔴'},atari5200:{label:'Atari 5200',href:'atari5200.html',icon:'🔴'},atari7800:{label:'Atari 7800',href:'atari7800.html',icon:'🔴'},jaguar:{label:'Atari Jaguar',href:'jaguar.html',icon:'🐆'},lynx:{label:'Atari Lynx',href:'lynx.html',icon:'🐾'},
    cdi:{label:'Philips CD-i',href:'cdi.html',icon:'💽'},coleco:{label:'ColecoVision',href:'coleco.html',icon:'🎮'},commodore:{label:'Commodore / VICE',href:'commodore.html',icon:'⌨️'},doom:{label:'Doom / PrBoom',href:'doom.html',icon:'🔥'},
    gamegear:{label:'Game Gear',href:'gamegear.html',icon:'🔵'},gbc:{label:'Game Boy / Color',href:'gbc.html',icon:'🟢'},genesis:{label:'Genesis / Mega Drive',href:'genesis.html',icon:'🔷'},mame:{label:'MAME 2003',href:'mame.html',icon:'👾'},mastersystem:{label:'Master System',href:'mastersystem.html',icon:'🔹'},
    ngp:{label:'Neo Geo Pocket',href:'ngp.html',icon:'⚫'},nes:{label:'NES / Famicom',href:'nes.html',icon:'🟥'},nds:{label:'Nintendo DS',href:'nds.html',icon:'◫'},psp:{label:'PSP',href:'psp.html',icon:'🎧'},sega32x:{label:'Sega 32X',href:'sega32x.html',icon:'✖️'},segacd:{label:'Sega CD',href:'segacd.html',icon:'💿'},saturn:{label:'Sega Saturn',href:'saturn.html',icon:'🪐'},
    turbografx:{label:'TurboGrafx / PC Engine',href:'turbografx.html',icon:'⚪'},virtualboy:{label:'Virtual Boy',href:'virtualboy.html',icon:'🥽'},wonderswan:{label:'WonderSwan / Color',href:'wonderswan.html',icon:'⬜'},zx81:{label:'ZX81',href:'zx81.html',icon:'⌨️'},zxspectrum:{label:'ZX Spectrum',href:'zxspectrum.html',icon:'🌈'},
    gba:{label:'Game Boy Advance',href:'emulator.html',icon:'🟣'},snes:{label:'SNES',href:'snes.html',icon:'🟪'},ps1:{label:'PlayStation',href:'ps1.html',icon:'◼️'},n64:{label:'Nintendo 64',href:'n64.html',icon:'🟩'}
  };

  function apply(){
    const q=(search?.value||'').trim().toLowerCase();let visible=0;
    for(const card of cards){const ok=!q||(card.dataset.search||card.textContent).toLowerCase().includes(q);card.hidden=!ok;if(ok)visible++}
    if(count)count.textContent=`${visible} shown`;if(empty)empty.style.display=visible?'none':'block';
  }
  search?.addEventListener('input',apply);apply();

  const fmtSize=n=>!n?'':n>=1048576?`${(n/1048576).toFixed(1)} MB`:`${Math.max(1,Math.round(n/1024))} KB`;
  const fmtWhen=t=>{if(!t)return'Recently played';const d=Date.now()-t,m=Math.floor(d/60000);if(m<1)return'Just now';if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;const days=Math.floor(h/24);return days<7?`${days}d ago`:new Date(t).toLocaleDateString()};
  const cleanName=n=>(n||'Game').replace(/\.(gba|sfc|smc|fig|gd3|gd7|dx2|bsx|swc|chd|bin|cue|img|mdf|pbp|toc|cbn|m3u|ccd|z64|n64|v64|zip|7z|iso|cso|nds|nes|gb|gbc|gg|md|gen|smd|sms|32x|pce|vb|vboy|ws|wsc|ngp|ngc|a26|a52|a78|j64|jag|lnx|col|cv|d64|d71|d81|wad|iwad|pwad|tzx|tap|z80|rzx|scl|trd|p|t81|adf|adz|dms|fdi|ipf|hdf|lha)$/i,'');

  function openDb(name,version){return new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onupgradeneeded=()=>{try{r.transaction.abort()}catch{}}})}
  async function getAll(dbName,store,version){try{const db=await openDb(dbName,version),rows=await new Promise((res,rej)=>{if(!db.objectStoreNames.contains(store)){res([]);return}const r=db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)});db.close();return rows}catch{return[]}}
  function localRows(key,system,timeKey='playedAt'){try{return JSON.parse(localStorage.getItem(key)||'[]').map(r=>({system,name:r.name,size:r.size||0,lastPlayed:r[timeKey]||r.playedAt||0}))}catch{return[]}}

  async function loadRecents(){
    const merged=[];
    const expanded=await getAll('PixelPlayerExpanded','games',1);
    for(const r of expanded)if(r?.source==='recent'&&r.system)merged.push({system:r.system,name:r.name,size:r.size||0,lastPlayed:r.lastPlayed||0});

    const gba=await getAll('PixelPlayerROMs','roms',2);
    for(const r of gba)merged.push({system:'gba',name:r.name,size:r.size||0,lastPlayed:r.lastPlayed||0});

    merged.push(...localRows('pixelplayer:snes:recent','snes'));
    merged.push(...localRows('pixelplayer:ps1:recent','ps1'));
    merged.push(...localRows('pixelplayer:n64:recent','n64'));

    const dedup=new Map();
    for(const r of merged){if(!r?.name||!systems[r.system])continue;const k=`${r.system}::${r.name}`;const old=dedup.get(k);if(!old||(r.lastPlayed||0)>(old.lastPlayed||0))dedup.set(k,r)}
    return [...dedup.values()].sort((a,b)=>(b.lastPlayed||0)-(a.lastPlayed||0)).slice(0,10);
  }

  function renderRecents(rows){
    if(!recentWrap||!recentList)return;
    if(!rows.length){recentWrap.classList.add('continue-empty');recentList.innerHTML='<div class="continue-placeholder"><span>▶</span><div><strong>Your recently played games will appear here.</strong><small>Start a game from any emulator and PixelPlayer will surface it on this dashboard.</small></div></div>';if(recentMeta)recentMeta.textContent='Nothing played yet';return}
    recentWrap.classList.remove('continue-empty');recentList.innerHTML='';if(recentMeta)recentMeta.textContent=`${rows.length} recent ${rows.length===1?'game':'games'}`;
    for(const row of rows){
      const s=systems[row.system];const a=document.createElement('a');a.className='continue-card';a.href=`${s.href}?build=64`;a.setAttribute('aria-label',`Open ${cleanName(row.name)} in ${s.label}`);
      a.innerHTML=`<div class="continue-art"><span>${s.icon}</span><i>▶</i></div><div class="continue-copy"><span class="continue-system">${s.label}</span><strong></strong><small>${fmtWhen(row.lastPlayed)}${row.size?` · ${fmtSize(row.size)}`:''}</small></div><span class="continue-open">OPEN →</span>`;
      a.querySelector('strong').textContent=cleanName(row.name);recentList.appendChild(a);
    }
  }

  loadRecents().then(renderRecents).catch(()=>renderRecents([]));
})();