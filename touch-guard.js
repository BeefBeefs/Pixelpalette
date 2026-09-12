// Build 97: lightweight Android long-press protection without altering emulator touch/compositor behavior.
(()=>{
  if(window.PixelPlayerTouchGuard97)return;window.PixelPlayerTouchGuard97=true;
  const protectedSelector='#game,.screen-frame,.ejs_virtualGamepad_parent,.portrait-touch-dock,.play-overlay-controls';
  const style=document.createElement('style');style.id='pixelplayer-touch-guard-97';style.textContent=`
    #game,#game *,
    .screen-frame,.screen-frame *,
    .ejs_virtualGamepad_parent,.ejs_virtualGamepad_parent *,
    .portrait-touch-dock,.portrait-touch-dock *,
    .play-overlay-controls,.play-overlay-controls *{
      -webkit-user-select:none!important;
      user-select:none!important;
      -webkit-touch-callout:none!important;
      -webkit-user-drag:none!important;
      -webkit-tap-highlight-color:transparent!important;
    }
  `;document.head.appendChild(style);

  function protectedTarget(target){return target instanceof Element&&!!target.closest(protectedSelector)}
  function block(event){if(protectedTarget(event.target))event.preventDefault()}
  // These fire only when the browser actually attempts document-style interaction.
  document.addEventListener('contextmenu',block,{capture:true});
  document.addEventListener('selectstart',block,{capture:true});
  document.addEventListener('dragstart',block,{capture:true});
})();
