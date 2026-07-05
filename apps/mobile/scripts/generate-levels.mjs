import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const outputPath = join(rootDir, 'src/data/levels/stage-catalog.json');

const legend = {
  '#': 'wall',
  '.': 'floor',
  A: 'sharedStart',
  K: 'key',
  D: 'exit',
};

const difficulties = [
  {
    id: 'beginner',
    labelKo: '초보',
    order: 1,
    sizes: [11, 11, 13, 13, 15],
    braidRate: 0.28,
    seedBase: 11000,
  },
  {
    id: 'intermediate',
    labelKo: '중수',
    order: 2,
    sizes: [15, 15, 17, 17, 19],
    braidRate: 0.18,
    seedBase: 22000,
  },
  {
    id: 'advanced',
    labelKo: '고수',
    order: 3,
    sizes: [17, 19, 19, 21, 21],
    braidRate: 0.12,
    seedBase: 33000,
  },
  {
    id: 'expert',
    labelKo: '초고수',
    order: 4,
    sizes: [21, 21, 23, 23, 25],
    braidRate: 0.07,
    seedBase: 44000,
  },
  {
    id: 'god',
    labelKo: '신',
    order: 5,
    sizes: [23, 23, 25, 25, 25],
    braidRate: 0.03,
    seedBase: 55000,
  },
];

function rng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

function carveMaze(size, random) {
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => '#'));
  const stack = [{ row: 1, col: 1 }];
  grid[1][1] = '.';

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = shuffle(
      [
        { row: current.row - 2, col: current.col, betweenRow: current.row - 1, betweenCol: current.col },
        { row: current.row + 2, col: current.col, betweenRow: current.row + 1, betweenCol: current.col },
        { row: current.row, col: current.col - 2, betweenRow: current.row, betweenCol: current.col - 1 },
        { row: current.row, col: current.col + 2, betweenRow: current.row, betweenCol: current.col + 1 },
      ],
      random,
    ).filter(
      (neighbor) =>
        neighbor.row > 0 &&
        neighbor.col > 0 &&
        neighbor.row < size - 1 &&
        neighbor.col < size - 1 &&
        grid[neighbor.row][neighbor.col] === '#',
    );

    if (neighbors.length === 0) {
      stack.pop();
      continue;
    }

    const next = neighbors[0];
    grid[next.betweenRow][next.betweenCol] = '.';
    grid[next.row][next.col] = '.';
    stack.push({ row: next.row, col: next.col });
  }

  return grid;
}

function addLoops(grid, braidRate, random) {
  const candidates = [];

  for (let row = 1; row < grid.length - 1; row += 1) {
    for (let col = 1; col < grid[row].length - 1; col += 1) {
      if (grid[row][col] !== '#') {
        continue;
      }

      const horizontal = grid[row][col - 1] === '.' && grid[row][col + 1] === '.';
      const vertical = grid[row - 1][col] === '.' && grid[row + 1][col] === '.';
      if (horizontal || vertical) {
        candidates.push({ row, col });
      }
    }
  }

  const openings = Math.floor(candidates.length * braidRate);
  shuffle(candidates, random)
    .slice(0, openings)
    .forEach(({ row, col }) => {
      grid[row][col] = '.';
    });
}

function floorCells(grid) {
  const cells = [];
  for (let row = 1; row < grid.length - 1; row += 1) {
    for (let col = 1; col < grid[row].length - 1; col += 1) {
      if (grid[row][col] === '.') {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function bfs(grid, start, blocked = new Set()) {
  const distances = new Map();
  const queue = [start];
  distances.set(keyOf(start), 0);

  for (const current of queue) {
    const distance = distances.get(keyOf(current));
    for (const next of neighbors(current)) {
      const key = keyOf(next);
      if (
        next.row < 0 ||
        next.col < 0 ||
        next.row >= grid.length ||
        next.col >= grid[0].length ||
        grid[next.row][next.col] === '#' ||
        blocked.has(key) ||
        distances.has(key)
      ) {
        continue;
      }
      distances.set(key, distance + 1);
      queue.push(next);
    }
  }

  return distances;
}

function degree(grid, position) {
  return neighbors(position).filter((next) => grid[next.row]?.[next.col] === '.').length;
}

function chooseMarkers(grid, random) {
  const cells = floorCells(grid);
  const start = { row: 1, col: 1 };
  const fromStart = bfs(grid, start);

  const keyCandidates = cells
    .filter((cell) => !same(cell, start))
    .map((cell) => ({
      cell,
      score: fromStart.get(keyOf(cell)) ?? 0,
    }))
    .sort((a, b) => b.score - a.score);
  const key = keyCandidates[Math.floor(random() * Math.max(1, Math.ceil(keyCandidates.length * 0.12)))]
    .cell;

  const fromKey = bfs(grid, key);
  const exitCandidates = cells
    .filter(
      (cell) =>
        !same(cell, start) &&
        !same(cell, key) &&
        degree(grid, cell) === 1,
    )
    .map((cell) => ({ cell, score: fromKey.get(keyOf(cell)) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  const fallbackExitCandidates = cells
    .filter((cell) => !same(cell, start) && !same(cell, key))
    .map((cell) => ({ cell, score: fromKey.get(keyOf(cell)) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  for (const candidate of [...exitCandidates, ...fallbackExitCandidates]) {
    const exit = candidate.cell;
    const blocked = new Set([keyOf(exit)]);
    const startCanReachKey = bfs(grid, start, blocked).has(keyOf(key));
    const startCanReachExit = bfs(grid, start).has(keyOf(exit));
    if (startCanReachKey && startCanReachExit) {
      return { start, key, exit };
    }
  }

  throw new Error('Unable to place validated markers.');
}

function makeStage(config, stageNumber) {
  const size = config.sizes[Math.floor((stageNumber - 1) / 10)];
  const random = rng(config.seedBase + stageNumber * 9973);
  const grid = carveMaze(size, random);
  addLoops(grid, config.braidRate, random);
  const markers = chooseMarkers(grid, random);

  grid[markers.start.row][markers.start.col] = 'A';
  grid[markers.key.row][markers.key.col] = 'K';
  grid[markers.exit.row][markers.exit.col] = 'D';

  return {
    id: `${config.id}-${String(stageNumber).padStart(3, '0')}`,
    titleKo: `${config.labelKo} ${stageNumber}`,
    subtitleKo: `${config.labelKo} 난이도 ${stageNumber}번째 미로`,
    theme: 'neon',
    difficultyId: config.id,
    difficultyKo: config.labelKo,
    stageNumber,
    rows: grid.map((row) => row.join('')),
    legend,
  };
}

function validateStage(stage) {
  const grid = stage.rows.map((row) => [...row]);
  const markers = {};
  stage.rows.forEach((row, rowIndex) => {
    [...row].forEach((tile, col) => {
      if (tile === 'A') markers.parent = { row: rowIndex, col };
      if (tile === 'K') markers.key = { row: rowIndex, col };
      if (tile === 'D') markers.exit = { row: rowIndex, col };
    });
  });

  for (const marker of Object.values(markers)) {
    grid[marker.row][marker.col] = '.';
  }

  const blockedExit = new Set([keyOf(markers.exit)]);
  const parentCanReachKey = bfs(grid, markers.parent, blockedExit).has(keyOf(markers.key));
  const parentCanReachExit = bfs(grid, markers.parent).has(keyOf(markers.exit));

  if (!parentCanReachKey || !parentCanReachExit) {
    throw new Error(`Invalid stage ${stage.id}`);
  }
}

function neighbors(position) {
  return [
    { row: position.row - 1, col: position.col },
    { row: position.row + 1, col: position.col },
    { row: position.row, col: position.col - 1 },
    { row: position.row, col: position.col + 1 },
  ];
}

function keyOf(position) {
  return `${position.row}:${position.col}`;
}

function same(a, b) {
  return a.row === b.row && a.col === b.col;
}

const catalog = {
  version: 1,
  stagesPerDifficulty: 50,
  difficulties: difficulties.map((difficulty) => ({
    id: difficulty.id,
    labelKo: difficulty.labelKo,
    order: difficulty.order,
    stages: Array.from({ length: 50 }, (_, index) => makeStage(difficulty, index + 1)),
  })),
};

catalog.difficulties.forEach((difficulty) => {
  difficulty.stages.forEach(validateStage);
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Generated ${catalog.difficulties.length * catalog.stagesPerDifficulty} stages.`);
