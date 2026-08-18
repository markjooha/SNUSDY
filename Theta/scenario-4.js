const PAGE = document.querySelector('.scenario4-page');
const STAGE = document.querySelector('.scenario4-stage');
const COUNT = document.querySelector('[data-scenario4-count]');
const MAIN = document.querySelector('.scenario4-main');
const SCROLL = document.querySelector('.scenario4-scroll');
const BACK = document.querySelector('.scenario4-back');

const DESIGN = { width: 1920, height: 1080 };
const INTRO = { initialPause: 500, countDuration: 3000, finalPause: 500, target: 42 };
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';
const ARTWORK_ASSETS = [
  './scenario/scenario-4/S4_Main-Title.svg',
  './scenario/scenario-4/S4_Main-Cue.svg',
  './scenario/scenario-4/S4_Main-Quote.svg',
  './scenario/scenario-4/S4_Main-Photos.svg',
  './scenario/scenario-4/S4_Main-Timeline.svg',
  './scenario/scenario-4/S4_Main-Story-1.svg',
  './scenario/scenario-4/S4_Main-Story-2.svg',
];

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setFrameScale() {
  const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
  STAGE.style.setProperty('--scenario4-scale', String(scale));
}

function createTextLines(container, layerUrl, start, end) {
  for (let top = start; top <= end; top += 50) {
    const line = document.createElement('i');
    line.className = 'scenario4-text-line';
    line.style.top = `${top}px`;
    line.style.backgroundImage = `url("${layerUrl}")`;
    line.style.backgroundPosition = `0 -${top}px`;
    container.append(line);
  }
}

function prepareTextLines() {
  // Static transparent layers work even when the page opens directly from disk.
  createTextLines(document.querySelector('[data-scenario4-story="one"]'), './scenario/scenario-4/S4_Main-Story-1.svg', 1950, 4150);
  createTextLines(document.querySelector('[data-scenario4-story="two"]'), './scenario/scenario-4/S4_Main-Story-2.svg', 5600, 7900);
}

function preloadArtwork(source) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
    image.src = source;
  });
}

function setupScrollReveal() {
  const targets = [...document.querySelectorAll('.scenario4-reveal, .scenario4-text-line, .scenario4-back')];
  if (prefersReducedMotion()) {
    targets.forEach((target) => target.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { root: SCROLL, rootMargin: '0px 0px -35% 0px', threshold: 0 });
  targets.forEach((target) => observer.observe(target));
}

function showMain() {
  PAGE.classList.add('is-main-ready');
  MAIN.setAttribute('aria-hidden', 'false');
  artworkReady.finally(() => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(setupScrollReveal));
  });
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

function closeScenario() {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 4 }, '*');
    return;
  }
  const closeEvent = new CustomEvent('theta:scenario4:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;
  if (window.history.length > 1) window.history.back();
  else window.location.assign('./index.html');
}

BACK.addEventListener('click', closeScenario);
prepareTextLines();
const artworkReady = Promise.all(ARTWORK_ASSETS.map(preloadArtwork));
window.addEventListener('resize', setFrameScale, { passive: true });
setFrameScale();
window.setTimeout(animateCount, prefersReducedMotion() ? 0 : INTRO.initialPause);
