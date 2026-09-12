// Build 103: one tiny update control for dashboard + emulator pages.
(()=>{
  const BUILD=103;
  window.PixelPlayerBuild=BUILD;
  if(document.getElementById('pixelPlayerUpdateBtn'))return;

  function stampBuild(){
    document.body.dataset.build=String(BUILD);
    document.querySelectorAll('footer').forEach(footer=>{
      if(footer.classList.contains('dashboard-footer')) footer.textContent=`PixelPlayer · browser-based multi-system emulation · Build ${BUILD}`;
      else footer.textContent=`PixelPlayer • Build ${BUILD}`;
    });
    const eyebrow=document.querySelector('.dashboard-hero .eyebrow');
    if(eyebrow)eyebrow.textContent=`PIXELPLAYER · BUILD ${BUILD}`;
  }

  async function forceUpdate(){
    const button=document.getElementById('pixelPlayerUpdateBtn');
    if(button){button.disabled=true;button.textContent='Checking…'}
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(reg=>reg.unregister().catch(()=>false)));
      }
      if('caches' in window){
        const keys=await caches.keys();
        await Promise.all(keys.filter(k=>/pixel|emulator|coi|shell|static|cache/i.test(k)).map(k=>caches.delete(k)));
      }
    }catch(e){console.warn('PixelPlayer cache refresh cleanup failed',e)}
    try{
      sessionStorage.setItem('pixelplayer:last-force-update',String(Date.now()));
    }catch{}
    const url=new URL(location.href);
    url.searchParams.set('v',String(BUILD));
    url.searchParams.set('fresh',String(Date.now()));
    location.replace(url.toString());
  }

  function mount(){
    stampBuild();
    const button=document.createElement('button');
    button.id='pixelPlayerUpdateBtn';
    button.type='button';
    button.textContent='↻ Check Update';
    button.title='Clear cached PixelPlayer shell files and reload the newest build';
    button.addEventListener('click',forceUpdate);
    const footer=document.querySelector('footer');
    if(footer){
      const wrap=document.createElement('div');
      wrap.className='pixelplayer-update-wrap';
      wrap.appendChild(button);
      footer.insertAdjacentElement('afterend',wrap);
    }else document.body.appendChild(button);
    const style=document.createElement('style');
    style.textContent='.pixelplayer-update-wrap{display:flex;justify-content:center;margin:5px 0 14px}.pixelplayer-update-wrap button,#pixelPlayerUpdateBtn{font:600 10px/1.1 system-ui,sans-serif;padding:4px 7px;border:1px solid #364239;border-radius:6px;background:#101512;color:#8fa198;opacity:.72;cursor:pointer}.pixelplayer-update-wrap button:active{opacity:1}.pixelplayer-update-wrap button:disabled{cursor:default;opacity:.5}';
    document.head.appendChild(style);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
