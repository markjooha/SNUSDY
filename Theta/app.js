const intro = document.querySelector('#intro');
const introWorld = document.querySelector('#introWorld');
const introScreens = [...document.querySelectorAll('[data-intro-screen]')];
const introStart = document.querySelector('#introStart');
const aboutChoice = document.querySelector('#aboutChoice');
const mapChoice = document.querySelector('#mapChoice');
const aboutBack = document.querySelector('#aboutBack');
const landing = document.querySelector('#landing');
const mapPage = document.querySelector('#mapPage');
const enterMap = document.querySelector('#enterMap');
const landingMap = document.querySelector('.landing-map');
const viewport = document.querySelector('#mapViewport');
const canvas = document.querySelector('#mapCanvas');
const uiLayer = document.querySelector('#uiLayer');
const coordinates = document.querySelector('#coordinates');
const indexTrigger = document.querySelector('#indexTrigger');
const indexOverlay = document.querySelector('#indexOverlay');
const closeIndex = document.querySelector('#closeIndex');
const buildingOverlay = document.querySelector('#buildingOverlay');
const closeBuilding = document.querySelector('#closeBuilding');
const daerimButton = document.querySelector('#daerimButton');
const buildingHotspot = document.querySelector('#buildingHotspot');
let mapArt = canvas.querySelector('.map-art');
const mapMainLayer = document.querySelector('.map-main-layer');

const FIGMA = { width: 1920, height: 1080, mapWidth: 8054, mapHeight: 7449 };
// Map_Center.svg marks the origin with a red point at (960, 540) in Page_Map_1.
// Transforming that point into the Page_Map_2 map frame gives this exact map-space origin.
const MAP_ORIGIN = { x: 4018.39162, y: 4197.871091 };
const MAP_BORDER = { x: 2802.26025390625, y: 2981.3837890625, width: 2427.280517578125, height: 2426.32421875 };
const CAMERA_BOUNDARY = {
  x: MAP_BORDER.x + MAP_BORDER.width / 2,
  y: MAP_BORDER.y + MAP_BORDER.height / 2,
  radius: Math.min(MAP_BORDER.width, MAP_BORDER.height) * .5 * .8,
};
const BUILDING_VIEW = { x: 4240.471504211426, y: 4485.057952880859 };
const ZOOM = { min: .72, max: 1.8, step: .12 };
// All passive camera motion is owned by one requestAnimationFrame loop.
const MOTION = {
  landing: { duration: 1600, easing: 'cubic-bezier(.22,.72,.18,1)' },
  overlay: { duration: 640, easing: 'cubic-bezier(.22,.72,.18,1)', coordinateDelay: 110 },
  drag: { sampleWeight: .28, maxVelocity: .9, damping: .0072, stopVelocity: .012 },
  zoom: { wheelImpulse: .00001, immediateFactor: .00012, maxVelocity: .0024, damping: .009, stopVelocity: .000015 },
  camera: { duration: 560 },
};
// Values below come from the Figma prototype reactions (not visual estimates).
const INTRO = {
  page6ToT1: { type: 'DISSOLVE', duration: 550, easing: 'var(--figma-ease-in)' },
  t1: { delay: 500, type: 'SMART_ANIMATE', duration: 900, easing: 'var(--figma-ease-out)' },
  t2: { delay: 600, type: 'SMART_ANIMATE', duration: 1500, easing: 'var(--figma-ease-out)' },
  t3: { delay: 800, type: 'SMART_ANIMATE', duration: 1200, easing: 'var(--figma-ease-out)' },
  page7: {
    enter: { duration: 600, easing: 'var(--figma-ease-out)' },
    leave: { duration: 550, easing: 'var(--figma-ease-in)' },
    choice: { duration: 511.046886, easing: 'GENTLE' },
    about: { type: 'DISSOLVE', duration: 600, easing: 'var(--figma-ease-out)' },
    map: { type: 'DISSOLVE', duration: 1000, easing: 'var(--figma-ease-out)' },
  },
  aboutTransition: { delay: 200, type: 'SMART_ANIMATE', duration: 1000, easing: 'var(--figma-ease-out)' },
  aboutBack: { type: 'DISSOLVE', duration: 1000, easing: 'var(--figma-ease-out)' },
  indexTrace: { delay: 1, duration: 400, easing: 'var(--figma-ease-out)' },
};
let displayScale = getScale();
let zoom = 1;
let mapPosition = positionForWorldCenter(MAP_ORIGIN, 1);
let selectedName = '-';
let drag = null;
let landingTransitioning = false;
let returnRequestedDuringTransition = false;
let motionFrame = 0;
let motionLastTime = 0;
let dragVelocity = { x: 0, y: 0 };
let zoomVelocity = 0;
let zoomFocus = null;
let cameraTween = null;
let introTimers = [];
let introTransitioning = false;
let indexTraceTimer = 0;

function applyMotionTokens() {
  const root = document.documentElement.style;
  root.setProperty('--landing-zoom-duration', `${MOTION.landing.duration}ms`);
  root.setProperty('--landing-zoom-easing', MOTION.landing.easing);
  root.setProperty('--map-ui-enter-duration', `${MOTION.overlay.duration}ms`);
  root.setProperty('--map-ui-enter-easing', MOTION.overlay.easing);
  root.setProperty('--coordinates-enter-delay', `${MOTION.overlay.coordinateDelay}ms`);
}

function applyIntroScale() {
  introWorld.style.setProperty('--intro-scale', Math.min(window.innerWidth / FIGMA.width, window.innerHeight / FIGMA.height));
}

function clearIntroTimers() {
  introTimers.forEach((timer) => window.clearTimeout(timer));
  introTimers = [];
}

function queueIntro(next, delay) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  introTimers.push(window.setTimeout(next, reducedMotion ? 1 : delay));
}

function getIntroScreen(name) {
  return introScreens.find((screen) => screen.dataset.introScreen === name);
}

function resetIntroScreen(screen) {
  screen.classList.remove('is-active', 'is-entering', 'is-dissolve-target', 'is-smart-enter', 'is-from-axes', 'is-from-about-transition', 'is-about-hovered', 'is-map-hovered');
  screen.style.removeProperty('--intro-motion-duration');
  screen.style.removeProperty('--intro-motion-easing');
  screen.setAttribute('aria-hidden', 'true');
}

function setIntroMotion(screen, motion) {
  screen.style.setProperty('--intro-motion-duration', `${motion.duration}ms`);
  screen.style.setProperty('--intro-motion-easing', motion.easing);
}

function showIntroScreen(name, { entryClass = '', motion = null, clearTimers = true } = {}) {
  if (clearTimers) clearIntroTimers();
  const nextScreen = introScreens.find((screen) => screen.dataset.introScreen === name);
  if (!nextScreen) return;
  introScreens.forEach((screen) => {
    const active = screen === nextScreen;
    if (!active) {
      resetIntroScreen(screen);
      return;
    }
    screen.classList.add('is-active');
    screen.classList.remove('is-entering', 'is-dissolve-target', 'is-smart-enter', 'is-from-axes', 'is-from-about-transition', 'is-about-hovered', 'is-map-hovered');
    if (entryClass) screen.classList.add(entryClass);
    if (motion) setIntroMotion(screen, motion);
    else {
      screen.style.removeProperty('--intro-motion-duration');
      screen.style.removeProperty('--intro-motion-easing');
    }
    screen.setAttribute('aria-hidden', 'false');
  });
  window.requestAnimationFrame(() => nextScreen.classList.add('is-entering'));
  return nextScreen;
}

function dissolveIntroTo(name, motion, onComplete) {
  clearIntroTimers();
  const source = introScreens.find((screen) => screen.classList.contains('is-active'));
  const target = getIntroScreen(name);
  if (!target || source === target) {
    showIntroScreen(name, { clearTimers: false });
    onComplete?.();
    return;
  }

  introTransitioning = true;
  introScreens.forEach((screen) => {
    if (screen !== source && screen !== target) resetIntroScreen(screen);
  });
  target.classList.remove('is-entering', 'is-smart-enter', 'is-from-axes', 'is-from-about-transition', 'is-about-hovered', 'is-map-hovered');
  target.classList.add('is-active', 'is-dissolve-target');
  target.setAttribute('aria-hidden', 'false');
  setIntroMotion(target, motion);
  if (source) source.setAttribute('aria-hidden', 'true');

  window.requestAnimationFrame(() => target.classList.add('is-entering'));
  queueIntro(() => {
    if (source) resetIntroScreen(source);
    target.classList.remove('is-dissolve-target', 'is-entering');
    target.style.removeProperty('--intro-motion-duration');
    target.style.removeProperty('--intro-motion-easing');
    introTransitioning = false;
    onComplete?.();
  }, motion.duration);
}

function smartAnimateIntroTo(name, motion, entryClass, onComplete) {
  introTransitioning = true;
  const target = showIntroScreen(name, { entryClass, motion });
  if (!target) {
    introTransitioning = false;
    return;
  }
  queueIntro(() => {
    target.classList.remove('is-entering', entryClass);
    target.style.removeProperty('--intro-motion-duration');
    target.style.removeProperty('--intro-motion-easing');
    introTransitioning = false;
    onComplete?.();
  }, motion.duration);
}

function beginIntroSequence() {
  if (introTransitioning) return;
  dissolveIntroTo('page6t1', INTRO.page6ToT1, () => {
    queueIntro(() => {
      smartAnimateIntroTo('page6t2', INTRO.t1, 'is-smart-enter', () => {
        queueIntro(() => {
          smartAnimateIntroTo('page6t3', INTRO.t2, 'is-smart-enter', () => {
            queueIntro(() => smartAnimateIntroTo('page7', INTRO.t3, 'is-from-axes'), INTRO.t3.delay);
          });
        }, INTRO.t2.delay);
      });
    }, INTRO.t1.delay);
  });
}

function setPage7Hover(kind) {
  const page7 = getIntroScreen('page7');
  if (!page7 || !page7.classList.contains('is-active') || introTransitioning) return;
  page7.classList.toggle('is-about-hovered', kind === 'about');
  page7.classList.toggle('is-map-hovered', kind === 'map');
}

function enterAbout() {
  if (introTransitioning) return;
  dissolveIntroTo('aboutTransition', INTRO.page7.about, () => {
    queueIntro(() => smartAnimateIntroTo('about', INTRO.aboutTransition, 'is-from-about-transition'), INTRO.aboutTransition.delay);
  });
}

function enterExistingLanding() {
  if (introTransitioning) return;
  clearIntroTimers();
  introTransitioning = true;
  landing.classList.remove('is-hidden');
  applyLandingScale();
  landing.classList.add('is-intro-handoff');
  landing.style.setProperty('--intro-motion-duration', `${INTRO.page7.map.duration}ms`);
  landing.style.setProperty('--intro-motion-easing', INTRO.page7.map.easing);
  intro.classList.add('is-handing-off');
  window.requestAnimationFrame(() => landing.classList.add('is-intro-handoff-visible'));
  queueIntro(() => {
    intro.classList.add('is-hidden');
    intro.classList.remove('is-handing-off');
    landing.classList.remove('is-intro-handoff', 'is-intro-handoff-visible');
    landing.style.removeProperty('--intro-motion-duration');
    landing.style.removeProperty('--intro-motion-easing');
    introTransitioning = false;
  }, INTRO.page7.map.duration);
}

function getScale() {
  return Math.min(window.innerWidth / FIGMA.width, window.innerHeight / FIGMA.height);
}

function getViewportCenter(scale = displayScale) {
  return { x: window.innerWidth / (2 * scale), y: window.innerHeight / (2 * scale) };
}

function positionForWorldCenter(worldPoint, atZoom, scale = displayScale) {
  const viewCenter = getViewportCenter(scale);
  return {
    x: viewCenter.x - worldPoint.x * atZoom,
    y: viewCenter.y - worldPoint.y * atZoom,
  };
}

function applyLandingScale() {
  const scale = getScale();
  const landingZoom = 1.05;
  const landingWidth = 2339 * scale * landingZoom;
  const landingHeight = 2163.08 * scale * landingZoom;
  const borderCenter = {
    x: MAP_BORDER.x + MAP_BORDER.width / 2,
    y: MAP_BORDER.y + MAP_BORDER.height / 2,
  };
  // Center the landing composition on the white Border of the main map area.
  landingMap.style.left = `${window.innerWidth / 2 - (borderCenter.x / FIGMA.mapWidth) * landingWidth}px`;
  landingMap.style.top = `${window.innerHeight / 2 - (borderCenter.y / FIGMA.mapHeight) * landingHeight}px`;
  landingMap.style.width = `${landingWidth}px`;
  landingMap.style.height = `${landingHeight}px`;
}

function applyLandingDestinationGeometry(scale = getScale()) {
  const mapHome = positionForWorldCenter(MAP_ORIGIN, 1, scale);
  landingMap.style.left = `${mapHome.x * scale}px`;
  landingMap.style.top = `${mapHome.y * scale}px`;
  landingMap.style.width = `${FIGMA.mapWidth * scale}px`;
  landingMap.style.height = `${FIGMA.mapHeight * scale}px`;
}

function applyCanvasSize() {
  const worldCenter = worldCenterForPosition(mapPosition);
  displayScale = getScale();
  uiLayer.style.transform = `scale(${displayScale})`;
  // Keep Figma-unit positioning for the left UI while extending the same UI layer
  // to the actual viewport. This lets the right overlay remain flush on wide screens.
  uiLayer.style.width = `${window.innerWidth / displayScale}px`;
  uiLayer.style.height = `${window.innerHeight / displayScale}px`;
  canvas.style.width = `${FIGMA.mapWidth * displayScale * zoom}px`;
  canvas.style.height = `${FIGMA.mapHeight * displayScale * zoom}px`;
  mapPosition = constrainPosition(positionForWorldCenter(worldCenter, zoom), zoom);
  applyMapPosition();
}

function applyMapPosition() {
  canvas.style.transform = `translate(${mapPosition.x * displayScale}px, ${mapPosition.y * displayScale}px)`;
  updateCoordinates();
}

function worldCenterForPosition(position, atZoom = zoom) {
  const viewCenter = getViewportCenter();
  return {
    x: (viewCenter.x - position.x) / atZoom,
    y: (viewCenter.y - position.y) / atZoom,
  };
}

function constrainPosition(next, atZoom = zoom) {
  const worldCenter = worldCenterForPosition(next, atZoom);
  const dx = worldCenter.x - CAMERA_BOUNDARY.x;
  const dy = worldCenter.y - CAMERA_BOUNDARY.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= CAMERA_BOUNDARY.radius) return next;
  return positionForWorldCenter({
    x: CAMERA_BOUNDARY.x + (dx / distance) * CAMERA_BOUNDARY.radius,
    y: CAMERA_BOUNDARY.y + (dy / distance) * CAMERA_BOUNDARY.radius,
  }, atZoom);
}

function updateCoordinates() {
  const worldCenter = worldCenterForPosition(mapPosition);
  const dx = worldCenter.x - MAP_ORIGIN.x;
  const dy = MAP_ORIGIN.y - worldCenter.y;
  const distance = Math.hypot(dx, dy);
  const angle = distance === 0 ? 0 : Math.atan2(dy, dx) * (180 / Math.PI);
  const detailed = selectedName !== '-';
  const formattedAngle = detailed ? (Math.trunc(angle * 1e7) / 1e7).toFixed(7) : Math.round(angle);
  coordinates.textContent = `${distance.toFixed(detailed ? 8 : 3)} / ${formattedAngle}° / ${selectedName}`;
}

function requestMotionFrame() {
  if (!motionFrame) motionFrame = window.requestAnimationFrame(runMotionFrame);
}

function stopPassiveMotion() {
  dragVelocity = { x: 0, y: 0 };
  zoomVelocity = 0;
  zoomFocus = null;
  cameraTween = null;
}

function animateMapTo(position) {
  stopPassiveMotion();
  cameraTween = {
    startedAt: performance.now(),
    from: { ...mapPosition },
    to: constrainPosition(position, zoom),
  };
  requestMotionFrame();
}

function openIndex() {
  indexOverlay.classList.add('is-open');
  indexOverlay.setAttribute('aria-hidden', 'false');
  indexTrigger.setAttribute('aria-expanded', 'true');
}

function closeIndexOverlay() {
  indexOverlay.classList.remove('is-open');
  indexOverlay.setAttribute('aria-hidden', 'true');
  indexTrigger.setAttribute('aria-expanded', 'false');
}

function openBuilding() {
  selectedName = '대림아파트';
  daerimButton.classList.add('is-active');
  buildingOverlay.classList.add('is-open');
  buildingOverlay.setAttribute('aria-hidden', 'false');
  animateMapTo(positionForWorldCenter(BUILDING_VIEW, zoom));
}

function closeBuildingOverlay() {
  buildingOverlay.classList.remove('is-open');
  buildingOverlay.setAttribute('aria-hidden', 'true');
}

function zoomAt(point, zoomDelta) {
  const boundedZoom = Math.min(ZOOM.max, Math.max(ZOOM.min, zoom + zoomDelta));
  if (boundedZoom === zoom) return false;
  const zoomRatio = boundedZoom / zoom;
  mapPosition = constrainPosition({
    x: point.x - (point.x - mapPosition.x) * zoomRatio,
    y: point.y - (point.y - mapPosition.y) * zoomRatio,
  }, boundedZoom);
  zoom = boundedZoom;
  applyCanvasSize();
  return true;
}

function enterMapUi() {
  uiLayer.classList.remove('is-entered');
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (!mapPage.classList.contains('is-hidden')) uiLayer.classList.add('is-entered');
    });
  });
}

function normalizeWheelDelta(event) {
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16
    : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
  const delta = event.deltaY * unit;
  return Math.sign(delta) * Math.min(Math.abs(delta), 120);
}

function runMotionFrame(timestamp) {
  motionFrame = 0;
  const deltaTime = Math.min(Math.max(timestamp - (motionLastTime || timestamp), 0), 40);
  motionLastTime = timestamp;

  if (cameraTween) {
    const progress = Math.min((timestamp - cameraTween.startedAt) / MOTION.camera.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    mapPosition = {
      x: cameraTween.from.x + (cameraTween.to.x - cameraTween.from.x) * eased,
      y: cameraTween.from.y + (cameraTween.to.y - cameraTween.from.y) * eased,
    };
    applyMapPosition();
    if (progress === 1) cameraTween = null;
  } else {
    let moved = false;
    if (Math.hypot(dragVelocity.x, dragVelocity.y) >= MOTION.drag.stopVelocity) {
      const nextPosition = constrainPosition({
        x: mapPosition.x + dragVelocity.x * deltaTime,
        y: mapPosition.y + dragVelocity.y * deltaTime,
      });
      const hitBoundary = nextPosition.x !== mapPosition.x + dragVelocity.x * deltaTime
        || nextPosition.y !== mapPosition.y + dragVelocity.y * deltaTime;
      mapPosition = nextPosition;
      const damping = Math.exp(-MOTION.drag.damping * deltaTime);
      dragVelocity.x *= damping;
      dragVelocity.y *= damping;
      if (hitBoundary) dragVelocity = { x: 0, y: 0 };
      moved = true;
    } else {
      dragVelocity = { x: 0, y: 0 };
    }

    if (Math.abs(zoomVelocity) >= MOTION.zoom.stopVelocity && zoomFocus) {
      const zoomed = zoomAt(zoomFocus, zoomVelocity * deltaTime);
      const atLimit = (zoom === ZOOM.min && zoomVelocity < 0) || (zoom === ZOOM.max && zoomVelocity > 0);
      zoomVelocity *= Math.exp(-MOTION.zoom.damping * deltaTime);
      if (!zoomed || atLimit) zoomVelocity = 0;
      moved = true;
    } else {
      zoomVelocity = 0;
      zoomFocus = null;
    }

    if (moved) applyMapPosition();
  }

  if (cameraTween || Math.hypot(dragVelocity.x, dragVelocity.y) >= MOTION.drag.stopVelocity || Math.abs(zoomVelocity) >= MOTION.zoom.stopVelocity) {
    requestMotionFrame();
  } else {
    motionLastTime = 0;
  }
}

function completeLandingTransition() {
  if (!landingTransitioning) return;
  landingTransitioning = false;
  zoom = 1;
  mapPosition = positionForWorldCenter(MAP_ORIGIN, zoom);
  selectedName = '-';
  applyCanvasSize();
  mapPage.classList.remove('is-hidden');

  // The already-rendered landing image becomes the interactive map image.
  // A matching destination geometry is visible before the DOM handoff, so no frame flashes.
  const sharedMap = landingMap.querySelector(':scope > img');
  sharedMap.className = 'map-art';
  if (mapArt) mapArt.replaceWith(sharedMap);
  else canvas.prepend(sharedMap);
  mapArt = sharedMap;
  canvas.insertBefore(mapMainLayer, buildingHotspot);

  landing.classList.remove('is-transitioning');
  landing.classList.add('is-hidden');
  enterMapUi();
}

function beginLandingTransition() {
  if (landingTransitioning) return false;
  landingTransitioning = true;
  const scale = getScale();
  landing.classList.add('is-transitioning');

  // Landing and map-page use the same image and interpolate to the exact map-page rectangle.
  // This is deliberately independent of the click point, preventing click-position-dependent jumps.
  window.requestAnimationFrame(() => {
    applyLandingDestinationGeometry(scale);
  });
  return true;
}

function returnToLanding() {
  if (landingTransitioning) {
    returnRequestedDuringTransition = true;
    return;
  }
  if (mapPage.classList.contains('is-hidden')) return;
  closeIndexOverlay();
  buildingOverlay.classList.remove('is-open');
  buildingOverlay.setAttribute('aria-hidden', 'true');
  stopPassiveMotion();
  uiLayer.classList.remove('is-entered');
  mapPosition = positionForWorldCenter(MAP_ORIGIN, 1);
  zoom = 1;
  selectedName = '-';

  if (mapArt) {
    mapArt.className = '';
    landingMap.replaceChildren(mapArt, mapMainLayer);
    mapArt = null;
  }
  mapPage.classList.add('is-hidden');
  landing.classList.remove('is-hidden', 'is-transitioning');
  applyLandingScale();
}

enterMap.addEventListener('click', () => {
  if (beginLandingTransition()) window.history.pushState({ thetaScreen: 'map' }, '', window.location.href);
});
landingMap.addEventListener('transitionend', (event) => {
  if (event.target !== landingMap || event.propertyName !== 'width') return;
  completeLandingTransition();
  if (returnRequestedDuringTransition) {
    returnRequestedDuringTransition = false;
    returnToLanding();
  }
});
window.addEventListener('popstate', returnToLanding);
introStart.addEventListener('click', beginIntroSequence);
aboutChoice.addEventListener('pointerenter', () => setPage7Hover('about'));
aboutChoice.addEventListener('pointerleave', () => setPage7Hover(null));
aboutChoice.addEventListener('focus', () => setPage7Hover('about'));
aboutChoice.addEventListener('blur', () => setPage7Hover(null));
aboutChoice.addEventListener('click', enterAbout);
mapChoice.addEventListener('pointerenter', () => setPage7Hover('map'));
mapChoice.addEventListener('pointerleave', () => setPage7Hover(null));
mapChoice.addEventListener('focus', () => setPage7Hover('map'));
mapChoice.addEventListener('blur', () => setPage7Hover(null));
mapChoice.addEventListener('click', enterExistingLanding);
aboutBack.addEventListener('click', () => {
  if (introTransitioning) return;
  dissolveIntroTo('page7', INTRO.aboutBack);
});
indexTrigger.addEventListener('click', () => indexOverlay.classList.contains('is-open') ? closeIndexOverlay() : openIndex());
indexTrigger.addEventListener('pointerenter', () => {
  window.clearTimeout(indexTraceTimer);
  indexTrigger.classList.remove('is-tracing');
  window.requestAnimationFrame(() => {
    indexTrigger.classList.add('is-tracing');
    indexTraceTimer = window.setTimeout(() => indexTrigger.classList.remove('is-tracing'), INTRO.indexTrace.duration);
  });
});
closeIndex.addEventListener('click', closeIndexOverlay);
closeBuilding.addEventListener('click', closeBuildingOverlay);
daerimButton.addEventListener('click', openBuilding);
buildingHotspot.addEventListener('click', openBuilding);
indexOverlay.addEventListener('pointerdown', (event) => event.stopPropagation());
buildingOverlay.addEventListener('pointerdown', (event) => event.stopPropagation());

viewport.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  stopPassiveMotion();
  if (buildingOverlay.classList.contains('is-open')) closeBuildingOverlay();
  if (indexOverlay.classList.contains('is-open')) closeIndexOverlay();
  drag = {
    lastX: event.clientX,
    lastY: event.clientY,
    lastTime: performance.now(),
    velocity: { x: 0, y: 0 },
  };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('is-dragging');
});
viewport.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const now = performance.now();
  const elapsed = Math.max(now - drag.lastTime, 1);
  const requestedDelta = {
    x: (event.clientX - drag.lastX) / displayScale,
    y: (event.clientY - drag.lastY) / displayScale,
  };
  const nextPosition = constrainPosition({
    x: mapPosition.x + requestedDelta.x,
    y: mapPosition.y + requestedDelta.y,
  });
  const appliedDelta = { x: nextPosition.x - mapPosition.x, y: nextPosition.y - mapPosition.y };
  const sample = { x: appliedDelta.x / elapsed, y: appliedDelta.y / elapsed };
  drag.velocity.x += (sample.x - drag.velocity.x) * MOTION.drag.sampleWeight;
  drag.velocity.y += (sample.y - drag.velocity.y) * MOTION.drag.sampleWeight;
  drag.velocity.x = Math.max(-MOTION.drag.maxVelocity, Math.min(MOTION.drag.maxVelocity, drag.velocity.x));
  drag.velocity.y = Math.max(-MOTION.drag.maxVelocity, Math.min(MOTION.drag.maxVelocity, drag.velocity.y));
  drag.lastX = event.clientX;
  drag.lastY = event.clientY;
  drag.lastTime = now;
  mapPosition = nextPosition;
  selectedName = '-';
  daerimButton.classList.remove('is-active');
  applyMapPosition();
});
function stopDrag(event) {
  if (!drag) return;
  dragVelocity = { ...drag.velocity };
  drag = null;
  viewport.classList.remove('is-dragging');
  if (event?.pointerId != null && viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  if (Math.hypot(dragVelocity.x, dragVelocity.y) >= MOTION.drag.stopVelocity) requestMotionFrame();
  else dragVelocity = { x: 0, y: 0 };
}
viewport.addEventListener('pointerup', stopDrag);
viewport.addEventListener('pointercancel', stopDrag);
viewport.addEventListener('lostpointercapture', stopDrag);
viewport.addEventListener('wheel', (event) => {
  event.preventDefault();
  cameraTween = null;
  dragVelocity = { x: 0, y: 0 };
  const delta = normalizeWheelDelta(event);
  if (!delta) return;
  const impulse = -delta * MOTION.zoom.wheelImpulse;
  if (zoomVelocity && Math.sign(zoomVelocity) !== Math.sign(impulse)) zoomVelocity = 0;
  zoomVelocity = Math.max(-MOTION.zoom.maxVelocity, Math.min(MOTION.zoom.maxVelocity, zoomVelocity + impulse));
  zoomFocus = { x: event.clientX / displayScale, y: event.clientY / displayScale };
  zoomAt(zoomFocus, -delta * MOTION.zoom.immediateFactor);
  requestMotionFrame();
}, { passive: false });

window.addEventListener('resize', () => {
  applyIntroScale();
  if (landingTransitioning) applyLandingDestinationGeometry();
  else applyLandingScale();
  if (!mapPage.classList.contains('is-hidden')) applyCanvasSize();
});
applyMotionTokens();
applyIntroScale();
applyLandingScale();
