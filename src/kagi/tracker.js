/* Known heavy-tracker domains — priority tiers */
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
  prefsSharedObserve(trackerApply);
}
