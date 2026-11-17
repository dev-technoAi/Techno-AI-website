const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('../.theme-ui-tests/node_modules/jsdom');
(async () => {
 const html = await (await fetch('http://localhost:3100/request-a-quote/')).text();
 for (const reduced of [false,true]) {
  const dom = new JSDOM(html,{url:'http://localhost:3100/request-a-quote/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window, d=w.document;
  w.matchMedia=query=>({matches:query.includes('reduced-motion')?reduced:false});
  w.IntersectionObserver=class {observe(){} unobserve(){} disconnect(){}};
  let callbacks=[];
  w.requestAnimationFrame=cb=>{callbacks.push(cb);return callbacks.length;};
  w.cancelAnimationFrame=()=>{};
  w.HTMLElement.prototype.getClientRects=function(){return [{width:100,height:30}];};
  w.eval(fs.readFileSync('public/site.js','utf8'));
  assert.equal(d.documentElement.classList.contains('fx'),!reduced,'Rendered pages must honor the system reduced-motion preference');
  const initial=callbacks; callbacks=[]; initial.forEach(cb=>cb(16));
  assert.equal(callbacks.length,0,'Touch/reduced motion must not spin an idle animation loop');
  const button=d.querySelector('.hx-menu'),menu=d.querySelector('#menu');
  button.click();
  assert.equal(button.getAttribute('aria-expanded'),'true');
  assert.equal(d.activeElement,menu.querySelector('a'));
  const last=[...menu.querySelectorAll('a[href],button')].at(-1);
  last.focus(); w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Tab',cancelable:true}));
  assert.equal(d.activeElement,button);
  w.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',cancelable:true}));
  assert.equal(button.getAttribute('aria-expanded'),'false');
  assert.ok(menu.hasAttribute('inert'));
  dom.window.close();
 }
 console.log('PASS: touch/reduced-motion idle scheduling, menu focus, Tab trap, Escape and inert state');
})();
