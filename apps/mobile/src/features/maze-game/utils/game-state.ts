import { createInitialState, prepareLevel } from '../../../game/maze';
import type { ExplorerId, GameState } from '../../../game/types';

export type GameStates = Record<ExplorerId, GameState>;

export function createGameStates(level: ReturnType<typeof prepareLevel>): GameStates {
  return {
    parent: createInitialState(level),
    child: createInitialState(level),
  };
}
