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
