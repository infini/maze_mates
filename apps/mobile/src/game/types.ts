export type ExplorerId = 'parent' | 'child';

export type Direction = 'up' | 'right' | 'down' | 'left';

export type Position = {
  row: number;
  col: number;
};

export type LevelData = {
  id: string;
  titleKo: string;
  subtitleKo: string;
  theme: string;
  difficultyId: string;
  difficultyKo: string;
  stageNumber: number;
  rows: string[];
  legend: Record<string, string>;
};

export type DifficultyData = {
  id: string;
  labelKo: string;
  order: number;
  stages: LevelData[];
};

export type StageCatalogData = {
  version: number;
  stagesPerDifficulty: number;
  difficulties: DifficultyData[];
};

export type CellKind = 'wall' | 'floor' | 'key' | 'exit';

export type Cell = {
  kind: CellKind;
  row: number;
  col: number;
};

export type TrailSegment = {
  from: Position;
  to: Position;
  at: number;
};

export type PreparedLevel = {
  id: string;
  titleKo: string;
  subtitleKo: string;
  difficultyId: string;
  difficultyKo: string;
  stageNumber: number;
  width: number;
  height: number;
  cells: Cell[][];
  starts: Record<ExplorerId, Position>;
  key: Position;
  exit: Position;
};

export type GameState = {
  explorers: Record<ExplorerId, Position>;
  keyCollected: boolean;
  isWon: boolean;
  moves: number;
  trails: Record<ExplorerId, TrailSegment[]>;
};

export type TrailMap = Map<string, Partial<Record<ExplorerId, Set<Direction>>>>;
