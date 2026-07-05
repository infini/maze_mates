import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import type { ExplorerId, Position } from '../../../game/types';
import { movementDuration } from '../utils/layout';

type AnimationSource = {
  activeExplorer: ExplorerId;
  cellSize: number;
  levelId: string;
  position: Position;
  resetKey: number;
};

export function useAnimatedToken({
  activeExplorer,
  cellSize,
  levelId,
  position,
  resetKey,
  tokenInset,
}: {
  activeExplorer: ExplorerId;
  cellSize: number;
  levelId: string;
  position: Position;
  resetKey: number;
  tokenInset: number;
}) {
  const animatedPosition = useRef(
    new Animated.ValueXY({
      x: position.col * cellSize + tokenInset,
      y: position.row * cellSize + tokenInset,
    }),
  ).current;
  const sourceRef = useRef<AnimationSource>({
    activeExplorer,
    cellSize,
    levelId,
    position,
    resetKey,
  });

  useEffect(() => {
    const target = {
      x: position.col * cellSize + tokenInset,
      y: position.row * cellSize + tokenInset,
    };
    const source = sourceRef.current;
    const shouldJump =
      source.activeExplorer !== activeExplorer ||
      source.levelId !== levelId ||
      source.cellSize !== cellSize ||
      source.resetKey !== resetKey;

    if (shouldJump) {
      animatedPosition.stopAnimation();
      animatedPosition.setValue(target);
      sourceRef.current = { activeExplorer, cellSize, levelId, position, resetKey };
      return;
    }

    const distance =
      Math.abs(source.position.row - position.row) + Math.abs(source.position.col - position.col);

    if (distance === 0) {
      return;
    }

    animatedPosition.stopAnimation();
    Animated.timing(animatedPosition, {
      toValue: target,
      duration: movementDuration(distance),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    sourceRef.current = { activeExplorer, cellSize, levelId, position, resetKey };
  }, [
    activeExplorer,
    animatedPosition,
    cellSize,
    levelId,
    position,
    position.col,
    position.row,
    resetKey,
    tokenInset,
  ]);

  return animatedPosition;
}
