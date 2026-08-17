/*
 * Moving-poster configuration
 * ---------------------------
 * To change the overall duration, adjust `cellIntervalMs` below.
 * All 15 scenes are reshuffled once per cycle. Edit `ANIMATION_SEQUENCE`
 * below to add, remove, or reorder scenes.
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

function createAllCoordinates() {
  const coordinates = [];

  for (let row = 1; row <= GRID.rows; row += 1) {
    for (let column = 1; column <= GRID.columns; column += 1) {
      coordinates.push({ column, row });
    }
  }

  return coordinates;
}

/** Sorts every Cell by one or more numeric visual measurements. */
function sortCoordinatesBy(measurements) {
  return createAllCoordinates().sort((first, second) => {
    const firstMeasurements = measurements(first);
    const secondMeasurements = measurements(second);

    for (let index = 0; index < firstMeasurements.length; index += 1) {
      const difference = firstMeasurements[index] - secondMeasurements[index];

      if (difference !== 0) {
        return difference;
      }
    }

    return first.row - second.row || first.column - second.column;
  });
}

function normalisedColumn(column) {
  return (column - 1) / (GRID.columns - 1);
}

function normalisedRow(row) {
  return (row - 1) / (GRID.rows - 1);
}

/** 1. Expands outward from the centre in circular ripples. */
function createCentreRippleOrder() {
  const centreColumn = (GRID.columns + 1) / 2;
  const centreRow = (GRID.rows + 1) / 2;

  return sortCoordinatesBy(({ column, row }) => {
    const offsetColumn = column - centreColumn;
    const offsetRow = row - centreRow;

    return [Math.hypot(offsetColumn, offsetRow), Math.atan2(offsetRow, offsetColumn)];
  });
}

/** 2. Lets four corner clusters grow toward the centre. */
function createFourCornersOrder() {
  const corners = [
    { column: 1, row: 1 },
    { column: GRID.columns, row: 1 },
    { column: GRID.columns, row: GRID.rows },
    { column: 1, row: GRID.rows },
  ];

  return sortCoordinatesBy(({ column, row }) => {
    const closestCorner = corners.reduce(
      (closest, corner, index) => {
        const distance = Math.hypot(column - corner.column, row - corner.row);

        return distance < closest.distance ? { distance, index } : closest;
      },
      { distance: Number.POSITIVE_INFINITY, index: 0 },
    );

    return [closestCorner.distance, closestCorner.index];
  });
}

/** 3. Traces each outer edge before stepping inward in a clockwise spiral. */
function createSpiralOrder() {
  const order = [];
  let left = 1;
  let right = GRID.columns;
  let top = 1;
  let bottom = GRID.rows;

  while (left <= right && top <= bottom) {
    for (let column = left; column <= right; column += 1) {
      order.push({ column, row: top });
    }

    for (let row = top + 1; row <= bottom; row += 1) {
      order.push({ column: right, row });
    }

    if (top < bottom) {
      for (let column = right - 1; column >= left; column -= 1) {
        order.push({ column, row: bottom });
      }
    }

    if (left < right) {
      for (let row = bottom - 1; row > top; row -= 1) {
        order.push({ column: left, row });
      }
    }

    left += 1;
    right -= 1;
    top += 1;
    bottom -= 1;
  }

  return order;
}

/** 4. Alternates direction on every row to create a continuous zigzag. */
function createZigzagOrder() {
  const order = [];

  for (let row = 1; row <= GRID.rows; row += 1) {
    const movesRight = row % 2 === 1;
    const firstColumn = movesRight ? 1 : GRID.columns;
    const lastColumn = movesRight ? GRID.columns : 1;
    const step = movesRight ? 1 : -1;

    for (let column = firstColumn; movesRight ? column <= lastColumn : column >= lastColumn; column += step) {
      order.push({ column, row });
    }
  }

  return order;
}

/** 5. Uses Manhattan distance for a crisp diamond-shaped expansion. */
function createDiamondOrder() {
  const centreColumn = (GRID.columns + 1) / 2;
  const centreRow = (GRID.rows + 1) / 2;

  return sortCoordinatesBy(({ column, row }) => [
    Math.abs(column - centreColumn) + Math.abs(row - centreRow),
    row,
    column,
  ]);
}

/** 6. Reveals a full-width X before expanding away from both diagonals. */
function createXExpansionOrder() {
  return sortCoordinatesBy(({ column, row }) => {
    const x = normalisedColumn(column);
    const y = normalisedRow(row);
    const distanceToX = Math.min(Math.abs(y - x), Math.abs(y - (1 - x)));

    return [distanceToX, x];
  });
}

/** 7. Opens from the centre vertical axis like a pair of curtains. */
function createHorizontalCurtainOrder() {
  const centreColumn = (GRID.columns + 1) / 2;

  return sortCoordinatesBy(({ column, row }) => [Math.abs(column - centreColumn), row, column]);
}

/** 8. Opens from the centre horizontal axis like a pair of curtains. */
function createVerticalCurtainOrder() {
  const centreRow = (GRID.rows + 1) / 2;

  return sortCoordinatesBy(({ column, row }) => [Math.abs(row - centreRow), column, row]);
}

/** 9. Fills one checkerboard colour before revealing its alternating partner. */
function createCheckerboardOrder() {
  return sortCoordinatesBy(({ column, row }) => [
    (column + row) % 2,
    column + row,
    row,
    column,
  ]);
}

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

let clusterCycle = 0;

function createClusterSeeds() {
  clusterCycle += 1;
  const random = createSeededRandom(0x51f15eed + clusterCycle * 7919);
  const seeds = [];
  const seedCount = 3 + Math.floor(random() * 4);

  while (seeds.length < seedCount) {
    const candidate = {
      column: 1 + Math.floor(random() * GRID.columns),
      row: 1 + Math.floor(random() * GRID.rows),
    };

    if (!seeds.some((seed) => seed.column === candidate.column && seed.row === candidate.row)) {
      seeds.push(candidate);
    }
  }

  return seeds;
}

/** 10. Grows 3–6 new, randomly positioned Cell colonies each cycle. */
function createClusterGrowthOrder() {
  const seeds = createClusterSeeds();

  return sortCoordinatesBy(({ column, row }) => {
    const nearestSeedDistance = Math.min(
      ...seeds.map((seed) => Math.hypot(column - seed.column, row - seed.row)),
    );

    return [nearestSeedDistance, row, column];
  });
}

/** 11. Moves a vertical reveal front from left to right in a sine wave. */
function createSineWaveOrder() {
  const amplitude = 4;

  return sortCoordinatesBy(({ column, row }) => {
    const waveOffset = amplitude * Math.sin(normalisedRow(row) * Math.PI * 2);

    return [column + waveOffset, row, column];
  });
}

function quadrantIndex(column, row) {
  const isLeft = column <= GRID.columns / 2;
  const isTop = row <= GRID.rows / 2;

  if (isTop && isLeft) return 0;
  if (isTop) return 1;
  if (!isLeft) return 2;
  return 3;
}

function quadrantZigzagRank(column, row) {
  const isLeft = column <= GRID.columns / 2;
  const isTop = row <= GRID.rows / 2;
  const firstColumn = isLeft ? 1 : GRID.columns / 2 + 1;
  const firstRow = isTop ? 1 : GRID.rows / 2 + 1;
  const width = GRID.columns / 2;
  const localColumn = column - firstColumn + 1;
  const localRow = row - firstRow + 1;
  const horizontalPosition = localRow % 2 === 1 ? localColumn : width - localColumn + 1;

  return (localRow - 1) * width + horizontalPosition;
}

/** 12. Visits the four quadrants clockwise, with a compact zigzag inside each. */
function createQuadrantCycleOrder() {
  return sortCoordinatesBy(({ column, row }) => [
    quadrantIndex(column, row),
    quadrantZigzagRank(column, row),
  ]);
}

// Every entry appears once per cycle, in a newly shuffled order.
const ANIMATION_SEQUENCE = Object.freeze([
  { id: 'diagonal', createOrder: createDiagonalOrder },
  { id: 'horizontal', createOrder: createHorizontalOrder },
  { id: 'vertical', createOrder: createVerticalOrder },
  { id: 'centre-ripple', createOrder: createCentreRippleOrder },
  { id: 'four-corners', createOrder: createFourCornersOrder },
  { id: 'spiral', createOrder: createSpiralOrder },
  { id: 'zigzag', createOrder: createZigzagOrder },
  { id: 'diamond', createOrder: createDiamondOrder },
  { id: 'x-expansion', createOrder: createXExpansionOrder },
  { id: 'horizontal-curtain', createOrder: createHorizontalCurtainOrder },
  { id: 'vertical-curtain', createOrder: createVerticalCurtainOrder },
  { id: 'checkerboard', createOrder: createCheckerboardOrder },
  { id: 'cluster-growth', createOrder: createClusterGrowthOrder },
  { id: 'sine-wave', createOrder: createSineWaveOrder },
  { id: 'quadrant-cycle', createOrder: createQuadrantCycleOrder },
]);

/** Returns a fresh Fisher-Yates shuffle without modifying the source list. */
function shuffleScenes(scenes) {
  const shuffledScenes = [...scenes];

  for (let index = shuffledScenes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledScenes[index], shuffledScenes[randomIndex]] = [
      shuffledScenes[randomIndex],
      shuffledScenes[index],
    ];
  }

  return shuffledScenes;
}

const previewParameters = new URLSearchParams(window.location.search);
const requestedSceneId = previewParameters.get('scene');
const previewSceneIndex = ANIMATION_SEQUENCE.findIndex(({ id }) => id === requestedSceneId);
const isPreviewingSingleScene = previewSceneIndex >= 0;
const requestedPreviewInterval = Number(previewParameters.get('interval'));
const previewCellIntervalMs = Number.isFinite(requestedPreviewInterval) && requestedPreviewInterval > 0
  ? Math.max(10, requestedPreviewInterval)
  : PLAYBACK.cellIntervalMs;
const cellsLayer = document.querySelector('#cells-layer');
const dotsLayer = document.querySelector('#dots-layer');
const cellElements = new Map();
let animationFrameId = null;
let sceneCycle = [];
let sceneCycleIndex = 0;

function getNextScene() {
  if (sceneCycleIndex >= sceneCycle.length) {
    sceneCycle = shuffleScenes(ANIMATION_SEQUENCE);
    sceneCycleIndex = 0;
  }

  const nextScene = sceneCycle[sceneCycleIndex];
  sceneCycleIndex += 1;
  return nextScene;
}

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

function startScene() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }

  const scene = isPreviewingSingleScene
    ? ANIMATION_SEQUENCE[previewSceneIndex]
    : getNextScene();
  const order = scene.createOrder();
  const cellIntervalMs = isPreviewingSingleScene
    ? previewCellIntervalMs
    : PLAYBACK.cellIntervalMs;
  assertOrder(order, scene.id);
  hideCells();
  hideDots();

  const cellPhaseMs = order.length * cellIntervalMs;
  const dotsPhaseMs = PLAYBACK.dotBlinkCount * 2 * PLAYBACK.dotBlinkMs;
  let revealedCount = 0;
  let dotsCreated = false;
  const startedAt = performance.now();

  function playFrame(now) {
    const elapsed = now - startedAt;

    if (elapsed < cellPhaseMs) {
      const visibleCount = Math.min(order.length, Math.floor(elapsed / cellIntervalMs) + 1);

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

    startScene();
  }

  animationFrameId = requestAnimationFrame(playFrame);
}

function initialisePoster() {
  if (ANIMATION_SEQUENCE.length === 0) {
    throw new Error('Add at least one animation scene to ANIMATION_SEQUENCE.');
  }

  createCells();
  startScene();
}

initialisePoster();
