const TOAST_ID = 'crave-toast';

function uiInjectStyles() {
  const style = document.createElement('style');
  style.textContent = `
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

function uiHideSidebarCTA() {
  const style = document.createElement('style');
  style.textContent = `
    .set-default { display: none !important; }
  `;
  document.head.appendChild(style);
}

function uiInit() {
  uiInjectStyles();
  uiHideSidebarCTA();
}
