// Build 66: local SVG system badges used by the PixelPlayer dashboard.
(()=>{
 const defs={
  '3do.html':['3DO','disc'],'amiga.html':['A','computer'],'amstrad.html':['CPC','computer'],'arcade.html':['AR','arcade'],'atari.html':['2600','atari'],'atari5200.html':['5200','atari'],'atari7800.html':['7800','atari'],'jaguar.html':['JAG','atari'],'lynx.html':['LYNX','handheld'],'cdi.html':['CD-i','disc'],'coleco.html':['CV','console'],'commodore.html':['C64','computer'],'doom.html':['DOOM','arcade'],'emulator.html':['GBA','handheld'],'gamegear.html':['GG','handheld'],'gbc.html':['GB','handheld'],'genesis.html':['MD','console'],'mame.html':['MAME','arcade'],'mastersystem.html':['MS','console'],'ngp.html':['NGP','handheld'],'nes.html':['NES','console'],'n64.html':['N64','cube'],'nds.html':['DS','dual'],'ps1.html':['PS','disc'],'psp.html':['PSP','handheld'],'sega32x.html':['32X','console'],'segacd.html':['SCD','disc'],'saturn.html':['SAT','disc'],'snes.html':['SNES','console'],'turbografx.html':['PCE','console'],'virtualboy.html':['VB','visor'],'wonderswan.html':['WS','handheld'],'zx81.html':['ZX81','computer'],'zxspectrum.html':['ZX','computer']};
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
 function svg(label,type){const small=label.length>3;return `<svg class="system-svg" viewBox="0 0 64 64" aria-hidden="true"><g class="system-device">${shape(type)}</g><text x="32" y="61" text-anchor="middle" class="system-code${small?' small':''}">${label}</text></svg>`}
 window.PixelPlayerSystemIcon={forHref(href){const key=(href||'').split('?')[0].split('/').pop(),d=defs[key]||['PP','console'];return svg(d[0],d[1])},install(){document.querySelectorAll('.system-card').forEach(card=>{const slot=card.querySelector('.icon');if(slot){slot.classList.add('system-icon');slot.innerHTML=this.forHref(card.getAttribute('href'))}})}};
 window.PixelPlayerSystemIcon.install();
})();