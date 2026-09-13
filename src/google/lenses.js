const LENS_PANEL_ID = 'crave-lens-panel';

const ALIAS_MAP = [
  { alias: '@:',   expand: 'site:',     hint: 'site'      },
  { alias: '.:',   expand: 'filetype:', hint: 'filetype'  },
  { alias: '~:',   expand: 'related:',  hint: 'related'   },
  { alias: 't:',   expand: 'intitle:',  hint: 'intitle'   },
  { alias: 'u:',   expand: 'inurl:',    hint: 'inurl'     },
  { alias: 'b:',   expand: 'before:',   hint: 'before'    },
  { alias: 'a:',   expand: 'after:',    hint: 'after'     },
];

const BUILTIN_LENSES = [
  { name: 'GitHub',        prefix: 'site:github.com'                },
  { name: 'Reddit',        prefix: 'site:reddit.com'                },
  { name: 'MDN',           prefix: 'site:developer.mozilla.org'     },
  { name: 'Wikipedia',     prefix: 'site:wikipedia.org'             },
  { name: 'arXiv',         prefix: 'site:arxiv.org'                 },
  { name: 'StackOverflow', prefix: 'site:stackoverflow.com'         },
  { name: 'HN',            prefix: 'site:news.ycombinator.com'      },
  { name: 'PDFs',          prefix: 'filetype:pdf'                   },
  { name: 'Past week',     prefix: 'after:' + (() => {
      const d = new Date(); d.setDate(d.getDate() - 7);
      return d.toISOString().slice(0,10);
    })()
  },
  { name: 'Past month',    prefix: 'after:' + (() => {
      const d = new Date(); d.setMonth(d.getMonth() - 1);
      return d.toISOString().slice(0,10);
    })()
  },
];

function lensesExpandAliases(raw) {
  let q = raw;
  for (const { alias, expand } of ALIAS_MAP) {
    const re = new RegExp(alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    q = q.replace(re, expand);
  }
  return q;
}

function lensesGetQuery() {
  return new URLSearchParams(location.search).get('q') || '';
}

function lensesStripPrefixes(q) {
  const all = [...BUILTIN_LENSES, ...cfgGet().lenses];
  for (const l of all) q = q.replace(l.prefix, '').trim();
  return q;
}

function lensesApply(prefix) {
  const base = lensesStripPrefixes(lensesGetQuery());
  const u = new URL(location.href);
  u.searchParams.set('q', (prefix + ' ' + base).trim());
  location.href = u.toString();
}

function lensesInjectStyles() {
  if (document.getElementById('crave-lens-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-lens-styles';
  s.textContent = `
    #${LENS_PANEL_ID} {
      position: fixed;
      top: 120px; left: 0;
      width: 168px;
      background: var(--color-bg-primary, #111);
      border: 1px solid var(--color-border, #2a2a2a);
      border-left: none;
      border-radius: 0 10px 10px 0;
      padding: 10px 0 12px;
      z-index: 900;
      box-shadow: 2px 0 16px rgba(0,0,0,.4);
      font: 12px/1.5 system-ui, sans-serif;
      color: var(--color-text-primary, #ddd);
      transform: translateX(-152px);
      transition: transform .2s ease;
    }
    #${LENS_PANEL_ID}:hover,
    #${LENS_PANEL_ID}.crave-pinned {
      transform: translateX(0);
    }
    #crave-lens-tab {
      position: absolute; right: -22px; top: 50%;
      transform: translateY(-50%);
      writing-mode: vertical-rl;
      font-size: 10px; color: #666;
      padding: 8px 4px;
      background: var(--color-bg-primary, #111);
      border: 1px solid var(--color-border, #2a2a2a);
      border-left: none;
      border-radius: 0 6px 6px 0;
      cursor: default;
      letter-spacing: .08em;
      user-select: none;
    }
    .crave-lens-section {
      padding: 0 10px;
      margin-bottom: 6px;
    }
    .crave-lens-heading {
      font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
      color: #555; padding: 6px 10px 3px; user-select: none;
    }
    .crave-lens-chip {
      display: block; width: 100%;
      text-align: left;
      font-size: 11px; padding: 3px 8px;
      border-radius: 5px; border: none;
      background: transparent;
      color: var(--color-text-secondary, #aaa);
      cursor: pointer; transition: all .12s;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .crave-lens-chip:hover { background: var(--color-bg-secondary, #1e1e1e); color: #eee; }
    .crave-lens-chip.crave-active {
      color: var(--color-primary, #fa552a);
      background: rgba(250,85,42,.08);
    }
    .crave-lens-sep {
      height: 1px; background: var(--color-border, #2a2a2a); margin: 6px 10px;
    }
    .crave-alias-row {
      display: flex; align-items: baseline; gap: 4px;
      padding: 2px 8px; font-size: 10px;
    }
    .crave-alias-key {
      font-family: monospace; font-size: 10px;
      color: var(--color-primary, #fa552a);
      min-width: 28px; flex-shrink: 0;
    }
    .crave-alias-val {
      color: #555; font-size: 10px;
    }
    #crave-lens-input-wrap {
      padding: 4px 10px 2px;
      display: flex; gap: 4px;
    }
    #crave-lens-input {
      flex: 1; font-size: 10px; padding: 3px 6px;
      background: var(--color-bg-secondary, #1e1e1e);
      border: 1px solid var(--color-border, #333);
      border-radius: 4px; color: inherit;
    }
    #crave-lens-go {
      font-size: 10px; padding: 3px 7px;
      background: var(--color-primary, #fa552a);
      border: none; border-radius: 4px; color: #fff; cursor: pointer;
    }
  `;
  document.head.appendChild(s);
}

function lensesRender() {
  const old = document.getElementById(LENS_PANEL_ID);
  if (old) old.remove();

  if (!cfgFeatureOn('lenses')) return;

  lensesInjectStyles();

  const panel = document.createElement('div');
  panel.id = LENS_PANEL_ID;

  const tab = document.createElement('div');
  tab.id = 'crave-lens-tab';
  tab.textContent = 'LENSES';
  panel.appendChild(tab);

  const currentQ = lensesGetQuery();

  const allLenses = [...BUILTIN_LENSES, ...cfgGet().lenses];
  const h1 = document.createElement('div');
  h1.className = 'crave-lens-heading';
  h1.textContent = 'Quick lenses';
  panel.appendChild(h1);

  allLenses.forEach(lens => {
    const btn = document.createElement('button');
    btn.className = 'crave-lens-chip';
    btn.textContent = lens.name;
    btn.title = lens.prefix;
    if (currentQ.includes(lens.prefix)) btn.classList.add('crave-active');
    btn.addEventListener('click', () => lensesApply(lens.prefix));
    panel.appendChild(btn);
  });

  const sep1 = document.createElement('div');
  sep1.className = 'crave-lens-sep';
  panel.appendChild(sep1);

  const h2 = document.createElement('div');
  h2.className = 'crave-lens-heading';
  h2.textContent = 'Alias shortcuts';
  panel.appendChild(h2);

  ALIAS_MAP.forEach(({ alias, expand }) => {
    const row = document.createElement('div');
    row.className = 'crave-alias-row';
    row.title = 'Type ' + alias + 'value in the box below';
    const key = document.createElement('span');
    key.className = 'crave-alias-key';
    key.textContent = alias;
    const val = document.createElement('span');
    val.className = 'crave-alias-val';
    val.textContent = '→ ' + expand;
    row.appendChild(key);
    row.appendChild(val);
    panel.appendChild(row);
  });

  const sep2 = document.createElement('div');
  sep2.className = 'crave-lens-sep';
  panel.appendChild(sep2);

  const h3 = document.createElement('div');
  h3.className = 'crave-lens-heading';
  h3.textContent = 'Search with alias';
  panel.appendChild(h3);

  const inputWrap = document.createElement('div');
  inputWrap.id = 'crave-lens-input-wrap';

  const input = document.createElement('input');
  input.id = 'crave-lens-input';
  input.placeholder = '@:github.com query';
  input.spellcheck = false;

  const go = document.createElement('button');
  go.id = 'crave-lens-go';
  go.textContent = '→';

  function runAlias() {
    const raw = input.value.trim();
    if (!raw) return;
    const expanded = lensesExpandAliases(raw);
    const u = new URL(location.href);
    u.searchParams.set('q', expanded);
    location.href = u.toString();
  }

  go.addEventListener('click', runAlias);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runAlias(); });

  inputWrap.appendChild(input);
  inputWrap.appendChild(go);
  panel.appendChild(inputWrap);

  document.body.appendChild(panel);

  const obs = new MutationObserver(() => {
    if (!document.getElementById(LENS_PANEL_ID)) lensesRender();
  });
  obs.observe(document.body, { childList: true });
}
