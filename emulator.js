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
const resetBtn=document.getElementById('resetBtn');
const fullscreenBtn=document.getElementById('fullscreenBtn');
const screenshotBtn=document.getElementById('screenshotBtn');
const exportSaveBtn=document.getElementById('exportSaveBtn');
const importSaveLabel=document.getElementById('importSaveLabel');
const saveInput=document.getElementById('saveInput');
let romObjectUrl=null;
let started=false;
let gameReady=false;
let paused=false;
let currentGameName='game';

function setEmuStatus(message){emuStatus.textContent=message;}
function setControlStatus(message,kind='info'){controlStatus.textContent=message;controlStatus.className=`status ${kind}`;}
function validRom(file){return file&&/\.gba$/i.test(file.name);}
function getEmulator(){return window.EJS_emulator||null;}
function setControlsEnabled(enabled){
  [pauseBtn,resetBtn,fullscreenBtn,screenshotBtn,exportSaveBtn].forEach(b=>b.disabled=!enabled);
  saveInput.disabled=!enabled;
  importSaveLabel.classList.toggle('disabled',!enabled);
  controlCenter.classList.toggle('disabled-panel',!enabled);
}
function downloadBytes(data,name,type='application/octet-stream'){
  if(!data)return;
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function cleanName(name){return (name||'game').replace(/[^a-z0-9_\- ]/gi,'_').trim()||'game';}

async function waitForGameManager(timeout=10000){
  const end=Date.now()+timeout;
  while(Date.now()<end){
    const e=getEmulator();
    if(e&&e.gameManager&&e.gameManager.FS&&e.gameManager.getSaveFilePath)return e;
    await new Promise(r=>setTimeout(r,100));
  }
  return null;
}

function markReady(){
  gameReady=true;
  setControlsEnabled(true);
  sessionRom.textContent=currentGameName;
  setEmuStatus('Running locally in your browser.');
  setControlStatus('Control Center ready. Saves, screenshots, reset, pause, and fullscreen are available.','good');
}

function startRom(file){
  if(!validRom(file)){setEmuStatus('Please choose a .gba ROM file.');return;}
  if(started){location.reload();return;}
  started=true;
  if(romObjectUrl)URL.revokeObjectURL(romObjectUrl);
  romObjectUrl=URL.createObjectURL(file);
  currentGameName=cleanName(file.name.replace(/\.gba$/i,''));
  romName.textContent=`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`;
  sessionRom.textContent=currentGameName;
  emuStage.classList.add('ready');
  setEmuStatus('Loading mGBA core…');
  setControlStatus('Starting emulator…');

  window.EJS_player='#game';
  window.EJS_core='gba';
  window.EJS_gameUrl=romObjectUrl;
  window.EJS_gameName=currentGameName;
  window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded=true;
  window.EJS_askBeforeExit=false;
  window.EJS_color='#9be33a';
  window.EJS_backgroundColor='#050706';
  window.EJS_defaultOptions={"save-state-location":"browser"};
  window.EJS_onGameStart=async()=>{
    const e=await waitForGameManager();
    if(e)markReady();
    else setControlStatus('The emulator started, but PixelPalette could not connect to its control API.','warn');
  };

  const script=document.createElement('script');
  script.src='https://cdn.emulatorjs.org/stable/data/loader.js';
  script.async=true;
  script.onerror=()=>{setEmuStatus('The emulator core could not be loaded. Check your connection and reload the page.');setControlStatus('Emulator runtime failed to load.','warn');};
  document.body.appendChild(script);
}

pauseBtn.addEventListener('click',()=>{
  const e=getEmulator();if(!gameReady||!e)return;
  try{
    if(paused){
      if(typeof e.play==='function')e.play();
      else if(e.gameManager?.toggleMainLoop)e.gameManager.toggleMainLoop(1);
      paused=false;pauseBtn.querySelector('span').textContent='⏸ Pause';setControlStatus('Emulation resumed.','good');
    }else{
      if(typeof e.pause==='function')e.pause();
      else if(e.gameManager?.toggleMainLoop)e.gameManager.toggleMainLoop(0);
      paused=true;pauseBtn.querySelector('span').textContent='▶ Resume';setControlStatus('Emulation paused.','info');
    }
  }catch(err){console.error(err);setControlStatus('Could not change pause state.','warn');}
});

resetBtn.addEventListener('click',()=>{
  const e=getEmulator();if(!gameReady||!e?.gameManager)return;
  try{e.gameManager.restart();paused=false;pauseBtn.querySelector('span').textContent='⏸ Pause';setControlStatus('GBA reset.','good');}
  catch(err){console.error(err);setControlStatus('Reset failed.','warn');}
});

fullscreenBtn.addEventListener('click',async()=>{
  const e=getEmulator();if(!gameReady)return;
  try{
    if(e&&typeof e.toggleFullscreen==='function')e.toggleFullscreen(!document.fullscreenElement);
    else if(!document.fullscreenElement)await emuStage.requestFullscreen();
    else await document.exitFullscreen();
  }catch(err){console.error(err);setControlStatus('Fullscreen could not be changed.','warn');}
});

screenshotBtn.addEventListener('click',async()=>{
  const e=getEmulator();if(!gameReady||!e?.gameManager)return;
  try{
    let bytes=null;
    if(typeof e.gameManager.screenshot==='function')bytes=await e.gameManager.screenshot();
    if(bytes){downloadBytes(bytes,`${currentGameName}_screenshot.png`,'image/png');setControlStatus('Screenshot downloaded.','good');return;}
    throw new Error('Screenshot unavailable');
  }catch(err){console.error(err);setControlStatus('Screenshot failed.','warn');}
});

exportSaveBtn.addEventListener('click',()=>{
  const e=getEmulator();if(!gameReady||!e?.gameManager)return;
  try{
    const save=e.gameManager.getSaveFile();
    if(!save||!save.length){setControlStatus('No battery save exists yet. Save in-game first, then try again.','warn');return;}
    downloadBytes(save,`${currentGameName}.sav`);
    setControlStatus(`Exported ${currentGameName}.sav.`,'good');
  }catch(err){console.error(err);setControlStatus('Could not export the battery save.','warn');}
});

saveInput.addEventListener('change',async()=>{
  const file=saveInput.files&&saveInput.files[0];saveInput.value='';
  const e=getEmulator();if(!file||!gameReady||!e?.gameManager)return;
  try{
    const bytes=new Uint8Array(await file.arrayBuffer());
    const gm=e.gameManager,path=gm.getSaveFilePath();
    if(!path)throw new Error('Save path unavailable');
    gm.writeFile(path,bytes);
    gm.loadSaveFiles();
    if(gm.FS?.syncfs)gm.FS.syncfs(false,()=>{});
    setControlStatus(`Imported ${file.name}. If the game does not refresh immediately, use Reset.`,'good');
  }catch(err){console.error(err);setControlStatus('Could not import that save file. Make sure it belongs to this ROM.','warn');}
});

romInput.addEventListener('change',()=>{const f=romInput.files&&romInput.files[0];if(f)startRom(f)});
['dragenter','dragover'].forEach(type=>romDrop.addEventListener(type,e=>{e.preventDefault();romDrop.classList.add('dragging')}));
['dragleave','drop'].forEach(type=>romDrop.addEventListener(type,e=>{e.preventDefault();romDrop.classList.remove('dragging')}));
romDrop.addEventListener('drop',e=>{const f=[...e.dataTransfer.files].find(validRom);if(f)startRom(f);else setEmuStatus('Drop a .gba ROM file here.')});
chooseAnotherBtn.addEventListener('click',()=>location.reload());
window.addEventListener('beforeunload',()=>{if(romObjectUrl)URL.revokeObjectURL(romObjectUrl)});
setControlsEnabled(false);