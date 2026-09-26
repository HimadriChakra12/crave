function prefsInjectMotionStyles() {
  if (document.getElementById('crave-prefs-motion')) return;
  const s = document.createElement('style');
  s.id = 'crave-prefs-motion';
  s.textContent = `
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-delay: 0ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      transition-delay: 0ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.appendChild(s);
}

function prefsMotionInit() {
  if (!cfgFeatureOn('perfNoAnim')) return;
  prefsInjectMotionStyles();
}
