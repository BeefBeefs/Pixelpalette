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
const controllerStatus=document.getElementById('controllerStatus');
const mapControllerBtn=document.getElementById('mapControllerBtn');
const resetControllerBtn=document.getElementById('resetControllerBtn');
const mappingSummary=document.getElementById('mappingSummary');
const mappingOverlay=document.getElementById('mappingOverlay');
const mappingStep=document.getElementById('mappingStep');
const mappingPrompt=document.getElementById('mappingPrompt');
const mappingHint=document.getElementById('mappingHint');
const mappingBackBtn=document.getElementById('mappingBackBtn');
const mappingSkipBtn=document.getElementById('mappingSkipBtn');
const mappingCancelBtn=document.getElementById('mappingCancelBtn');

let romObjectUrl=null,started=false,gameReady=false,paused=false,fastForward=false,currentGameName='game';
let activeGamepadIndex=-1,activeGamepadId='',controllerMapping=null,lastMappedStates={};
let mappingActive=false,mappingIndex=0,mappingDraft={},mappingArmed=false;

const GBA_INPUTS=[
  {key:'A',label:'A',ejs:8},{key:'B',label:'B',ejs:0},{key:'L',label:'L',ejs:10},{key:'R',label:'R',ejs:11},
  {key:'Start',label:'Start',ejs:3},{key:'Select',label:'Select',ejs:2},{key:'Up',label:'D-Pad Up',ejs:4},{key:'Down',label:'D-Pad Down',ejs:5},{key:'Left',label:'D-Pad Left',ejs:6},{key:'Right',label:'D-Pad Right',ejs:7}
];

function setEmuStatus(message){emuStatus.textContent=message;}
function setControlStatus(message,kind='info'){controlStatus.textContent=message;controlStatus.className=`status ${kind}`;}
function validRom(file){return file&&/\.gba$/i.test(file.name);}
function getEmulator(){return window.EJS_emulator||null;}
function cleanName(name){return (name||'game').replace(/[^a-z0-9_\- ]/gi,'_').trim()||'game';}
function stateKey(slot){return `pixelplayer:${currentGameName}:state:${slot}`;}
function controllerKey(id){return `pixelplayer:controller:${id}`;}
function bytesToBase64(bytes){let s='';const u=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode(...u.subarray(i,i+0x8000));return btoa(s);}
function base64ToBytes(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u;}
function downloadBytes(data,name,type='application/octet-stream'){if(!data)return;const blob=data instanceof Blob?data:new Blob([data],{type});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
function setControlsEnabled(enabled){[pauseBtn,fastForwardBtn,resetBtn,fullscreenBtn,screenshotBtn,exportSaveBtn].forEach(b=>b.disabled=!enabled);saveInput.disabled=!enabled;importSaveLabel.classList.toggle('disabled',!enabled);controlCenter.classList.toggle('disabled-panel',!enabled);stateSlots.forEach(slot=>slot.querySelectorAll('button').forEach(b=>b.disabled=!enabled));}
async function waitForGameManager(timeout=10000){const end=Date.now()+timeout;while(Date.now()<end){const e=getEmulator();if(e&&e.gameManager&&e.gameManager.FS)return e;await new Promise(r=>setTimeout(r,100));}return null;}
function renderStateSlots(){stateSlots.forEach(slot=>{const n=slot.dataset.slot,raw=localStorage.getItem(stateKey(n));const thumb=slot.querySelector('.state-thumb'),time=slot.querySelector('.state-time'),load=slot.querySelector('.load-state-btn');if(!raw){thumb.className='state-thumb empty';thumb.innerHTML=`<span>Slot ${n}</span>`;time.textContent='Empty';load.disabled=!gameReady;return;}try{const data=JSON.parse(raw);thumb.className='state-thumb';thumb.innerHTML=data.thumb?`<img src="${data.thumb}" alt="Slot ${n} screenshot">`:`<span>Slot ${n}</span>`;time.textContent=data.savedAt?new Date(data.savedAt).toLocaleString():'Saved';load.disabled=!gameReady;}catch{localStorage.removeItem(stateKey(n));}});}
async function captureThumb(e){try{const bytes=await e.gameManager.screenshot();if(!bytes)return null;const blob=new Blob([bytes],{type:'image/png'});return await new Promise(res=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>res(null);r.readAsDataURL(blob)});}catch{return null;}}
function markReady(){gameReady=true;setControlsEnabled(true);sessionRom.textContent=currentGameName;renderStateSlots();setEmuStatus('Running locally in your browser.');setControlStatus('Control Center ready.','good');}

function startRom(file){if(!validRom(file)){setEmuStatus('Please choose a .gba ROM file.');return;}if(started){location.reload();return;}started=true;if(romObjectUrl)URL.revokeObjectURL(romObjectUrl);romObjectUrl=URL.createObjectURL(file);currentGameName=cleanName(file.name.replace(/\.gba$/i,''));romName.textContent=`${file.name} • ${(file.size/1024/1024).toFixed(2)} MB`;sessionRom.textContent=currentGameName;emuStage.classList.add('ready');setEmuStatus('Loading mGBA core…');setControlStatus('Starting emulator…');window.EJS_player='#game';window.EJS_core='gba';window.EJS_gameUrl=romObjectUrl;window.EJS_gameName=currentGameName;window.EJS_pathtodata='https://cdn.emulatorjs.org/stable/data/';window.EJS_startOnLoaded=true;window.EJS_askBeforeExit=false;window.EJS_color='#9be33a';window.EJS_backgroundColor='#050706';window.EJS_defaultOptions={"save-state-location":"browser"};window.EJS_onGameStart=async()=>{const e=await waitForGameManager();if(e)markReady();else setControlStatus('The emulator started, but PixelPalette could not connect to its control API.','warn');};const script=document.createElement('script');script.src='https://cdn.emulatorjs.org/stable/data/loader.js';script.async=true;script.onerror=()=>{setEmuStatus('The emulator core could not be loaded.');setControlStatus('Emulator runtime failed to load.','warn');};document.body.appendChild(script);}

pauseBtn.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e)return;try{if(paused){typeof e.play==='function'?e.play():e.gameManager?.toggleMainLoop?.(1);paused=false;pauseBtn.querySelector('span').textContent='⏸ Pause';}else{typeof e.pause==='function'?e.pause():e.gameManager?.toggleMainLoop?.(0);paused=true;pauseBtn.querySelector('span').textContent='▶ Resume';}setControlStatus(paused?'Emulation paused.':'Emulation resumed.',paused?'info':'good');}catch{setControlStatus('Could not change pause state.','warn');}});
fastForwardBtn.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{fastForward=!fastForward;e.gameManager.setFastForwardRatio?.(3);e.gameManager.toggleFastForward?.(fastForward);fastForwardBtn.classList.toggle('active-toggle',fastForward);fastForwardBtn.querySelector('span').textContent=fastForward?'⏩ Fast Forward ON':'⏩ Fast Forward';setControlStatus(fastForward?'Fast forward enabled at 3× speed.':'Fast forward disabled.','good');}catch{setControlStatus('Fast forward could not be changed.','warn');}});
resetBtn.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{e.gameManager.restart();paused=false;fastForward=false;pauseBtn.querySelector('span').textContent='⏸ Pause';fastForwardBtn.classList.remove('active-toggle');fastForwardBtn.querySelector('span').textContent='⏩ Fast Forward';setControlStatus('GBA reset.','good');}catch{setControlStatus('Reset failed.','warn');}});
fullscreenBtn.addEventListener('click',async()=>{const e=getEmulator();if(!gameReady)return;try{if(e&&typeof e.toggleFullscreen==='function')e.toggleFullscreen(!document.fullscreenElement);else if(!document.fullscreenElement)await emuStage.requestFullscreen();else await document.exitFullscreen();}catch{setControlStatus('Fullscreen could not be changed.','warn');}});
screenshotBtn.addEventListener('click',async()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const bytes=await e.gameManager.screenshot();if(!bytes)throw 0;downloadBytes(bytes,`${currentGameName}_screenshot.png`,'image/png');setControlStatus('Screenshot downloaded.','good');}catch{setControlStatus('Screenshot failed.','warn');}});
exportSaveBtn.addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const save=e.gameManager.getSaveFile();if(!save||!save.length){setControlStatus('No battery save exists yet.','warn');return;}downloadBytes(save,`${currentGameName}.sav`);setControlStatus(`Exported ${currentGameName}.sav.`,'good');}catch{setControlStatus('Could not export the battery save.','warn');}});
saveInput.addEventListener('change',async()=>{const file=saveInput.files&&saveInput.files[0];saveInput.value='';const e=getEmulator();if(!file||!gameReady||!e?.gameManager)return;try{const bytes=new Uint8Array(await file.arrayBuffer()),gm=e.gameManager,path=gm.getSaveFilePath();gm.writeFile(path,bytes);gm.loadSaveFiles();gm.FS?.syncfs?.(false,()=>{});setControlStatus(`Imported ${file.name}. Reset if needed.`,'good');}catch{setControlStatus('Could not import that save file.','warn');}});

stateSlots.forEach(slot=>{const n=slot.dataset.slot;slot.querySelector('.save-state-btn').addEventListener('click',async()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const state=e.gameManager.getState();if(!state)throw 0;setControlStatus(`Saving state to Slot ${n}…`);const thumb=await captureThumb(e);localStorage.setItem(stateKey(n),JSON.stringify({savedAt:Date.now(),state:bytesToBase64(state),thumb}));renderStateSlots();setControlStatus(`Saved state to Slot ${n}.`,'good');}catch(err){console.error(err);setControlStatus('Could not save state. Browser storage may be full.','warn');}});slot.querySelector('.load-state-btn').addEventListener('click',()=>{const e=getEmulator();if(!gameReady||!e?.gameManager)return;try{const raw=localStorage.getItem(stateKey(n));if(!raw){setControlStatus(`Slot ${n} is empty.`,'warn');return;}const data=JSON.parse(raw);e.gameManager.loadState(base64ToBytes(data.state));setControlStatus(`Loaded state from Slot ${n}.`,'good');}catch(err){console.error(err);setControlStatus('Could not load that save state.','warn');}});});

function getPads(){return navigator.getGamepads?navigator.getGamepads():[];}
function getActivePad(){const pads=getPads();if(activeGamepadIndex>=0&&pads[activeGamepadIndex])return pads[activeGamepadIndex];for(const p of pads)if(p)return p;return null;}
function shortPadName(id){return (id||'Controller').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim().slice(0,55);}
function readControllerProfile(id){try{return JSON.parse(localStorage.getItem(controllerKey(id))||'null');}catch{return null;}}
function saveControllerProfile(){if(!activeGamepadId||!controllerMapping)return;localStorage.setItem(controllerKey(activeGamepadId),JSON.stringify(controllerMapping));}
function inputLabel(binding){if(!binding)return 'Not mapped';if(binding.type==='button')return `Button ${binding.index}`;return `Axis ${binding.index} ${binding.sign>0?'+':'−'}`;}
function renderControllerSummary(){
  if(!activeGamepadId){mappingSummary.className='mapping-summary empty-state';mappingSummary.textContent='Press any controller button once so the browser can detect it.';return;}
  mappingSummary.className='mapping-summary';
  mappingSummary.innerHTML=GBA_INPUTS.map(x=>`<div class="mapping-chip"><strong>${x.label}</strong><span>${inputLabel(controllerMapping?.[x.key])}</span></div>`).join('');
}
function activatePad(p){
  if(!p)return;
  const changed=p.index!==activeGamepadIndex||p.id!==activeGamepadId;
  activeGamepadIndex=p.index;activeGamepadId=p.id||`gamepad-${p.index}`;
  if(changed){controllerMapping=readControllerProfile(activeGamepadId);lastMappedStates={};}
  controllerStatus.textContent=`${shortPadName(p.id)}${controllerMapping?' • mapped':' • needs mapping'}`;
  mapControllerBtn.disabled=false;resetControllerBtn.disabled=!controllerMapping;renderControllerSummary();
}
function detectAnyPad(){const pads=getPads();for(const p of pads){if(!p)continue;if(p.buttons.some(b=>b.pressed||b.value>.55)||p.axes.some(a=>Math.abs(a)>.65)){activatePad(p);return p;}}return getActivePad();}
function bindingActive(p,b){if(!p||!b)return false;if(b.type==='button')return !!p.buttons[b.index]&&(p.buttons[b.index].pressed||p.buttons[b.index].value>.55);const v=p.axes[b.index]||0;return b.sign>0?v>.55:v<-.55;}
function allNeutral(p){return p&&p.buttons.every(b=>!b.pressed&&b.value<.35)&&p.axes.every(a=>Math.abs(a)<.45);}
function detectBinding(p){
  for(let i=0;i<p.buttons.length;i++){const b=p.buttons[i];if(b.pressed||b.value>.65)return{type:'button',index:i};}
  for(let i=0;i<p.axes.length;i++){const v=p.axes[i];if(Math.abs(v)>.7)return{type:'axis',index:i,sign:v>0?1:-1};}
  return null;
}
function updateMappingDialog(){const item=GBA_INPUTS[mappingIndex];mappingStep.textContent=`${mappingIndex+1} / ${GBA_INPUTS.length}`;mappingPrompt.textContent=`Press the control for ${item.label}`;mappingHint.textContent='Release all controls, then press the button or direction you want to use.';mappingBackBtn.disabled=mappingIndex===0;mappingArmed=false;}
function beginMapping(){const p=getActivePad();if(!p)return;activatePad(p);mappingDraft={...(controllerMapping||{})};mappingIndex=0;mappingActive=true;mappingOverlay.classList.remove('hidden');updateMappingDialog();}
function finishMapping(){controllerMapping=mappingDraft;saveControllerProfile();mappingActive=false;mappingOverlay.classList.add('hidden');resetControllerBtn.disabled=false;controllerStatus.textContent=`${shortPadName(activeGamepadId)} • mapped`;renderControllerSummary();setControlStatus('Controller mapping saved and active.','good');lastMappedStates={};}
function cancelMapping(){mappingActive=false;mappingOverlay.classList.add('hidden');mappingDraft={};renderControllerSummary();}
function advanceMapping(binding){mappingDraft[GBA_INPUTS[mappingIndex].key]=binding;mappingIndex++;if(mappingIndex>=GBA_INPUTS.length)finishMapping();else updateMappingDialog();}

mapControllerBtn.addEventListener('click',beginMapping);
resetControllerBtn.addEventListener('click',()=>{if(!activeGamepadId)return;localStorage.removeItem(controllerKey(activeGamepadId));controllerMapping=null;lastMappedStates={};resetControllerBtn.disabled=true;controllerStatus.textContent=`${shortPadName(activeGamepadId)} • needs mapping`;renderControllerSummary();setControlStatus('Saved mapping cleared.','info');});
mappingCancelBtn.addEventListener('click',cancelMapping);
mappingSkipBtn.addEventListener('click',()=>{if(!mappingActive)return;delete mappingDraft[GBA_INPUTS[mappingIndex].key];mappingIndex++;if(mappingIndex>=GBA_INPUTS.length)finishMapping();else updateMappingDialog();});
mappingBackBtn.addEventListener('click',()=>{if(!mappingActive||mappingIndex===0)return;mappingIndex--;updateMappingDialog();});
window.addEventListener('gamepadconnected',e=>activatePad(e.gamepad));
window.addEventListener('gamepaddisconnected',e=>{if(e.gamepad.index===activeGamepadIndex){activeGamepadIndex=-1;activeGamepadId='';controllerMapping=null;lastMappedStates={};controllerStatus.textContent='No controller detected';mapControllerBtn.disabled=true;resetControllerBtn.disabled=true;renderControllerSummary();}});

function controllerLoop(){
  const p=detectAnyPad();
  if(mappingActive&&p){
    if(!mappingArmed){if(allNeutral(p))mappingArmed=true;}
    else{const b=detectBinding(p);if(b){mappingArmed=false;advanceMapping(b);}}
  }else if(p&&controllerMapping&&gameReady){
    const gm=getEmulator()?.gameManager;
    if(gm?.simulateInput){
      for(const input of GBA_INPUTS){const binding=controllerMapping[input.key];if(!binding)continue;const on=bindingActive(p,binding),prev=!!lastMappedStates[input.key];if(on!==prev){gm.simulateInput(0,input.ejs,on?1:0);lastMappedStates[input.key]=on;}}
    }
  }
  requestAnimationFrame(controllerLoop);
}

romInput.addEventListener('change',()=>{const f=romInput.files&&romInput.files[0];if(f)startRom(f)});['dragenter','dragover'].forEach(type=>romDrop.addEventListener(type,e=>{e.preventDefault();romDrop.classList.add('dragging')}));['dragleave','drop'].forEach(type=>romDrop.addEventListener(type,e=>{e.preventDefault();romDrop.classList.remove('dragging')}));romDrop.addEventListener('drop',e=>{const f=[...e.dataTransfer.files].find(validRom);if(f)startRom(f);else setEmuStatus('Drop a .gba ROM file here.')});chooseAnotherBtn.addEventListener('click',()=>location.reload());window.addEventListener('beforeunload',()=>{if(romObjectUrl)URL.revokeObjectURL(romObjectUrl)});setControlsEnabled(false);renderControllerSummary();controllerLoop();