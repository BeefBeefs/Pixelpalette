// Build 69: shared ROM folder scan progress UI.
(()=>{
  if(window.PixelPlayerFolderProgress)return;
  const style=document.createElement('style');
  style.textContent=`.rom-library-progress{display:grid;gap:7px;padding:10px 12px;border:1px solid var(--border2,#344039);border-radius:11px;background:rgba(10,15,11,.72)}.rom-library-progress[hidden]{display:none}.rom-library-progress-row{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--muted,#98a59c);font-size:.72rem}.rom-library-progress-row strong{color:var(--text,#f4f7f4);font-size:.72rem}.rom-library-progress-track{height:9px;overflow:hidden;border-radius:999px;background:#090d0a;border:1px solid var(--border,#29332c)}.rom-library-progress-track i{display:block;height:100%;width:0;background:linear-gradient(90deg,#79c93a,#a7ee63);border-radius:inherit;transition:width .12s linear}.rom-library-progress.complete .rom-library-progress-track i{background:linear-gradient(90deg,#79c93a,#b7f57e)}.rom-library-progress.error .rom-library-progress-track i{background:linear-gradient(90deg,#b96b32,#e6924d)}@media(prefers-reduced-motion:reduce){.rom-library-progress-track i{transition:none}}`;
  document.head.appendChild(style);
  function ensure(){
    const panel=document.getElementById('romLibraryPanel')||document.querySelector('.rom-library-panel');
    if(!panel)return null;
    let wrap=document.getElementById('romLibraryProgress');
    if(wrap)return wrap;
    wrap=document.createElement('div');
    wrap.id='romLibraryProgress';
    wrap.className='rom-library-progress';
    wrap.hidden=true;
    wrap.innerHTML='<div class="rom-library-progress-row"><span id="romLibraryProgressLabel">Preparing folder scan…</span><strong id="romLibraryProgressPercent">0%</strong></div><div class="rom-library-progress-track" role="progressbar" aria-label="ROM folder scan progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="romLibraryProgressFill"></i></div>';
    const summary=panel.querySelector('.rom-library-summary');
    (summary||panel.querySelector('.rom-library-toolbar')||panel.firstElementChild)?.insertAdjacentElement('afterend',wrap);
    return wrap;
  }
  function set(done,total,text){
    const wrap=ensure();if(!wrap)return;
    const safeTotal=Math.max(0,total||0),safeDone=Math.min(Math.max(0,done||0),safeTotal||done||0);
    const pct=safeTotal?Math.round((safeDone/safeTotal)*100):0;
    wrap.hidden=false;
    const label=document.getElementById('romLibraryProgressLabel'),percent=document.getElementById('romLibraryProgressPercent'),fill=document.getElementById('romLibraryProgressFill'),track=wrap.querySelector('[role="progressbar"]');
    if(label)label.textContent=text||`${safeDone.toLocaleString()} / ${safeTotal.toLocaleString()} indexed`;
    if(percent)percent.textContent=`${pct}%`;
    if(fill)fill.style.width=`${pct}%`;
    track?.setAttribute('aria-valuenow',String(pct));
  }
  function start(total,label='Indexing compatible games locally…'){const wrap=ensure();wrap?.classList.remove('complete','error');set(0,total,`${label} 0 / ${Number(total||0).toLocaleString()}`)}
  function update(done,total,label='Indexing'){set(done,total,`${label} ${Number(done||0).toLocaleString()} / ${Number(total||0).toLocaleString()}`)}
  function done(total,label='Folder scan complete'){set(total,total,`${label} · ${Number(total||0).toLocaleString()} indexed`);ensure()?.classList.add('complete')}
  function error(done,total,label='Folder scan stopped'){set(done,total,`${label} · ${Number(done||0).toLocaleString()} / ${Number(total||0).toLocaleString()}`);ensure()?.classList.add('error')}
  window.PixelPlayerFolderProgress={ensure,start,update,done,error};
  ensure();
})();