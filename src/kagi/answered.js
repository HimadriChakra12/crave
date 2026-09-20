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
