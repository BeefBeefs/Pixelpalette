// Build 40: shared compact top navigation.
(()=>{
  if(!document.querySelector('link[href*="nav.css?v=40"]')){const css=document.createElement('link');css.rel='stylesheet';css.href='nav.css?v=40';document.head.appendChild(css);}
  const nav=document.querySelector('.tool-tabs');if(!nav)return;
  const page=(location.pathname.split('/').pop()||'index.html').toLowerCase();
  const systems=[['emulator.html','GBA Emulator'],['snes.html','SNES Emulator'],['ps1.html','PS1 Emulator'],['n64.html','N64 Emulator']];
  const active=systems.find(([href])=>page===href);
  nav.innerHTML='';
  const palette=document.createElement('a');palette.className=`tool-tab nav-palette${page==='index.html'||page===''?' active':''}`;palette.href='index.html';palette.innerHTML='<span class="tab-dot"></span>Palette Tool';nav.appendChild(palette);
  const wrap=document.createElement('div');wrap.className=`emulator-dropdown${active?' active':''}`;
  const button=document.createElement('button');button.type='button';button.className='tool-tab emulator-dropdown-toggle';button.setAttribute('aria-haspopup','menu');button.setAttribute('aria-expanded','false');button.innerHTML=`<span class="tab-dot"></span><span>${active?active[1]:'Emulators'}</span><b aria-hidden="true">▾</b>`;
  const menu=document.createElement('div');menu.className='emulator-dropdown-menu';menu.setAttribute('role','menu');
  systems.forEach(([href,label])=>{const a=document.createElement('a');a.href=href;a.className=`emulator-dropdown-item${page===href?' active':''}`;a.setAttribute('role','menuitem');a.innerHTML=`<span class="tab-dot"></span>${label}`;menu.appendChild(a);});
  wrap.append(button,menu);nav.appendChild(wrap);
  function setOpen(open){wrap.classList.toggle('open',open);button.setAttribute('aria-expanded',open?'true':'false');}
  button.addEventListener('click',e=>{e.stopPropagation();setOpen(!wrap.classList.contains('open'));});
  document.addEventListener('click',e=>{if(!wrap.contains(e.target))setOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setOpen(false);button.focus();}});
})();