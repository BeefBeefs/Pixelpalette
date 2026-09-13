// Build 115: N64-specific virtual-control polish.
(()=>{
  if((document.body.dataset.system||'').toLowerCase()!=='n64')return;
  const THEME_KEY='pixelplayer:virtual-controller-theme';
  const YELLOW='#e1b62b';
  const EDGE='#4c4f52';

  function systemTheme(){try{return (localStorage.getItem(THEME_KEY)||'system')==='system'}catch{return true}}
  function paintCButtons(){
    if(!systemTheme())return;
    for(const button of document.querySelectorAll('.ejs_virtualGamepad_button')){
      const label=(button.textContent||'').trim().toUpperCase().replace(/\s+/g,'');
      if(!['CU','CD','CL','CR','C-UP','C-DOWN','C-LEFT','C-RIGHT'].includes(label))continue;
      button.style.setProperty('background',YELLOW,'important');
      button.style.setProperty('background-color',YELLOW,'important');
      button.style.setProperty('border-color',EDGE,'important');
      button.style.setProperty('color','#17191b','important');
    }
  }
  const later=()=>setTimeout(paintCButtons,0);
  window.addEventListener('pixelplayer:system-ready',later);
  window.addEventListener('pixelplayer:controller-theme-changed',later);
  window.addEventListener('fullscreenchange',later);
  window.addEventListener('orientationchange',later,{passive:true});
  paintCButtons();
})();
