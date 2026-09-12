// Build 78: progress UI for on-demand Libretro box-art fetching.
(()=>{
  if(window.PixelPlayerBoxArtProgress78)return;window.PixelPlayerBoxArtProgress78=true;
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
  async function scan(){
    const id=++runId;running=true;await waitForCards();if(id!==runId)return;
    const ui=ensureUi();if(!ui){running=false;return}
    const cards=[...list.querySelectorAll('.rom-game-card')],total=cards.length;let checked=0,found=0,loaded=0,missing=0,next=0;
    update(ui,0,total,0,0,0,total?'Starting…':'No games');
    if(!total){running=false;return}
    const processCard=card=>new Promise(resolve=>{
      const img=card.querySelector('.rom-game-cover img');if(!img){checked++;missing++;update(ui,checked,total,found,loaded,missing);resolve();return}
      let done=false;const finish=ok=>{if(done)return;done=true;checked++;if(ok){found++;loaded++;}else missing++;update(ui,checked,total,found,loaded,missing);resolve()};
      img.loading='eager';
      if(img.complete){finish(img.naturalWidth>0);return}
      img.addEventListener('load',()=>finish(true),{once:true});img.addEventListener('error',()=>finish(false),{once:true});
    });
    const worker=async()=>{while(id===runId){const i=next++;if(i>=total)return;await processCard(cards[i])}};
    await Promise.all(Array.from({length:Math.min(6,total)},worker));if(id!==runId)return;
    update(ui,checked,total,found,loaded,missing,`Done · ${found.toLocaleString()} found`);running=false;
    const status=document.getElementById('boxArtStatus');if(status)status.textContent=`Box art scan complete: ${found.toLocaleString()} found, ${missing.toLocaleString()} missing.`;
  }
  document.addEventListener('click',e=>{if(!e.target.closest?.('#fetchBoxArtBtn'))return;setTimeout(()=>scan().catch(err=>{console.warn('Box art progress failed',err);running=false}),0)},true);
})();