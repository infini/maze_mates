import { useCallback, useEffect, useMemo, useState } from 'react';
import { difficulties } from '../../../data/levels';
import { settings } from '../../../data/settings';
import { buildTrailMap, createInitialState, moveExplorerTo, prepareLevel } from '../../../game/maze';
import type { ExplorerId } from '../../../game/types';
import { explorerTheme } from '../constants';
import { createGameStates } from '../utils/game-state';
import type { GameStates } from '../utils/game-state';
import {
  createTimerState,
  createTimerStates,
  finishTimer,
  getElapsedMs,
  pauseTimer,
  startTimer,
  togglePause,
} from '../utils/timer';
import type { TimerStates } from '../utils/timer';

export function useMazeGame() {
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const difficulty = difficulties[difficultyIndex] ?? difficulties[0];
  const levelData = difficulty.stages[stageIndex] ?? difficulty.stages[0];
  const level = useMemo(() => prepareLevel(levelData), [levelData]);
  const [activeExplorer, setActiveExplorer] = useState<ExplorerId>('parent');
  const [now, setNow] = useState(() => Date.now());
  const [timerStates, setTimerStates] = useState<TimerStates>(() => createTimerStates());
  const [gameStates, setGameStates] = useState<GameStates>(() => createGameStates(level));
  const [animationResetKey, setAnimationResetKey] = useState(0);

  const timerState = timerStates[activeExplorer];
  const gameState = gameStates[activeExplorer];
  const elapsedMs = getElapsedMs(timerState, now);
  const hasStarted = timerState.startedAt !== null;
  const isPaused = timerState.pausedAt !== null;
  const trailVisibleMs = settings.trailVisibleSeconds * 1000;
  const trailMap = useMemo(
    () => buildTrailMap(gameState.trails, elapsedMs, trailVisibleMs),
    [gameState.trails, elapsedMs, trailVisibleMs],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setActiveExplorer('parent');
    setNow(Date.now());
    setTimerStates(createTimerStates());
    setGameStates(createGameStates(level));
    setAnimationResetKey((current) => current + 1);
  }, [level]);

  const commitMove = useCallback(
    (row: number, col: number) => {
      if (!hasStarted || isPaused || gameState.isWon) {
        return;
      }

      const timestamp = Date.now();
      const elapsedAtMove = getElapsedMs(timerState, timestamp);
      const nextGameState = moveExplorerTo(
        level,
        gameState,
        activeExplorer,
        { row, col },
        trailVisibleMs,
        elapsedAtMove,
      );

      if (nextGameState === gameState) {
        return;
      }

      setNow(timestamp);
      setGameStates((current) => ({ ...current, [activeExplorer]: nextGameState }));

      if (!gameState.isWon && nextGameState.isWon) {
        setTimerStates((current) => ({
          ...current,
          [activeExplorer]: finishTimer(current[activeExplorer], timestamp),
        }));
      }
    },
    [
      activeExplorer,
      gameState,
      hasStarted,
      isPaused,
      level,
      timerState,
      trailVisibleMs,
    ],
  );

  const resetActiveRun = useCallback(() => {
    setNow(Date.now());
    setAnimationResetKey((current) => current + 1);
    setTimerStates((current) => ({ ...current, [activeExplorer]: createTimerState() }));
    setGameStates((current) => ({ ...current, [activeExplorer]: createInitialState(level) }));
  }, [activeExplorer, level]);

  const pauseActiveRun = useCallback(() => {
    if (!hasStarted || gameState.isWon) {
      return;
    }

    const timestamp = Date.now();
    setNow(timestamp);
    setTimerStates((current) => ({
      ...current,
      [activeExplorer]: togglePause(current[activeExplorer], timestamp),
    }));
  }, [activeExplorer, gameState.isWon, hasStarted]);

  const startActiveRun = useCallback(() => {
    if (gameState.isWon || (hasStarted && !isPaused)) {
      return;
    }

    const timestamp = Date.now();
    setNow(timestamp);
    setTimerStates((current) => ({
      ...current,
      [activeExplorer]: startTimer(current[activeExplorer], timestamp),
    }));
  }, [activeExplorer, gameState.isWon, hasStarted, isPaused]);

  const selectExplorer = useCallback(
    (explorerId: ExplorerId) => {
      if (explorerId === activeExplorer) {
        return;
      }

      const timestamp = Date.now();
      setNow(timestamp);
      setAnimationResetKey((current) => current + 1);
      setTimerStates((current) => ({
        ...current,
        [activeExplorer]: pauseTimer(current[activeExplorer], timestamp),
      }));
      setActiveExplorer(explorerId);
    },
    [activeExplorer],
  );

  const loadStage = useCallback(
    (nextIndex: number) => {
      setStageIndex(Math.max(0, Math.min(difficulty.stages.length - 1, nextIndex)));
    },
    [difficulty.stages.length],
  );

  const selectDifficulty = useCallback((nextDifficultyIndex: number) => {
    const clampedIndex = Math.max(0, Math.min(difficulties.length - 1, nextDifficultyIndex));
    setDifficultyIndex(clampedIndex);
    setStageIndex(0);
  }, []);

  return {
    activeExplorer,
    animationResetKey,
    canLoadNextStage: stageIndex < difficulty.stages.length - 1,
    canLoadPreviousStage: stageIndex > 0,
    difficulties,
    difficultyIndex,
    elapsedMs,
    gameState,
    hasStarted,
    isPaused,
    level,
    loadStage,
    onCellPress: commitMove,
    onPauseToggle: pauseActiveRun,
    onReset: resetActiveRun,
    onSelectDifficulty: selectDifficulty,
    onSelectExplorer: selectExplorer,
    onStartPress: startActiveRun,
    stageIndex,
    stagesInDifficulty: difficulty.stages.length,
    statusText: getStatusText({ activeExplorer, gameState, hasStarted, isPaused }),
    trailMap,
  };
}

function getStatusText({
  activeExplorer,
  gameState,
  hasStarted,
  isPaused,
}: {
  activeExplorer: ExplorerId;
  gameState: ReturnType<typeof createInitialState>;
  hasStarted: boolean;
  isPaused: boolean;
}) {
  if (gameState.isWon) {
    return `${explorerTheme[activeExplorer].label} 탈출 성공. 기록이 고정됐습니다.`;
  }
  if (!hasStarted) {
    return `${explorerTheme[activeExplorer].label} 차례입니다. 시작 버튼을 누르면 타이머와 이동이 시작됩니다.`;
  }
  if (isPaused) {
    return '일시정지 중입니다. 시간과 이동 자국이 멈췄어요.';
  }
  if (gameState.keyCollected) {
    return '열쇠 획득. 이제 출구로 이동하세요.';
  }
  return '먼저 반짝이는 열쇠를 찾으세요.';
}
