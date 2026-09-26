const PREFS_BLOCK_HOSTS = [
  'doubleclick.net', 'googlesyndication.com', 'googletagmanager.com',
  'google-analytics.com', 'googleadservices.com', 'adservice.google.com',
  'facebook.net', 'connect.facebook.net', 'scorecardresearch.com',
  'adnxs.com', 'taboola.com', 'outbrain.com', 'hotjar.com',
  'fullstory.com', 'mouseflow.com', 'segment.com', 'segment.io',
  'amplitude.com', 'mixpanel.com', 'criteo.com', 'quantserve.com',
  'rubiconproject.com', 'openx.net', 'pubmatic.com',
];

function prefsHostBlocked(url) {
  try {
    const h = new URL(url, location.href).hostname.replace(/^www\./, '');
    return PREFS_BLOCK_HOSTS.some(b => h === b || h.endsWith('.' + b));
  } catch (_) {
    return false;
  }
}

function prefsStripIfTracker(el) {
  const src = el.getAttribute('src');
  if (!src || !prefsHostBlocked(src)) return;
  el.remove();
}

function prefsSweepNetwork(root) {
  root.querySelectorAll('script[src], iframe[src], img[src]')
    .forEach(prefsStripIfTracker);
}

function prefsNetworkInit() {
  if (!cfgFeatureOn('perfKillTrackers')) return;
  prefsSweepNetwork(document);
  prefsSharedObserve(() => prefsSweepNetwork(document.body));
}
