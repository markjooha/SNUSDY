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
let displayScale = getScale();
let zoom = 1;
let mapPosition = positionForWorldCenter(MAP_ORIGIN, 1);
let selectedName = '-';
let drag = null;
let motionTimer;
let landingTransitioning = false;
let returnRequestedDuringTransition = false;

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

function animateMapTo(position, nextZoom = zoom) {
  clearTimeout(motionTimer);
  canvas.classList.add('is-animating');
  mapPosition = constrainPosition(position, nextZoom);
  zoom = nextZoom;
  applyCanvasSize();
  motionTimer = window.setTimeout(() => canvas.classList.remove('is-animating'), 590);
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

function zoomAt(clientX, clientY, nextZoom) {
  const boundedZoom = Math.min(ZOOM.max, Math.max(ZOOM.min, nextZoom));
  if (boundedZoom === zoom) return;
  const point = { x: clientX / displayScale, y: clientY / displayScale };
  const zoomRatio = boundedZoom / zoom;
  mapPosition = constrainPosition({
    x: point.x - (point.x - mapPosition.x) * zoomRatio,
    y: point.y - (point.y - mapPosition.y) * zoomRatio,
  }, boundedZoom);
  zoom = boundedZoom;
  applyCanvasSize();
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
indexTrigger.addEventListener('click', () => indexOverlay.classList.contains('is-open') ? closeIndexOverlay() : openIndex());
closeIndex.addEventListener('click', closeIndexOverlay);
closeBuilding.addEventListener('click', closeBuildingOverlay);
daerimButton.addEventListener('click', openBuilding);
buildingHotspot.addEventListener('click', openBuilding);
indexOverlay.addEventListener('pointerdown', (event) => event.stopPropagation());
buildingOverlay.addEventListener('pointerdown', (event) => event.stopPropagation());

viewport.addEventListener('pointerdown', (event) => {
  if (event.target.closest('button')) return;
  if (buildingOverlay.classList.contains('is-open')) closeBuildingOverlay();
  if (indexOverlay.classList.contains('is-open')) closeIndexOverlay();
  drag = { startX: event.clientX, startY: event.clientY, origin: { ...mapPosition } };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add('is-dragging');
});
viewport.addEventListener('pointermove', (event) => {
  if (!drag) return;
  mapPosition = constrainPosition({
    x: drag.origin.x + (event.clientX - drag.startX) / displayScale,
    y: drag.origin.y + (event.clientY - drag.startY) / displayScale,
  });
  selectedName = '-';
  daerimButton.classList.remove('is-active');
  applyMapPosition();
});
function stopDrag() { drag = null; viewport.classList.remove('is-dragging'); }
viewport.addEventListener('pointerup', stopDrag);
viewport.addEventListener('pointercancel', stopDrag);
viewport.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoomAt(event.clientX, event.clientY, zoom + (event.deltaY < 0 ? ZOOM.step : -ZOOM.step));
}, { passive: false });

window.addEventListener('resize', () => {
  if (landingTransitioning) applyLandingDestinationGeometry();
  else applyLandingScale();
  if (!mapPage.classList.contains('is-hidden')) applyCanvasSize();
});
applyLandingScale();
