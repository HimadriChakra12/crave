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
      /* skip non-http */
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

    /* Inject near the URL/breadcrumb line */
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
