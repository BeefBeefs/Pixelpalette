// Build 115: shared build stamp; updates are handled automatically by versioned assets.
(()=>{
  const BUILD=115;
  window.PixelPlayerBuild=BUILD;
  function stampBuild(){
    document.body.dataset.build=String(BUILD);
    document.querySelectorAll('footer').forEach(f=>{
      f.textContent=f.classList.contains('dashboard-footer')
        ?`PixelPlayer · browser-based multi-system emulation · Build ${BUILD}`
        :`PixelPlayer • Build ${BUILD}`;
    });
    document.querySelectorAll('#pixelPlayerUpdateBtn,.pixelplayer-update-wrap').forEach(el=>el.remove());
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stampBuild,{once:true});else stampBuild();
})();
