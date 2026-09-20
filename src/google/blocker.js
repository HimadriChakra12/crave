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
  try { return new URL(a.href).hostname.replace(/^www\./, ''); }
  catch (_) { return null; }
}

function blockerApply() {
  if (!cfgFeatureOn('blocker')) return;

  blockerGetResultEls().forEach(el => {
    const domain = blockerDomainFromEl(el);
    if (!domain) return;

    if (cfgIsBlocked(domain)) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    uiAttachDomainBtns(el, domain);
  });
}

function blockerObserve() {
  new MutationObserver(blockerApply)
    .observe(document.body, { childList: true, subtree: true });
}

function blockerInit() {
  blockerApply();
  blockerObserve();
}
