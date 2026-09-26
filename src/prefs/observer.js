let _prefsObserverCallbacks = [];
let _prefsObserverInstance  = null;
let _prefsObserverPending   = false;
let _prefsObserverPaused    = false;

function prefsIdle(cb) {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(cb, { timeout: 400 });
  else setTimeout(cb, 120);
}

function prefsFlushObservers() {
  _prefsObserverPending = false;
  if (_prefsObserverPaused) return;
  _prefsObserverCallbacks.forEach(fn => {
    try { fn(); } catch (_) { /* one bad feature shouldn't sink the rest */ }
  });
}

function prefsScheduleFlush() {
  if (_prefsObserverPending || _prefsObserverPaused) return;
  _prefsObserverPending = true;
  prefsIdle(prefsFlushObservers);
}

function prefsSharedObserve(fn) {
  _prefsObserverCallbacks.push(fn);
  fn();

  if (!_prefsObserverInstance) {
    _prefsObserverInstance = new MutationObserver(prefsScheduleFlush);
    _prefsObserverInstance.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('visibilitychange', () => {
      _prefsObserverPaused = document.hidden;
      if (!_prefsObserverPaused) prefsScheduleFlush();
    });
  }
}
