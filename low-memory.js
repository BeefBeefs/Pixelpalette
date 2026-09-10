// Build 45: shared low-memory mode for all emulator pages.
(()=>{
  const KEY='pixelplayer:low-memory-mode';
  const stage=document.getElementById('emuStage');
  if(!stage||document.getElementById('lowMemoryMode'))return;
  let enabled=false;
  try{enabled=localStorage.getItem(KEY)==='1'}catch{}

  const bar=document.createElement('div');
  bar.className='low-memory-bar';
  bar.innerHTML=`<label class="low-memory-control" for="lowMemoryMode"><span class="low-memory-copy"><strong>Low Memory Mode</strong><small>While a game is running, hide nonessential PixelPlayer UI and pause decorative page effects to leave more headroom for the emulator.</small></span><span class="low-memory-check"><input id="lowMemoryMode" type="checkbox" ${enabled?'checked':''}><span aria-hidden="true"></span></span></label><div id="lowMemoryStatus" class="low-memory-status"></div>`;
  stage.insertAdjacentElement('afterend',bar);
  const checkbox=document.getElementById('lowMemoryMode');
  const status=document.getElementById('lowMemoryStatus');

  const style=document.createElement('style');
  style.textContent=`
    .low-memory-bar{margin:10px 0 18px;padding:11px 13px;border:1px solid var(--border2,#344039);border-radius:12px;background:rgba(12,17,14,.72)}
    .low-memory-control{display:flex;align-items:center;justify-content:space-between;gap:14px;cursor:pointer;user-select:none}
    .low-memory-copy{display:flex;flex-direction:column;gap:3px;min-width:0}.low-memory-copy strong{font-size:.84rem;color:var(--text,#f4f7f4)}.low-memory-copy small{font-size:.7rem;line-height:1.35;color:var(--muted,#98a59c)}
    .low-memory-check{position:relative;flex:0 0 42px;width:42px;height:24px}.low-memory-check input{position:absolute;opacity:0;pointer-events:none}.low-memory-check span{position:absolute;inset:0;border:1px solid var(--border2,#344039);border-radius:999px;background:#151c17;transition:.15s}.low-memory-check span:after{content:"";position:absolute;width:16px;height:16px;left:3px;top:3px;border-radius:50%;background:#8b978f;transition:.15s}.low-memory-check input:checked+span{background:rgba(155,227,58,.16);border-color:rgba(155,227,58,.55)}.low-memory-check input:checked+span:after{transform:translateX(18px);background:#b8f45f}
    .low-memory-status{margin-top:6px;font-size:.68rem;color:var(--muted,#98a59c)}
    body.low-memory-running .ambient,body.low-memory-running .tool-tabs,body.low-memory-running .emulator-hero,body.low-memory-running .emulator-workbench,body.low-memory-running footer{display:none!important}
    body.low-memory-running .emulator-shell{max-width:none!important;padding-top:8px!important}
    body.low-memory-running .emulator-stage{margin-top:0!important}
    body.low-memory-running .low-memory-bar{max-width:980px;margin-left:auto;margin-right:auto}
    body.low-memory-running *:not(.ejs_canvas):not(canvas){animation-play-state:paused!important;transition:none!important}
    @media(max-width:620px){.low-memory-control{align-items:flex-start}.low-memory-copy small{max-width:74vw}}
    body.rom-playing .low-memory-bar{display:none!important}`;
  document.head.appendChild(style);

  function isRunning(){return !!stage.classList.contains('ready')}
  function sync(reason='sync'){
    enabled=!!checkbox.checked;
    try{localStorage.setItem(KEY,enabled?'1':'0')}catch{}
    document.body.classList.toggle('low-memory-mode',enabled);
    document.body.classList.toggle('low-memory-running',enabled&&isRunning());
    if(status)status.textContent=enabled?(isRunning()?'Active — nonessential page UI/effects are suspended while this game runs.':'Enabled — it will engage automatically when a game starts.'):'Off — full PixelPlayer UI remains active.';
    window.dispatchEvent(new CustomEvent('pixelplayer:low-memory-changed',{detail:{enabled,running:enabled&&isRunning(),reason}}));
  }

  checkbox.addEventListener('change',()=>sync('toggle'));
  new MutationObserver(()=>sync('stage')).observe(stage,{attributes:true,attributeFilter:['class']});
  window.addEventListener('pixelplayer:rom-start',()=>setTimeout(()=>sync('rom-start'),0));
  window.PixelPlayerLowMemory={enabled:()=>enabled,isRunning:()=>enabled&&isRunning(),set:value=>{checkbox.checked=!!value;sync('api')}};
  sync('init');
})();