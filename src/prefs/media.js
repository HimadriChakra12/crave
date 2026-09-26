function prefsTameMedia(root) {
  if (cfgFeatureOn('perfNoAutoplay')) {
    root.querySelectorAll('video, audio').forEach(m => {
      m.autoplay = false;
      m.preload  = 'none';
      if (!m.paused) m.pause();
    });
  }

  if (cfgFeatureOn('perfLazyMedia')) {
    root.querySelectorAll('img:not([loading])').forEach(img => {
      img.loading  = 'lazy';
      img.decoding = 'async';
    });
    root.querySelectorAll('iframe:not([loading])').forEach(f => {
      f.loading = 'lazy';
    });
  }
}

function prefsMediaInit() {
  if (!cfgFeatureOn('perfNoAutoplay') && !cfgFeatureOn('perfLazyMedia')) return;
  prefsTameMedia(document);
  prefsSharedObserve(() => prefsTameMedia(document.body));
}
