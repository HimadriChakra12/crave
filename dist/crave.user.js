// ==UserScript==
// @name         Crave
// @namespace    https://github.com/HimadriChakra12/bundlejs
// @version      1.0.0
// @description  Kagi-like power features on Brave Search: domain blocking/boosting, lenses, Google quick-links, Wikipedia infobox, inline calculator, Google Maps popup
// @match        https://search.brave.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @icon         https://brave.com/static-assets/images/brave-favicon.png
// @homepageURL  https://github.com/HimadriChakra12/bundlejs
// @updateURL    https://raw.githubusercontent.com/HimadriChakra12/bundlejs/main/dist/crave.user.js
// @downloadURL  https://raw.githubusercontent.com/HimadriChakra12/bundlejs/main/dist/crave.user.js
// @run-at       document-end
// ==/UserScript==

// ---- start.js ----
(() => {
  'use strict';

// ---- google/config.js ----
const CFG_KEY = 'crave_cfg';

const DEFAULTS = {
  blockList: {},
  boostList: {},
  lenses:    [],
  features: {
    blocker: true,
    lenses:  true,
    nav:     true,
  },
};

let _cfg = null;

function cfgLoad() {
  try {
    const raw = GM_getValue(CFG_KEY, null);
    _cfg = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULTS));
    for (const k of Object.keys(DEFAULTS.features)) {
      if (_cfg.features[k] === undefined) _cfg.features[k] = DEFAULTS.features[k];
    }
    if (!_cfg.blockList) _cfg.blockList = {};
    if (!_cfg.boostList) _cfg.boostList = {};
    if (!_cfg.lenses)    _cfg.lenses    = [];
  } catch (_) {
    _cfg = JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function cfgSave() { GM_setValue(CFG_KEY, JSON.stringify(_cfg)); }
function cfgGet()  { if (!_cfg) cfgLoad(); return _cfg; }

function cfgBlockDomain(domain) {
  const c = cfgGet(); c.blockList[domain] = true; delete c.boostList[domain]; cfgSave();
}
function cfgBoostDomain(domain) {
  const c = cfgGet(); c.boostList[domain] = true; delete c.blockList[domain]; cfgSave();
}
function cfgUnpinDomain(domain) {
  const c = cfgGet(); delete c.blockList[domain]; delete c.boostList[domain]; cfgSave();
}

function cfgIsBlocked(domain) { return !!cfgGet().blockList[domain]; }
function cfgIsBoosted(domain) { return !!cfgGet().boostList[domain]; }

function cfgToggleFeature(key) {
  const c = cfgGet(); c.features[key] = !c.features[key]; cfgSave(); return c.features[key];
}
function cfgFeatureOn(key) { return !!cfgGet().features[key]; }

function cfgAddLens(name, prefix) {
  const c = cfgGet();
  if (!c.lenses.find(l => l.name === name)) { c.lenses.push({ name, prefix }); cfgSave(); }
}
function cfgRemoveLens(name) {
  const c = cfgGet(); c.lenses = c.lenses.filter(l => l.name !== name); cfgSave();
}

// ---- google/ui.js ----
const PANEL_ID = 'crave-panel';
const BTN_ID    = 'crave-toggle-btn';
const TOAST_ID  = 'crave-toast';

function uiInjectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #${BTN_ID} {
      position: fixed; bottom: 20px; right: 20px; z-index: 99999;
      width: 38px; height: 38px; border-radius: 50%;
      background: var(--color-primary, #fa552a);
      color: #fff; font-size: 18px; line-height: 38px; text-align: center;
      cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.35);
      user-select: none; transition: transform .15s;
    }
    #${BTN_ID}:hover { transform: scale(1.1); }

    #${PANEL_ID} {
      position: fixed; bottom: 68px; right: 20px; z-index: 99998;
      width: 310px; background: var(--color-bg-primary, #1a1a1a);
      border: 1px solid var(--color-border, #333);
      border-radius: 10px; padding: 14px 16px;
      font: 13px/1.5 system-ui, sans-serif;
      color: var(--color-text-primary, #e8e8e8);
      box-shadow: 0 4px 24px rgba(0,0,0,.5);
      display: none;
    }
    #${PANEL_ID}.crave-open { display: block; }
    #${PANEL_ID} h3 {
      margin: 0 0 10px; font-size: 13px; font-weight: 600;
      letter-spacing: .04em; color: var(--color-primary, #fa552a);
      text-transform: uppercase;
    }
    #${PANEL_ID} .crave-section { margin-bottom: 12px; }
    #${PANEL_ID} .crave-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 0;
    }
    #${PANEL_ID} .crave-label { font-size: 12px; }
    #${PANEL_ID} .crave-toggle {
      position: relative; width: 34px; height: 18px; flex-shrink: 0;
    }
    #${PANEL_ID} .crave-toggle input { opacity: 0; width: 0; height: 0; }
    #${PANEL_ID} .crave-slider {
      position: absolute; inset: 0; border-radius: 18px; cursor: pointer;
      background: #444; transition: background .2s;
    }
    #${PANEL_ID} .crave-slider::before {
      content: ''; position: absolute;
      width: 12px; height: 12px; left: 3px; top: 3px;
      border-radius: 50%; background: #fff; transition: transform .2s;
    }
    #${PANEL_ID} .crave-toggle input:checked + .crave-slider { background: var(--color-primary, #fa552a); }
    #${PANEL_ID} .crave-toggle input:checked + .crave-slider::before { transform: translateX(16px); }

    #${PANEL_ID} .crave-sep {
      height: 1px; background: var(--color-border, #333); margin: 8px 0;
    }
    #${PANEL_ID} .crave-lens-row {
      display: flex; gap: 6px; margin-bottom: 6px;
    }
    #${PANEL_ID} .crave-lens-row input {
      flex: 1; background: var(--color-bg-secondary, #2a2a2a);
      border: 1px solid var(--color-border, #444); border-radius: 5px;
      padding: 4px 7px; font-size: 11px; color: inherit;
    }
    #${PANEL_ID} .crave-btn {
      padding: 4px 10px; border-radius: 5px; border: none; cursor: pointer;
      font-size: 11px; background: var(--color-primary, #fa552a); color: #fff;
    }
    #${PANEL_ID} .crave-btn-ghost {
      background: transparent;
      border: 1px solid var(--color-border, #444);
      color: var(--color-text-primary, #e8e8e8);
    }
    #${PANEL_ID} .crave-list {
      list-style: none; margin: 4px 0 0; padding: 0; max-height: 80px;
      overflow-y: auto; font-size: 11px;
    }
    #${PANEL_ID} .crave-list li {
      display: flex; justify-content: space-between; align-items: center;
      padding: 2px 0;
    }
    #${PANEL_ID} .crave-list li span.crave-rm {
      cursor: pointer; color: #888; font-size: 13px; line-height: 1;
    }
    #${PANEL_ID} .crave-list li span.crave-rm:hover { color: #fa552a; }

    .crave-domain-btns {
      display: inline-flex; gap: 4px; margin-left: 6px;
      vertical-align: middle; opacity: 0;
      transition: opacity .15s;
    }
    .fz-result:hover .crave-domain-btns,
    .snippet:hover .crave-domain-btns,
    [data-type="web"]:hover .crave-domain-btns { opacity: 1; }
    .crave-domain-btns button {
      font-size: 10px; padding: 1px 5px; border-radius: 3px;
      border: 1px solid #555; background: transparent;
      color: #aaa; cursor: pointer; line-height: 1.4;
    }
    .crave-domain-btns button:hover { border-color: #fa552a; color: #fa552a; }

    #${TOAST_ID} {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 99999; background: #222; color: #eee;
      padding: 8px 18px; border-radius: 20px; font-size: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,.4);
      opacity: 0; pointer-events: none; transition: opacity .25s;
    }
    #${TOAST_ID}.crave-show { opacity: 1; }

  `;
  document.head.appendChild(style);
}

function uiToast(msg, duration) {
  duration = duration || 2000;
  let el = document.getElementById(TOAST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOAST_ID;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('crave-show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('crave-show'), duration);
}

function uiBuildToggleRow(label, featureKey, onToggle) {
  const row = document.createElement('div');
  row.className = 'crave-row';

  const lbl = document.createElement('span');
  lbl.className = 'crave-label';
  lbl.textContent = label;

  const tog = document.createElement('label');
  tog.className = 'crave-toggle';
  const inp = document.createElement('input');
  inp.type = 'checkbox';
  inp.checked = cfgFeatureOn(featureKey);
  inp.addEventListener('change', () => {
    const state = cfgToggleFeature(featureKey);
    if (onToggle) onToggle(state);
    uiToast(label + (state ? ' on' : ' off'));
  });
  const slider = document.createElement('span');
  slider.className = 'crave-slider';
  tog.appendChild(inp);
  tog.appendChild(slider);

  row.appendChild(lbl);
  row.appendChild(tog);
  return row;
}

function uiBuildBlocklistSection() {
  const sec = document.createElement('div');
  sec.className = 'crave-section';

  const h = document.createElement('h3');
  h.textContent = 'Blocked domains';
  sec.appendChild(h);

  const list = document.createElement('ul');
  list.className = 'crave-list';
  list.id = 'crave-blocklist';
  sec.appendChild(list);

  function render() {
    list.innerHTML = '';
    const blocked = Object.keys(cfgGet().blockList);
    if (blocked.length === 0) {
      const li = document.createElement('li');
      li.style.color = '#666';
      li.textContent = 'none yet — hover a result to block';
      list.appendChild(li);
      return;
    }
    blocked.forEach(d => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = d;
      const rm = document.createElement('span');
      rm.className = 'crave-rm';
      rm.textContent = '×';
      rm.title = 'Remove block';
      rm.addEventListener('click', () => {
        cfgUnpinDomain(d);
        render();
        uiToast('Unblocked ' + d);
        blockerApply();
      });
      li.appendChild(name);
      li.appendChild(rm);
      list.appendChild(li);
    });
  }

  render();
  sec._refresh = render;
  return sec;
}



function uiBuildPanel() {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  const title = document.createElement('h3');
  title.textContent = '⚡ Crave';
  panel.appendChild(title);

  const featureRows = [
    ['Domain blocker', 'blocker', () => { blockerApply(); }],
    ['Nav hooks',      'nav',     () => { navInit(); }],
  ];
  featureRows.forEach(([label, key, cb]) => {
    panel.appendChild(uiBuildToggleRow(label, key, cb));
  });

  panel.appendChild(Object.assign(document.createElement('div'), { className: 'crave-sep' }));
  panel.appendChild(uiBuildBlocklistSection());

  return panel;
}

function uiInit() {
  uiInjectStyles();

  const btn = document.createElement('div');
  btn.id = BTN_ID;
  btn.textContent = '⚡';
  btn.title = 'Crave settings';
  document.body.appendChild(btn);

  const panel = uiBuildPanel();
  document.body.appendChild(panel);

  btn.addEventListener('click', () => panel.classList.toggle('crave-open'));

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn)
      panel.classList.remove('crave-open');
  });
}

function uiAttachDomainBtns(resultEl, domain) {
  if (resultEl.querySelector('.crave-domain-btns')) return;

  const wrap = document.createElement('span');
  wrap.className = 'crave-domain-btns';

  const blockBtn = document.createElement('button');
  blockBtn.textContent = '✕ block';
  blockBtn.title = 'Block ' + domain;
  blockBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    cfgBlockDomain(domain);
    blockerApply();
    uiToast('Blocked ' + domain);
    const bl = document.getElementById('crave-blocklist');
    if (bl && bl.closest('div')._refresh) bl.closest('div')._refresh();
  });

  const boostBtn = document.createElement('button');
  boostBtn.textContent = '▲ boost';
  boostBtn.title = 'Boost ' + domain;
  boostBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    cfgBoostDomain(domain);
    blockerApply();
    uiToast('Boosted ' + domain);
  });

  wrap.appendChild(blockBtn);
  wrap.appendChild(boostBtn);

  const titleEl = resultEl.querySelector('a[href], .title, h3');
  if (titleEl) titleEl.appendChild(wrap);
  else resultEl.appendChild(wrap);
}

// ---- google/blocker.js ----
const RESULT_SELECTORS = [
  '.fz-result',
  '.snippet',
  '[data-type="web"]',
  '.result',
];

function blockerGetResultEls() {
  for (const sel of RESULT_SELECTORS) {
    const els = document.querySelectorAll(sel);
    if (els.length) return Array.from(els);
  }
  return [];
}

function blockerDomainFromEl(el) {
  const a = el.querySelector('a[href]');
  if (!a) return null;
  try {
    return new URL(a.href).hostname.replace(/^www\./, '');
  } catch (_) {
    return null;
  }
}

function blockerApply() {
  if (!cfgFeatureOn('blocker')) return;

  const results = blockerGetResultEls();
  const container = results[0] && results[0].parentElement;

  const boosted  = [];
  const normal   = [];

  results.forEach(el => {
    const domain = blockerDomainFromEl(el);
    if (!domain) { normal.push(el); return; }

    if (cfgIsBlocked(domain)) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';

    if (cfgFeatureOn('blocker')) uiAttachDomainBtns(el, domain);

    if (cfgIsBoosted(domain)) boosted.push(el);
    else normal.push(el);
  });

  if (container && boosted.length) {
    const first = normal[0] || container.firstChild;
    boosted.forEach(el => container.insertBefore(el, first));
  }
}

function blockerObserve() {
  const observer = new MutationObserver(() => blockerApply());
  observer.observe(document.body, { childList: true, subtree: true });
}

function blockerInit() {
  blockerApply();
  blockerObserve();
}

// ---- google/lenses.js ----
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

// ---- google/nav.js ----
function navGetQuery() {
  return new URLSearchParams(location.search).get('q') || '';
}

function mapsOpen(q) {
  const url = 'https://www.google.com/maps/search/' + encodeURIComponent(q);
  const sw   = screen.availWidth;
  const sh   = screen.availHeight;
  const w    = Math.min(900, sw - 80);
  const h    = Math.min(650, sh - 80);
  const left = Math.round((sw - w) / 2);
  const top  = Math.round((sh - h) / 2);
  window.open(
    url,
    'crave_maps',
    'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top +
    ',resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no'
  );
}

function navOnKey(e) { if (e.key === 'Escape') {} }

function navInjectFlights(ul, q) {
  if (ul.querySelector('[data-crave-flights]')) return;
  const li = document.createElement('li');
  li.className = 'tab-item svelte-l0weru';
  li.setAttribute('data-crave-flights', '1');
  const a = document.createElement('a');
  a.className = 'desktop-default-semibold svelte-l0weru';
  a.href      = 'https://www.google.com/travel/flights?q=' + encodeURIComponent(q);
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.innerHTML = '<span>Flights</span>';
  li.appendChild(a);
  const mapsLi = (ul.querySelector('a[href*="/maps/search"]') || {closest: ()=>null}).closest('li');
  if (mapsLi) mapsLi.after(li);
  else ul.appendChild(li);
}

function navHook(ul) {
  const q = navGetQuery();
  if (!q) return;

  ul.querySelectorAll('.tab-item a').forEach(a => {
    if (a.dataset.craveHooked) return;
    a.dataset.craveHooked = '1';
    const href = a.getAttribute('href') || '';

    if (href.includes('/maps/search')) {
      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        mapsOpen(new URLSearchParams(new URL(a.href, location.origin).search).get('q') || q);
      });
    }

    if (href.includes('/images')) {
      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.open('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q), '_blank', 'noopener noreferrer');
      });
    }
  });

  navInjectFlights(ul, q);
}

function navInit() {
  craveWaitFor('#primary-tabs', ul => {
    navHook(ul);
    const obs = new MutationObserver(() => {
      const current = document.querySelector('#primary-tabs');
      if (current) navHook(current);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}

// ---- google/main.js ----
  cfgLoad();
  uiInit();

  function craveWaitFor(selector, cb, timeout) {
    timeout = timeout || 10000;
    const start = Date.now();
    const el = document.querySelector(selector);
    if (el) { cb(el); return; }
    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { obs.disconnect(); cb(found); }
      else if (Date.now() - start > timeout) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  function craveMain() {
    if (cfgFeatureOn('blocker')) blockerInit();
    if (cfgFeatureOn('lenses'))  lensesRender();
    if (cfgFeatureOn('nav'))     navInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', craveMain);
  } else {
    craveMain();
  }

// ---- end.js ----
})();

