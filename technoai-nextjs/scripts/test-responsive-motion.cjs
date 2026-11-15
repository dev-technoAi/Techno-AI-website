const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { JSDOM } = require('../.theme-ui-tests/node_modules/jsdom');

// Regression checks for phone screens, enlarged copy and orientation changes.
// DOM geometry is supplied explicitly: these verify motion/sizing logic, not browser rendering.
for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390]]) {
  const dom = new JSDOM(`<html data-motion="full"><body>
    <section class="hero-scroll" data-progress><div class="hero-pin"><div class="hero-body"></div><div class="hero-cap"></div></div></section>
    <section class="hero-scroll drone-scroll" data-progress><div class="hero-pin"><div class="hero-body"></div><div class="hero-cap"></div></div></section>
    <section class="chapters" data-progress data-count="6" data-active="0"><div class="ch-pin"><div class="ch-head"></div>${Array.from({length:6},(_,i)=>`<article class="ch-panel" data-i="${i}"><video data-src="/${i}.mp4"></video><div class="ch-copy"></div></article>`).join('')}</div></section>
    <section class="hscroll" data-progress><div class="hs-pin"><div class="hs-head"></div><div class="hscroll-track"><div class="dom"><div class="dom-n"></div><div class="dom-b"></div></div></div></div></section>
    <section class="pg-hero" data-progress><div class="pg-hero-pin"><div class="pg-hero-body"></div></div></section>
  </body></html>`, {url:'http://localhost:3100',pretendToBeVisual:true});
  const w=dom.window,d=w.document;
  Object.defineProperty(w,'innerWidth',{value:width,writable:true}); Object.defineProperty(w,'innerHeight',{value:height,writable:true});
  let callbacks=[], resize, cleanup, copyHeight=250;
  w.matchMedia=()=>({matches:false});
  w.IntersectionObserver=class {observe(){}unobserve(){}disconnect(){}};
  w.ResizeObserver=class {constructor(cb){resize=cb}observe(){}disconnect(){}};
  w.requestAnimationFrame=cb=>{callbacks.push(cb);return callbacks.length}; w.cancelAnimationFrame=()=>{};
  const styles=el=>({getPropertyValue:()=> '68px',paddingTop:'86px',paddingBottom:'24px',rowGap:'18px'});
  const sections=[...d.querySelectorAll('[data-progress]')];
  sections.forEach((section,index)=>{
    const pin=section.firstElementChild;
    Object.defineProperty(pin,'clientHeight',{get:()=>Math.max(height,parseFloat(section.style.getPropertyValue('--scene-min-height'))||0)});
    section.getBoundingClientRect=()=>{const h=pin.clientHeight+height*1.6;return {top:index*10000-w.scrollY,bottom:index*10000+h-w.scrollY,height:h}};
    section.querySelectorAll('.hero-body,.hero-cap,.ch-head,.ch-copy,.hs-head,.dom-b,.dom-n,.pg-hero-body').forEach(el=>Object.defineProperty(el,'scrollHeight',{get:()=>el.matches('.ch-copy')?copyHeight:el.matches('.pg-hero-body')?700:el.matches('.ch-head,.dom-n')?32:200}));
  });
  Object.defineProperty(d.querySelector('.hscroll-track'),'scrollWidth',{value:2400});
  d.querySelectorAll('video').forEach(v=>{let paused=true;Object.defineProperty(v,'paused',{get:()=>paused});v.play=()=>{paused=false;return Promise.resolve()};v.pause=()=>{paused=true}});
  const code=ts.transpileModule(fs.readFileSync('app/redesign/motion.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const out={};
  new Function('require','exports','window','document','navigator','getComputedStyle','matchMedia','IntersectionObserver','ResizeObserver','requestAnimationFrame','cancelAnimationFrame','innerWidth','innerHeight','Event',code)(name=>name==='react'?{useEffect:fn=>{cleanup=fn()}}:name==='react/jsx-runtime'?{jsx:()=>null,jsxs:()=>null}:require(name),out,w,d,w.navigator,styles,w.matchMedia,w.IntersectionObserver,w.ResizeObserver,w.requestAnimationFrame,w.cancelAnimationFrame,width,height,w.Event);
  out.Motion();
  const frame=()=>{const batch=callbacks;callbacks=[];batch.forEach(cb=>cb(16));assert.equal(callbacks.length,0,'Touch must not run an idle loop')};
  const scroll=y=>{w.scrollY=y;w.dispatchEvent(new w.Event('scroll'));frame()};
  frame();
  const hero=sections[0], drone=sections[1], chapters=sections[2], page=sections[4];
  scroll(height*.8);assert.equal(hero.style.getPropertyValue('--p'),'0.5000');assert.equal(Number(drone.style.getPropertyValue('--p')),0);
  scroll(10000+height*.8);assert.equal(drone.style.getPropertyValue('--p'),'0.5000');
  copyHeight=480;resize();frame();
  const min=parseFloat(chapters.style.getPropertyValue('--scene-min-height'));
  assert.ok(min>=480+32+110+18+Math.min(180,width*9/16),'Complete copy plus media must fit');
  const overflow=Math.max(chapters.firstElementChild.clientHeight-height,0);
  scroll(20000+overflow/2);assert.equal(chapters.style.getPropertyValue('--p'),'0.0000','Do not transition away before oversized copy can be read');
  scroll(20000+overflow+height*.9);assert.equal(chapters.dataset.active,'3');assert.equal(d.querySelector('[data-i="3"] video').paused,false);
  scroll(20000+overflow);assert.equal(chapters.dataset.active,'0');
  const pageOverflow=Math.max(page.firstElementChild.clientHeight-height,0);
  scroll(40000+pageOverflow/2);assert.equal(page.style.getPropertyValue('--p'),'0.0000','Long interior hero copy remains readable');
  cleanup();dom.window.close();
}
console.log('PASS: six phone/tablet/landscape sizes, both hero effects, enlarged card copy, interior hero overflow, chapter transitions and video playback.');
