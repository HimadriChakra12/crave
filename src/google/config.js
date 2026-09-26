const CFG_KEY = 'crave_cfg';

const DEFAULTS = {
  lenses:    [],
  features: {
    lenses:     true,
    bang:       true,
    categories: true,
    tracker:    true,
    archive:    true,
    within:     true,
    /* prefs group -- lightweight/efficiency toggles, on by default */
    perfKillTrackers: true,
    perfNoAutoplay:   true,
    perfLazyMedia:    true,
    perfNoAnim:       true,
  },
};

let _cfg = null;

function cfgLoad() {
  try {
    const raw = GM_getValue(CFG_KEY, null);
    _cfg = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULTS));
    for (const k of Object.keys(DEFAULTS.features)) {
      if (_cfg.features[k] === undefined) _cfg.features[k] = DEFAULTS.features[k];
    }
    if (!_cfg.lenses)    _cfg.lenses    = [];
  } catch (_) {
    _cfg = JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function cfgSave() { GM_setValue(CFG_KEY, JSON.stringify(_cfg)); }
function cfgGet()  { if (!_cfg) cfgLoad(); return _cfg; }

function cfgToggleFeature(key) {
  const c = cfgGet(); c.features[key] = !c.features[key]; cfgSave(); return c.features[key];
}
function cfgFeatureOn(key) { return !!cfgGet().features[key]; }

function cfgAddLens(name, prefix) {
  const c = cfgGet();
  if (!c.lenses.find(l => l.name === name)) { c.lenses.push({ name, prefix }); cfgSave(); }
}
function cfgRemoveLens(name) {
  const c = cfgGet(); c.lenses = c.lenses.filter(l => l.name !== name); cfgSave();
}
