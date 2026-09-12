// Build 48: system-inspired virtual controller colors without changing control geometry.
(()=>{
  const KEY='pixelplayer:virtual-controller-theme';
  const system=document.body.dataset.system||(document.body.classList.contains('n64-page')?'n64':document.body.classList.contains('ps1-page')?'ps1':document.body.classList.contains('snes-page')?'snes':'gba');
  const THEMES={
    gba:{base:'#202126',edge:'#555864',text:'#f4f4f4',accent:'#8d2347',start:'#6f727a',buttons:{A:'#8d2347',B:'#8d2347',L:'#6f727a',R:'#6f727a'}},
    gbc:{base:'#b9b8ad',edge:'#4f5158',text:'#17181b',accent:'#7b1e4a',start:'#77777d',buttons:{A:'#7b1e4a',B:'#7b1e4a'}},
    nes:{base:'#b7b7b7',edge:'#393939',text:'#111',accent:'#a61c2b',start:'#555',buttons:{A:'#b51f2e',B:'#b51f2e'}},
    snes:{base:'#d1d0d6',edge:'#55525f',text:'#202027',accent:'#6e48a8',start:'#77727f',buttons:{A:'#6a3da5',B:'#6a3da5',X:'#9b78c7',Y:'#9b78c7'}},
    n64:{base:'#b8b9bc',edge:'#4c4f52',text:'#17191b',accent:'#159447',start:'#777b7f',buttons:{A:'#2f63b5',B:'#2a9c4a','Z':'#777b7f',START:'#d9483b',C:'#e4c126'}},
    nds:{base:'#c9c9c9',edge:'#575757',text:'#171717',accent:'#777',start:'#777',buttons:{A:'#777',B:'#777',X:'#777',Y:'#777'}},
    ps1:{base:'#b5b5b7',edge:'#515156',text:'#17171b',accent:'#666',start:'#777',buttons:{TRIANGLE:'#33a56d','△':'#33a56d',CIRCLE:'#d64a58','○':'#d64a58','O':'#d64a58',CROSS:'#5079bf','×':'#5079bf','X':'#5079bf',SQUARE:'#d85b91','□':'#d85b91'}},
    psp:{base:'#1b1b1d',edge:'#777',text:'#f4f4f4',accent:'#555',start:'#4a4a4d',buttons:{TRIANGLE:'#404247','△':'#404247',CIRCLE:'#404247','○':'#404247',CROSS:'#404247','×':'#404247',X:'#404247',SQUARE:'#404247','□':'#404247'}},
    genesis:{base:'#1c1c1f',edge:'#55565b',text:'#fff',accent:'#c42031',start:'#c42031',buttons:{A:'#38383c',B:'#38383c',C:'#38383c',X:'#38383c',Y:'#38383c',Z:'#38383c'}},
    gamegear:{base:'#17191c',edge:'#53565c',text:'#fff',accent:'#3c72bc',start:'#555',buttons:{1:'#bd3445',2:'#bd3445'}},
    mastersystem:{base:'#e4e4e2',edge:'#444',text:'#111',accent:'#c9212e',start:'#555',buttons:{1:'#c9212e',2:'#c9212e'}},
    segacd:{base:'#1d1d20',edge:'#56575c',text:'#fff',accent:'#c42031',start:'#c42031',buttons:{A:'#38383c',B:'#38383c',C:'#38383c'}},
    sega32x:{base:'#1d1d20',edge:'#56575c',text:'#fff',accent:'#c42031',start:'#c42031',buttons:{A:'#38383c',B:'#38383c',C:'#38383c'}},
    saturn:{base:'#d8d8d5',edge:'#555',text:'#111',accent:'#2a65a6',start:'#777',buttons:{A:'#2b6db0',B:'#db3c44',C:'#e6c23c',X:'#78a5cf',Y:'#6d7278',Z:'#72a16a'}},
    atari2600:{base:'#2b241d',edge:'#111',text:'#f1e5ce',accent:'#d46a24',start:'#5b4a39',buttons:{FIRE:'#d46a24'}},
    atari5200:{base:'#252525',edge:'#555',text:'#fff',accent:'#d96b24',start:'#555',buttons:{}},
    atari7800:{base:'#202020',edge:'#555',text:'#fff',accent:'#cf2f35',start:'#555',buttons:{1:'#cf2f35',2:'#cf2f35'}},
    jaguar:{base:'#252525',edge:'#606060',text:'#fff',accent:'#c92c35',start:'#555',buttons:{A:'#c92c35',B:'#c92c35',C:'#c92c35'}},
    lynx:{base:'#353535',edge:'#777',text:'#fff',accent:'#d66c26',start:'#666',buttons:{A:'#d66c26',B:'#d66c26'}},
    virtualboy:{base:'#161616',edge:'#7b1118',text:'#ff3944',accent:'#b21620',start:'#741118',buttons:{A:'#b21620',B:'#b21620'}},
    threeDO:{base:'#d9d9d7',edge:'#555',text:'#111',accent:'#3a7d44',start:'#777',buttons:{A:'#b43132',B:'#2f66a3',C:'#d2ad31'}},
    arcade:{base:'#242424',edge:'#606060',text:'#fff',accent:'#c92e3b',start:'#555',buttons:{A:'#cf3340',B:'#e4c63c',C:'#3b9e5c',D:'#3c6fbd'}},
    mame:{base:'#242424',edge:'#606060',text:'#fff',accent:'#c92e3b',start:'#555',buttons:{A:'#cf3340',B:'#e4c63c',C:'#3b9e5c',D:'#3c6fbd'}},
    turbografx:{base:'#e3e3df',edge:'#555',text:'#111',accent:'#d32e36',start:'#777',buttons:{I:'#d32e36',II:'#d32e36'}},
    ngp:{base:'#3b3b3d',edge:'#777',text:'#fff',accent:'#4b8cc4',start:'#666',buttons:{A:'#4b8cc4',B:'#4b8cc4'}},
    wonderswan:{base:'#d6d6d2',edge:'#666',text:'#111',accent:'#557d9d',start:'#777',buttons:{A:'#557d9d',B:'#557d9d'}},
    coleco:{base:'#222',edge:'#555',text:'#fff',accent:'#e2bd2d',start:'#555',buttons:{1:'#e2bd2d',2:'#e2bd2d'}},
    commodore:{base:'#c8c3a9',edge:'#58564c',text:'#171714',accent:'#6b6a5e',start:'#777',buttons:{}},
    amiga:{base:'#d6d2c7',edge:'#56544f',text:'#171714',accent:'#777',start:'#777',buttons:{}},
    zxspectrum:{base:'#1d1d1d',edge:'#555',text:'#fff',accent:'#d63b42',start:'#555',buttons:{}},
    zx81:{base:'#e8e5dc',edge:'#555',text:'#111',accent:'#777',start:'#777',buttons:{}},
    amstrad:{base:'#d5d2c7',edge:'#555',text:'#111',accent:'#d04444',start:'#777',buttons:{}},
    doom:{base:'#292521',edge:'#594b3e',text:'#f0dfc4',accent:'#8d2d2a',start:'#5b4a3d',buttons:{}},
    cdi:{base:'#d2d1cc',edge:'#555',text:'#111',accent:'#297da0',start:'#777',buttons:{}},
    pcfx:{base:'#e4e4e2',edge:'#555',text:'#111',accent:'#3980b8',start:'#777',buttons:{I:'#3980b8',II:'#3980b8'}}
  };
  const GREEN={base:'#182019',edge:'#5a773f',text:'#f4f7f4',accent:'#9be33a',start:'#45612e',buttons:{}};
  const MONO={base:'#4b4b4b',edge:'#777',text:'#fff',accent:'#666',start:'#666',buttons:{}};
  function mode(){try{return localStorage.getItem(KEY)||'system'}catch{return 'system'}}
  function palette(){return mode()==='green'?GREEN:mode()==='mono'?MONO:(THEMES[system]||{base:'#333',edge:'#666',text:'#fff',accent:'#777',start:'#666',buttons:{}})}
  function norm(text){return (text||'').trim().toUpperCase().replace(/\s+/g,' ')}
  function buttonColor(p,label){if(mode()!=='system')return p.accent;for(const [key,val] of Object.entries(p.buttons||{})){if(label===key||label.includes(key))return val}if(label.includes('START')||label.includes('SELECT')||label.includes('OPTION'))return p.start;return p.accent}
  function paint(){
    const p=palette();document.body.dataset.controllerTheme=mode();
    for(const pad of document.querySelectorAll('.ejs_virtualGamepad_parent')){
      pad.style.setProperty('--pp-pad-base',p.base);pad.style.setProperty('--pp-pad-edge',p.edge);pad.style.setProperty('--pp-pad-text',p.text);pad.style.setProperty('--pp-pad-accent',p.accent);
      for(const el of pad.querySelectorAll('.ejs_virtualGamepad_button')){const c=buttonColor(p,norm(el.textContent));el.style.setProperty('background',c,'important');el.style.setProperty('background-color',c,'important');el.style.setProperty('border-color',p.edge,'important');el.style.setProperty('color',p.text,'important');el.style.setProperty('box-shadow','inset 0 -2px 0 rgba(0,0,0,.28),0 1px 3px rgba(0,0,0,.28)','important')}
      for(const el of pad.querySelectorAll('[class*="dpad"],[class*="DPad"],[class*="joystick"],[class*="stick"]')){if(el.classList.contains('ejs_virtualGamepad_button'))continue;el.style.setProperty('filter','none','important');el.style.setProperty('border-color',p.edge,'important')}
    }
  }
  const style=document.createElement('style');style.textContent=`
    .ejs_virtualGamepad_parent [class*="dpad"],.ejs_virtualGamepad_parent [class*="DPad"],.ejs_virtualGamepad_parent [class*="joystick"],.ejs_virtualGamepad_parent [class*="stick"]{--ejs-control-color:var(--pp-pad-base,#333)!important}
    .ejs_virtualGamepad_button:active{filter:brightness(1.35)!important;transform:scale(.96)}
    .controller-theme-setting{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:14px;padding:11px 12px;border:1px solid var(--border2,#344039);border-radius:12px;background:rgba(12,17,14,.55)}
    .controller-theme-setting div{display:flex;flex-direction:column;gap:3px}.controller-theme-setting strong{font-size:.84rem}.controller-theme-setting span{font-size:.7rem;color:var(--muted,#98a59c)}
    .controller-theme-setting select{min-width:175px;padding:9px 30px 9px 10px;border:1px solid var(--border2,#344039);border-radius:10px;background:#101612;color:var(--text,#f4f7f4);font:inherit;font-weight:800}
    @media(max-width:620px){.controller-theme-setting{align-items:stretch;flex-direction:column}.controller-theme-setting select{width:100%}}
  `;document.head.appendChild(style);
  function addSetting(){if(document.getElementById('controllerThemeSelect'))return;const host=document.querySelector('[data-panel="controller"] .controller-panel')||document.querySelector('[data-panel="controller"] .tab-card');if(!host)return;const row=document.createElement('label');row.className='controller-theme-setting';row.innerHTML='<div><strong>Virtual Controller Theme</strong><span>Changes colors only; layout and touch positions stay unchanged.</span></div><select id="controllerThemeSelect"><option value="system">System Colors</option><option value="green">PixelPlayer Green</option><option value="mono">Monochrome</option></select>';host.appendChild(row);const s=row.querySelector('select');s.value=mode();s.addEventListener('change',()=>{try{localStorage.setItem(KEY,s.value)}catch{}paint();window.dispatchEvent(new CustomEvent('pixelplayer:controller-theme-changed',{detail:{theme:s.value}}))})}
  const observer=new MutationObserver(()=>requestAnimationFrame(()=>{addSetting();paint()}));observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('pixelplayer:system-ready',paint);window.addEventListener('pixelplayer:n64-ready',paint);window.addEventListener('resize',()=>requestAnimationFrame(paint),{passive:true});
  window.PixelPlayerControllerTheme={get:mode,set:value=>{if(!['system','green','mono'].includes(value))return;try{localStorage.setItem(KEY,value)}catch{}const s=document.getElementById('controllerThemeSelect');if(s)s.value=value;paint()},refresh:paint};
  addSetting();paint();
})();