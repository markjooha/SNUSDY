const PAGE = document.querySelector('.scenario7-page');
const STAGE = document.querySelector('.scenario7-stage');
const STORY = document.querySelector('.scenario7-story');
const COUNT = document.querySelector('[data-scenario7-count]');
const BACK = document.querySelector('.scenario7-back');
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';

const DESIGN = { width: 1920, height: 1080 };
const INTRO_TARGET = 40;
const TIMING = {
  introPause: 500,
  countDuration: 3000,
  introFinalPause: 500,
  introSlide: 850,
  paperEnter: 1200,
  beforeBack: 1000,
};

const PAPERS = [
  { source: './scenario/scenario-8/Paper-2.svg', left: 166, top: 150, rotate: 1.7 },
  { source: './scenario/scenario-8/Paper-3.svg', left: 156, top: 235, rotate: -2.3 },
  { source: './scenario/scenario-8/Paper-4.svg', left: 184, top: 167, rotate: 5.4 },
  { source: './scenario/scenario-8/Paper-5.svg', left: 139, top: 194, rotate: -3.8 },
  { source: './scenario/scenario-8/Paper-6.svg', left: 286, top: 129, rotate: 5 },
];

let step = 0;
let isEntering = false;
let storyReady = false;

// Warm each supplied Paper SVG while the count intro is on-screen so a click
// can move the actual sheet immediately.
PAPERS.forEach(({ source }) => {
  const image = new Image();
  image.src = source;
});

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
  PAGE.classList.add('is-story-ready');
  await wait(TIMING.introSlide);
  storyReady = true;
}

async function advanceStory() {
  if (!storyReady || isEntering || step >= PAPERS.length) return;

  isEntering = true;
  const paper = PAPERS[step];
  const layer = document.createElement('div');
  const art = document.createElement('img');

  layer.className = 'scenario7-paper-layer';
  layer.style.setProperty('--paper-left', `${paper.left}px`);
  layer.style.setProperty('--paper-top', `${paper.top}px`);
  layer.style.setProperty('--paper-rotate', `${paper.rotate}deg`);
  art.className = 'scenario7-paper-art';
  art.src = paper.source;
  art.alt = '';
  art.draggable = false;
  layer.append(art);
  STORY.append(layer);

  // Separate frames ensure the initial off-canvas position is painted before
  // Slow Spring (1200ms) begins.
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  layer.classList.add('is-entering');
  await wait(TIMING.paperEnter);

  step += 1;
  isEntering = false;

  if (step === PAPERS.length) {
    await wait(TIMING.beforeBack);
    BACK.classList.add('is-visible');
  }
}

STORY.addEventListener('click', advanceStory);

BACK.addEventListener('click', (event) => {
  event.stopPropagation();
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 8 }, '*');
    return;
  }
  const closeEvent = new CustomEvent('theta:scenario7:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;

  if (window.history.length > 1) window.history.back();
  else window.location.assign('./index.html');
});

window.addEventListener('resize', setStageScale, { passive: true });
setStageScale();
runIntro();
