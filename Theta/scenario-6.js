const PAGE = document.querySelector('.scenario6-page');
const STAGE = document.querySelector('.scenario6-stage');
const COUNT = document.querySelector('[data-scenario6-count]');
const FIRST_SEQUENCE = document.querySelector('.scenario6-sequence--first');
const SECOND_SEQUENCE = document.querySelector('.scenario6-sequence--second');
const BACK = document.querySelector('.scenario6-back');

const DESIGN = { width: 1920, height: 1080 };
const TIMING = {
  introPause: 500,
  countDuration: 3000,
  beforeStory: 500,
  firstLinePause: 680,
  lineInterval: 860,
  beforeSecondPhase: 900,
  phaseDissolve: 450,
  secondLinePause: 650,
  beforeBack: 700,
};

// Build-06's polar heading is 152°. It intentionally uses the included
// DS-Digital font, rather than the prose font used by the story frames.
const INTRO_TARGET = 152;
const IS_EMBEDDED = new URLSearchParams(window.location.search).get('embed') === '1';

const ASSET = (name) => `./scenario/scenario-6/${name}`;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion() ? 0 : duration));
}

function setStageScale() {
  const scale = Math.min(window.innerWidth / DESIGN.width, window.innerHeight / DESIGN.height);
  STAGE.style.setProperty('--scenario6-scale', String(scale));
}

function makeArt(source, className = 'scenario6-frame-art') {
  const image = document.createElement('img');
  image.className = className;
  image.src = ASSET(source);
  image.alt = '';
  image.draggable = false;
  return image;
}

function makeReveal(source, lineIndex, topOffset) {
  const image = makeArt(source, 'scenario6-reveal-art');
  // The exported S6 vectors sit in 60px line boxes. A small overhang prevents
  // a clipped ascender/descender while still revealing exactly one line.
  const top = topOffset + lineIndex * 60 - 11;
  image.style.setProperty('--line-top', `${top}px`);
  image.style.setProperty('--line-bottom', `${top + 72}px`);
  return image;
}

function show(reveal) {
  reveal.classList.add('is-visible');
}

async function countToTarget() {
  if (prefersReducedMotion()) {
    COUNT.textContent = String(INTRO_TARGET);
    return;
  }

  const startedAt = performance.now();
  await new Promise((resolve) => {
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / TIMING.countDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      COUNT.textContent = String(Math.min(INTRO_TARGET, Math.floor(INTRO_TARGET * eased)));
      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        COUNT.textContent = String(INTRO_TARGET);
        resolve();
      }
    };
    window.requestAnimationFrame(tick);
  });
}

async function revealLines(lines, startAt = 0) {
  for (let index = startAt; index < lines.length; index += 1) {
    show(lines[index]);
    if (index < lines.length - 1) await wait(TIMING.lineInterval);
  }
}

async function runScenario() {
  // Keep the original exported SVGs as the visible type layer: the supplied
  // artwork carries the exact Elice text outlines from Figma. Only the new
  // lines are clipped out and dissolved on top of the preceding frame.
  FIRST_SEQUENCE.append(makeArt('S6_Main-1.svg'));
  const firstReveals = [
    ...Array.from({ length: 7 }, (_, index) => makeReveal('S6_Main-2.svg', index + 1, 60)),
    ...Array.from({ length: 8 }, (_, index) => makeReveal('S6_Main-3.svg', index + 8, 60)),
  ];
  firstReveals.forEach((reveal) => FIRST_SEQUENCE.append(reveal));

  SECOND_SEQUENCE.append(makeArt('S6_Main-4.svg'));
  const secondReveals = Array.from(
    { length: 9 },
    (_, index) => makeReveal('S6_Main-5.svg', index + 2, 71),
  );
  secondReveals.forEach((reveal) => SECOND_SEQUENCE.append(reveal));

  if (prefersReducedMotion()) {
    COUNT.textContent = String(INTRO_TARGET);
    PAGE.classList.add('is-story-ready', 'is-second-phase');
    firstReveals.forEach(show);
    secondReveals.forEach(show);
    BACK.classList.add('is-visible');
    return;
  }

  await wait(TIMING.introPause);
  await countToTarget();
  await wait(TIMING.beforeStory);

  // S6_Intro-2 dissolves into S6_Main-1.
  PAGE.classList.add('is-story-ready');
  await wait(TIMING.firstLinePause);
  await revealLines(firstReveals); // S6_Main-2 → S6_Main-3, one line at a time.

  await wait(TIMING.beforeSecondPhase);
  // S6_Main-3 dissolves to S6_Main-4 before the second text block continues.
  PAGE.classList.add('is-second-phase');
  await wait(TIMING.phaseDissolve + TIMING.secondLinePause);
  await revealLines(secondReveals); // S6_Main-4 → S6_Main-5.

  await wait(TIMING.beforeBack);
  BACK.classList.add('is-visible');
}

BACK.addEventListener('click', () => {
  if (IS_EMBEDDED && window.parent !== window) {
    window.parent.postMessage({ channel: 'theta-scenario-embedded', action: 'close', id: 6 }, '*');
    return;
  }
  const closeEvent = new CustomEvent('theta:scenario6:close', { cancelable: true });
  if (!window.dispatchEvent(closeEvent)) return;

  if (window.history.length > 1) window.history.back();
  else window.location.assign('./index.html');
});

window.addEventListener('resize', setStageScale, { passive: true });
setStageScale();
runScenario();
