import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { explorerImages, tileImages } from '../../../game/assets';
import type { ExplorerId, GameState, PreparedLevel, TrailMap } from '../../../game/types';
import { explorerOrder, explorerTheme } from '../constants';
import { Trail } from './Trail';

export function MazeBoard({
  activeExplorer,
  animatedTokenPosition,
  boardSize,
  cellSize,
  gameState,
  hasStarted,
  isPaused,
  level,
  onCellPress,
  tokenSize,
  trailMap,
}: {
  activeExplorer: ExplorerId;
  animatedTokenPosition: Animated.ValueXY;
  boardSize: number;
  cellSize: number;
  gameState: GameState;
  hasStarted: boolean;
  isPaused: boolean;
  level: PreparedLevel;
  onCellPress: (row: number, col: number) => void;
  tokenSize: number;
  trailMap: TrailMap;
}) {
  return (
    <View style={[styles.boardFrame, { width: boardSize, height: boardSize }]}>
      {level.cells.map((row, rowIndex) =>
        row.map((cell) => {
          const key = `${cell.row}:${cell.col}`;
          const trails = trailMap.get(key);
          const baseTile = cell.kind === 'wall' ? 'wall' : 'floor';

          return (
            <Pressable
              key={key}
              disabled={cell.kind === 'wall' || !hasStarted || isPaused || gameState.isWon}
              onPress={() => onCellPress(cell.row, cell.col)}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  left: cell.col * cellSize,
                  top: rowIndex * cellSize,
                },
              ]}
            >
              <Image source={tileImages[baseTile]} style={styles.tileImage} resizeMode="cover" />
              {cell.kind === 'exit' ? (
                <Image source={tileImages.exit} style={styles.tileOverlay} resizeMode="contain" />
              ) : null}
              {cell.kind === 'key' && !gameState.keyCollected ? (
                <Image source={tileImages.key} style={styles.tileOverlay} resizeMode="contain" />
              ) : null}
              {trails ? (
                <View pointerEvents="none" style={styles.trailCanvas}>
                  {explorerOrder.map((explorerId) =>
                    trails[explorerId] ? (
                      <Trail
                        key={explorerId}
                        color={explorerTheme[explorerId].trail}
                        directions={trails[explorerId]}
                        narrow={explorerId === 'child'}
                      />
                    ) : null,
                  )}
                </View>
              ) : null}
            </Pressable>
          );
        }),
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          styles.animatedExplorerToken,
          {
            width: tokenSize,
            height: tokenSize,
            transform: [
              { translateX: animatedTokenPosition.x },
              { translateY: animatedTokenPosition.y },
            ],
          },
        ]}
      >
        <Image source={explorerImages[activeExplorer]} style={styles.tokenImage} resizeMode="contain" />
      </Animated.View>

      {isPaused ? (
        <View style={styles.pauseOverlay}>
          <Text style={styles.pauseOverlayTitle}>일시정지</Text>
          <Text style={styles.pauseOverlayText}>계속 버튼으로 이어서 플레이</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  boardFrame: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#52638f',
    backgroundColor: '#11182d',
  },
  cell: {
    position: 'absolute',
    overflow: 'hidden',
  },
  tileImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  tileOverlay: {
    position: 'absolute',
    left: '9%',
    top: '9%',
    width: '82%',
    height: '82%',
  },
  trailCanvas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  animatedExplorerToken: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  tokenImage: {
    width: '100%',
    height: '100%',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7, 11, 24, 0.78)',
  },
  pauseOverlayTitle: {
    color: '#f8f4dc',
    fontSize: 30,
    fontWeight: '900',
  },
  pauseOverlayText: {
    marginTop: 8,
    color: '#85fff7',
    fontSize: 14,
    fontWeight: '700',
  },
});
