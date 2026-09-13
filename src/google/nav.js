function navGetQuery() {
  return new URLSearchParams(location.search).get('q') || '';
}

function mapsOpen(q) {
  const url = 'https://www.google.com/maps/search/' + encodeURIComponent(q);
  const sw   = screen.availWidth;
  const sh   = screen.availHeight;
  const w    = Math.min(900, sw - 80);
  const h    = Math.min(650, sh - 80);
  const left = Math.round((sw - w) / 2);
  const top  = Math.round((sh - h) / 2);
  window.open(
    url,
    'crave_maps',
    'width=' + w + ',height=' + h + ',left=' + left + ',top=' + top +
    ',resizable=yes,scrollbars=yes,toolbar=no,menubar=no,location=no'
  );
}

function navOnKey(e) { if (e.key === 'Escape') {} }

function navInjectFlights(ul, q) {
  if (ul.querySelector('[data-crave-flights]')) return;
  const li = document.createElement('li');
  li.className = 'tab-item svelte-l0weru';
  li.setAttribute('data-crave-flights', '1');
  const a = document.createElement('a');
  a.className = 'desktop-default-semibold svelte-l0weru';
  a.href      = 'https://www.google.com/travel/flights?q=' + encodeURIComponent(q);
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.innerHTML = '<span>Flights</span>';
  li.appendChild(a);
  const mapsLi = (ul.querySelector('a[href*="/maps/search"]') || {closest: ()=>null}).closest('li');
  if (mapsLi) mapsLi.after(li);
  else ul.appendChild(li);
}

function navHook(ul) {
  const q = navGetQuery();
  if (!q) return;

  ul.querySelectorAll('.tab-item a').forEach(a => {
    if (a.dataset.craveHooked) return;
    a.dataset.craveHooked = '1';
    const href = a.getAttribute('href') || '';

    if (href.includes('/maps/search')) {
      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        mapsOpen(new URLSearchParams(new URL(a.href, location.origin).search).get('q') || q);
      });
    }

    if (href.includes('/images')) {
      a.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        window.open('https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(q), '_blank', 'noopener noreferrer');
      });
    }
  });

  navInjectFlights(ul, q);
}

function navInit() {
  craveWaitFor('#primary-tabs', ul => {
    navHook(ul);
    const obs = new MutationObserver(() => {
      const current = document.querySelector('#primary-tabs');
      if (current) navHook(current);
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  });
}
