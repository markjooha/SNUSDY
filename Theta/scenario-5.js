const PAGE = document.querySelector('.scenario5-page');
const FRAME = document.querySelector('.scenario5-frame');
const COUNT = document.querySelector('[data-scenario5-count]');
const BACK = document.querySelector('.scenario5-back');

const DESIGN = { width: 1920, height: 1080 };
const INTRO = {
  initialPause: 500,
  countDuration: 3000,
  finalPause: 500,
  target: 21,
};
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setFrameScale() {
  const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
  FRAME.style.setProperty('--scenario5-scale', String(scale));
}

function showMain() {
  PAGE.classList.add('is-main-ready');
  document.querySelector('.scenario5-main').setAttribute('aria-hidden', 'false');
}

function animateCount() {
  if (prefersReducedMotion()) {
    COUNT.textContent = String(INTRO.target);
    showMain();
    return;
  }

  const startedAt = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - startedAt) / INTRO.countDuration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    COUNT.textContent = String(Math.min(INTRO.target, Math.floor(INTRO.target * eased)));

    if (progress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    COUNT.textContent = String(INTRO.target);
    window.setTimeout(showMain, INTRO.finalPause);
  };

  window.requestAnimationFrame(tick);
}

function startScenario() {
  setFrameScale();
  if (prefersReducedMotion()) {
    animateCount();
    return;
  }
  window.setTimeout(animateCount, INTRO.initialPause);
}

BACK.addEventListener('click', () => {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 5 }, '*');
    return;
  }
  const closeEvent = new CustomEvent('theta:scenario5:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;

  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.assign('./index.html');
  }
});

window.addEventListener('resize', setFrameScale, { passive: true });
startScenario();
