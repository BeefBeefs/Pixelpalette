// Build 133: PixelPlayer installable-app bootstrap with fresh HTML navigations.
(()=>{
  if(window.PixelPlayerPWA133)return;window.PixelPlayerPWA133=true;
  const BUILD=133,head=document.head;
  if(!head.querySelector('link[rel="manifest"]')){const l=document.createElement('link');l.rel='manifest';l.href=`manifest.webmanifest?v=${BUILD}`;head.appendChild(l)}
  const meta=(name,content)=>{if(head.querySelector(`meta[name="${name}"]`))return;const m=document.createElement('meta');m.name=name;m.content=content;head.appendChild(m)};
  meta('theme-color','#0b0f0c');meta('mobile-web-app-capable','yes');meta('apple-mobile-web-app-capable','yes');meta('apple-mobile-web-app-status-bar-style','black');meta('apple-mobile-web-app-title','PixelPlayer');
  if(!head.querySelector('link[rel="icon"]')){const i=document.createElement('link');i.rel='icon';i.href=`icons/pixelplayer-icon.svg?v=${BUILD}`;i.type='image/svg+xml';head.appendChild(i)}
  if(!head.querySelector('link[rel="apple-touch-icon"]')){const i=document.createElement('link');i.rel='apple-touch-icon';i.href=`icons/pixelplayer-icon.svg?v=${BUILD}`;head.appendChild(i)}
  if(!document.querySelector('script[src*="version-check.js"]')){const v=document.createElement('script');v.src=`version-check.js?v=${BUILD}`;v.defer=true;document.body.appendChild(v)}
  const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  document.documentElement.classList.toggle('pixelplayer-standalone',standalone());
  matchMedia('(display-mode: standalone)').addEventListener?.('change',()=>document.documentElement.classList.toggle('pixelplayer-standalone',standalone()));
  if('serviceWorker'in navigator&&location.protocol!=='file:'){
    navigator.serviceWorker.register(`coi-serviceworker.min.js?v=${BUILD}`,{scope:'./',updateViaCache:'none'}).then(async reg=>{
      try{await reg.update();if(reg.waiting)reg.waiting.postMessage({type:'skipWaiting'});await navigator.serviceWorker.ready;(reg.active||navigator.serviceWorker.controller)?.postMessage({type:'warm-shell'})}catch{}
    }).catch(e=>console.warn('PixelPlayer app worker registration failed',e));
    let reloading=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
  }
  let deferred=null;
  function installButton(){const nav=document.querySelector('.tool-tabs');if(!nav||document.getElementById('installPixelPlayerBtn')||standalone())return;const b=document.createElement('button');b.id='installPixelPlayerBtn';b.type='button';b.className='tool-tab pixelplayer-install';b.innerHTML='<span class="tab-dot"></span><span>Install App</span>';b.hidden=!deferred;b.onclick=async()=>{if(!deferred)return;const p=deferred;deferred=null;b.hidden=true;try{await p.prompt();await p.userChoice}catch{}};nav.appendChild(b)}
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;installButton();const b=document.getElementById('installPixelPlayerBtn');if(b)b.hidden=false});
  window.addEventListener('appinstalled',()=>{deferred=null;document.getElementById('installPixelPlayerBtn')?.remove()});
  const style=document.createElement('style');style.textContent='.pixelplayer-install{margin-left:auto!important;color:#cfff9a!important}.pixelplayer-standalone body{overscroll-behavior:none}.pixelplayer-standalone .tool-tabs{position:sticky;top:0;z-index:1200;background:#0b0f0c!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}.dash-favorites .dash-game-card{grid-template-columns:58px 1fr auto!important}.dash-favorites .dash-game-icon{width:58px!important;height:58px!important;border-radius:13px!important}.dash-favorites .dash-game-icon .system-art-img{max-width:47px!important;max-height:47px!important}@media(max-width:620px){.dash-favorites .dash-game-card{grid-template-columns:54px 1fr auto!important}.dash-favorites .dash-game-icon{width:54px!important;height:54px!important}}';head.appendChild(style);installButton();
})();
