/* Accessible custom presentation; original select/value/validation remain intact. */
(() => {
  const controls = [];
  document.querySelectorAll('.brand-content form select:not([multiple])').forEach((select, index) => {
    if (select.dataset.brandSelect) return;
    select.dataset.brandSelect = 'true';
    const id = `${select.id || `brand-field-${index}`}-custom`;
    const label = select.id && document.querySelector(`label[for="${CSS.escape(select.id)}"]`);
    const name = label?.textContent.trim() || select.getAttribute('aria-label') || 'Choose an option';
    const root = document.createElement('div');
    root.className = 'brand-select';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'brand-select-trigger';
    trigger.id = `${id}-trigger`;
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${id}-list`);
    const value = document.createElement('span');
    value.id = `${id}-value`;
    trigger.append(value);
    if (label) {
      label.id ||= `${id}-label`;
      trigger.setAttribute('aria-labelledby', `${label.id} ${value.id}`);
      label.addEventListener('click', (event) => { event.preventDefault(); trigger.focus(); });
    } else trigger.setAttribute('aria-label', name);
    const popover = document.createElement('div');
    popover.className = 'brand-select-popover';
    popover.hidden = true;
    const search = document.createElement('input');
    search.type = 'search';
    search.className = 'brand-select-search';
    search.placeholder = 'Search options…';
    search.autocomplete = 'off';
    search.setAttribute('aria-label', `Search ${name}`);
    const list = document.createElement('div');
    list.className = 'brand-select-list';
    list.id = `${id}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', name);
    const error = document.createElement('div');
    error.className = 'brand-select-error';
    error.id = `${id}-error`;
    error.hidden = true;
    error.textContent = `Please select ${name.toLowerCase()}.`;
    error.setAttribute('role', 'alert');
    trigger.setAttribute('aria-describedby', error.id);
    if (select.options.length > 8) popover.append(search);
    popover.append(list);
    root.append(trigger, popover, error);
    select.after(root);
    select.classList.add('brand-native-select');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');
    select.parentElement.classList.add('has-brand-select');

    const close = (focus = false) => {
      popover.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (focus) trigger.focus();
    };
    const sync = () => {
      value.textContent = select.selectedOptions[0]?.textContent || 'Choose an option';
      trigger.disabled = select.disabled;
      if (select.validity.valid) { trigger.removeAttribute('aria-invalid'); error.hidden = true; }
    };
    const render = () => {
      list.replaceChildren();
      Array.from(select.options).forEach((option, optionIndex) => {
        if (option.hidden || !option.textContent.toLowerCase().includes(search.value.trim().toLowerCase())) return;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'brand-select-option';
        item.tabIndex = -1;
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(option.selected));
        item.textContent = option.textContent;
        item.disabled = option.disabled || Boolean(option.parentElement?.disabled);
        item.addEventListener('click', () => {
          select.selectedIndex = optionIndex;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          sync(); close(true);
        });
        list.append(item);
      });
      if (!list.children.length) {
        const empty = document.createElement('div');
        empty.className = 'brand-select-empty';
        empty.textContent = 'No options found';
        empty.setAttribute('role', 'status');
        list.append(empty);
      }
    };
    const open = (last = false) => {
      controls.forEach((control) => { if (control.root !== root) control.close(); });
      search.value = '';
      render();
      popover.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const bounds = trigger.getBoundingClientRect();
      popover.classList.toggle('above', window.innerHeight - bounds.bottom < 290 && bounds.top > 300);
      const options = list.querySelectorAll('button:not(:disabled)');
      const target = last ? options[options.length - 1] : list.querySelector('[aria-selected="true"]:not(:disabled)') || options[0];
      if (search.isConnected && !last) search.focus(); else target?.focus();
    };
    trigger.addEventListener('click', () => popover.hidden ? open() : close());
    trigger.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); event.stopPropagation(); open(event.key === 'ArrowUp'); }
    });
    root.addEventListener('keydown', (event) => {
      if (popover.hidden) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
      if (event.key === 'Tab') { close(); return; }
      const options = Array.from(list.querySelectorAll('button:not(:disabled)'));
      if (event.key === 'Enter' && document.activeElement === search) { event.preventDefault(); options[0]?.click(); return; }
      const current = options.indexOf(document.activeElement);
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) && !(document.activeElement === search && ['Home', 'End'].includes(event.key))) {
        event.preventDefault();
        let next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : current + (event.key === 'ArrowDown' ? 1 : -1);
        next = Math.max(0, Math.min(options.length - 1, next));
        options[next]?.focus();
      }
    });
    search.addEventListener('input', render);
    select.addEventListener('change', () => { sync(); if (!popover.hidden) render(); });
    select.addEventListener('invalid', (event) => {
      event.preventDefault();
      trigger.setAttribute('aria-invalid', 'true');
      error.hidden = false;
      if (!select.form?.querySelector(':invalid:not(select)')) trigger.focus();
    });
    select.form?.addEventListener('reset', () => requestAnimationFrame(() => { sync(); close(); }));
    new MutationObserver(() => { sync(); if (!popover.hidden) render(); }).observe(select, { attributes: true, childList: true, subtree: true });
    controls.push({ root, close });
    sync();
  });
  document.addEventListener('pointerdown', (event) => controls.forEach(({ root, close }) => { if (!root.contains(event.target)) close(); }));
})();
