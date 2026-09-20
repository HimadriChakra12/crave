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
