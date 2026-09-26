function settingsIsPage() {
  return location.pathname === '/settings';
}

const CRAVE_FEATURES = [
  { key: 'lenses',     label: 'Lenses',          desc: 'Quick site filter dropdown in the nav bar',    icon: '🔍', color: '#212848' },
  { key: 'bang',       label: 'Bangs',            desc: '!yt, !gh, !mdn … redirect shortcuts',          icon: '!',  color: '#212848' },
  { key: 'categories', label: 'Category demote',  desc: 'Fade forums, social, SEO farms and listicles', icon: '🏷', color: '#212848' },
  { key: 'tracker',    label: 'Tracker badges',   desc: 'Show tracker risk on results',                 icon: '🛡', color: '#212848' },
  { key: 'archive',    label: 'Archive link',     desc: 'Wayback Machine link on each result',          icon: '📦', color: '#212848' },
  { key: 'within',     label: 'Filter results',   desc: 'Instant text filter across visible results',   icon: '⚡', color: '#212848' },
  { key: 'perfKillTrackers', label: 'Kill trackers',   desc: 'Strip known ad/analytics scripts, iframes, pixels', icon: '🚫', color: '#212848' },
  { key: 'perfNoAutoplay',   label: 'No autoplay',     desc: 'Pause video/audio, skip preloading media',          icon: '⏸',  color: '#212848' },
  { key: 'perfLazyMedia',    label: 'Lazy media',      desc: 'Defer off-screen images/iframes until scrolled to', icon: '🐢', color: '#212848' },
  { key: 'perfNoAnim',       label: 'Cut animations',  desc: 'Collapse transitions/animations to save CPU/GPU',   icon: '🧊', color: '#212848' },
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

  /* Find the premium CTA article inside the sidebar */
  const premiumCTA = document.querySelector('.sidebar article.premium-cta, .sidebar .premium-cta, aside article.premium-cta');
  if (!premiumCTA) return;

  settingsInjectStyles();

  /* Wrapper to match sidebar article spacing */
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

  /* Replace the premium CTA in-place inside the sidebar */
  premiumCTA.replaceWith(wrapper);
}

function settingsInit() {
  if (!settingsIsPage()) return;
  settingsInject();
  let t;
  new MutationObserver(() => { clearTimeout(t); t = setTimeout(settingsInject, 80); })
    .observe(document.documentElement, { childList: true, subtree: true });
}
