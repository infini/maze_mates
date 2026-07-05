import type {
  CellKind,
  Direction,
  ExplorerId,
  GameState,
  LevelData,
  Position,
  PreparedLevel,
  TrailMap,
} from './types';

const directions: Record<Direction, Position> = {
  up: { row: -1, col: 0 },
  right: { row: 0, col: 1 },
  down: { row: 1, col: 0 },
  left: { row: 0, col: -1 },
};

const opposite: Record<Direction, Direction> = {
  up: 'down',
  right: 'left',
  down: 'up',
  left: 'right',
};

export function prepareLevel(level: LevelData): PreparedLevel {
  const width = level.rows[0]?.length ?? 0;
  let start: Position | undefined;
  let key: Position | undefined;
  let exit: Position | undefined;

  const cells = level.rows.map((line, row) => {
    if (line.length !== width) {
      throw new Error(`Level ${level.id} has a non-rectangular row at ${row}.`);
    }

    return [...line].map((tile, col) => {
      const position = { row, col };

      if (tile === 'A') {
        start = position;
      }
      if (tile === 'K') {
        key = position;
      }
      if (tile === 'D') {
        exit = position;
      }

      return {
        row,
        col,
        kind: tileToCellKind(tile),
      };
    });
  });

  if (!start || !key || !exit) {
    throw new Error(`Level ${level.id} must include A, K, and D markers.`);
  }

  return {
    id: level.id,
    titleKo: level.titleKo,
    subtitleKo: level.subtitleKo,
    difficultyId: level.difficultyId,
    difficultyKo: level.difficultyKo,
    stageNumber: level.stageNumber,
    width,
    height: level.rows.length,
    cells,
    starts: {
      parent: start,
      child: start,
    },
    key,
    exit,
  };
}

export function createInitialState(level: PreparedLevel): GameState {
  return {
    explorers: {
      parent: level.starts.parent,
      child: level.starts.child,
    },
    keyCollected: false,
    isWon: false,
    moves: 0,
    trails: {
      parent: [],
      child: [],
    },
  };
}

export function moveExplorer(
  level: PreparedLevel,
  state: GameState,
  explorerId: ExplorerId,
  direction: Direction,
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (state.isWon) {
    return state;
  }

  const current = state.explorers[explorerId];
  const delta = directions[direction];
  const next = {
    row: current.row + delta.row,
    col: current.col + delta.col,
  };
  return applyPath(level, state, explorerId, [next], trailVisibleMs, trailNowMs);
}

export function moveExplorerTo(
  level: PreparedLevel,
  state: GameState,
  explorerId: ExplorerId,
  target: Position,
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (state.isWon) {
    return state;
  }

  const current = state.explorers[explorerId];
  if (samePosition(current, target)) {
    return state;
  }

  const sameRow = current.row === target.row;
  const sameCol = current.col === target.col;
  if (!sameRow && !sameCol) {
    return state;
  }

  const rowStep = sameRow ? 0 : target.row > current.row ? 1 : -1;
  const colStep = sameCol ? 0 : target.col > current.col ? 1 : -1;
  const path: Position[] = [];
  let cursor = { row: current.row + rowStep, col: current.col + colStep };

  while (!samePosition(cursor, target)) {
    path.push(cursor);
    cursor = { row: cursor.row + rowStep, col: cursor.col + colStep };
  }
  path.push(target);

  return applyPath(level, state, explorerId, path, trailVisibleMs, trailNowMs);
}

export function explorersAt(state: GameState, row: number, col: number): ExplorerId[] {
  return (['parent', 'child'] as ExplorerId[]).filter((id) =>
    samePosition(state.explorers[id], { row, col }),
  );
}

export function buildTrailMap(
  trails: GameState['trails'],
  now: number,
  visibleMs: number,
): TrailMap {
  const map: TrailMap = new Map();

  (Object.keys(trails) as ExplorerId[]).forEach((explorerId) => {
    trails[explorerId].forEach((segment) => {
      if (now - segment.at > visibleMs) {
        return;
      }

      const direction = directionBetween(segment.from, segment.to);
      if (!direction) {
        return;
      }

      ensureTrailSet(map, segment.from, explorerId).add(direction);
      ensureTrailSet(map, segment.to, explorerId).add(opposite[direction]);
    });
  });

  return map;
}

function pruneTrails(trails: GameState['trails'], now: number, visibleMs: number) {
  return {
    parent: trails.parent.filter((segment) => now - segment.at <= visibleMs),
    child: trails.child.filter((segment) => now - segment.at <= visibleMs),
  };
}

function applyPath(
  level: PreparedLevel,
  state: GameState,
  explorerId: ExplorerId,
  path: Position[],
  trailVisibleMs: number,
  trailNowMs: number,
): GameState {
  if (path.length === 0) {
    return state;
  }

  let previous = state.explorers[explorerId];
  let keyCollected = state.keyCollected;
  const segments = [];

  for (const next of path) {
    const cell = level.cells[next.row]?.[next.col];
    if (
      !cell ||
      cell.kind === 'wall' ||
      !areAdjacent(previous, next) ||
      (cell.kind === 'exit' && !keyCollected)
    ) {
      return state;
    }

    segments.push({ from: previous, to: next, at: trailNowMs });
    keyCollected = keyCollected || samePosition(next, level.key);
    previous = next;
  }

  const explorers = {
    ...state.explorers,
    [explorerId]: previous,
  };
  const isWon =
    keyCollected &&
    samePosition(explorers[explorerId], level.exit);
  const trails = pruneTrails(state.trails, trailNowMs, trailVisibleMs);

  return {
    explorers,
    keyCollected,
    isWon,
    moves: state.moves + path.length,
    trails: {
      ...trails,
      [explorerId]: [...trails[explorerId], ...segments],
    },
  };
}

function tileToCellKind(tile: string): CellKind {
  if (tile === '#') {
    return 'wall';
  }
  if (tile === 'K') {
    return 'key';
  }
  if (tile === 'D') {
    return 'exit';
  }
  return 'floor';
}

function ensureTrailSet(map: TrailMap, position: Position, explorerId: ExplorerId) {
  const key = positionKey(position);
  const entry = map.get(key) ?? {};
  entry[explorerId] = entry[explorerId] ?? new Set<Direction>();
  map.set(key, entry);
  return entry[explorerId];
}

function directionBetween(from: Position, to: Position): Direction | undefined {
  if (to.row === from.row - 1 && to.col === from.col) {
    return 'up';
  }
  if (to.row === from.row + 1 && to.col === from.col) {
    return 'down';
  }
  if (to.col === from.col - 1 && to.row === from.row) {
    return 'left';
  }
  if (to.col === from.col + 1 && to.row === from.row) {
    return 'right';
  }
  return undefined;
}

function positionKey(position: Position) {
  return `${position.row}:${position.col}`;
}

function samePosition(a: Position, b: Position) {
  return a.row === b.row && a.col === b.col;
}

function areAdjacent(a: Position, b: Position) {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}
