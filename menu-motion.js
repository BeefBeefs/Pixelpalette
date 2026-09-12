// Build 76: one-shot menu transitions only; no gameplay animation loop.
(()=>{
  if(window.PixelPlayerMenuMotion76)return;window.PixelPlayerMenuMotion76=true;
  const style=document.createElement('style');style.textContent=`
  body:not(.rom-playing):not(.low-memory-running):not(.ui-motion-off) .emulator-tab-panel.active:not([hidden]){animation:ppPanelIn .19s ease both}
  @keyframes ppPanelIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  body.rom-playing .emulator-tab-panel,body.low-memory-running .emulator-tab-panel,body.ui-motion-off .emulator-tab-panel{animation:none!important}
  @media(prefers-reduced-motion:reduce){.emulator-tab-panel{animation:none!important}}
  `;document.head.appendChild(style);
  window.addEventListener('pixelplayer:performance-changed',e=>document.body.classList.toggle('ui-motion-off',!!e.detail?.enabled));
})();