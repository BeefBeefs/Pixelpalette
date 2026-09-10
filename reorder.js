let draggedPaletteIndex=-1;

function rebuildSharedPaletteCache(){
  sharedPalette=sharedEntries.filter(Boolean);
}

function rewriteImageIndicesForSwap(a,b){
  for(const item of items){
    if(!item.result) continue;
    const indices=item.result.indices;
    for(let i=0;i<indices.length;i++){
      if(indices[i]===a) indices[i]=b;
      else if(indices[i]===b) indices[i]=a;
    }
  }
}

function redrawResultsFromIndices(){
  for(const item of items){
    if(!item.result) continue;
    const r=item.result,out=new ImageData(r.width,r.height);
    for(let p=0;p<r.indices.length;p++){
      const idx=r.indices[p],o=p*4;
      if(hasSharedTransparency&&idx===0){out.data[o+3]=0;continue}
      const c=sharedEntries[idx]||[0,0,0];
      out.data[o]=c[0];out.data[o+1]=c[1];out.data[o+2]=c[2];out.data[o+3]=255;
    }
    r.imageData=out;
  }
  if(selectedIndex>=0) selectItem(selectedIndex);
}

function swapPaletteEntries(a,b){
  if(a===b||a<0||b<0||a>=sharedEntries.length||b>=sharedEntries.length) return;
  if(hasSharedTransparency&&(a===0||b===0)){
    setStatus('Palette index 0 is reserved for transparency and cannot be moved.','warn');
    return;
  }
  [sharedEntries[a],sharedEntries[b]]=[sharedEntries[b],sharedEntries[a]];
  const aLocked=locked.has(a),bLocked=locked.has(b);
  if(aLocked) locked.delete(a); if(bLocked) locked.delete(b);
  if(aLocked) locked.add(b); if(bLocked) locked.add(a);
  if(editingIndex===a) editingIndex=b; else if(editingIndex===b) editingIndex=a;
  rewriteImageIndicesForSwap(a,b);
  rebuildSharedPaletteCache();
  redrawResultsFromIndices();
  renderPalette();
  if(editingIndex>=0&&sharedEntries[editingIndex]) openEditor(editingIndex);
  setStatus(`Moved palette colors between indices ${a} and ${b} without changing image appearance.`,'good');
}

function movePaletteEntry(from,to){
  if(from===to||from<0||to<0||from>=sharedEntries.length||to>=sharedEntries.length) return;
  const step=from<to?1:-1;
  let cur=from;
  while(cur!==to){swapPaletteEntries(cur,cur+step);cur+=step}
}

const baseRenderPalette=renderPalette;
renderPalette=function(){
  baseRenderPalette();
  [...paletteGrid.querySelectorAll('.swatch')].forEach((swatch,i)=>{
    swatch.draggable=!(hasSharedTransparency&&i===0);
    swatch.dataset.paletteIndex=i;
    swatch.classList.add('reorderable');
    swatch.addEventListener('dragstart',e=>{
      draggedPaletteIndex=i;
      swatch.classList.add('drag-source');
      e.dataTransfer.effectAllowed='move';
      e.dataTransfer.setData('text/plain',String(i));
    });
    swatch.addEventListener('dragend',()=>{
      draggedPaletteIndex=-1;
      paletteGrid.querySelectorAll('.swatch').forEach(s=>s.classList.remove('drag-source','drag-target'));
    });
    swatch.addEventListener('dragover',e=>{
      if(draggedPaletteIndex<0||draggedPaletteIndex===i) return;
      e.preventDefault();e.dataTransfer.dropEffect='move';
      paletteGrid.querySelectorAll('.swatch').forEach(s=>s.classList.remove('drag-target'));
      swatch.classList.add('drag-target');
    });
    swatch.addEventListener('drop',e=>{
      e.preventDefault();
      const from=draggedPaletteIndex>=0?draggedPaletteIndex:Number(e.dataTransfer.getData('text/plain'));
      swatch.classList.remove('drag-target');
      movePaletteEntry(from,i);
      draggedPaletteIndex=-1;
    });
  });
};

function addMobileReorderControls(){
  if(document.getElementById('paletteMoveControls')) return;
  const wrap=document.createElement('div');
  wrap.id='paletteMoveControls';wrap.className='palette-move-controls';
  const left=document.createElement('button'),right=document.createElement('button');
  left.type=right.type='button';left.className=right.className='secondary compact';
  left.textContent='← Move Left';right.textContent='Move Right →';
  left.addEventListener('click',()=>{if(editingIndex>0)swapPaletteEntries(editingIndex,editingIndex-1)});
  right.addEventListener('click',()=>{if(editingIndex>=0&&editingIndex<sharedEntries.length-1)swapPaletteEntries(editingIndex,editingIndex+1)});
  wrap.append(left,right);
  paletteEditor.appendChild(wrap);
}

addMobileReorderControls();
renderPalette();
