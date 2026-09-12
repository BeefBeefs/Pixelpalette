// Build 59: visible PSP threading preflight diagnostics for devices without DevTools.
(()=>{
  if(!document.body?.classList.contains('psp-page'))return;
  const checks=()=>({
    secure:!!window.isSecureContext,
    isolated:window.crossOriginIsolated===true,
    sab:typeof SharedArrayBuffer!=='undefined',
    serviceWorker:!!navigator.serviceWorker,
    controlled:!!navigator.serviceWorker?.controller
  });
  function verdict(c){return c.secure&&c.isolated&&c.sab?'ready':'blocked'}
  function line(label,ok,detail=''){return `<div class="psp-preflight-line ${ok?'ok':'bad'}"><strong>${ok?'✓':'✕'} ${label}</strong>${detail?`<span>${detail}</span>`:''}</div>`}
  function render(){
    if(document.getElementById('pspPreflight'))return true;
    const stage=document.getElementById('emuStage'),hero=document.querySelector('.emulator-hero');
    if(!stage&&!hero)return false;
    const c=checks(),state=verdict(c);
    const box=document.createElement('section');box.id='pspPreflight';box.className=`psp-preflight ${state}`;
    box.innerHTML=`<div class="psp-preflight-head"><strong>PSP Browser Check</strong><span>${state==='ready'?'READY FOR THREADED PPSSPP':'THREADING REQUIREMENT FAILED'}</span></div>${line('Secure context',c.secure,location.protocol)}${line('Cross-origin isolated',c.isolated,String(window.crossOriginIsolated))}${line('SharedArrayBuffer',c.sab,c.sab?'available':'unavailable')}${line('Service worker available',c.serviceWorker,c.serviceWorker?'yes':'no')}${line('Service worker controlling page',c.controlled,c.controlled?'yes':'no')}<p>${state==='ready'?'The browser prerequisites for threaded PPSSPP are available. If a game still fails, the next likely issue is the game file/memory path.':'PPSSPP threading cannot start correctly yet. Reload this page once; if this box still shows a failure, send a screenshot of it.'}</p>`;
    (stage||hero).insertAdjacentElement('afterend',box);
    const style=document.createElement('style');style.textContent=`.psp-preflight{margin:12px 0;padding:12px 14px;border:1px solid var(--border2,#344039);border-radius:12px;background:rgba(12,17,14,.9);display:grid;gap:7px}.psp-preflight.ready{border-color:rgba(155,227,58,.45)}.psp-preflight.blocked{border-color:rgba(255,132,95,.55)}.psp-preflight-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:2px}.psp-preflight-head strong{font-size:.88rem}.psp-preflight-head span{font-size:.64rem;font-weight:900;letter-spacing:.05em}.psp-preflight.ready .psp-preflight-head span,.psp-preflight-line.ok strong{color:#9be33a}.psp-preflight.blocked .psp-preflight-head span,.psp-preflight-line.bad strong{color:#ff845f}.psp-preflight-line{display:flex;justify-content:space-between;gap:12px;font-size:.72rem}.psp-preflight-line span{color:var(--muted,#98a59c);text-align:right}.psp-preflight p{margin:3px 0 0;font-size:.7rem;line-height:1.4;color:var(--muted,#98a59c)}body.rom-playing .psp-preflight,body.low-memory-running .psp-preflight{display:none!important}`;document.head.appendChild(style);
    const emuStatus=document.getElementById('emuStatus');
    if(emuStatus&&!c.isolated)emuStatus.textContent='PSP threading preflight failed — see PSP Browser Check below.';
    window.PixelPlayerPspPreflight={checks:c,state};
    return true;
  }
  if(render())return;
  let tries=0;const timer=setInterval(()=>{tries++;if(render()||tries>=20)clearInterval(timer)},100);
})();