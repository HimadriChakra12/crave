const LENS_LI_ID       = 'crave-lens-li';
const LENS_DROPDOWN_ID = 'crave-lens-dropdown';

const ALIAS_MAP = [
  { alias: '@:',  expand: 'site:'     },
  { alias: '.:',  expand: 'filetype:' },
  { alias: '~:',  expand: 'related:'  },
  { alias: 't:',  expand: 'intitle:'  },
  { alias: 'u:',  expand: 'inurl:'    },
  { alias: 'b:',  expand: 'before:'   },
  { alias: 'a:',  expand: 'after:'    },
];

const BUILTIN_LENSES = [
  { name: 'GitHub',        prefix: 'site:github.com'            },
  { name: 'Reddit',        prefix: 'site:reddit.com'            },
  { name: 'MDN',           prefix: 'site:developer.mozilla.org' },
  { name: 'Wikipedia',     prefix: 'site:wikipedia.org'         },
  { name: 'arXiv',         prefix: 'site:arxiv.org'             },
  { name: 'StackOverflow', prefix: 'site:stackoverflow.com'     },
  { name: 'HN',            prefix: 'site:news.ycombinator.com'  },
  { name: 'PDFs',          prefix: 'filetype:pdf'               },
];

function lensesGetQuery() {
  return new URLSearchParams(location.search).get('q') || '';
}

function lensesStripPrefixes(q) {
  for (const l of [...BUILTIN_LENSES, ...cfgGet().lenses])
    q = q.replace(l.prefix, '').trim();
  return q;
}

function lensesApply(prefix) {
  const base = lensesStripPrefixes(lensesGetQuery());
  const u = new URL(location.href);
  u.searchParams.set('q', (prefix + ' ' + base).trim());
  location.href = u.toString();
}

function lensesExpandAliases(raw) {
  let q = raw;
  for (const { alias, expand } of ALIAS_MAP) {
    const re = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    q = q.replace(re, expand);
  }
  return q;
}

function lensesInjectStyles() {
  if (document.getElementById('crave-lens-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-lens-styles';
  s.textContent = `
    #${LENS_LI_ID} a {
      cursor: pointer;
    }
    #${LENS_DROPDOWN_ID} {
      position: fixed;
      z-index: 99999;
      min-width: 220px;
      background: var(--color-bg-primary, #1b1b1e);
      border: 1px solid var(--divider-subtle, rgba(255,255,255,.1));
      border-radius: 14px;
      padding: 8px;
      box-shadow: 0 12px 32px rgba(0,0,0,.55);
      display: none;
      box-sizing: border-box;
    }
    #${LENS_DROPDOWN_ID}.crave-open { display: block; }

    .crave-lens-chip {
      display: flex; align-items: center; justify-content: space-between;
      gap: 12px;
      width: 100%; box-sizing: border-box;
      text-align: left;
      font-size: 14px; line-height: 1.4;
      padding: 10px 12px;
      margin: 1px 0;
      border-radius: 8px;
      border: none; background: transparent;
      color: var(--text-secondary, #ccc);
      cursor: pointer; white-space: nowrap;
      font-family: inherit;
    }
    .crave-lens-chip:hover {
      background: var(--interactive-hover, rgba(255,255,255,.08));
      color: var(--text-primary, #fff);
    }
    .crave-lens-chip.crave-active {
      background: var(--interactive-hover, rgba(255,255,255,.1));
      color: var(--text-primary, #fff);
      font-weight: 600;
    }
    .crave-lens-check {
      color: var(--text-primary, #fff);
      font-size: 13px;
      line-height: 1;
      flex: none;
    }

    .crave-lens-sep {
      height: 1px;
      background: var(--divider-subtle, rgba(255,255,255,.08));
      margin: 6px 4px;
    }

    .crave-alias-toggle {
      display: block; width: 100%;
      text-align: left;
      font-size: 11px; font-weight: 600;
      letter-spacing: .06em; text-transform: uppercase;
      color: var(--text-tertiary, #666);
      padding: 6px 12px 4px;
      border: none; background: transparent;
      cursor: pointer; font-family: inherit;
    }
    .crave-alias-toggle:hover { color: var(--text-primary, #fff); }

    .crave-alias-table {
      border-collapse: collapse;
      font-size: 11px;
      display: none; width: 100%;
      padding: 0 12px 6px;
      box-sizing: border-box;
    }
    .crave-alias-table.crave-open { display: table; }
    .crave-alias-table td { padding: 2px 3px; vertical-align: middle; }
    .crave-alias-key {
      font-family: ui-monospace, monospace;
      color: var(--focus-border, #fa552a);
    }
    .crave-alias-arrow { color: var(--text-tertiary, #555); padding: 0 4px; }
    .crave-alias-expand {
      color: var(--text-secondary, #888);
      font-family: ui-monospace, monospace;
    }
  `;
  document.head.appendChild(s);
}

function lensesCloseDropdown() {
  const dd = document.getElementById(LENS_DROPDOWN_ID);
  if (dd) dd.classList.remove('crave-open');
}

function lensesBuildDropdown() {
  let dd = document.getElementById(LENS_DROPDOWN_ID);
  if (dd) dd.remove();

  dd = document.createElement('div');
  dd.id = LENS_DROPDOWN_ID;

  const currentQ = lensesGetQuery();

  [...BUILTIN_LENSES, ...cfgGet().lenses].forEach(lens => {
    const chip = document.createElement('button');
    chip.className = 'crave-lens-chip';
    chip.title = lens.prefix;

    const label = document.createElement('span');
    label.textContent = lens.name;
    chip.appendChild(label);

    if (currentQ.includes(lens.prefix)) {
      chip.classList.add('crave-active');
      const check = document.createElement('span');
      check.className = 'crave-lens-check';
      check.textContent = '✓';
      chip.appendChild(check);
    }

    chip.addEventListener('click', e => {
      e.stopPropagation();
      lensesCloseDropdown();
      lensesApply(lens.prefix);
    });
    dd.appendChild(chip);
  });

  const sep = document.createElement('div');
  sep.className = 'crave-lens-sep';
  dd.appendChild(sep);

  const aliasToggle = document.createElement('button');
  aliasToggle.className = 'crave-alias-toggle';
  aliasToggle.textContent = 'Aliases ›';

  const table = document.createElement('table');
  table.className = 'crave-alias-table';
  ALIAS_MAP.forEach(({ alias, expand }) => {
    const tr = document.createElement('tr');
    tr.innerHTML =
      `<td class="crave-alias-key">${alias}</td>` +
      `<td class="crave-alias-arrow">→</td>` +
      `<td class="crave-alias-expand">${expand}</td>`;
    table.appendChild(tr);
  });

  aliasToggle.addEventListener('click', e => {
    e.stopPropagation();
    const open = table.classList.toggle('crave-open');
    aliasToggle.textContent = open ? 'Aliases ‹' : 'Aliases ›';
  });

  dd.appendChild(aliasToggle);
  dd.appendChild(table);

  document.body.appendChild(dd);
  return dd;
}

function lensesInjectTab(ul) {
  if (document.getElementById(LENS_LI_ID)) return;

  const currentQ = lensesGetQuery();
  const hasActive = [...BUILTIN_LENSES, ...cfgGet().lenses]
    .some(l => currentQ.includes(l.prefix));

  const li = document.createElement('li');
  li.id = LENS_LI_ID;
  li.className = 'tab-item svelte-l0weru';

  const a = document.createElement('a');
  a.className = 'desktop-default-semibold svelte-l0weru';
  a.textContent = hasActive ? 'Lenses ●' : 'Lenses';
  a.style.cursor = 'pointer';
  if (hasActive) a.style.color = 'var(--focus-border, #fa552a)';

  a.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    const dd = lensesBuildDropdown();
    const rect = a.getBoundingClientRect();
    dd.style.top  = (rect.bottom + 4) + 'px';
    dd.style.left = rect.left + 'px';
    dd.classList.toggle('crave-open');
  });

  li.appendChild(a);
  ul.appendChild(li);
}

function lensesRender() {
  if (!cfgFeatureOn('lenses')) return;
  lensesInjectStyles();

  /* Close dropdown on outside click */
  document.addEventListener('click', lensesCloseDropdown);

  /* Use craveWaitFor + body-level observer so Svelte re-renders are caught */
  craveWaitFor('#primary-tabs', ul => {
    lensesInjectTab(ul);

    const obs = new MutationObserver(() => {
      const current = document.querySelector('#primary-tabs');
      if (current) lensesInjectTab(current);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}
