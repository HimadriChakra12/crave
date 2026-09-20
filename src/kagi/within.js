const WITHIN_BAR_ID = 'crave-within-bar';
let withinActive = '';

function withinInjectStyles() {
  if (document.getElementById('crave-within-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-within-styles';
  s.textContent = `
    #${WITHIN_BAR_ID} {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 0 3px;
      font-family: system-ui, sans-serif;
    }
    #crave-within-input {
      font-size: 11px; padding: 3px 8px;
      background: var(--color-bg-secondary, #1e1e1e);
      border: 1px solid var(--color-border, #333);
      border-radius: 6px; color: inherit;
      width: 180px; transition: border-color .12s;
    }
    #crave-within-input:focus {
      outline: none;
      border-color: var(--color-primary, #fa552a);
    }
    #crave-within-clear {
      font-size: 11px; padding: 2px 8px; border-radius: 6px;
      border: 1px solid var(--color-border, #333);
      background: transparent; color: #888; cursor: pointer;
      display: none;
    }
    #crave-within-clear.crave-visible { display: block; }
    #crave-within-clear:hover { color: #fa552a; border-color: #fa552a; }
    #crave-within-count {
      font-size: 10px; color: #555;
    }
    .crave-within-hidden { display: none !important; }
  `;
  document.head.appendChild(s);
}

function withinGetResults() {
  for (const sel of ['.fz-result','.snippet','[data-type="web"]','.result']) {
    const els = document.querySelectorAll(sel);
    if (els.length) return Array.from(els);
  }
  return [];
}

function withinFilter(term) {
  withinActive = term.toLowerCase().trim();
  const results = withinGetResults();
  let shown = 0;

  results.forEach(el => {
    if (!withinActive) {
      el.classList.remove('crave-within-hidden');
      shown++;
      return;
    }
    const text = el.textContent.toLowerCase();
    if (text.includes(withinActive)) {
      el.classList.remove('crave-within-hidden');
      shown++;
    } else {
      el.classList.add('crave-within-hidden');
    }
  });

  const count = document.getElementById('crave-within-count');
  if (count) {
    count.textContent = withinActive
      ? shown + ' of ' + results.length + ' results'
      : '';
  }

  const clear = document.getElementById('crave-within-clear');
  if (clear) clear.classList.toggle('crave-visible', !!withinActive);
}

function withinRender() {
  if (document.getElementById(WITHIN_BAR_ID)) return;

  withinInjectStyles();

  const bar = document.createElement('div');
  bar.id = WITHIN_BAR_ID;

  const input = document.createElement('input');
  input.id          = 'crave-within-input';
  input.type        = 'text';
  input.placeholder = '🔍 filter results…';
  input.spellcheck  = false;

  const clear = document.createElement('button');
  clear.id          = 'crave-within-clear';
  clear.textContent = '✕ clear';
  clear.addEventListener('click', () => {
    input.value = '';
    withinFilter('');
    input.focus();
  });

  const count = document.createElement('span');
  count.id = 'crave-within-count';

  input.addEventListener('input', () => withinFilter(input.value));
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; withinFilter(''); }
  });

  bar.appendChild(input);
  bar.appendChild(clear);
  bar.appendChild(count);

  craveWaitFor('#primary-tabs', tabs => {
    const nav = tabs.closest('nav') || tabs.parentElement;
    if (nav && nav.parentElement) {
      nav.parentElement.insertBefore(bar, nav.nextSibling);
    }
  });
}

function withinInit() {
  withinRender();
}
