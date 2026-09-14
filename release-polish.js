// Build 139: presentation-only release polish. No emulator-core behavior lives here.
(()=>{
 const body=document.body;
 const system=(body.dataset.system||'').toLowerCase();
 const accents={gba:'#9b6be8',gbc:'#88d05f',nes:'#e05b5b',snes:'#a885e8',n64:'#e2c84e',ps1:'#8da0b8',psp:'#91a9d8',nds:'#9ca7b2',genesis:'#6d8fe8',gamegear:'#4ea0dc',mastersystem:'#db5b5b',segacd:'#4f8cd8',sega32x:'#d9a046',saturn:'#8f82cf',atari:'#e15b5b',atari5200:'#dd6666',atari7800:'#d15b5b',jaguar:'#d49347',lynx:'#d5b15f',virtualboy:'#d94a4a',arcade:'#de7c3f',mame:'#d67640',turbografx:'#e7e7e7',ngp:'#b8bcc0',wonderswan:'#dfe3e5',coleco:'#8fc96b',commodore:'#6f8ed7',amiga:'#d05c5c',zxspectrum:'#76c75d',zx81:'#c8c8c8',amstrad:'#62a2df',doom:'#c85745',cdi:'#5f9ad9','3do':'#d6b053',pcfx:'#d5d5d5'};
 if(system)document.documentElement.style.setProperty('--system-accent',accents[system]||'#9be33a');

 const tabIcons={play:'▶',roms:'▦',saves:'▣',controller:'✚',info:'i'};
 document.querySelectorAll('.emulator-subtab[data-tab]').forEach(btn=>{
   if(btn.querySelector('.pp-tab-icon'))return;
   const icon=document.createElement('span');icon.className='pp-tab-icon';icon.setAttribute('aria-hidden','true');icon.textContent=tabIcons[btn.dataset.tab]||'•';btn.prepend(icon);
 });

 const dangerIds=['clearRomLibraryBtn','clearRecentRomsBtn','resetCurrentLayoutBtn','resetControlLayoutBtn'];
 dangerIds.forEach(id=>document.getElementById(id)?.classList.add('danger'));
 const dangerObserver=new MutationObserver(()=>dangerIds.forEach(id=>document.getElementById(id)?.classList.add('danger')));
 if(body.classList.contains('emulator-page'))dangerObserver.observe(body,{childList:true,subtree:true});

 function empty(el,icon,title,copy){if(!el||el.dataset.ppEmptyPolished)return;el.dataset.ppEmptyPolished='1';el.classList.add('pp-empty-polish');el.innerHTML=`<div><span class="pp-empty-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><small>${copy}</small></div>`}
 const lib=document.getElementById('romLibraryList');if(lib?.classList.contains('empty-state'))empty(lib,'▦','No games indexed yet','Choose a game folder above and PixelPlayer will build your library here.');
 const recent=document.getElementById('recentRoms');if(recent?.classList.contains('empty-state'))empty(recent,'▶','Nothing played yet','Games you launch on this system will appear here for quick access.');
 const mapping=document.querySelector('.mapping-summary.empty-state');if(mapping)empty(mapping,'✚','No controller detected','Connect a gamepad and press any button to detect it.');

 const clearLibrary=document.getElementById('clearRomLibraryBtn');if(clearLibrary)clearLibrary.textContent='Clear Library';
 const openHeading=document.querySelector('[data-panel="roms"] .rom-loader .card-heading h2');if(openHeading&&/^Open /.test(openHeading.textContent))openHeading.textContent=openHeading.textContent.replace(/^Open /,'Choose ');

 function dashboardPolish(){
   const grid=document.querySelector('.system-grid');if(!grid)return;
   if(!grid.querySelector('a[href*="gamecube.html"]')){const card=document.createElement('a');card.className='system-card';card.href='gamecube.html?v=139';card.dataset.search='gamecube nintendo gecko webgpu wasm experimental';card.innerHTML='<span class="icon">🟦</span><strong>GameCube / Gecko</strong><small>Experimental WebGPU test</small><span class="launch">TEST →</span>';grid.appendChild(card)}
   if(!grid.querySelector('a[href*="dreamcast.html"]')){const card=document.createElement('a');card.className='system-card';card.href='dreamcast.html?v=139';card.dataset.search='dreamcast sega flycast wasm experimental';card.innerHTML='<span class="icon">🌀</span><strong>Dreamcast / Flycast</strong><small>Experimental WASM test</small><span class="launch">TEST →</span>';grid.appendChild(card)}
   const cards=[...grid.querySelectorAll('.system-card:not(.tool-card)')];
   const search=document.getElementById('systemSearch'),count=document.getElementById('visibleSystemCount'),emptySearch=document.getElementById('emptySearch');
    const catFor=href=>{href=(href||'').split('?')[0];if(['emulator.html','gbc.html','nes.html','snes.html','n64.html','nds.html','virtualboy.html'].includes(href))return'Nintendo';if(['genesis.html','gamegear.html','mastersystem.html','segacd.html','sega32x.html','saturn.html','dreamcast.html'].includes(href))return'Sega';if(['ps1.html','psp.html'].includes(href))return'Sony';if(['atari.html','atari5200.html','atari7800.html','jaguar.html','lynx.html'].includes(href))return'Atari';if(['amiga.html','amstrad.html','commodore.html','zxspectrum.html','zx81.html'].includes(href))return'Computers';if(['arcade.html','mame.html'].includes(href))return'Arcade';return'Other'};
   cards.forEach(c=>c.dataset.category=catFor(c.getAttribute('href')));
   let active='All';
   const bar=document.createElement('div');bar.className='system-filter-bar';bar.setAttribute('aria-label','Filter systems');
   ['All','Nintendo','Sega','Sony','Atari','Computers','Arcade','Other'].forEach(cat=>{const b=document.createElement('button');b.type='button';b.className='system-filter-chip'+(cat==='All'?' active':'');b.textContent=cat;b.dataset.category=cat;b.addEventListener('click',()=>{active=cat;bar.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));apply()});bar.appendChild(b)});
   grid.insertAdjacentElement('beforebegin',bar);
   function apply(){const q=(search?.value||'').trim().toLowerCase();let visible=0;cards.forEach(c=>{const matchesSearch=!q||(c.dataset.search||c.textContent).toLowerCase().includes(q);const matchesCat=active==='All'||c.dataset.category===active;const show=matchesSearch&&matchesCat;c.hidden=!show;if(show)visible++});if(count)count.textContent=`${visible} shown`;if(emptySearch)emptySearch.style.display=visible?'none':'block'}
   search?.addEventListener('input',()=>queueMicrotask(apply));apply();
   document.querySelectorAll('.continue-open').forEach(x=>x.textContent='CONTINUE →');
   const splash=document.getElementById('launchSplash');if(splash)setTimeout(()=>{splash.classList.add('pp-hide');setTimeout(()=>splash.remove(),280)},620);
   try{if(localStorage.getItem('pixelplayer:onboarding:v1')!=='1')showOnboarding()}catch{showOnboarding()}
 }
 function showOnboarding(){if(document.getElementById('ppOnboarding'))return;const o=document.createElement('div');o.id='ppOnboarding';o.className='pp-onboarding';o.innerHTML=`<div class="pp-onboarding-card"><div class="pp-onboarding-mark"><img src="icons/pixelplayer-icon.svg?v=139" alt=""></div><h2>Welcome to PixelPlayer</h2><p>Three quick steps and you're ready to play.</p><div class="pp-steps"><div class="pp-step"><span class="pp-step-num">1</span><div><strong>Choose a system</strong><small>Pick the console you want to play.</small></div></div><div class="pp-step"><span class="pp-step-num">2</span><div><strong>Choose your ROM folder</strong><small>Your game files stay on this device.</small></div></div><div class="pp-step"><span class="pp-step-num">3</span><div><strong>Play</strong><small>Launch a game and PixelPlayer remembers your library.</small></div></div></div><div class="pp-onboarding-actions"><button class="primary" id="ppOnboardingGo" type="button">Let's Go</button><button class="secondary" id="ppOnboardingSkip" type="button">Skip</button></div></div>`;body.appendChild(o);const close=()=>{try{localStorage.setItem('pixelplayer:onboarding:v1','1')}catch{}o.remove()};o.querySelector('#ppOnboardingGo').addEventListener('click',()=>{close();document.getElementById('systems')?.scrollIntoView({behavior:'smooth',block:'start'})});o.querySelector('#ppOnboardingSkip').addEventListener('click',close)}
 if(document.querySelector('.system-grid'))dashboardPolish();
})();
