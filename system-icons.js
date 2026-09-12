// Build 68: full-color Iconic ES system artwork with local vector fallbacks.
(()=>{
 const ROOT='https://raw.githubusercontent.com/Delgan/iconic-es/main/_inc/logos-svg/';
 const logos={
  '3do.html':'3do.svg','amiga.html':'amiga.svg','amstrad.html':'amstradcpc.svg','arcade.html':'fbneo.svg',
  'atari.html':'atari2600.svg','atari5200.html':'atari5200.svg','atari7800.html':'atari7800.svg','jaguar.html':'atarijaguar.svg','lynx.html':'atarilynx.svg',
  'cdi.html':'cdi.svg','coleco.html':'colecovision.svg','commodore.html':'c64.svg','doom.html':'prboom.svg',
  'emulator.html':'gba.svg','gamegear.html':'gamegear.svg','gbc.html':'gbc.svg','genesis.html':'megadrive.svg','mastersystem.html':'mastersystem.svg',
  'nes.html':'nes.svg','n64.html':'n64.svg','nds.html':'nds.svg','ps1.html':'psx.svg','psp.html':'psp.svg',
  'sega32x.html':'sega32x.svg','segacd.html':'segacd.svg','saturn.html':'saturn.svg','snes.html':'snes.svg','turbografx.html':'pcengine.svg',
  'wonderswan.html':'wonderswancolor.svg','zx81.html':'zx81.svg','zxspectrum.html':'zxspectrum.svg'
 };
 const defs={
  '3do.html':['3DO','disc'],'amiga.html':['A','computer'],'amstrad.html':['CPC','computer'],'arcade.html':['AR','arcade'],'atari.html':['2600','atari'],'atari5200.html':['5200','atari'],'atari7800.html':['7800','atari'],'jaguar.html':['JAG','atari'],'lynx.html':['LYNX','handheld'],'cdi.html':['CD-i','disc'],'coleco.html':['CV','console'],'commodore.html':['C64','computer'],'doom.html':['DOOM','arcade'],'emulator.html':['GBA','handheld'],'gamegear.html':['GG','handheld'],'gbc.html':['GB','handheld'],'genesis.html':['MD','console'],'mame.html':['MAME','arcade'],'mastersystem.html':['MS','console'],'ngp.html':['NGP','handheld'],'nes.html':['NES','console'],'n64.html':['N64','cube'],'nds.html':['DS','dual'],'ps1.html':['PS','disc'],'psp.html':['PSP','handheld'],'sega32x.html':['32X','console'],'segacd.html':['SCD','disc'],'saturn.html':['SAT','disc'],'snes.html':['SNES','console'],'turbografx.html':['PCE','console'],'virtualboy.html':['VB','visor'],'wonderswan.html':['WS','handheld'],'zx81.html':['ZX81','computer'],'zxspectrum.html':['ZX','computer']};
 function keyFor(href){return (href||'').split('?')[0].split('/').pop()||''}
 function shape(type){switch(type){
  case'handheld':return '<rect x="8" y="15" width="48" height="34" rx="10"/><rect x="19" y="21" width="19" height="14" rx="2" class="screen"/><circle cx="46" cy="30" r="3" class="detail"/><circle cx="52" cy="25" r="3" class="detail"/>';
  case'computer':return '<rect x="10" y="10" width="44" height="30" rx="4"/><rect x="16" y="16" width="32" height="17" rx="2" class="screen"/><path d="M18 46h28M25 40v6M39 40v6"/>';
  case'arcade':return '<path d="M18 8h28l5 16-4 32H17l-4-32z"/><rect x="20" y="15" width="24" height="14" rx="2" class="screen"/><circle cx="37" cy="40" r="3" class="detail"/><circle cx="44" cy="43" r="3" class="detail"/><path d="M24 38v10M19 43h10"/>';
  case'disc':return '<circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="7" class="screen"/><circle cx="32" cy="32" r="2" class="detail"/>';
  case'atari':return '<path d="M32 8c0 18-7 31-18 45M32 8c0 18 7 31 18 45M24 12c0 12-4 22-11 31M40 12c0 12 4 22 11 31"/>';
  case'dual':return '<rect x="12" y="6" width="40" height="52" rx="7"/><rect x="18" y="12" width="28" height="16" rx="2" class="screen"/><rect x="18" y="35" width="28" height="16" rx="2" class="screen"/>';
  case'visor':return '<path d="M8 23c7-9 41-9 48 0l-5 19c-5 6-14 7-19 1-5 6-14 5-19-1z"/><circle cx="22" cy="31" r="6" class="screen"/><circle cx="42" cy="31" r="6" class="screen"/>';
  case'cube':return '<path d="M32 7l21 12v25L32 57 11 44V19z"/><path d="M11 19l21 12 21-12M32 31v26"/>';
  default:return '<rect x="7" y="17" width="50" height="30" rx="8"/><circle cx="45" cy="32" r="4" class="detail"/><path d="M18 32h12M24 26v12"/>';
 }}
 function fallback(href){const key=keyFor(href),d=defs[key]||['PP','console'],small=d[0].length>3;return `<svg class="system-svg" viewBox="0 0 64 64" aria-hidden="true"><g class="system-device">${shape(d[1])}</g><text x="32" y="61" text-anchor="middle" class="system-code${small?' small':''}">${d[0]}</text></svg>`}
 function forHref(href){const key=keyFor(href),file=logos[key];if(!file)return `<span class="system-fallback">${fallback(href)}</span>`;return `<img class="system-logo-img" src="${ROOT}${file}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="system-fallback" hidden>${fallback(href)}</span>`}
 function hydrate(root=document){root.querySelectorAll?.('.system-logo-img').forEach(img=>{if(img.dataset.ppHydrated)return;img.dataset.ppHydrated='1';img.addEventListener('error',()=>{img.hidden=true;const fb=img.nextElementSibling;if(fb)fb.hidden=false},{once:true})})}
 function install(){document.querySelectorAll('.system-card').forEach(card=>{const slot=card.querySelector('.icon');if(slot){slot.classList.add('system-icon','system-icon-art');slot.innerHTML=forHref(card.getAttribute('href'))}});hydrate(document)}
 window.PixelPlayerSystemIcon={forHref,hydrate,install,hasArtwork:href=>!!logos[keyFor(href)]};
 install();
})();