const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('../.theme-ui-tests/node_modules/jsdom');

(async () => {
  const html = await (await fetch('http://localhost:3100/request-a-quote/')).text();
  const dom = new JSDOM(html, { url: 'http://localhost:3100/request-a-quote/', runScripts: 'outside-only', pretendToBeVisual: true });
  const { window } = dom;
  const { document } = window;
  window.CSS ||= {};
  window.CSS.escape ||= (value) => value.replace(/[^\w-]/g, '\\$&');
  const form = document.querySelector('.quote-panel form');
  const selects = [...form.querySelectorAll('select')];
  const defaults = selects.map((select) => select.value);
  const before = [...new window.FormData(form).entries()];
  window.eval(fs.readFileSync('public/brand-select.js', 'utf8'));
  const roots = [...form.querySelectorAll('.brand-select')];
  assert.equal(roots.length, 3);
  assert.deepEqual([...new window.FormData(form).entries()], before, 'Enhancement must preserve submission values');
  const trigger = (root) => root.querySelector('.brand-select-trigger');
  const key = (element, value) => element.dispatchEvent(new window.KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true }));

  trigger(roots[0]).click();
  const search = roots[0].querySelector('input');
  assert.equal(document.activeElement, search);
  search.value = 'zz-no-country';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  assert.equal(roots[0].querySelector('[role="status"]').textContent, 'No options found');
  search.value = 'Pakistan';
  search.dispatchEvent(new window.Event('input', { bubbles: true }));
  key(search, 'Enter');
  assert.equal(selects[0].value, 'Pakistan');
  assert.equal(new window.FormData(form).get(selects[0].name), 'Pakistan');
  assert.equal(trigger(roots[0]).getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, trigger(roots[0]));

  key(trigger(roots[1]), 'ArrowDown');
  assert.equal(trigger(roots[1]).getAttribute('aria-expanded'), 'true');
  const first = document.activeElement;
  key(first, 'ArrowDown');
  assert.notEqual(document.activeElement, first);
  key(document.activeElement, 'Escape');
  assert.equal(trigger(roots[1]).getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, trigger(roots[1]));

  trigger(roots[0]).click();
  trigger(roots[1]).click();
  assert.equal(trigger(roots[0]).getAttribute('aria-expanded'), 'false', 'Only one dropdown may be open');
  document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
  assert.equal(trigger(roots[1]).getAttribute('aria-expanded'), 'false');

  const empty = new window.Option('Choose a technology', '');
  selects[1].prepend(empty);
  selects[1].value = '';
  assert.equal(selects[1].checkValidity(), false);
  assert.equal(trigger(roots[1]).getAttribute('aria-invalid'), 'true');
  assert.equal(roots[1].querySelector('[role="alert"]').hidden, false);
  empty.remove();
  form.reset();
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  assert.deepEqual(selects.map((select) => select.value), defaults);
  assert.equal(trigger(roots[1]).hasAttribute('aria-invalid'), false);
  selects[0].disabled = true;
  await new Promise((resolve) => window.queueMicrotask(resolve));
  assert.equal(trigger(roots[0]).disabled, true);
  console.log('PASS: dropdown search, empty results, keyboard navigation, escape, outside click, native values, validation, reset, disabled state. No form was submitted.');
  dom.window.close();
})().catch((error) => { console.error(error); process.exitCode = 1; });
