/* ── Crave boot ── */
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
