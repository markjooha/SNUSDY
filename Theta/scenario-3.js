const PAGE = document.querySelector('.scenario3-page');
const STAGE = document.querySelector('.scenario3-stage');
const COUNT = document.querySelector('[data-scenario3-count]');
const SCREENS = [...document.querySelectorAll('[data-scenario3-screen]')];
const BACK = document.querySelector('.scenario3-back');

const DESIGN = { width: 1920, height: 1080 };
const INTRO_TARGET = 80;
const TIMING = {
  initialPause: 500,
  countDuration: 3000,
  finalPause: 500,
  dissolve: 400,
};
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';

let activeScreen = 1;
let isDissolving = false;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion() ? 0 : duration));
}

function setStageScale() {
  const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
  STAGE.style.setProperty('--scenario3-scale', String(scale));
}

async function countToTarget() {
  if (prefersReducedMotion()) {
    COUNT.textContent = String(INTRO_TARGET);
    return;
  }

  await new Promise((resolve) => {
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / TIMING.countDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      COUNT.textContent = String(Math.min(INTRO_TARGET, Math.floor(INTRO_TARGET * eased)));

      if (progress < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      COUNT.textContent = String(INTRO_TARGET);
      resolve();
    };
    window.requestAnimationFrame(tick);
  });
}

async function runIntro() {
  await wait(TIMING.initialPause);
  await countToTarget();
  await wait(TIMING.finalPause);
  PAGE.classList.add('is-main-ready');
}

async function showScreen(nextScreen) {
  if (isDissolving || nextScreen === activeScreen || nextScreen > SCREENS.length) return;

  isDissolving = true;
  const current = SCREENS[activeScreen - 1];
  const next = SCREENS[nextScreen - 1];
  next.removeAttribute('aria-hidden');
  next.classList.add('is-current');
  current.classList.remove('is-current');

  await wait(TIMING.dissolve);
  current.setAttribute('aria-hidden', 'true');
  activeScreen = nextScreen;
  isDissolving = false;
}

document.querySelectorAll('.scenario3-next').forEach((button) => {
  button.addEventListener('click', () => showScreen(activeScreen + 1));
});

BACK.addEventListener('click', () => {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 3 }, '*');
    return;
  }

  const closeEvent = new CustomEvent('theta:scenario3:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;

  if (window.history.length > 1) window.history.back();
  else window.location.assign('./index.html');
});

window.addEventListener('resize', setStageScale, { passive: true });
setStageScale();
runIntro();
