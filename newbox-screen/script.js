/*
 * Moving-poster configuration
 * ---------------------------
 * To change the overall duration, adjust `cellIntervalMs` below.
 * To add, remove, or reorder scenes, edit only `ANIMATION_SEQUENCE`.
 * A custom scene needs an `id` and a `createOrder()` function that returns
 * every { column, row } coordinate once. Coordinates are 1-based.
 */
const ARTBOARD = Object.freeze({ width: 2721.26, height: 1530.71 });

const GRID = Object.freeze({
  columns: 44,
  rows: 20,
  cellSize: 39.04,
  startX: 60.48,
  startY: 180.48,
  pitchX: 60,
  pitchY: 60,
});

const PLAYBACK = Object.freeze({
  // 880 cells * 150ms = 132s. Including dots, one scene lasts about 136s.
  cellIntervalMs: 150,
  dotBlinkMs: 500,
  dotBlinkCount: 4,
  dotCountMin: 18,
  dotCountMax: 22,
});

const ASSETS = Object.freeze({
  cell: './Cell.svg',
  dots: ['./Dot-Circle.svg', './Dot-X.svg', './Dot-Cross.svg'],
});

/** Creates coordinates in each row from left to right, from top to bottom. */
function createHorizontalOrder() {
  const order = [];

  for (let row = 1; row <= GRID.rows; row += 1) {
    for (let column = 1; column <= GRID.columns; column += 1) {
      order.push({ column, row });
    }
  }

  return order;
}

/** Creates coordinates in each column from top to bottom, from left to right. */
function createVerticalOrder() {
  const order = [];

  for (let column = 1; column <= GRID.columns; column += 1) {
    for (let row = 1; row <= GRID.rows; row += 1) {
      order.push({ column, row });
    }
  }

  return order;
}

/**
 * Groups cells by their upper-right to lower-left diagonal. Within a group,
 * cells are revealed from the upper-right end toward the lower-left end.
 */
function createDiagonalOrder() {
  const order = [];
  const firstDiagonal = 2;
  const lastDiagonal = GRID.columns + GRID.rows;

  for (let diagonal = firstDiagonal; diagonal <= lastDiagonal; diagonal += 1) {
    const firstColumn = Math.min(GRID.columns, diagonal - 1);
    const lastColumn = Math.max(1, diagonal - GRID.rows);

    for (let column = firstColumn; column >= lastColumn; column -= 1) {
      order.push({ column, row: diagonal - column });
    }
  }

  return order;
}

// Add a new scene here, or move/remove an entry to change the loop sequence.
const ANIMATION_SEQUENCE = Object.freeze([
  { id: 'diagonal', createOrder: createDiagonalOrder },
  { id: 'horizontal', createOrder: createHorizontalOrder },
  { id: 'vertical', createOrder: createVerticalOrder },
]);

const cellsLayer = document.querySelector('#cells-layer');
const dotsLayer = document.querySelector('#dots-layer');
const cellElements = new Map();
let animationFrameId = null;
let sceneIndex = 0;

function coordinateKey(column, row) {
  return `${column}:${row}`;
}

function artboardX(value) {
  return `${(value / ARTBOARD.width) * 100}%`;
}

function artboardY(value) {
  return `${(value / ARTBOARD.height) * 100}%`;
}

function createImage(className, source, { left, top, width, height, centered = false }) {
  const image = document.createElement('img');
  image.className = className;
  image.src = source;
  image.alt = '';
  image.draggable = false;
  image.style.left = artboardX(left);
  image.style.top = artboardY(top);
  image.style.width = artboardX(width);
  image.style.height = artboardY(height);

  if (centered) {
    image.style.transform = 'translate(-50%, -50%)';
  }

  return image;
}

function createCells() {
  const cellFragment = document.createDocumentFragment();

  for (let row = 1; row <= GRID.rows; row += 1) {
    for (let column = 1; column <= GRID.columns; column += 1) {
      const cell = createImage('cell', ASSETS.cell, {
        left: GRID.startX + (column - 1) * GRID.pitchX,
        top: GRID.startY + (row - 1) * GRID.pitchY,
        width: GRID.cellSize,
        height: GRID.cellSize,
      });

      cell.dataset.column = column;
      cell.dataset.row = row;
      cellElements.set(coordinateKey(column, row), cell);
      cellFragment.append(cell);
    }
  }

  cellsLayer.append(cellFragment);
}

function assertOrder(order, sceneId) {
  const expectedLength = GRID.columns * GRID.rows;
  const uniqueCoordinates = new Set(order.map(({ column, row }) => coordinateKey(column, row)));
  const everyCoordinateExists = order.every(
    ({ column, row }) =>
      Number.isInteger(column) &&
      Number.isInteger(row) &&
      column >= 1 &&
      column <= GRID.columns &&
      row >= 1 &&
      row <= GRID.rows,
  );

  if (order.length !== expectedLength || uniqueCoordinates.size !== expectedLength || !everyCoordinateExists) {
    throw new Error(`The animation order for "${sceneId}" must contain every grid coordinate exactly once.`);
  }
}

function hideCells() {
  for (const cell of cellElements.values()) {
    cell.classList.remove('is-visible');
  }
}

function hideDots() {
  dotsLayer.replaceChildren();
  dotsLayer.classList.remove('is-visible');
}

function randomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function chooseDotCoordinates() {
  const coordinates = [];

  for (let row = 1; row <= GRID.rows; row += 1) {
    for (let column = 1; column <= GRID.columns; column += 1) {
      coordinates.push({ column, row });
    }
  }

  const count = randomInteger(PLAYBACK.dotCountMin, PLAYBACK.dotCountMax);

  // Fisher-Yates gives unique, unbiased coordinates without repeated picks.
  for (let index = coordinates.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [coordinates[index], coordinates[randomIndex]] = [coordinates[randomIndex], coordinates[index]];
  }

  return coordinates.slice(0, count);
}

function createDots() {
  const dotFragment = document.createDocumentFragment();

  for (const { column, row } of chooseDotCoordinates()) {
    const source = ASSETS.dots[randomInteger(0, ASSETS.dots.length - 1)];
    const cellCenterX = GRID.startX + (column - 1) * GRID.pitchX + GRID.cellSize / 2;
    const cellCenterY = GRID.startY + (row - 1) * GRID.pitchY + GRID.cellSize / 2;
    const size = source.includes('Circle') ? 15.77 : source.includes('Dot-X') ? 18.74 : 22.31;
    const dot = createImage('dot', source, {
      left: cellCenterX,
      top: cellCenterY,
      width: size,
      height: size,
      centered: true,
    });

    dotFragment.append(dot);
  }

  dotsLayer.replaceChildren(dotFragment);
}

function startScene(nextSceneIndex) {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  sceneIndex = nextSceneIndex % ANIMATION_SEQUENCE.length;
  const scene = ANIMATION_SEQUENCE[sceneIndex];
  const order = scene.createOrder();
  assertOrder(order, scene.id);
  hideCells();
  hideDots();

  const cellPhaseMs = order.length * PLAYBACK.cellIntervalMs;
  const dotsPhaseMs = PLAYBACK.dotBlinkCount * 2 * PLAYBACK.dotBlinkMs;
  let revealedCount = 0;
  let dotsCreated = false;
  const startedAt = performance.now();

  function playFrame(now) {
    const elapsed = now - startedAt;

    if (elapsed < cellPhaseMs) {
      const visibleCount = Math.min(order.length, Math.floor(elapsed / PLAYBACK.cellIntervalMs) + 1);

      while (revealedCount < visibleCount) {
        const { column, row } = order[revealedCount];
        cellElements.get(coordinateKey(column, row)).classList.add('is-visible');
        revealedCount += 1;
      }

      animationFrameId = requestAnimationFrame(playFrame);
      return;
    }

    while (revealedCount < order.length) {
      const { column, row } = order[revealedCount];
      cellElements.get(coordinateKey(column, row)).classList.add('is-visible');
      revealedCount += 1;
    }

    if (!dotsCreated) {
      createDots();
      dotsCreated = true;
    }

    const dotElapsed = elapsed - cellPhaseMs;
    const blinkIndex = Math.floor(dotElapsed / PLAYBACK.dotBlinkMs);
    const dotsAreVisible = blinkIndex % 2 === 0;
    dotsLayer.classList.toggle('is-visible', dotsAreVisible);

    if (dotElapsed < dotsPhaseMs) {
      animationFrameId = requestAnimationFrame(playFrame);
      return;
    }

    startScene(sceneIndex + 1);
  }

  animationFrameId = requestAnimationFrame(playFrame);
}

function initialisePoster() {
  if (ANIMATION_SEQUENCE.length === 0) {
    throw new Error('Add at least one animation scene to ANIMATION_SEQUENCE.');
  }

  createCells();
  startScene(0);
}

initialisePoster();
