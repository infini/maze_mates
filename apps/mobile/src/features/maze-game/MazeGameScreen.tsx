import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GameHud } from './components/GameHud';
import { MazeBoard } from './components/MazeBoard';
import { useAnimatedToken } from './hooks/useAnimatedToken';
import { useMazeGame } from './hooks/useMazeGame';
import { getBoardSize } from './utils/layout';

export function MazeGameScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const game = useMazeGame();
  const boardSize = getBoardSize({ height, isLandscape, width });
  const cellSize = boardSize / game.level.width;
  const tokenInset = cellSize * 0.11;
  const tokenSize = cellSize * 0.78;
  const tokenPosition = game.gameState.explorers[game.activeExplorer];
  const animatedTokenPosition = useAnimatedToken({
    activeExplorer: game.activeExplorer,
    cellSize,
    levelId: game.level.id,
    position: tokenPosition,
    resetKey: game.animationResetKey,
    tokenInset,
  });

  return (
    <View style={styles.screen}>
      <ExpoStatusBar style="light" />
      {isLandscape ? (
        renderContent()
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>{renderContent()}</ScrollView>
      )}
    </View>
  );

  function renderContent() {
    return (
      <View
        style={[
          styles.stage,
          isLandscape ? styles.stageLandscape : styles.stagePortrait,
          !isLandscape ? styles.stagePortraitScrollable : null,
        ]}
      >
        <MazeBoard
          activeExplorer={game.activeExplorer}
          animatedTokenPosition={animatedTokenPosition}
          boardSize={boardSize}
          cellSize={cellSize}
          gameState={game.gameState}
          hasStarted={game.hasStarted}
          isPaused={game.isPaused}
          level={game.level}
          onCellPress={game.onCellPress}
          tokenSize={tokenSize}
          trailMap={game.trailMap}
        />
        <GameHud
          activeExplorer={game.activeExplorer}
          boardSize={boardSize}
          canLoadNext={game.canLoadNext}
          canLoadPrevious={game.canLoadPrevious}
          elapsedMs={game.elapsedMs}
          gameState={game.gameState}
          hasStarted={game.hasStarted}
          isLandscape={isLandscape}
          isPaused={game.isPaused}
          level={game.level}
          levelIndex={game.levelIndex}
          levelsCount={game.levelsCount}
          onLoadLevel={game.loadLevel}
          onPauseToggle={game.onPauseToggle}
          onReset={game.onReset}
          onSelectExplorer={game.onSelectExplorer}
          onStartPress={game.onStartPress}
          statusText={game.statusText}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070b18',
  },
  scrollContent: {
    flexGrow: 1,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    gap: 10,
  },
  stageLandscape: {
    flexDirection: 'row',
  },
  stagePortrait: {
    flexDirection: 'column',
  },
  stagePortraitScrollable: {
    justifyContent: 'flex-start',
    paddingTop: 30,
    paddingBottom: 72,
  },
});
