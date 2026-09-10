const romInput=document.getElementById('romInput');
const romDrop=document.getElementById('romDrop');
const romName=document.getElementById('romName');
const emuStage=document.getElementById('emuStage');
const emuStatus=document.getElementById('emuStatus');
const chooseAnotherBtn=document.getElementById('chooseAnotherBtn');
const controlCenter=document.getElementById('controlCenter');
const sessionRom=document.getElementById('sessionRom');
const controlStatus=document.getElementById('controlStatus');
const pauseBtn=document.getElementById('pauseBtn');
const fastForwardBtn=document.getElementById('fastForwardBtn');
const resetBtn=document.getElementById('resetBtn');
const fullscreenBtn=document.getElementById('fullscreenBtn');
const screenshotBtn=document.getElementById('screenshotBtn');
const exportSaveBtn=document.getElementById('exportSaveBtn');
const importSaveLabel=document.getElementById('importSaveLabel');
const saveInput=document.getElementById('saveInput');
const stateSlots=[...document.querySelectorAll('.state-slot')];
const recentRoms=document.getElementById('recentRoms');
const clearRecentRomsBtn=document.getElementById('clearRecentRomsBtn');
const controllerStatus=document.getElementById('controllerStatus');
const mappingSummary=document.getElementById('mappingSummary');
const enterPortraitBtn=document.getElementById('enterPortraitBtn');
const playFastForwardBtn=document.getElementById('playFastForwardBtn');
const playExitBtn=document.getElementById('playExitBtn');

const SNES_EXT=/\.(sfc|smc|fig|gd3|gd7|dx2|bsx|swc|zip)$/i;
const RECENT_KEY='pixelplayer:snes:recent';
let romObjectUrl=null,started=false,gameReady=false,paused=false,fastForward=false,currentGameName='game';

function setEmuStatus(message){if(emuStatus)emuStatus.textContent=message;}
function setControlStatus(message,kind='info'){if(!controlStatus)return;controlStatus.textContent=message;controlStatus.className=`status ${kind}`;}
function validRom(file){return !!file&&SNES_EXT.test(file.name||'');}
function getEmulator(){return window.EJS_emulator||null;}
function cleanName(name){return (name||'game').replace(/[^a-z0-9_\- ]/gi,'_').trim()||'game';}
function stateKey(slot){return `pixelplayer:snes:${currentGameName}:state:${slot}`;}
function bytesToBase64(bytes){let s='';const u=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s);}
function base64ToBytes(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
function downloadBytes(data,name,type='application/octet-stream'){if(!data)return;const blob=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
function setControlsEnabled(enabled){[pauseBtn,fastForwardBtn,resetBtn,fullscreenBtn,screenshotBtn,exportSaveBtn].forEach(b=>{if(b)b.disabled=!enabled});if(saveInput)saveInput.disabled=!enabled;if(importSaveLabel)importSaveLabel.classList.toggle('disabled',!enabled);if(controlCenter)controlCenter.classList.toggle('disabled-panel',!enabled);stateSlots.forEach(slot=>slot.querySelectorAll('button').forEach(b=>b.disabled=!enabled));}
async function waitForGameManager(timeout=12000){const end=Date.now()+timeout;while(Date.now()<end){const e=getEmulator();if(e&&e.gameManager&&e.gameManager.FS)return e;await new Promise(r=>setTimeout(r,100));}return null;}
async function captureThumb(e){try{const bytes=await e.gameManager.screenshot();if(!bytes)return null;const blob=new Blob([bytes],{type:'image/png'});return await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>res(null);r.readAsDataURL(blob)});}catch{return null;}}
function renderStateSlots(){stateSlots.forEach(slot=>{const n=slot.dataset.slot,raw=localStorage.getItem(stateKey(n));const thumb=slot.querySelector('.state-thumb'),time=slot.querySelector('.state-time'),load=slot.querySelector('.load-state-btn');if(!raw){thumb.className='state-thumb empty';thumb.innerHTML=`<span>Slot ${n}</span>`;time.textContent='Empty';load.disabled=!gameReady;return;}try{const data=JSON.parse(raw);thumb.className='state-thumb';thumb.innerHTML=data.thumb?`<img src="${data.thumb}" alt="Slot ${n} screenshot">`:`<span>Slot ${n}</span>`;time.textContent=data.savedAt?new Date(data.savedAt).toLocaleString():'Saved';load.disabled=!gameReady;}catch{localStorage.removeItem(stateKey(n));}});}
function readRecents(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]');}catch{return[];}}
function writeRecents(rows){try{localStorage.setItem(RECENT_KEY,JSON.stringify(rows.slice(0,12)));}catch{}}
function addRecent(file){const rows=readRecents().filter(x=>x.name!==file.name);rows.unshift({name:file.name,size:file.size,playedAt:Date.now()});writeRecents(rows);renderRecents();}
function renderRecents(){if(!recentRoms)return;const rows=readRecents();if(!rows.length){recentRoms.className='recent-roms empty-state';recentRoms.textContent='No recent ROMs yet.';return;}recentRoms.className='recent-roms';recentRoms.innerHTML=rows.map(r=>`<div class="recent-rom"><div><strong>${r.name.replace(SNES_EXT,'')}</strong><span>${new Date(r.playedAt).toLocaleString()} • ${(r.size/1024/1024).toFixed(2)} MB</span></div><small>Re-open from device or Folder Library</small></div>`).join('');}
function markReady(){gameReady=true;setControlsEnabled(true);sessionRom.textContent=currentGameName;renderStateSlots();setEmuStatus('Running locally in your browser.');setControlStatus('SNES Control Center ready.','good');}

function startRom(file){
  if(!validRom(file)){setEmuStatus('Please choose a supported SNES ROM (.sfc, .smc, .fig, .gd3, .gd7, .dx2, .bsx, .swc, or .zip).');return;}
  if(started){location.reload();return;}
  started=true;
  if(romObjectUrl)URL.revokeObjectURL(romObjectUrl);
  romObjectUrl=URL.createObjectURL(file);
  currentGameName=cleanName(file.name.replace(SNES_EXT,''));
  romName.textContent=`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`;
  sessionRom.textContent=currentGameName;
  emuStage.classList.add('ready');
  setEmuStatus('Loading Snes9x core…');
  setControlStatus('Starting SNES emulator…');
  addRecent(file);
  window.EJS_player='#game';
  window.EJS_core='snes';
  window.EJS_gameUrl=romObjectUrl;
  window.EJS_gameName=currentGameName;
  window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded=true;
  window.EJS_askBeforeExit=false;
  window.EJS_color='#9be33a';
  window.EJS_backgroundColor='#050706';
  window.EJS_mouse=false;
  window.EJS_multitap=false;
  window.EJS_defaultOptions={"save-state-location":"browser"};
  window.EJS_onGameStart=async()=>{const e=await waitForGameManager();if(e)markReady();else setControlStatus('The SNES emulator started, but PixelPlayer could not connect to its control API.','warn');};
  const script=document.createElement('script');
  script.src='https://cdn.emulatorjs.org/stable/data/loader.js';script.async=true;
  script.onerror=()=>{setEmuStatus('The SNES emulator core could not be loaded.');setControlStatus('Emulator runtime failed to load.','warn');};
  document.body.appendChild(script);
}
window.startRom=startRom;

romInput?.addEventListener('change',()=>{const file=romInput.files?.[0];romInput.value='';if(file)startRom(file);});
['dragenter','dragover'].forEach(type=>romDrop?.addEventListener(type,e=>{e.preventDefault();romDrop.classList.add('dragging');}));
['dragleave','drop'].forEach(type=>romDrop?.addEventListener(type,e=>{e.preventDefault();romDrop.classList.remove('dragging');}));
romDrop?.addEventListener('drop',e=>{const file=e.dataTransfer?.files?.[0];if(file)startRom(file);});
chooseAnotherBtn?.addEventListener('click',()=>location.reload());
enterPortraitBtn?.addEventListener('click',()=>{if(!gameReady)return;document.body.classList.add('rom-playing');window.scrollTo(0,0);window.dispatchEvent(new Event('resize'));});
playExitBtn?.addEventListener('click',()=>{document.body.classList.remove('rom-playing');window.dispatchEvent(new Event('resize'));});

pauseBtn?.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e)return;try{if(paused){typeof e.play==='function'?e.play():e.gameManager?.toggleMainLoop?.(1);paused=false;pauseBtn.querySelector('span').textContent='⏸ Pause';}else{typeof e.pause==='function'?e.pause():e.gameManager?.toggleMainLoop?.(0);paused=true;pauseBtn.querySelector('span').textContent='▶ Resume';}setControlStatus(paused?'Emulation paused.':'Emulation resumed.',paused?'info':'good');}catch{setControlStatus('Could not change pause state.','warn');}});
function toggleFastForward(){const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{fastForward=!fastForward;e.gameManager.setFastForwardRatio?.(3);e.gameManager.toggleFastForward?.(fastForward);fastForwardBtn?.classList.toggle('active-toggle',fastForward);fastForwardBtn?.setAttribute('aria-pressed',fastForward?'true':'false');if(fastForwardBtn?.querySelector('span'))fastForwardBtn.querySelector('span').textContent=fastForward?'⏩ Fast Forward ON':'⏩ Fast Forward: OFF';if(playFastForwardBtn){playFastForwardBtn.textContent=fastForward?'⏩ FF: ON':'⏩ FF: OFF';playFastForwardBtn.setAttribute('aria-pressed',fastForward?'true':'false');}setControlStatus(fastForward?'Fast forward enabled at 3× speed.':'Fast forward disabled.','good');}catch{setControlStatus('Fast forward could not be changed.','warn');}}
fastForwardBtn?.addEventListener('click',toggleFastForward);playFastForwardBtn?.addEventListener('click',toggleFastForward);
resetBtn?.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{e.gameManager.restart();paused=false;fastForward=false;pauseBtn.querySelector('span').textContent='⏸ Pause';if(fastForwardBtn?.querySelector('span'))fastForwardBtn.querySelector('span').textContent='⏩ Fast Forward: OFF';if(playFastForwardBtn)playFastForwardBtn.textContent='⏩ FF: OFF';setControlStatus('SNES reset.','good');}catch{setControlStatus('Reset failed.','warn');}});
fullscreenBtn?.addEventListener('click',async()=>{const e=getEmulator();if(!gameReady)return;try{if(e&&typeof e.toggleFullscreen==='function')e.toggleFullscreen(!document.fullscreenElement);else if(!document.fullscreenElement)await emuStage.requestFullscreen();else await document.exitFullscreen();}catch{setControlStatus('Fullscreen could not be changed.','warn');}});
screenshotBtn?.addEventListener('click',async()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const bytes=await e.gameManager.screenshot();if(!bytes)throw 0;downloadBytes(bytes,`${currentGameName}_screenshot.png`,'image/png');setControlStatus('Screenshot downloaded.','good');}catch{setControlStatus('Screenshot failed.','warn');}});
exportSaveBtn?.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const save=e.gameManager.getSaveFile();if(!save||!save.length){setControlStatus('No cartridge save exists yet.','warn');return;}downloadBytes(save,`${currentGameName}.srm`);setControlStatus(`Exported ${currentGameName}.srm.`,'good');}catch{setControlStatus('Could not export the cartridge save.','warn');}});
saveInput?.addEventListener('change',async()=>{const file=saveInput.files?.[0];saveInput.value='';const e=getEmulator();if(!file||!gameReady||!e?.gameManager)return;try{const bytes=new Uint8Array(await file.arrayBuffer()),gm=e.gameManager,path=gm.getSaveFilePath();gm.writeFile(path,bytes);gm.loadSaveFiles();gm.FS?.syncfs?.(false,()=>{});setControlStatus(`Imported ${file.name}. Reset if needed.`,'good');}catch{setControlStatus('Could not import that save file.','warn');}});

stateSlots.forEach(slot=>{const n=slot.dataset.slot;slot.querySelector('.save-state-btn')?.addEventListener('click',async()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const state=e.gameManager.getState();if(!state)throw 0;setControlStatus(`Saving state to Slot ${n}…`);const thumb=await captureThumb(e);localStorage.setItem(stateKey(n),JSON.stringify({savedAt:Date.now(),state:bytesToBase64(state),thumb}));renderStateSlots();setControlStatus(`Saved state to Slot ${n}.`,'good');}catch{setControlStatus('Could not save state. Browser storage may be full.','warn');}});slot.querySelector('.load-state-btn')?.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const raw=localStorage.getItem(stateKey(n));if(!raw){setControlStatus(`Slot ${n} is empty.`,'warn');return;}e.gameManager.loadState(base64ToBytes(JSON.parse(raw).state));setControlStatus(`Loaded state from Slot ${n}.`,'good');}catch{setControlStatus('Could not load that save state.','warn');}});});
clearRecentRomsBtn?.addEventListener('click',()=>{writeRecents([]);renderRecents();});

function updateController(){const pads=navigator.getGamepads?navigator.getGamepads():[];const pad=[...pads].find(Boolean);if(!pad){if(controllerStatus)controllerStatus.textContent='No controller detected';if(mappingSummary){mappingSummary.className='mapping-summary empty-state';mappingSummary.textContent='Waiting for controller input…';}return;}if(controllerStatus)controllerStatus.textContent=(pad.id||'Controller').slice(0,65);if(mappingSummary){mappingSummary.className='mapping-summary';mappingSummary.innerHTML='<div class="mapping-chip"><strong>SNES</strong><span>Standard gamepad mapping active</span></div><div class="mapping-chip"><strong>Buttons</strong><span>A / B / X / Y / L / R / Start / Select</span></div>';}}
window.addEventListener('gamepadconnected',updateController);window.addEventListener('gamepaddisconnected',updateController);setInterval(updateController,1200);
renderRecents();setControlsEnabled(false);renderStateSlots();updateController();