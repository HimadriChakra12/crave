const PANEL_ID = 'crave-panel';
const BTN_ID    = 'crave-toggle-btn';
const TOAST_ID  = 'crave-toast';

function uiInjectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #${BTN_ID} {
      position: fixed; bottom: 20px; right: 20px; z-index: 99999;
      width: 38px; height: 38px; border-radius: 50%;
      background: var(--color-primary, #fa552a);
      color: #fff; font-size: 18px; line-height: 38px; text-align: center;
      cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.35);
      user-select: none; transition: transform .15s;
    }
    #${BTN_ID}:hover { transform: scale(1.1); }

    #${PANEL_ID} {
      position: fixed; bottom: 68px; right: 20px; z-index: 99998;
      width: 310px; background: var(--color-bg-primary, #1a1a1a);
      border: 1px solid var(--color-border, #333);
      border-radius: 10px; padding: 14px 16px;
      font: 13px/1.5 system-ui, sans-serif;
      color: var(--color-text-primary, #e8e8e8);
      box-shadow: 0 4px 24px rgba(0,0,0,.5);
      display: none;
    }
    #${PANEL_ID}.crave-open { display: block; }
    #${PANEL_ID} h3 {
      margin: 0 0 10px; font-size: 13px; font-weight: 600;
      letter-spacing: .04em; color: var(--color-primary, #fa552a);
      text-transform: uppercase;
    }
    #${PANEL_ID} .crave-section { margin-bottom: 12px; }
    #${PANEL_ID} .crave-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px 0;
    }
    #${PANEL_ID} .crave-label { font-size: 12px; }
    #${PANEL_ID} .crave-toggle {
      position: relative; width: 34px; height: 18px; flex-shrink: 0;
    }
    #${PANEL_ID} .crave-toggle input { opacity: 0; width: 0; height: 0; }
    #${PANEL_ID} .crave-slider {
      position: absolute; inset: 0; border-radius: 18px; cursor: pointer;
      background: #444; transition: background .2s;
    }
    #${PANEL_ID} .crave-slider::before {
      content: ''; position: absolute;
      width: 12px; height: 12px; left: 3px; top: 3px;
      border-radius: 50%; background: #fff; transition: transform .2s;
    }
    #${PANEL_ID} .crave-toggle input:checked + .crave-slider { background: var(--color-primary, #fa552a); }
    #${PANEL_ID} .crave-toggle input:checked + .crave-slider::before { transform: translateX(16px); }

    #${PANEL_ID} .crave-sep {
      height: 1px; background: var(--color-border, #333); margin: 8px 0;
    }
    #${PANEL_ID} .crave-lens-row {
      display: flex; gap: 6px; margin-bottom: 6px;
    }
    #${PANEL_ID} .crave-lens-row input {
      flex: 1; background: var(--color-bg-secondary, #2a2a2a);
      border: 1px solid var(--color-border, #444); border-radius: 5px;
      padding: 4px 7px; font-size: 11px; color: inherit;
    }
    #${PANEL_ID} .crave-btn {
      padding: 4px 10px; border-radius: 5px; border: none; cursor: pointer;
      font-size: 11px; background: var(--color-primary, #fa552a); color: #fff;
    }
    #${PANEL_ID} .crave-btn-ghost {
      background: transparent;
      border: 1px solid var(--color-border, #444);
      color: var(--color-text-primary, #e8e8e8);
    }
    #${PANEL_ID} .crave-list {
      list-style: none; margin: 4px 0 0; padding: 0; max-height: 80px;
      overflow-y: auto; font-size: 11px;
    }
    #${PANEL_ID} .crave-list li {
      display: flex; justify-content: space-between; align-items: center;
      padding: 2px 0;
    }
    #${PANEL_ID} .crave-list li span.crave-rm {
      cursor: pointer; color: #888; font-size: 13px; line-height: 1;
    }
    #${PANEL_ID} .crave-list li span.crave-rm:hover { color: #fa552a; }

    .crave-domain-btns {
      display: inline-flex; gap: 4px; margin-left: 6px;
      vertical-align: middle; opacity: 0;
      transition: opacity .15s;
    }
    .fz-result:hover .crave-domain-btns,
    .snippet:hover .crave-domain-btns,
    [data-type="web"]:hover .crave-domain-btns { opacity: 1; }
    .crave-domain-btns button {
      font-size: 10px; padding: 1px 5px; border-radius: 3px;
      border: 1px solid #555; background: transparent;
      color: #aaa; cursor: pointer; line-height: 1.4;
    }
    .crave-domain-btns button:hover { border-color: #fa552a; color: #fa552a; }

    #${TOAST_ID} {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      z-index: 99999; background: #222; color: #eee;
      padding: 8px 18px; border-radius: 20px; font-size: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,.4);
      opacity: 0; pointer-events: none; transition: opacity .25s;
    }
    #${TOAST_ID}.crave-show { opacity: 1; }

  `;
  document.head.appendChild(style);
}

function uiToast(msg, duration) {
  duration = duration || 2000;
  let el = document.getElementById(TOAST_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOAST_ID;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('crave-show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('crave-show'), duration);
}

function uiBuildToggleRow(label, featureKey, onToggle) {
  const row = document.createElement('div');
  row.className = 'crave-row';

  const lbl = document.createElement('span');
  lbl.className = 'crave-label';
  lbl.textContent = label;

  const tog = document.createElement('label');
  tog.className = 'crave-toggle';
  const inp = document.createElement('input');
  inp.type = 'checkbox';
  inp.checked = cfgFeatureOn(featureKey);
  inp.addEventListener('change', () => {
    const state = cfgToggleFeature(featureKey);
    if (onToggle) onToggle(state);
    uiToast(label + (state ? ' on' : ' off'));
  });
  const slider = document.createElement('span');
  slider.className = 'crave-slider';
  tog.appendChild(inp);
  tog.appendChild(slider);

  row.appendChild(lbl);
  row.appendChild(tog);
  return row;
}

function uiBuildBlocklistSection() {
  const sec = document.createElement('div');
  sec.className = 'crave-section';

  const h = document.createElement('h3');
  h.textContent = 'Blocked domains';
  sec.appendChild(h);

  const list = document.createElement('ul');
  list.className = 'crave-list';
  list.id = 'crave-blocklist';
  sec.appendChild(list);

  function render() {
    list.innerHTML = '';
    const blocked = Object.keys(cfgGet().blockList);
    if (blocked.length === 0) {
      const li = document.createElement('li');
      li.style.color = '#666';
      li.textContent = 'none yet — hover a result to block';
      list.appendChild(li);
      return;
    }
    blocked.forEach(d => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = d;
      const rm = document.createElement('span');
      rm.className = 'crave-rm';
      rm.textContent = '×';
      rm.title = 'Remove block';
      rm.addEventListener('click', () => {
        cfgUnpinDomain(d);
        render();
        uiToast('Unblocked ' + d);
        blockerApply();
      });
      li.appendChild(name);
      li.appendChild(rm);
      list.appendChild(li);
    });
  }

  render();
  sec._refresh = render;
  return sec;
}



function uiBuildPanel() {
  const panel = document.createElement('div');
  panel.id = PANEL_ID;

  const title = document.createElement('h3');
  title.textContent = '⚡ Crave';
  panel.appendChild(title);

  const featureRows = [
    ['Domain blocker', 'blocker', () => { blockerApply(); }],
    ['Nav hooks',      'nav',     () => { navInit(); }],
  ];
  featureRows.forEach(([label, key, cb]) => {
    panel.appendChild(uiBuildToggleRow(label, key, cb));
  });

  panel.appendChild(Object.assign(document.createElement('div'), { className: 'crave-sep' }));
  panel.appendChild(uiBuildBlocklistSection());

  return panel;
}

function uiInit() {
  uiInjectStyles();

  const btn = document.createElement('div');
  btn.id = BTN_ID;
  btn.textContent = '⚡';
  btn.title = 'Crave settings';
  document.body.appendChild(btn);

  const panel = uiBuildPanel();
  document.body.appendChild(panel);

  btn.addEventListener('click', () => panel.classList.toggle('crave-open'));

  document.addEventListener('click', e => {
    if (!panel.contains(e.target) && e.target !== btn)
      panel.classList.remove('crave-open');
  });
}

function uiAttachDomainBtns(resultEl, domain) {
  if (resultEl.querySelector('.crave-domain-btns')) return;

  const wrap = document.createElement('span');
  wrap.className = 'crave-domain-btns';

  const blockBtn = document.createElement('button');
  blockBtn.textContent = '✕ block';
  blockBtn.title = 'Block ' + domain;
  blockBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    cfgBlockDomain(domain);
    blockerApply();
    uiToast('Blocked ' + domain);
    const bl = document.getElementById('crave-blocklist');
    if (bl && bl.closest('div')._refresh) bl.closest('div')._refresh();
  });

  const boostBtn = document.createElement('button');
  boostBtn.textContent = '▲ boost';
  boostBtn.title = 'Boost ' + domain;
  boostBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    cfgBoostDomain(domain);
    blockerApply();
    uiToast('Boosted ' + domain);
  });

  wrap.appendChild(blockBtn);
  wrap.appendChild(boostBtn);

  const titleEl = resultEl.querySelector('a[href], .title, h3');
  if (titleEl) titleEl.appendChild(wrap);
  else resultEl.appendChild(wrap);
}
