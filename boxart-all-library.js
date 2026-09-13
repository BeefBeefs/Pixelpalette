// Build 114: make Find Box Art cover every indexed ROM, not only the currently rendered batch.
(()=>{
  if(window.__pixelPlayerBoxArtAll114)return;window.__pixelPlayerBoxArtAll114=true;
  let preparing=false,passThrough=false;

  function allLoaded(list){
    const sentinel=list?.querySelector('.pp-library-sentinel');
    if(!sentinel)return true;
    if(sentinel.hidden)return true;
    const text=sentinel.textContent||'';
    return /^\s*All\s+/i.test(text);
  }

  async function loadEveryCard(){
    const list=document.getElementById('romLibraryList');
    if(!list)return;
    let lastCount=-1,stalled=0;
    for(let i=0;i<250&&!allLoaded(list);i++){
      const count=list.querySelectorAll('.rom-game-card').length;
      list.scrollTop=list.scrollHeight;
      await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,12)));
      const next=list.querySelectorAll('.rom-game-card').length;
      if(next===count&&count===lastCount)stalled++;else stalled=0;
      lastCount=next;
      if(stalled>=8)break;
    }
  }

  document.addEventListener('click',async e=>{
    const btn=e.target.closest?.('#fetchBoxArtBtn');
    if(!btn||passThrough||preparing)return;
    const list=document.getElementById('romLibraryList');
    if(!list||allLoaded(list))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    preparing=true;
    const original=btn.textContent;
    btn.disabled=true;
    btn.textContent='Loading full library…';
    const status=document.getElementById('boxArtStatus');
    if(status)status.textContent='Preparing all indexed ROMs for box-art matching…';
    try{
      await loadEveryCard();
    }finally{
      preparing=false;
      btn.disabled=false;
      btn.textContent=original||'Find Box Art';
    }
    passThrough=true;
    try{btn.click()}finally{queueMicrotask(()=>{passThrough=false})}
  },true);
})();
