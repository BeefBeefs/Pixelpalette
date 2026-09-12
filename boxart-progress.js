// Build 79: progress UI with tolerant Libretro box-art filename matching.
(()=>{
  if(window.PixelPlayerBoxArtProgress79)return;window.PixelPlayerBoxArtProgress79=true;
  const list=document.getElementById('romLibraryList');if(!list)return;
  const style=document.createElement('style');style.textContent=`
    .boxart-progress{display:none;width:100%;margin-top:10px;padding:10px 12px;border:1px solid #29352b;border-radius:12px;background:#0b100c}
    .boxart-progress.show{display:block}.boxart-progress-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:7px;font-size:.72rem;color:#9aa69b}.boxart-progress-head strong{color:#a7e66d}.boxart-progress-track{height:8px;overflow:hidden;border:1px solid #2a372c;border-radius:999px;background:#070b08}.boxart-progress-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#74c63e,#a8e965);transition:width .12s ease}.boxart-progress-stats{display:flex;gap:12px;flex-wrap:wrap;margin-top:7px;color:#748077;font-size:.66rem}.boxart-progress-stats b{color:#d7e2d8;font-weight:800}
    body.rom-playing .boxart-progress-fill,body.low-memory-running .boxart-progress-fill,body.ui-motion-off .boxart-progress-fill{transition:none}
    @media(prefers-reduced-motion:reduce){.boxart-progress-fill{transition:none}}
  `;document.head.appendChild(style);
  let running=false,runId=0;
  function ensureUi(){
    const controls=document.getElementById('romLibraryDisplayControls');if(!controls)return null;
    let ui=document.getElementById('boxArtProgress');if(ui)return ui;
    ui=document.createElement('div');ui.id='boxArtProgress';ui.className='boxart-progress';ui.innerHTML=`<div class="boxart-progress-head"><span>Box art fetch</span><strong id="boxArtProgressPct">0%</strong></div><div class="boxart-progress-track"><span id="boxArtProgressFill" class="boxart-progress-fill"></span></div><div class="boxart-progress-stats"><span>Checked <b id="boxArtChecked">0 / 0</b></span><span>Found <b id="boxArtFound">0</b></span><span>Loaded <b id="boxArtLoaded">0</b></span><span>Missing <b id="boxArtMissing">0</b></span></div>`;controls.appendChild(ui);return ui;
  }
  function update(ui,checked,total,found,loaded,missing,label){const pct=total?Math.round(checked/total*100):100;ui.classList.add('show');ui.querySelector('#boxArtProgressPct').textContent=label||`${pct}%`;ui.querySelector('#boxArtProgressFill').style.width=`${pct}%`;ui.querySelector('#boxArtChecked').textContent=`${checked.toLocaleString()} / ${total.toLocaleString()}`;ui.querySelector('#boxArtFound').textContent=found.toLocaleString();ui.querySelector('#boxArtLoaded').textContent=loaded.toLocaleString();ui.querySelector('#boxArtMissing').textContent=missing.toLocaleString()}
  const waitForCards=()=>new Promise(resolve=>{
    const existing=list.querySelectorAll('.rom-game-card').length;if(existing){requestAnimationFrame(()=>resolve());return}
    const obs=new MutationObserver(()=>{if(list.querySelector('.rom-game-card')){obs.disconnect();requestAnimationFrame(()=>resolve())}});obs.observe(list,{childList:true});setTimeout(()=>{obs.disconnect();resolve()},1200)
  });
  function decodedParts(src){try{const u=new URL(src);const parts=u.pathname.split('/');const named=parts.lastIndexOf('Named_Boxarts');if(named<1)return null;return{origin:u.origin,playlist:decodeURIComponent(parts[named-1]),title:decodeURIComponent((parts[named+1]||'').replace(/\.png$/i,''))}}catch{return null}}
  function sanitizeTitle(s){return (s||'').replace(/\.(zip|7z|gba|nes|fds|unf|unif|sfc|smc|fig|gd3|gd7|dx2|bsx|swc|z64|n64|v64|chd|bin|cue|img|mdf|pbp|toc|cbn|m3u|ccd|iso|cso|nds|gb|gbc|gg|md|gen|smd|sms|32x|pce|vb|vboy|ws|wsc|ngp|ngc|a26|a52|a78|j64|jag|lnx|col|cv|d64|d71|d81|wad|iwad|pwad|tzx|tap|z80|rzx|scl|trd|p|t81|adf|adz|dms|fdi|ipf|hdf|lha)$/i,'').replace(/[_]+/g,' ').replace(/\s+/g,' ').trim()}
  function candidates(title){
    const out=[],add=s=>{s=sanitizeTitle(s).replace(/\s+([,.:;!?])/g,'$1').trim();if(s&&!out.includes(s))out.push(s)};
    const base=sanitizeTitle(title);add(base);
    const noBrackets=base.replace(/\s*\[[^\]]*\]/g,'').replace(/\s+/g,' ').trim();add(noBrackets);
    const noDump=noBrackets
      .replace(/\s*\((?:rev(?:ision)?\s*[^)]*|beta[^)]*|proto(?:type)?[^)]*|demo[^)]*|sample[^)]*|alt[^)]*|hack[^)]*|unl[^)]*|pirate[^)]*|bad[^)]*)\)\s*/ig,' ')
      .replace(/\s+/g,' ').trim();add(noDump);
    const titleOnly=noDump.replace(/(?:\s*\([^)]*\))+\s*$/g,'').replace(/\s+/g,' ').trim();add(titleOnly);
    if(/^the\s+/i.test(titleOnly)){add(titleOnly.replace(/^the\s+(.+)$/i,'$1, The'))}
    else if(/,\s*the$/i.test(titleOnly)){add('The '+titleOnly.replace(/,\s*the$/i,''))}
    for(const region of ['USA','World','Europe'])add(`${titleOnly} (${region})`);
    return out.slice(0,8)
  }
  function urlFor(parts,title){const safe=title.replace(/[&*\/:`<>?\\|\"]/g,'_');return `${parts.origin}/${encodeURIComponent(parts.playlist)}/Named_Boxarts/${encodeURIComponent(safe)}.png`}
  function tryImage(img,urls){return new Promise(resolve=>{
    let i=0,done=false;
    const finish=ok=>{if(done)return;done=true;img.onload=null;img.onerror=null;resolve(ok)};
    const next=()=>{if(i>=urls.length){finish(false);return}const src=urls[i++];img.onload=()=>finish(true);img.onerror=()=>next();img.loading='eager';img.src=src;if(img.complete&&img.naturalWidth>0)finish(true)};
    next();
  })}
  async function scan(){
    const id=++runId;running=true;await waitForCards();if(id!==runId)return;
    const ui=ensureUi();if(!ui){running=false;return}
    const cards=[...list.querySelectorAll('.rom-game-card')],total=cards.length;let checked=0,found=0,loaded=0,missing=0,next=0;
    update(ui,0,total,0,0,0,total?'Starting…':'No games');
    if(!total){running=false;return}
    const processCard=async card=>{
      let img=card.querySelector('.rom-game-cover img');if(!img){checked++;missing++;update(ui,checked,total,found,loaded,missing);return}
      const parts=decodedParts(img.src);if(!parts){checked++;missing++;update(ui,checked,total,found,loaded,missing);return}
      const title=card.querySelector('.rom-game-title')?.textContent?.trim()||parts.title;
      const urls=candidates(title).map(t=>urlFor(parts,t));
      // Preserve the exact URL first when it differs from the normalized title chain.
      if(img.src&&!urls.includes(img.src))urls.unshift(img.src);
      const ok=await tryImage(img,urls.slice(0,8));checked++;
      if(ok){found++;loaded++;card.querySelector('.rom-game-cover')?.classList.add('has-art')}else{missing++;img.remove()}
      update(ui,checked,total,found,loaded,missing)
    };
    const worker=async()=>{while(id===runId){const i=next++;if(i>=total)return;await processCard(cards[i])}};
    await Promise.all(Array.from({length:Math.min(6,total)},worker));if(id!==runId)return;
    update(ui,checked,total,found,loaded,missing,`Done · ${found.toLocaleString()} found`);running=false;
    const status=document.getElementById('boxArtStatus');if(status)status.textContent=`Box art scan complete: ${found.toLocaleString()} found, ${missing.toLocaleString()} missing. Tolerant filename matching was used.`;
  }
  document.addEventListener('click',e=>{if(!e.target.closest?.('#fetchBoxArtBtn'))return;setTimeout(()=>scan().catch(err=>{console.warn('Box art progress failed',err);running=false}),0)},true);
})();