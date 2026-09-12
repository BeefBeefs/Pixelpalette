// Build 83: cancellable single-run box-art finder; no permanent/re-entrant DOM observers.
(()=>{
  if(window.PixelPlayerBoxArtProgress83)return;window.PixelPlayerBoxArtProgress83=true;
  const body=document.body,list=document.getElementById('romLibraryList');if(!list)return;
  const system=body.dataset.system||(body.classList.contains('n64-page')?'n64':body.classList.contains('ps1-page')?'ps1':body.classList.contains('snes-page')?'snes':'gba');
  const MAP_KEY=`pixelplayer:boxart-map:${system}`;
  try{localStorage.removeItem(`pixelplayer:boxart-enabled:${system}`)}catch{}

  const PLAYLISTS={
    '3do':['The 3DO Company - 3DO'],threeDO:['The 3DO Company - 3DO'],
    amiga:['Commodore - Amiga'],amstrad:['Amstrad - CPC'],
    arcade:['FBNeo - Arcade Games','MAME'],mame:['MAME','FBNeo - Arcade Games'],
    atari2600:['Atari - 2600'],atari5200:['Atari - 5200'],atari7800:['Atari - 7800'],jaguar:['Atari - Jaguar'],lynx:['Atari - Lynx'],
    cdi:['Philips - CD-i'],coleco:['Coleco - ColecoVision'],commodore:['Commodore - 64'],doom:['DOOM'],
    gba:['Nintendo - Game Boy Advance'],gamegear:['Sega - Game Gear'],gbc:['Nintendo - Game Boy Color','Nintendo - Game Boy'],
    genesis:['Sega - Mega Drive - Genesis'],mastersystem:['Sega - Master System - Mark III'],
    ngp:['SNK - Neo Geo Pocket','SNK - Neo Geo Pocket Color'],nes:['Nintendo - Nintendo Entertainment System','Nintendo - Family Computer Disk System'],
    n64:['Nintendo - Nintendo 64'],nds:['Nintendo - Nintendo DS'],ps1:['Sony - PlayStation'],psp:['Sony - PlayStation Portable'],
    sega32x:['Sega - 32X'],segacd:['Sega - Mega-CD - Sega CD'],saturn:['Sega - Saturn'],snes:['Nintendo - Super Nintendo Entertainment System'],
    turbografx:['NEC - PC Engine - TurboGrafx 16'],virtualboy:['Nintendo - Virtual Boy'],
    wonderswan:['Bandai - WonderSwan','Bandai - WonderSwan Color'],zx81:['Sinclair - ZX 81','Sinclair - ZX81'],zxspectrum:['Sinclair - ZX Spectrum']
  };

  const style=document.createElement('style');style.textContent=`
    .boxart-progress{display:none;width:100%;margin-top:10px;padding:10px 12px;border:1px solid #29352b;border-radius:12px;background:#0b100c}
    .boxart-progress.show{display:block}.boxart-progress-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:7px;font-size:.72rem;color:#9aa69b}.boxart-progress-head strong{color:#a7e66d}.boxart-progress-track{height:8px;overflow:hidden;border:1px solid #2a372c;border-radius:999px;background:#070b08}.boxart-progress-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#74c63e,#a8e965);transition:width .12s ease}.boxart-progress-stats{display:flex;gap:12px;flex-wrap:wrap;margin-top:7px;color:#748077;font-size:.66rem}.boxart-progress-stats b{color:#d7e2d8;font-weight:800}
    #fetchBoxArtBtn:disabled{opacity:.68;cursor:wait;pointer-events:none}#cancelBoxArtBtn{margin-left:6px}body.rom-playing .boxart-progress-fill,body.low-memory-running .boxart-progress-fill,body.ui-motion-off .boxart-progress-fill{transition:none}@media(prefers-reduced-motion:reduce){.boxart-progress-fill{transition:none}}
  `;document.head.appendChild(style);

  const getMap=()=>{try{return JSON.parse(localStorage.getItem(MAP_KEY)||'{}')}catch{return{}}};
  const saveMap=m=>{try{localStorage.setItem(MAP_KEY,JSON.stringify(m))}catch{}};
  let running=false,runId=0,cancelRequested=false,activeMap=null;
  const activeProbes=new Set();

  function ensureUi(){
    const controls=document.getElementById('romLibraryDisplayControls');if(!controls)return null;
    const btn=document.getElementById('fetchBoxArtBtn');if(btn&&!running&&!btn.disabled)btn.textContent='Find Box Art';
    let cancel=document.getElementById('cancelBoxArtBtn');
    if(btn&&!cancel){cancel=document.createElement('button');cancel.id='cancelBoxArtBtn';cancel.className='secondary';cancel.type='button';cancel.textContent='Cancel';cancel.hidden=true;btn.insertAdjacentElement('afterend',cancel)}
    const status=document.getElementById('boxArtStatus');if(status&&!running&&/enabled/i.test(status.textContent||''))status.textContent='Box art is fetched only when requested.';
    let ui=document.getElementById('boxArtProgress');if(ui)return ui;
    ui=document.createElement('div');ui.id='boxArtProgress';ui.className='boxart-progress';ui.innerHTML=`<div class="boxart-progress-head"><span>Box art search</span><strong id="boxArtProgressPct">0%</strong></div><div class="boxart-progress-track"><span id="boxArtProgressFill" class="boxart-progress-fill"></span></div><div class="boxart-progress-stats"><span>Checked <b id="boxArtChecked">0 / 0</b></span><span>Found <b id="boxArtFound">0</b></span><span>Loaded <b id="boxArtLoaded">0</b></span><span>Missing <b id="boxArtMissing">0</b></span></div>`;controls.appendChild(ui);return ui;
  }
  function update(ui,checked,total,found,loaded,missing,label){const pct=total?Math.round(checked/total*100):100;ui.classList.add('show');ui.querySelector('#boxArtProgressPct').textContent=label||`${pct}%`;ui.querySelector('#boxArtProgressFill').style.width=`${pct}%`;ui.querySelector('#boxArtChecked').textContent=`${checked.toLocaleString()} / ${total.toLocaleString()}`;ui.querySelector('#boxArtFound').textContent=found.toLocaleString();ui.querySelector('#boxArtLoaded').textContent=loaded.toLocaleString();ui.querySelector('#boxArtMissing').textContent=missing.toLocaleString()}

  const extRe=/\.(zip|7z|gba|nes|fds|unf|unif|sfc|smc|fig|gd3|gd7|dx2|bsx|swc|z64|n64|v64|chd|bin|cue|img|mdf|pbp|toc|cbn|m3u|ccd|iso|cso|nds|gb|gbc|gg|md|gen|smd|sms|32x|pce|vb|vboy|ws|wsc|ngp|ngc|a26|a52|a78|j64|jag|lnx|col|cv|d64|d71|d81|wad|iwad|pwad|tzx|tap|z80|rzx|scl|trd|p|t81|adf|adz|dms|fdi|ipf|hdf|lha)$/i;
  function sanitizeTitle(s){return (s||'').replace(extRe,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim()}
  function candidates(raw){
    const out=[],add=s=>{s=sanitizeTitle(s).replace(/\s+([,.:;!?])/g,'$1').trim();if(s&&!out.includes(s))out.push(s)};
    const base=sanitizeTitle(raw);add(base);
    const noSquare=base.replace(/\s*\[[^\]]*\]/g,' ').replace(/\s+/g,' ').trim();add(noSquare);
    const normalizedRegion=noSquare.replace(/\((U|US|USA)\)/ig,'(USA)').replace(/\((E|EU|EUR)\)/ig,'(Europe)').replace(/\((J|JP|JPN)\)/ig,'(Japan)');add(normalizedRegion);
    const noDump=normalizedRegion.replace(/\s*\((?:rev(?:ision)?\s*[^)]*|beta[^)]*|proto(?:type)?[^)]*|demo[^)]*|sample[^)]*|alt[^)]*|hack[^)]*|unl[^)]*|pirate[^)]*|bad[^)]*|trainer[^)]*|crack[^)]*)\)\s*/ig,' ').replace(/\s+/g,' ').trim();add(noDump);
    const titleOnly=noDump.replace(/(?:\s*\([^)]*\))+\s*$/g,'').replace(/\s+/g,' ').trim();add(titleOnly);
    if(/^the\s+/i.test(titleOnly))add(titleOnly.replace(/^the\s+(.+)$/i,'$1, The'));else if(/,\s*the$/i.test(titleOnly))add('The '+titleOnly.replace(/,\s*the$/i,''));
    for(const suffix of ['(USA)','(USA, Europe)','(World)','(Europe)','(Japan)'])add(`${titleOnly} ${suffix}`);
    return out.slice(0,10)
  }
  function safeName(title){return title.replace(/[&*\/:`<>?\\|\"]/g,'_')}
  function urlFor(playlist,title){return `https://thumbnails.libretro.com/${encodeURIComponent(playlist)}/Named_Boxarts/${encodeURIComponent(safeName(title))}.png`}
  function probe(url,id){return new Promise(resolve=>{
    if(id!==runId||cancelRequested){resolve(false);return}
    const img=new Image();let done=false;const rec={img,finish:null};
    const finish=ok=>{if(done)return;done=true;activeProbes.delete(rec);img.onload=img.onerror=null;resolve(ok&&id===runId&&!cancelRequested)};rec.finish=finish;activeProbes.add(rec);
    img.onload=()=>finish(true);img.onerror=()=>finish(false);img.decoding='async';img.src=url;if(img.complete)finish(img.naturalWidth>0)
  })}
  async function findUrl(title,id){const playlists=PLAYLISTS[system]||[];if(!playlists.length)return'';for(const playlist of playlists){if(id!==runId||cancelRequested)return'';for(const candidate of candidates(title)){if(id!==runId||cancelRequested)return'';const url=urlFor(playlist,candidate);if(await probe(url,id))return url}}return''}

  function setCover(card,url){
    const cover=card.querySelector('.rom-game-cover');if(!cover||!url||cover.dataset.boxartFailed==='1')return;
    let img=cover.querySelector('img');if(!img){img=document.createElement('img');img.alt='';img.decoding='async';cover.appendChild(img)}
    img.onload=()=>{cover.dataset.boxartFailed='';cover.classList.add('has-art')};
    img.onerror=()=>{cover.dataset.boxartFailed='1';cover.classList.remove('has-art');img.onerror=img.onload=null;img.remove()};
    img.src=url;
  }
  function applyCached(){const map=getMap();for(const card of list.querySelectorAll('.rom-game-card')){const title=card.querySelector('.rom-game-title')?.textContent?.trim();if(title&&map[title])setCover(card,map[title])}}

  function cancelSearch(){
    if(!running)return;cancelRequested=true;runId++;
    for(const rec of [...activeProbes]){try{rec.finish(false)}catch{}}activeProbes.clear();
    if(activeMap)saveMap(activeMap);
    const status=document.getElementById('boxArtStatus');if(status)status.textContent='Box art search cancelled. Already-found artwork was kept.';
    const ui=document.getElementById('boxArtProgress');if(ui)ui.querySelector('#boxArtProgressPct').textContent='Cancelled';
  }

  async function scan(){
    if(running)return;const btn=document.getElementById('fetchBoxArtBtn');if(!btn)return;
    running=true;cancelRequested=false;const id=++runId;btn.disabled=true;btn.textContent='Working…';const ui=ensureUi(),cancel=document.getElementById('cancelBoxArtBtn');if(cancel)cancel.hidden=false;
    const cards=[...list.querySelectorAll('.rom-game-card')],total=cards.length,map=getMap();activeMap=map;let checked=0,found=0,loaded=0,missing=0,next=0;
    update(ui,0,total,0,0,0,total?'Starting…':'No games');
    const status=document.getElementById('boxArtStatus');if(status)status.textContent=`Searching ${total.toLocaleString()} games in ${PLAYLISTS[system]?.join(' / ')||'the matching Libretro library'}…`;
    if(!total){btn.disabled=false;btn.textContent='Find Box Art';if(cancel)cancel.hidden=true;running=false;activeMap=null;return}
    const processCard=async card=>{
      if(id!==runId||cancelRequested)return;const title=card.querySelector('.rom-game-title')?.textContent?.trim()||'';
      let url=map[title]||'';if(url&&!await probe(url,id)){if(id!==runId||cancelRequested)return;delete map[title];url=''}
      if(!url)url=await findUrl(title,id);if(id!==runId||cancelRequested)return;
      checked++;if(url){found++;loaded++;map[title]=url;setCover(card,url)}else missing++;
      if(checked%10===0||checked===total)saveMap(map);update(ui,checked,total,found,loaded,missing)
    };
    const worker=async()=>{while(id===runId&&!cancelRequested){const i=next++;if(i>=total)return;await processCard(cards[i])}};
    try{
      await Promise.all(Array.from({length:Math.min(4,total)},worker));
      if(cancelRequested||id!==runId){saveMap(map);return}
      saveMap(map);update(ui,checked,total,found,loaded,missing,`Done · ${found.toLocaleString()} found`);if(status)status.textContent=`Box art search complete: ${found.toLocaleString()} found, ${missing.toLocaleString()} missing.`
    }
    finally{running=false;activeMap=null;btn.disabled=false;btn.textContent='Find Box Art';if(cancel)cancel.hidden=true}
  }

  document.addEventListener('click',e=>{
    const cancel=e.target.closest?.('#cancelBoxArtBtn');if(cancel){e.preventDefault();e.stopImmediatePropagation();cancelSearch();return}
    const btn=e.target.closest?.('#fetchBoxArtBtn');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();if(running)return;scan().catch(err=>{console.warn('Box art search failed',err);running=false;activeMap=null;btn.disabled=false;btn.textContent='Find Box Art';const c=document.getElementById('cancelBoxArtBtn');if(c)c.hidden=true})
  },true);

  // One-shot setup only. No permanent subtree observers: failed cached art must never be able to re-create itself recursively.
  function setupOnce(){if(ensureUi())applyCached()}
  if(document.getElementById('romLibraryDisplayControls'))setupOnce();
  else{
    const host=document.getElementById('romLibraryPanel')||document.body;
    const once=new MutationObserver(()=>{if(document.getElementById('romLibraryDisplayControls')){once.disconnect();setupOnce()}});
    once.observe(host,{childList:true,subtree:true});
  }
})();