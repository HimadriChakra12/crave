// ==UserScript==
// @name         Crave
// @namespace    https://github.com/HimadriChakra12/bundlejs
// @version      3.0.0
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
  lenses:    [],
  features: {
    lenses:     true,
    bang:       true,
    categories: true,
    answered:   true,
    tracker:    true,
    archive:    true,
    within:     true,
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
    if (!_cfg.lenses)    _cfg.lenses    = [];
  } catch (_) {
    _cfg = JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function cfgSave() { GM_setValue(CFG_KEY, JSON.stringify(_cfg)); }
function cfgGet()  { if (!_cfg) cfgLoad(); return _cfg; }

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
const TOAST_ID = 'crave-toast';

function uiInjectStyles() {
  const style = document.createElement('style');
  style.textContent = `
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

function uiHideSidebarCTA() {
  const style = document.createElement('style');
  style.textContent = `
    .set-default { display: none !important; }
  `;
  document.head.appendChild(style);
}

function uiInit() {
  uiInjectStyles();
  uiHideSidebarCTA();
}

// ---- google/lenses.js ----
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
      min-width: 180px;
      background: var(--color-bg-primary, #111);
      border: 1px solid var(--divider-subtle, rgba(255,255,255,.1));
      border-radius: 8px;
      padding: 6px 0;
      box-shadow: 0 8px 24px rgba(0,0,0,.5);
      display: none;
    }
    #${LENS_DROPDOWN_ID}.crave-open { display: block; }

    .crave-lens-chip {
      display: block; width: 100%;
      text-align: left;
      font-size: 14px; line-height: 1.5;
      padding: 5px 16px;
      border: none; background: transparent;
      color: var(--text-secondary, #aaa);
      cursor: pointer; white-space: nowrap;
      font-family: inherit;
    }
    .crave-lens-chip:hover {
      background: var(--interactive-hover, rgba(255,255,255,.06));
      color: var(--text-primary, #fff);
    }
    .crave-lens-chip.crave-active {
      color: var(--focus-border, #fa552a);
      font-weight: 500;
    }

    .crave-lens-sep {
      height: 1px;
      background: var(--divider-subtle, rgba(255,255,255,.08));
      margin: 4px 0;
    }

    .crave-alias-toggle {
      display: block; width: 100%;
      text-align: left;
      font-size: 11px; font-weight: 600;
      letter-spacing: .06em; text-transform: uppercase;
      color: var(--text-tertiary, #666);
      padding: 6px 16px 3px;
      border: none; background: transparent;
      cursor: pointer; font-family: inherit;
    }
    .crave-alias-toggle:hover { color: var(--text-primary, #fff); }

    .crave-alias-table {
      border-collapse: collapse;
      font-size: 11px;
      display: none; width: 100%;
      padding: 0 16px 4px;
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
    chip.textContent = lens.name;
    chip.title = lens.prefix;
    if (currentQ.includes(lens.prefix)) chip.classList.add('crave-active');
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

  document.addEventListener('click', lensesCloseDropdown);

  craveWaitFor('#primary-tabs', ul => {
    lensesInjectTab(ul);

    const obs = new MutationObserver(() => {
      const current = document.querySelector('#primary-tabs');
      if (current) lensesInjectTab(current);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}

// ---- google/settings.js ----
function settingsIsPage() {
  return location.pathname === '/settings';
}

const CRAVE_FEATURES = [
  { key: 'lenses',     label: 'Lenses',          desc: 'Quick site filter dropdown in the nav bar',    icon: '🔍', color: '#212848' },
  { key: 'bang',       label: 'Bangs',            desc: '!yt, !gh, !mdn … redirect shortcuts',          icon: '!',  color: '#212848' },
  { key: 'categories', label: 'Category demote',  desc: 'Fade forums, social, SEO farms and listicles', icon: '🏷', color: '#212848' },
  { key: 'answered',   label: 'Answered star',    desc: 'Mark results that answered your query',        icon: '★',  color: '#212848' },
  { key: 'tracker',    label: 'Tracker badges',   desc: 'Show tracker risk on results',                 icon: '🛡', color: '#212848' },
  { key: 'archive',    label: 'Archive link',     desc: 'Wayback Machine link on each result',          icon: '📦', color: '#212848' },
  { key: 'within',     label: 'Filter results',   desc: 'Instant text filter across visible results',   icon: '⚡', color: '#212848' },
];

function settingsInjectStyles() {
  if (document.getElementById('crave-settings-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-settings-styles';
  s.textContent = `
    #crave-settings-section {
      background: #1c1c1d;
      border-radius: 12px;
      overflow: hidden;
      margin-top: 16px;
    }

    .crave-s-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .crave-s-row:last-child { border-bottom: none; }

    .crave-s-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      background: #212848;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; flex-shrink: 0;
      color: #bcc6f3;
      font-weight: 700;
      font-family: inherit;
    }

    .crave-s-info { flex: 1; min-width: 0; }

    .crave-s-label {
      font-size: 13px;
      font-weight: 500;
      color: #eee;
      font-family: inherit;
      line-height: 1.3;
    }
    .crave-s-desc {
      font-size: 11px;
      color: #777;
      margin-top: 1px;
      font-family: inherit;
      line-height: 1.4;
    }

    .crave-s-toggle {
      position: relative;
      width: 40px; height: 22px; flex-shrink: 0;
    }
    .crave-s-toggle input { opacity:0; width:0; height:0; position:absolute; }
    .crave-s-slider {
      position: absolute; inset: 0; border-radius: 22px;
      background: rgba(255,255,255,.15);
      cursor: pointer; transition: background .15s;
    }
    .crave-s-slider::before {
      content: ''; position: absolute;
      width: 16px; height: 16px; left: 3px; top: 3px;
      border-radius: 50%; background: #fff;
      transition: transform .15s;
      box-shadow: 0 1px 2px rgba(0,0,0,.4);
    }
    .crave-s-toggle input:checked + .crave-s-slider { background: #fa552a; }
    .crave-s-toggle input:checked + .crave-s-slider::before { transform: translateX(18px); }
  `;
  document.head.appendChild(s);
}

function settingsBuildSection() {
  const section = document.createElement('div');
  section.id = 'crave-settings-section';

  CRAVE_FEATURES.forEach(({ key, label, desc, icon }) => {
    const row = document.createElement('div');
    row.className = 'crave-s-row';

    const ic = document.createElement('div');
    ic.className   = 'crave-s-icon';
    ic.textContent = icon;

    const info = document.createElement('div');
    info.className = 'crave-s-info';

    const lbl = document.createElement('div');
    lbl.className   = 'crave-s-label';
    lbl.textContent = label;

    const dsc = document.createElement('div');
    dsc.className   = 'crave-s-desc';
    dsc.textContent = desc;

    info.appendChild(lbl);
    info.appendChild(dsc);

    const tog    = document.createElement('label');
    tog.className = 'crave-s-toggle';
    const inp    = document.createElement('input');
    inp.type     = 'checkbox';
    inp.checked  = cfgFeatureOn(key);
    inp.addEventListener('change', () => {
      cfgToggleFeature(key);
      uiToast(label + (inp.checked ? ' on' : ' off'));
    });
    const slider = document.createElement('span');
    slider.className = 'crave-s-slider';
    tog.appendChild(inp);
    tog.appendChild(slider);

    row.appendChild(ic);
    row.appendChild(info);
    row.appendChild(tog);
    section.appendChild(row);
  });

  return section;
}

function settingsInject() {
  if (document.getElementById('crave-settings-section')) return;

  const premiumCTA = document.querySelector('.sidebar article.premium-cta, .sidebar .premium-cta, aside article.premium-cta');
  if (!premiumCTA) return;

  settingsInjectStyles();

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'margin-bottom:12px;';

  const label = document.createElement('div');
  label.style.cssText = [
    'font-size:11px', 'font-weight:700',
    'letter-spacing:.08em', 'text-transform:uppercase',
    'color:#464649', 'padding:0 4px 8px',
    'font-family:inherit',
  ].join(';');
  label.textContent = '⚡ Crave';

  wrapper.appendChild(label);
  wrapper.appendChild(settingsBuildSection());

  premiumCTA.replaceWith(wrapper);
}

function settingsInit() {
  if (!settingsIsPage()) return;
  settingsInject();
  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(settingsInject, 80); })
    .observe(document.documentElement, { childList: true, subtree: true });
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
    settingsInit();
    if (cfgFeatureOn('lenses'))     lensesRender();
    if (cfgFeatureOn('bang'))       bangInit();
    if (cfgFeatureOn('categories')) categoriesInit();
    if (cfgFeatureOn('answered'))   answeredInit();
    if (cfgFeatureOn('tracker'))    trackerInit();
    if (cfgFeatureOn('archive'))    archiveInit();
    if (cfgFeatureOn('within'))     withinInit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', craveMain);
  } else {
    craveMain();
  }

// ---- kagi/bang.js ----
const BANGS = {
  '!g':    q => 'https://www.google.com/search?q=' + q,
  '!yt':   q => 'https://www.youtube.com/results?search_query=' + q,
  '!gh':   q => 'https://github.com/search?q=' + q,
  '!mdn':  q => 'https://developer.mozilla.org/en-US/search?q=' + q,
  '!w':    q => 'https://en.wikipedia.org/w/index.php?search=' + q,
  '!so':   q => 'https://stackoverflow.com/search?q=' + q,
  '!r':    q => 'https://www.reddit.com/search/?q=' + q,
  '!d':    q => 'https://duckduckgo.com/?q=' + q,
  '!maps': q => 'https://www.google.com/maps/search/' + q,
  '!img':  q => 'https://www.google.com/search?tbm=isch&q=' + q,
  '!a':    q => 'https://www.amazon.com/s?k=' + q,
  '!npm':  q => 'https://www.npmjs.com/search?q=' + q,
  '!pypi': q => 'https://pypi.org/search/?q=' + q,
  '!tw':   q => 'https://twitter.com/search?q=' + q,
  '!hn':   q => 'https://hn.algolia.com/?q=' + q,
  '!arch': q => 'https://wiki.archlinux.org/index.php?search=' + q,
  '!wb':   q => 'https://web.archive.org/web/*/' + q,
  '!ddg':  q => 'https://duckduckgo.com/?q=' + q,
  '!sx':   q => 'https://stackexchange.com/search?q=' + q,
};

function bangParse(raw) {
  const parts = raw.trim().split(/\s+/);
  for (let i = 0; i < parts.length; i++) {
    const token = parts[i].toLowerCase();
    if (BANGS[token]) {
      const rest = parts.filter((_, j) => j !== i).join(' ');
      return { bang: token, query: rest };
    }
  }
  return null;
}

function bangIntercept(e) {
  const input = document.querySelector('input[type="search"], input[name="q"]');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return;
  const match = bangParse(raw);
  if (!match) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const url = BANGS[match.bang](encodeURIComponent(match.query));
  window.open(url, '_blank', 'noopener noreferrer');
}

function bangInit() {
  craveWaitFor('form[role="search"], form.search-form, form', form => {
    form.addEventListener('submit', bangIntercept, true);
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const active = document.activeElement;
    if (!active) return;
    const tag = active.tagName;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
    bangIntercept(e);
  }, true);
}

// ---- kagi/categories.js ----
const CAT_FORUMS = [
  'reddit.com','quora.com','stackexchange.com','stackoverflow.com',
  'news.ycombinator.com','discourse.org','boards.4chan.org','forum.',
  'forums.','community.','discuss.','answers.yahoo.com',
];

const CAT_SOCIAL = [
  'twitter.com','x.com','facebook.com','instagram.com','tiktok.com',
  'linkedin.com','pinterest.com','tumblr.com','mastodon.social',
];

const CAT_AGG = [
  'msn.com','yahoo.com','flipboard.com','feedly.com','alltop.com',
  'news.google.com','smartnews.com','upday.com',
];

const CAT_SEO = [
  'hubspot.com','semrush.com','Neil Patel','searchenginejournal.com',
  'searchengineland.com','backlinko.com','ahrefs.com',
  'ezinearticles.com','articlesbase.com','goarticles.com',
  'medium.com','substack.com',
];

const LISTICLE_RE = /\b(\d+)\s+(best|top|worst|ways|tips|tricks|things|reasons|facts|ideas|hacks|mistakes|steps|tools|apps|plugins|secrets|examples|signs|types|methods)\b/i;

const CAT_DEMOTE_OPACITY = '0.45';

function catDomainMatches(domain, list) {
  return list.some(p => domain.includes(p));
}

function catIsListicle(el) {
  const title = el.querySelector('a[href], h3, .title');
  return title && LISTICLE_RE.test(title.textContent);
}

function catBadge(el, label, color) {
  if (el.querySelector('.crave-cat-badge')) return;
  const b = document.createElement('span');
  b.className = 'crave-cat-badge';
  b.textContent = label;
  b.style.cssText = [
    'font-size:9px', 'padding:1px 5px', 'border-radius:3px',
    'margin-left:6px', 'vertical-align:middle',
    'border:1px solid ' + color,
    'color:' + color,
    'opacity:.7',
  ].join(';');
  const anchor = el.querySelector('a[href]');
  if (anchor) anchor.appendChild(b);
}

function catFoldListicle(el) {
  if (el.dataset.craveListicleFolded) return;
  el.dataset.craveListicleFolded = '1';

  const orig = el.style.cssText;
  el.style.cssText += ';max-height:48px;overflow:hidden;position:relative;';

  const expand = document.createElement('button');
  expand.className = 'crave-listicle-expand';
  expand.textContent = '▼ listicle';
  expand.style.cssText = [
    'position:absolute', 'bottom:2px', 'right:6px',
    'font-size:9px', 'padding:1px 7px', 'border-radius:4px',
    'border:1px solid #555', 'background:#111',
    'color:#888', 'cursor:pointer',
  ].join(';');
  expand.addEventListener('click', e => {
    e.stopPropagation();
    el.style.cssText = orig;
    expand.remove();
    delete el.dataset.craveListicleFolded;
  });
  el.style.position = 'relative';
  el.appendChild(expand);
}

function catInjectStyles() {
  if (document.getElementById('crave-cat-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-cat-styles';
  s.textContent = `
    .crave-cat-demoted { opacity: ${CAT_DEMOTE_OPACITY}; transition: opacity .2s; }
    .crave-cat-demoted:hover { opacity: 1; }
  `;
  document.head.appendChild(s);
}

function catApply() {
  catInjectStyles();

  const results = [];
  for (const sel of ['.fz-result','.snippet','[data-type="web"]','.result']) {
    const els = document.querySelectorAll(sel);
    if (els.length) { els.forEach(e => results.push(e)); break; }
  }

  results.forEach(el => {
    if (el.dataset.craveCateg) return;
    el.dataset.craveCateg = '1';

    const a = el.querySelector('a[href]');
    if (!a) return;
    let domain = '';
    try { domain = new URL(a.href).hostname.replace(/^www\./, ''); } catch (_) { return; }

    if (catDomainMatches(domain, CAT_FORUMS)) {
      el.classList.add('crave-cat-demoted');
      catBadge(el, 'forum', '#888');
    } else if (catDomainMatches(domain, CAT_SOCIAL)) {
      el.classList.add('crave-cat-demoted');
      catBadge(el, 'social', '#8888cc');
    } else if (catDomainMatches(domain, CAT_AGG)) {
      el.classList.add('crave-cat-demoted');
      catBadge(el, 'aggregator', '#cc8844');
    } else if (catDomainMatches(domain, CAT_SEO)) {
      el.classList.add('crave-cat-demoted');
      catBadge(el, 'SEO', '#cc4444');
    }

    if (catIsListicle(el)) {
      catBadge(el, 'listicle', '#6699aa');
      catFoldListicle(el);
    }
  });
}

function categoriesInit() {
  catApply();
  new MutationObserver(catApply)
    .observe(document.body, { childList: true, subtree: true });
}

// ---- kagi/answered.js ----
const ANSWERED_KEY = 'crave_answered';

function answeredLoad() {
  try { return JSON.parse(GM_getValue(ANSWERED_KEY, '{}')); }
  catch (_) { return {}; }
}

function answeredSave(data) {
  GM_setValue(ANSWERED_KEY, JSON.stringify(data));
}

function answeredMark(url, title) {
  const data = answeredLoad();
  if (data[url]) {
    delete data[url];
  } else {
    data[url] = { title, ts: Date.now() };
  }
  answeredSave(data);
  return !!data[url];
}

function answeredIsMarked(url) {
  return !!answeredLoad()[url];
}

function answeredInjectStyles() {
  if (document.getElementById('crave-answered-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-answered-styles';
  s.textContent = `
    .crave-answered-btn {
      background: none; border: none; cursor: pointer;
      font-size: 13px; padding: 0 3px;
      opacity: 0; transition: opacity .15s;
      vertical-align: middle; line-height: 1;
      color: #888;
    }
    .crave-answered-btn.crave-marked {
      opacity: 1 !important; color: #f5a623;
    }
    .fz-result:hover .crave-answered-btn,
    .snippet:hover .crave-answered-btn,
    [data-type="web"]:hover .crave-answered-btn { opacity: .6; }
    .crave-answered-btn:hover { opacity: 1 !important; }
  `;
  document.head.appendChild(s);
}

function answeredApply() {
  answeredInjectStyles();

  const results = [];
  for (const sel of ['.fz-result','.snippet','[data-type="web"]','.result']) {
    const els = document.querySelectorAll(sel);
    if (els.length) { els.forEach(e => results.push(e)); break; }
  }

  results.forEach(el => {
    if (el.querySelector('.crave-answered-btn')) return;

    const a = el.querySelector('a[href]');
    if (!a) return;

    const url   = a.href;
    const title = (el.querySelector('h3, .title') || a).textContent.trim();

    const btn = document.createElement('button');
    btn.className   = 'crave-answered-btn';
    btn.title       = 'This answered it';
    btn.textContent = '★';

    if (answeredIsMarked(url)) btn.classList.add('crave-marked');

    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const now = answeredMark(url, title);
      btn.classList.toggle('crave-marked', now);
      uiToast(now ? '★ Marked as answered' : '☆ Unmarked');
    });

    const titleEl = el.querySelector('h3, .title, a[href]');
    if (titleEl) titleEl.appendChild(btn);
    else el.appendChild(btn);
  });
}

function answeredInit() {
  answeredApply();
  new MutationObserver(answeredApply)
    .observe(document.body, { childList: true, subtree: true });
}

// ---- kagi/tracker.js ----
const TRACKER_HIGH = [
  'facebook.com','instagram.com','doubleclick.net','adnxs.com',
  'scorecardresearch.com','quantserve.com','krxd.net','rfihub.com',
  'taboola.com','outbrain.com','rubiconproject.com','openx.net',
  'pubmatic.com','casalemedia.com','advertising.com','adroll.com',
  'hotjar.com','mouseflow.com','fullstory.com','heap.io',
];

const TRACKER_MED = [
  'google-analytics.com','googletagmanager.com','googleadservices.com',
  'twitter.com','linkedin.com','pinterest.com','snapchat.com',
  'amazon-adsystem.com','media.net','criteo.com','yandex.ru',
  'optimizely.com','segment.com','amplitude.com','mixpanel.com',
  'intercom.io','drift.com','zendesk.com','freshdesk.com',
];

const TRACKER_LOW = [
  'cloudflare.com','akamai.com','fastly.com',
  'newrelic.com','datadog.com','sentry.io',
  'disqus.com','livechat.com','tawk.to',
];

function trackerScore(domain) {
  if (TRACKER_HIGH.some(t => domain.includes(t))) return 3;
  if (TRACKER_MED.some(t => domain.includes(t)))  return 2;
  if (TRACKER_LOW.some(t => domain.includes(t)))  return 1;
  return 0;
}

const TRACKER_LABELS = ['', '⚠ low', '⚠ med', '🔴 high'];
const TRACKER_COLORS = ['', '#888844', '#cc8833', '#cc3333'];

function trackerInjectStyles() {
  if (document.getElementById('crave-tracker-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-tracker-styles';
  s.textContent = `
    .crave-tracker-badge {
      font-size: 9px; padding: 1px 5px; border-radius: 3px;
      margin-left: 5px; vertical-align: middle;
      border: 1px solid currentColor;
      opacity: .75; cursor: default;
      font-family: system-ui, sans-serif;
    }
    .crave-tracker-badge:hover { opacity: 1; }
  `;
  document.head.appendChild(s);
}

function trackerApply() {
  trackerInjectStyles();

  const results = [];
  for (const sel of ['.fz-result','.snippet','[data-type="web"]','.result']) {
    const els = document.querySelectorAll(sel);
    if (els.length) { els.forEach(e => results.push(e)); break; }
  }

  results.forEach(el => {
    if (el.querySelector('.crave-tracker-badge')) return;

    const a = el.querySelector('a[href]');
    if (!a) return;

    let domain = '';
    try { domain = new URL(a.href).hostname.replace(/^www\./, ''); }
    catch (_) { return; }

    const score = trackerScore(domain);
    if (score === 0) return;

    const badge = document.createElement('span');
    badge.className   = 'crave-tracker-badge';
    badge.textContent = TRACKER_LABELS[score];
    badge.style.color = TRACKER_COLORS[score];
    badge.title       = 'Tracker risk: ' + ['none','low','medium','high'][score];

    const anchor = el.querySelector('a[href]');
    if (anchor) anchor.appendChild(badge);
  });
}

function trackerInit() {
  trackerApply();
  new MutationObserver(trackerApply)
    .observe(document.body, { childList: true, subtree: true });
}

// ---- kagi/archive.js ----
function archiveInjectStyles() {
  if (document.getElementById('crave-archive-styles')) return;
  const s = document.createElement('style');
  s.id = 'crave-archive-styles';
  s.textContent = `
    .crave-archive-link {
      font-size: 10px; padding: 1px 6px; border-radius: 3px;
      margin-left: 6px; vertical-align: middle;
      border: 1px solid #444; color: #777;
      text-decoration: none; white-space: nowrap;
      opacity: 0; transition: opacity .15s;
      font-family: system-ui, sans-serif;
    }
    .fz-result:hover .crave-archive-link,
    .snippet:hover .crave-archive-link,
    [data-type="web"]:hover .crave-archive-link { opacity: 1; }
    .crave-archive-link:hover {
      border-color: var(--color-primary, #fa552a);
      color: var(--color-primary, #fa552a);
    }
  `;
  document.head.appendChild(s);
}

function archiveApply() {
  archiveInjectStyles();

  const results = [];
  for (const sel of ['.fz-result','.snippet','[data-type="web"]','.result']) {
    const els = document.querySelectorAll(sel);
    if (els.length) { els.forEach(e => results.push(e)); break; }
  }

  results.forEach(el => {
    if (el.querySelector('.crave-archive-link')) return;

    const a = el.querySelector('a[href]');
    if (!a) return;

    let url = '';
    try {
      const parsed = new URL(a.href);
      if (!parsed.protocol.startsWith('http')) return;
      url = parsed.href;
    } catch (_) { return; }

    const link = document.createElement('a');
    link.className  = 'crave-archive-link';
    link.href       = 'https://web.archive.org/web/*/' + url;
    link.target     = '_blank';
    link.rel        = 'noopener noreferrer';
    link.textContent = '📦 archive';
    link.title      = 'View on Wayback Machine';

    const urlLine = el.querySelector(
      '.url-breadcrumb, .fz-result__url, .snippet__url, [class*="url"], cite'
    );
    if (urlLine) urlLine.appendChild(link);
    else a.appendChild(link);
  });
}

function archiveInit() {
  archiveApply();
  new MutationObserver(archiveApply)
    .observe(document.body, { childList: true, subtree: true });
}

// ---- kagi/within.js ----
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

// ---- end.js ----
})();

