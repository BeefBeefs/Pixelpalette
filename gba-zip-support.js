// Build 71: transparent ZIP support for GBA picks and folder-library launches.
(()=>{
  if(window.PixelPlayerGbaArchive)return;
  const romInput=document.getElementById('romInput'),folderInput=document.getElementById('romFolderInput');
  if(romInput)romInput.accept='.gba,.zip,application/zip,application/octet-stream';
  if(folderInput)folderInput.accept='.gba,.zip,application/zip,application/octet-stream';
  let zipPromise=null,busy=false;
  function status(text){const el=document.getElementById('emuStatus');if(el)el.textContent=text}
  function loadZip(){if(window.zip?.ZipReader)return Promise.resolve();if(zipPromise)return zipPromise;zipPromise=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@zip.js/zip.js@2.7.57/dist/zip.min.js';s.onload=res;s.onerror=()=>rej(new Error('ZIP reader failed to load'));document.head.appendChild(s)});return zipPromise}
  async function extract(file){
    await loadZip();
    const reader=new zip.ZipReader(new zip.BlobReader(file));
    try{
      const entries=await reader.getEntries();
      const gba=entries.find(e=>!e.directory&&/\.gba$/i.test(e.filename||''));
      if(!gba)throw new Error('No .gba ROM was found inside this ZIP.');
      const blob=await gba.getData(new zip.BlobWriter('application/octet-stream'));
      const name=(gba.filename||file.name.replace(/\.zip$/i,'.gba')).split('/').pop()||'game.gba';
      return new File([blob],name,{type:'application/octet-stream',lastModified:file.lastModified||Date.now()});
    }finally{try{await reader.close()}catch{}}
  }
  async function open(file){
    if(!file)return;
    if(/\.gba$/i.test(file.name||'')){window.startRom?.(file);return}
    if(!/\.zip$/i.test(file.name||'')){status('Please choose a .gba or .zip GBA ROM.');return}
    if(busy)return;busy=true;
    try{status(`Opening ${file.name}…`);const gba=await extract(file);status(`Extracted ${gba.name}. Starting mGBA…`);window.startRom?.(gba)}
    catch(err){console.warn('GBA ZIP launch failed',err);status(err?.message||'Could not open that ZIP archive.')}
    finally{busy=false}
  }
  document.addEventListener('change',e=>{
    const input=e.target;if(input?.id!=='romInput'||!input.files?.length)return;
    const file=input.files[0];if(!/\.zip$/i.test(file.name||''))return;
    e.preventDefault();e.stopImmediatePropagation();input.value='';open(file);
  },true);
  window.PixelPlayerGbaArchive={open,extract};
})();