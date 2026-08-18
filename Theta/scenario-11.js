const PAGE = document.querySelector('.scenario11-page');
const STAGE = document.querySelector('.scenario11-stage');
const COUNT = document.querySelector('[data-scenario11-count]');
const MAIN = document.querySelector('.scenario11-main');
const BACK = document.querySelector('.scenario11-back');

const DESIGN = { width: 1920, height: 1080 };
const INTRO = {
  initialPause: 500,
  countDuration: 3000,
  finalPause: 500,
  target: 90,
};
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setFrameScale() {
  const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
  STAGE.style.setProperty('--scenario11-scale', String(scale));
}

function showMain() {
  PAGE.classList.add('is-main-ready');
  MAIN.setAttribute('aria-hidden', 'false');
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
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 11 }, '*');
    return;
  }
  const closeEvent = new CustomEvent('theta:scenario11:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;

  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.assign('./index.html');
  }
});

window.addEventListener('resize', setFrameScale, { passive: true });
startScenario();
