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
