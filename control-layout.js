// Build 49: opt-in per-system virtual control positioning. Defaults remain untouched until the user moves a control.
(()=>{
  const system=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  const KEY=`pixelplayer:control-layout:${system}`;
  let editing=false,drag=null,saveTimer=0;
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return {}}}
  let offsets=load();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(offsets))}catch{}}
  function norm(s){return (s||'').trim().toUpperCase().replace(/\s+/g,' ').replace(/[^A-Z0-9△○×□+\- ]/g,'')}
  function controls(){
    const pads=[...document.querySelectorAll('.ejs_virtualGamepad_parent')],out=[];
    for(const pad of pads){
      const buttons=[...pad.querySelectorAll('.ejs_virtualGamepad_button')];
      buttons.forEach((el,i)=>out.push(el));
      // Add large analog / d-pad assemblies only when they are not themselves made from individual virtual buttons.
      for(const el of pad.querySelectorAll('[class*="joystick"],[class*="Joystick"],[class*="dpad"],[class*="DPad"]')){
        if(el.classList.contains('ejs_virtualGamepad_button')||el.querySelector('.ejs_virtualGamepad_button')||el.closest('.ejs_virtualGamepad_button'))continue;
        if(!out.includes(el))out.push(el);
      }
    }
    return out;
  }
  function identity(el,index){
    if(el.dataset.ppControlId)return el.dataset.ppControlId;
    const text=norm(el.textContent);
    const cls=[...el.classList].filter(x=>/button|dpad|joystick|stick/i.test(x)).sort().join('.');
    const same=[...document.querySelectorAll('.ejs_virtualGamepad_parent .ejs_virtualGamepad_button')];
    let key=text?`button:${text}`:`control:${cls||'unnamed'}`;
    const peers=controls().filter(x=>x!==el&&(text?norm(x.textContent)===text:[...x.classList].filter(c=>/button|dpad|joystick|stick/i.test(c)).sort().join('.')===cls));
    if(peers.length)key+=`:${index}`;
    el.dataset.ppControlId=key;
    return key;
  }
  function apply(){
    const list=controls();
    list.forEach((el,i)=>{
      const id=identity(el,i),p=offsets[id];
      if(p&&(p.x||p.y)){
        el.style.setProperty('margin-left',`${p.x||0}px`,'important');
        el.style.setProperty('margin-top',`${p.y||0}px`,'important');
        el.classList.add('pp-control-moved');
      }else{
        el.style.removeProperty('margin-left');el.style.removeProperty('margin-top');el.classList.remove('pp-control-moved');
      }
      el.classList.toggle('pp-control-movable',editing);
    });
  }
  function setEditing(v){
    editing=!!v;document.body.classList.toggle('pp-control-editing',editing);
    const tab=document.getElementById('moveControlsBtn'),overlay=document.getElementById('playMoveControlsBtn');
    if(tab){tab.classList.toggle('active-toggle',editing);tab.textContent=editing?'✓ Done Moving':'✥ Move Controls'}
    if(overlay){overlay.classList.toggle('active-toggle',editing);overlay.textContent=editing?'✓ Done':'✥ Move'}
    const hint=document.getElementById('controlLayoutHint');if(hint)hint.textContent=editing?'Drag any highlighted virtual control. Changes save automatically for this system.':'Default positions are used unless you move a control.';
    apply();
  }
  function resetAll(){offsets={};save();apply();const hint=document.getElementById('controlLayoutHint');if(hint)hint.textContent='Custom positions cleared. EmulatorJS default positions restored.'}
  function addUI(){
    if(!document.getElementById('moveControlsBtn')){
      const host=document.querySelector('[data-panel="controller"] .controller-panel')||document.querySelector('[data-panel="controller"] .tab-card');
      if(host){
        const row=document.createElement('div');row.className='control-layout-setting';row.innerHTML='<div><strong>Virtual Control Layout</strong><span id="controlLayoutHint">Default positions are used unless you move a control.</span></div><div class="control-layout-actions"><button id="moveControlsBtn" class="secondary" type="button">✥ Move Controls</button><button id="resetControlLayoutBtn" class="secondary" type="button">Reset Positions</button></div>';
        host.appendChild(row);row.querySelector('#moveControlsBtn').addEventListener('click',()=>setEditing(!editing));row.querySelector('#resetControlLayoutBtn').addEventListener('click',resetAll);
      }
    }
    const overlay=document.querySelector('.play-overlay-controls');
    if(overlay&&!document.getElementById('playMoveControlsBtn')){const b=document.createElement('button');b.id='playMoveControlsBtn';b.className='play-control';b.type='button';b.textContent='✥ Move';b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();setEditing(!editing)});overlay.prepend(b)}
  }
  function point(e){return e.touches?.[0]||e.changedTouches?.[0]||e}
  function start(e){
    if(!editing)return;const el=e.target.closest?.('.pp-control-movable');if(!el)return;
    e.preventDefault();e.stopPropagation();const p=point(e),list=controls(),id=identity(el,list.indexOf(el)),base=offsets[id]||{x:0,y:0};
    drag={el,id,x0:p.clientX,y0:p.clientY,bx:base.x||0,by:base.y||0};el.classList.add('pp-control-dragging');
    try{el.setPointerCapture?.(e.pointerId)}catch{}
  }
  function move(e){if(!drag)return;e.preventDefault();e.stopPropagation();const p=point(e),x=Math.round(drag.bx+p.clientX-drag.x0),y=Math.round(drag.by+p.clientY-drag.y0);offsets[drag.id]={x,y};drag.el.style.setProperty('margin-left',`${x}px`,'important');drag.el.style.setProperty('margin-top',`${y}px`,'important');drag.el.classList.add('pp-control-moved');clearTimeout(saveTimer);saveTimer=setTimeout(save,120)}
  function end(e){if(!drag)return;e?.preventDefault?.();e?.stopPropagation?.();drag.el.classList.remove('pp-control-dragging');drag=null;save()}
  const style=document.createElement('style');style.textContent=`
    .control-layout-setting{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:12px;padding:11px 12px;border:1px solid var(--border2,#344039);border-radius:12px;background:rgba(12,17,14,.55)}
    .control-layout-setting>div:first-child{display:flex;flex-direction:column;gap:3px}.control-layout-setting strong{font-size:.84rem}.control-layout-setting span{font-size:.7rem;color:var(--muted,#98a59c)}.control-layout-actions{display:flex;gap:8px;flex-wrap:wrap}.control-layout-actions button{white-space:nowrap}
    body.pp-control-editing .ejs_virtualGamepad_parent{pointer-events:auto!important}
    body.pp-control-editing .pp-control-movable{outline:2px dashed rgba(155,227,58,.95)!important;outline-offset:3px!important;cursor:move!important;touch-action:none!important;user-select:none!important;z-index:1400!important}
    body.pp-control-editing .pp-control-moved{outline-color:#f5a742!important}.pp-control-dragging{filter:brightness(1.25)!important;opacity:.9!important}
    #playMoveControlsBtn.active-toggle,#moveControlsBtn.active-toggle{border-color:#9be33a!important;box-shadow:0 0 0 2px rgba(155,227,58,.18)!important}
    @media(max-width:620px){.control-layout-setting{align-items:stretch;flex-direction:column}.control-layout-actions{display:grid;grid-template-columns:1fr 1fr}.control-layout-actions button{width:100%}}
  `;document.head.appendChild(style);
  document.addEventListener('pointerdown',start,true);document.addEventListener('pointermove',move,true);document.addEventListener('pointerup',end,true);document.addEventListener('pointercancel',end,true);
  const observer=new MutationObserver(()=>requestAnimationFrame(()=>{addUI();apply()}));observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',()=>requestAnimationFrame(apply),{passive:true});document.addEventListener('fullscreenchange',()=>setTimeout(apply,60));window.addEventListener('orientationchange',()=>setTimeout(apply,120));
  window.PixelPlayerControlLayout={editing:()=>editing,setEditing,reset:resetAll,refresh:apply,get:()=>({...offsets})};
  addUI();apply();
})();