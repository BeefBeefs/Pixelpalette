// Build 132: shared build stamp and release-polish bootstrap.
(()=>{
  const BUILD=132;
  window.PixelPlayerBuild=BUILD;
  function ensurePolish(){
    if(!document.querySelector('link[href*="release-polish.css"]')){const l=document.createElement('link');l.rel='stylesheet';l.href=`release-polish.css?v=${BUILD}`;document.head.appendChild(l)}
    if(document.querySelector('.system-grid')&&!document.getElementById('launchSplash')){const s=document.createElement('div');s.id='launchSplash';s.className='launch-splash';s.innerHTML='<div class="launch-splash-inner"><img src="icons/pixelplayer-splash.svg?v=132" alt="PixelPlayer"><small>Loading</small></div>';document.body.prepend(s)}
    if(!document.querySelector('script[src*="release-polish.js"]')){const s=document.createElement('script');s.src=`release-polish.js?v=${BUILD}`;s.defer=true;document.body.appendChild(s)}
  }
  function stampBuild(){document.body.dataset.build=String(BUILD);document.querySelectorAll('footer').forEach(f=>{f.textContent=f.classList.contains('dashboard-footer')?`PixelPlayer · browser-based multi-system emulation · Build ${BUILD}`:`PixelPlayer • Build ${BUILD}`});document.querySelectorAll('#pixelPlayerUpdateBtn,.pixelplayer-update-wrap').forEach(el=>el.remove());ensurePolish()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stampBuild,{once:true});else stampBuild();
})();