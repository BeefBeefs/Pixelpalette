// Build 60: optional emulator FPS display using actual emulated frame count when available.
(()=>{
  const KEY='pixelplayer:show-fps';
  const stage=document.getElementById('emuStage');
  if(!stage)return;
  const controls=stage.querySelector('.play-overlay-controls');
  const frame=stage.querySelector('.screen-frame');
  if(!controls||!frame)return;
  const btn=document.createElement('button');
  btn.id='playFpsBtn';btn.className='play-control';btn.type='button';
  const badge=document.createElement('div');
  badge.id='pixelplayerFps';
  Object.assign(badge.style,{position:'absolute',top:'8px',left:'8px',zIndex:'40',padding:'4px 7px',borderRadius:'6px',background:'rgba(0,0,0,.72)',color:'#9be33a',font:'700 12px/1.2 ui-monospace,monospace',pointerEvents:'none',display:'none'});
  const cs=getComputedStyle(frame);if(cs.position==='static')frame.style.position='relative';frame.appendChild(badge);controls.insertBefore(btn,controls.firstChild);
  let on=localStorage.getItem(KEY)==='1',timer=null,lastFrame=null,lastTime=null;
  function sync(){btn.textContent=on?'FPS: ON':'FPS: OFF';btn.setAttribute('aria-pressed',String(on));badge.style.display=on?'block':'none';if(on)start();else stop()}
  function stop(){if(timer){clearInterval(timer);timer=null}lastFrame=lastTime=null;badge.textContent='FPS --'}
  function start(){if(timer)return;badge.textContent='FPS --';timer=setInterval(()=>{
    const gm=window.EJS_emulator?.gameManager;
    const now=performance.now();
    let n=null;try{n=gm?.getFrameNum?.()}catch{}
    if(Number.isFinite(n)&&lastFrame!==null&&lastTime!==null){const dt=(now-lastTime)/1000;if(dt>0)badge.textContent=`FPS ${Math.max(0,(n-lastFrame)/dt).toFixed(1)}`}
    else if(!gm)badge.textContent='FPS --';
    if(Number.isFinite(n)){lastFrame=n;lastTime=now}
  },1000)}
  btn.addEventListener('click',()=>{on=!on;localStorage.setItem(KEY,on?'1':'0');sync()});
  sync();
})();