// Build 96: protect active emulator displays and virtual controls from Android long-press selection/callouts.
(()=>{
  if(window.PixelPlayerTouchGuard96)return;window.PixelPlayerTouchGuard96=true;
  const protectedSelector='#game,.screen-frame,.ejs_virtualGamepad_parent,.portrait-touch-dock,.play-overlay-controls';
  const style=document.createElement('style');style.id='pixelplayer-touch-guard-96';style.textContent=`
    #game,#game *,
    .screen-frame,.screen-frame *,
    .ejs_virtualGamepad_parent,.ejs_virtualGamepad_parent *,
    .portrait-touch-dock,.portrait-touch-dock *,
    .play-overlay-controls,.play-overlay-controls *{
      -webkit-user-select:none!important;user-select:none!important;
      -webkit-touch-callout:none!important;
      -webkit-user-drag:none!important;
      -webkit-tap-highlight-color:transparent!important;
    }
    #game,.screen-frame,.ejs_virtualGamepad_parent,.portrait-touch-dock{touch-action:none!important}
    .ejs_virtualGamepad_button,.play-overlay-controls button{touch-action:manipulation!important}
    #game img,.screen-frame img,.ejs_virtualGamepad_parent img{pointer-events:none!important;-webkit-user-drag:none!important}
  `;document.head.appendChild(style);

  function protectedTarget(target){return target instanceof Element&&!!target.closest(protectedSelector)}
  function block(event){if(protectedTarget(event.target))event.preventDefault()}
  document.addEventListener('contextmenu',block,{capture:true});
  document.addEventListener('selectstart',block,{capture:true});
  document.addEventListener('dragstart',block,{capture:true});

  // Clear any accidental selection if Android/Chrome began one before the event was cancelled.
  document.addEventListener('pointerdown',event=>{
    if(!protectedTarget(event.target))return;
    try{const sel=getSelection();if(sel&&!sel.isCollapsed)sel.removeAllRanges()}catch{}
  },{capture:true,passive:true});
})();
