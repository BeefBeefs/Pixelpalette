const romInput=document.getElementById('romInput');
const romDrop=document.getElementById('romDrop');
const romName=document.getElementById('romName');
const emuStage=document.getElementById('emuStage');
const emuStatus=document.getElementById('emuStatus');
const chooseAnotherBtn=document.getElementById('chooseAnotherBtn');
let romObjectUrl=null;
let started=false;

function setEmuStatus(message){emuStatus.textContent=message;}
function validRom(file){return file&&/\.gba$/i.test(file.name);}
function startRom(file){
  if(!validRom(file)){setEmuStatus('Please choose a .gba ROM file.');return;}
  if(started){location.reload();return;}
  started=true;
  if(romObjectUrl)URL.revokeObjectURL(romObjectUrl);
  romObjectUrl=URL.createObjectURL(file);
  romName.textContent=`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`;
  emuStage.classList.add('ready');
  setEmuStatus('Loading mGBA core…');

  window.EJS_player='#game';
  window.EJS_core='gba';
  window.EJS_gameUrl=romObjectUrl;
  window.EJS_gameName=file.name.replace(/\.gba$/i,'');
  window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';
  window.EJS_startOnLoaded=true;
  window.EJS_askBeforeExit=false;
  window.EJS_color='#9be33a';
  window.EJS_backgroundColor='#050706';
  window.EJS_onGameStart=()=>setEmuStatus('Running locally in your browser.');

  const script=document.createElement('script');
  script.src='https://cdn.emulatorjs.org/stable/data/loader.js';
  script.async=true;
  script.onerror=()=>setEmuStatus('The emulator core could not be loaded. Check your connection and reload the page.');
  document.body.appendChild(script);
}

romInput.addEventListener('change',()=>{const f=romInput.files&&romInput.files[0];if(f)startRom(f)});
['dragenter','dragover'].forEach(type=>romDrop.addEventListener(type,e=>{e.preventDefault();romDrop.classList.add('dragging')}));
['dragleave','drop'].forEach(type=>romDrop.addEventListener(type,e=>{e.preventDefault();romDrop.classList.remove('dragging')}));
romDrop.addEventListener('drop',e=>{const f=[...e.dataTransfer.files].find(validRom);if(f)startRom(f);else setEmuStatus('Drop a .gba ROM file here.')});
chooseAnotherBtn.addEventListener('click',()=>location.reload());
window.addEventListener('beforeunload',()=>{if(romObjectUrl)URL.revokeObjectURL(romObjectUrl)});