// Build 44: shared persistent core selector for all emulator pages.
(()=>{
  const page=document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba';
  const CONFIG={
    gba:{defaultCore:'mgba',options:[['mgba','mGBA']]},
    snes:{defaultCore:'snes9x',options:[['snes9x','Snes9x'],['bsnes','bsnes']]},
    ps1:{defaultCore:'pcsx_rearmed',options:[['pcsx_rearmed','PCSX-ReARMed'],['mednafen_psx_hw','Beetle PSX HW']]},
    n64:{defaultCore:'mupen64plus_next',options:[['mupen64plus_next','Mupen64Plus-Next'],['parallel_n64','Parallel-N64']]}
  };
  const cfg=CONFIG[page];
  if(!cfg)return;
  const storageKey=`pixelplayer:core:${page}`;
  const valid=new Set(cfg.options.map(x=>x[0]));
  function read(){
    try{
      let saved=localStorage.getItem(storageKey);
      // Build 43 accidentally stored Parallel-N64 with a hyphen; migrate it automatically.
      if(page==='n64'&&saved==='parallel-n64'){saved='parallel_n64';localStorage.setItem(storageKey,saved);}
      return valid.has(saved)?saved:cfg.defaultCore;
    }catch{return cfg.defaultCore}
  }
  function write(value){if(!valid.has(value))return;try{localStorage.setItem(storageKey,value)}catch{}}
  function label(value){return cfg.options.find(x=>x[0]===value)?.[1]||value}

  const host=document.querySelector('.rom-loader');
  let select=null;
  if(host){
    const row=document.createElement('div');row.className='core-picker-row';
    const copy=document.createElement('div');copy.className='core-picker-copy';copy.innerHTML='<strong>Emulator Core</strong><span>Saved for this system and used the next time a game starts.</span>';
    const box=document.createElement('label');box.className='core-picker';box.innerHTML='<span>Core</span>';
    select=document.createElement('select');select.id='emulatorCoreSelect';select.setAttribute('aria-label','Emulator core');
    cfg.options.forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=`${text}${value===cfg.defaultCore?' (Default)':''}`;select.appendChild(o)});
    select.value=read();box.appendChild(select);row.append(copy,box);
    const heading=host.querySelector('.card-heading');heading?.insertAdjacentElement('afterend',row);
    select.addEventListener('change',()=>{write(select.value);const status=document.getElementById('emuStatus');if(status)status.textContent=`${label(select.value)} selected. It will be used for the next game.`;});
  }

  const style=document.createElement('style');style.textContent=`
    .core-picker-row{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 14px;padding:11px 12px;border:1px solid var(--border2,#344039);border-radius:12px;background:rgba(12,17,14,.55)}
    .core-picker-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.core-picker-copy strong{font-size:.86rem}.core-picker-copy span{font-size:.72rem;color:var(--muted,#98a59c)}
    .core-picker{display:flex;align-items:center;gap:8px;flex:0 0 auto;font-size:.72rem;color:var(--muted,#98a59c)}.core-picker select{min-width:190px;max-width:260px;padding:9px 34px 9px 10px;border:1px solid var(--border2,#344039);border-radius:10px;background:#101612;color:var(--text,#f4f7f4);font:inherit;font-weight:800;outline:none}.core-picker select:focus{border-color:rgba(155,227,58,.7);box-shadow:0 0 0 2px rgba(155,227,58,.12)}
    @media(max-width:620px){.core-picker-row{align-items:stretch;flex-direction:column}.core-picker{justify-content:space-between}.core-picker select{min-width:0;width:min(68vw,260px)}}`;
  document.head.appendChild(style);

  function applySelectedCore(){
    const chosen=select?.value||read();write(chosen);window.EJS_core=chosen;
    const status=document.getElementById('emuStatus'),control=document.getElementById('controlStatus');
    if(status)status.textContent=`Loading ${label(chosen)} core…`;
    if(control)control.textContent=`Starting ${label(chosen)}…`;
    window.dispatchEvent(new CustomEvent('pixelplayer:core-applied',{detail:{system:page,core:chosen,label:label(chosen)}}));
  }

  // Every emulator page appends EmulatorJS' loader only after setting EJS_core.
  // Intercept that exact append so the remembered user choice wins immediately before the loader executes.
  const originalAppend=Element.prototype.appendChild;
  Element.prototype.appendChild=function(node){
    try{if(node?.tagName==='SCRIPT'&&String(node.src||'').includes('cdn.emulatorjs.org/stable/data/loader.js'))applySelectedCore()}catch{}
    return originalAppend.call(this,node);
  };

  window.PixelPlayerCore={get:()=>select?.value||read(),set:value=>{if(page==='n64'&&value==='parallel-n64')value='parallel_n64';if(valid.has(value)){write(value);if(select)select.value=value}},defaultCore:cfg.defaultCore,options:cfg.options.map(([value,text])=>({value,label:text}))};
})();