const PAGE = document.querySelector('.scenario7-page');
const STAGE = document.querySelector('.scenario7-stage');
const COUNT = document.querySelector('[data-scenario7-count]');
const BACK = document.querySelector('.scenario7-back');
const ITEMS = document.querySelectorAll('[data-scenario7-item]');
const DETAIL = document.querySelector('.scenario7-detail');
const DETAIL_RETURN = document.querySelector('.scenario7-detail-return');

const DESIGN = { width: 1920, height: 1080 };
const INTRO_TARGET = 40;
const TIMING = {
  introPause: 500,
  countDuration: 3000,
  introFinalPause: 500,
  introDissolve: 380,
};
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion() ? 0 : duration));
}

function setStageScale() {
  const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
  STAGE.style.setProperty('--scenario7-scale', String(scale));
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
  await wait(TIMING.introPause);
  PAGE.classList.add('is-counting');
  await countToTarget();
  PAGE.classList.add('is-intro-final');
  await wait(TIMING.introFinalPause);
  PAGE.classList.add('is-intro-exiting');
  await wait(TIMING.introDissolve);
  PAGE.classList.add('is-main-ready');
  await wait(1820);
  PAGE.classList.add('is-entry-complete');
}

function openDetail(kind) {
  if (!PAGE.classList.contains('is-main-ready') || PAGE.classList.contains('is-detail-open')) return;
  PAGE.classList.add('is-detail-open', `is-detail-${kind}`);
  DETAIL.setAttribute('aria-hidden', 'false');
}

function returnToMain() {
  if (!PAGE.classList.contains('is-detail-open')) return;
  PAGE.classList.remove('is-detail-open', 'is-detail-note', 'is-detail-paper');
  DETAIL.setAttribute('aria-hidden', 'true');
}

function closeScenario() {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 7 }, '*');
    return;
  }

  const closeEvent = new CustomEvent('theta:scenario7:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;
  if (window.history.length > 1) window.history.back();
  else window.location.assign('./index.html');
}

ITEMS.forEach((item) => item.addEventListener('click', () => openDetail(item.dataset.scenario7Item)));
DETAIL_RETURN.addEventListener('click', returnToMain);
BACK.addEventListener('click', closeScenario);
window.addEventListener('resize', setStageScale, { passive: true });

setStageScale();
runIntro();
