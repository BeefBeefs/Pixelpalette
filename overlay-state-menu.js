// Build 52: compact Save/Load dropdowns that reuse the existing visible manual Slots 1-3.
(()=>{
  const overlay=document.querySelector('.play-overlay-controls');
  if(!overlay||document.getElementById('playSaveMenuBtn'))return;

  function slotButton(slot,action){
    const card=document.querySelector(`.state-slot[data-slot="${slot}"]`);
    return card?.querySelector(action==='save'?'.save-state-btn':'.load-state-btn')||null;
  }
  function available(slot,action){const b=slotButton(slot,action);return !!b&&!b.disabled}
  function closeMenus(except=null){for(const m of document.querySelectorAll('.pp-state-dropdown.open'))if(m!==except){m.classList.remove('open');m.previousElementSibling?.setAttribute?.('aria-expanded','false')}}
  function run(slot,action,menu){
    const b=slotButton(slot,action);
    if(!b||b.disabled)return;
    b.click();menu.classList.remove('open');menu.previousElementSibling?.setAttribute?.('aria-expanded','false');
  }
  function makeMenu(action,label){
    const wrap=document.createElement('div');wrap.className='pp-state-menu-wrap';
    const button=document.createElement('button');button.id=action==='save'?'playSaveMenuBtn':'playLoadMenuBtn';button.className='play-control';button.type='button';button.textContent=`${label}…`;button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');
    const menu=document.createElement('div');menu.className='pp-state-dropdown';menu.setAttribute('role','menu');
    [1,2,3].forEach(slot=>{const item=document.createElement('button');item.type='button';item.className='pp-state-slot-choice';item.textContent=`Slot ${slot}`;item.dataset.slot=slot;item.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();run(slot,action,menu)});menu.appendChild(item)});
    button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const opening=!menu.classList.contains('open');closeMenus(menu);menu.classList.toggle('open',opening);button.setAttribute('aria-expanded',opening?'true':'false');refresh()});
    wrap.append(button,menu);return {wrap,button,menu,action};
  }
  const save=makeMenu('save','Save'),load=makeMenu('load','Load');
  const move=document.getElementById('playMoveControlsBtn'),ff=document.getElementById('playFastForwardBtn');
  const anchor=(move&&move.parentElement===overlay)?move:ff;
  if(anchor){anchor.insertAdjacentElement('afterend',load.wrap);anchor.insertAdjacentElement('afterend',save.wrap)}else{overlay.prepend(load.wrap);overlay.prepend(save.wrap)}

  function refresh(){
    for(const entry of [save,load])for(const item of entry.menu.querySelectorAll('.pp-state-slot-choice')){
      const nextDisabled=!available(+item.dataset.slot,entry.action);
      if(item.disabled!==nextDisabled)item.disabled=nextDisabled;
    }
  }
  const style=document.createElement('style');style.textContent=`
    .pp-state-menu-wrap{position:relative;display:inline-flex;align-items:center}
    .pp-state-dropdown{display:none;position:absolute;top:calc(100% + 6px);left:50%;transform:translateX(-50%);min-width:104px;padding:5px;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(10,13,11,.97);box-shadow:0 8px 24px rgba(0,0,0,.42);z-index:1800}
    .pp-state-dropdown.open{display:grid;gap:4px}
    .pp-state-slot-choice{appearance:none;border:1px solid rgba(255,255,255,.12);border-radius:7px;background:#182019;color:#f4f7f4;padding:8px 10px;font:inherit;font-size:.72rem;font-weight:800;white-space:nowrap;cursor:pointer}
    .pp-state-slot-choice:active{background:#263321}.pp-state-slot-choice:disabled{opacity:.38;cursor:not-allowed}
    body.rom-playing .pp-state-dropdown{top:calc(100% + 5px)}
  `;document.head.appendChild(style);
  document.addEventListener('click',()=>closeMenus());
  window.addEventListener('resize',()=>closeMenus(),{passive:true});
  document.addEventListener('fullscreenchange',()=>closeMenus());
  window.addEventListener('pixelplayer:system-ready',refresh);window.addEventListener('pixelplayer:n64-ready',refresh);
  // No MutationObserver here: observing `disabled` while refresh() changes `disabled`
  // can create a self-triggering loop and crash mobile browsers during startup.
  setInterval(refresh,1500);refresh();
})();