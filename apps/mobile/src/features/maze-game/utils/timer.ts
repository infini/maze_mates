import type { ExplorerId } from '../../../game/types';

export type TimerState = {
  startedAt: number | null;
  pausedAt: number | null;
  pausedTotalMs: number;
  clearTimeMs: number | null;
};

export type TimerStates = Record<ExplorerId, TimerState>;

export function createTimerState(): TimerState {
  return {
    startedAt: null,
    pausedAt: null,
    pausedTotalMs: 0,
    clearTimeMs: null,
  };
}

export function createTimerStates(): TimerStates {
  return {
    parent: createTimerState(),
    child: createTimerState(),
  };
}

export function getElapsedMs(timer: TimerState, now: number) {
  if (timer.clearTimeMs !== null) {
    return timer.clearTimeMs;
  }
  if (timer.startedAt === null) {
    return 0;
  }

  const effectiveNow = timer.pausedAt ?? now;
  return Math.max(0, effectiveNow - timer.startedAt - timer.pausedTotalMs);
}

export function startTimer(timer: TimerState, now: number): TimerState {
  if (timer.clearTimeMs !== null) {
    return timer;
  }
  if (timer.startedAt === null) {
    return {
      ...timer,
      startedAt: now,
    };
  }
  if (timer.pausedAt !== null) {
    return togglePause(timer, now);
  }
  return timer;
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  if (timer.startedAt === null || timer.pausedAt !== null || timer.clearTimeMs !== null) {
    return timer;
  }

  return {
    ...timer,
    pausedAt: now,
  };
}

export function togglePause(timer: TimerState, now: number): TimerState {
  if (timer.clearTimeMs !== null || timer.startedAt === null) {
    return timer;
  }

  if (timer.pausedAt !== null) {
    return {
      ...timer,
      pausedAt: null,
      pausedTotalMs: timer.pausedTotalMs + now - timer.pausedAt,
    };
  }

  return {
    ...timer,
    pausedAt: now,
  };
}

export function finishTimer(timer: TimerState, now: number): TimerState {
  if (timer.clearTimeMs !== null) {
    return timer;
  }

  return {
    ...timer,
    pausedAt: null,
    clearTimeMs: getElapsedMs(timer, now),
  };
}

export function formatElapsedTime(milliseconds: number) {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60);

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(
    centiseconds,
  ).padStart(2, '0')}`;
}
