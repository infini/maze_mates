import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { settings } from '../../../data/settings';
import type { ExplorerId, GameState, PreparedLevel } from '../../../game/types';
import { explorerOrder, explorerTheme } from '../constants';
import { formatElapsedTime } from '../utils/timer';

export function GameHud({
  activeExplorer,
  boardSize,
  canLoadNext,
  canLoadPrevious,
  elapsedMs,
  gameState,
  hasStarted,
  isLandscape,
  isPaused,
  level,
  levelIndex,
  levelsCount,
  onLoadLevel,
  onPauseToggle,
  onReset,
  onSelectExplorer,
  onStartPress,
  statusText,
}: {
  activeExplorer: ExplorerId;
  boardSize: number;
  canLoadNext: boolean;
  canLoadPrevious: boolean;
  elapsedMs: number;
  gameState: GameState;
  hasStarted: boolean;
  isLandscape: boolean;
  isPaused: boolean;
  level: PreparedLevel;
  levelIndex: number;
  levelsCount: number;
  onLoadLevel: (index: number) => void;
  onPauseToggle: () => void;
  onReset: () => void;
  onSelectExplorer: (explorerId: ExplorerId) => void;
  onStartPress: () => void;
  statusText: string;
}) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <View
      style={[
        styles.controlPanel,
        isLandscape ? styles.panelLandscape : styles.panelPortrait,
        !isLandscape ? { width: boardSize, maxWidth: boardSize } : null,
      ]}
    >
      <View style={styles.hudRow}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.appTitle}>
            MazeMates
          </Text>
          <Text numberOfLines={1} style={styles.levelTitle}>
            {level.titleKo} · {levelIndex + 1}/{levelsCount}
          </Text>
        </View>
      </View>

      <View style={styles.iconCluster}>
        <StartButton
          disabled={gameState.isWon || (hasStarted && !isPaused)}
          label={!hasStarted ? '시작' : isPaused ? '계속' : '진행 중'}
          onPress={onStartPress}
        />
        <IconButton
          active={isPaused}
          disabled={!hasStarted || gameState.isWon}
          label={isPaused ? '▶' : 'Ⅱ'}
          onPress={onPauseToggle}
        />
        <IconButton label="↻" onPress={onReset} />
        <IconButton
          active={settingsOpen}
          label="⚙"
          onPress={() => setSettingsOpen((current) => !current)}
        />
      </View>

      <View style={styles.statusBand}>
        <Text numberOfLines={2} style={styles.statusText}>
          {statusText}
        </Text>
        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>{gameState.isWon ? '클리어 시간' : '진행 시간'}</Text>
          <Text style={styles.timerText}>{formatElapsedTime(elapsedMs)}</Text>
        </View>
        <Text style={styles.stageText}>
          {level.difficultyKo} {level.stageNumber} / 50 · 이동 {gameState.moves}
        </Text>
      </View>

      {settingsOpen ? <SettingsPanel /> : null}

      <View style={styles.bottomControls}>
        <View style={styles.selectorRow}>
          {explorerOrder.map((explorerId) => {
            const selected = explorerId === activeExplorer;
            return (
              <Pressable
                key={explorerId}
                onPress={() => onSelectExplorer(explorerId)}
                style={[
                  styles.explorerButton,
                  selected ? styles.explorerButtonSelected : null,
                  { borderColor: explorerTheme[explorerId].color },
                  selected ? { flexGrow: 1.8 } : { flexGrow: 1 },
                ]}
              >
                <View
                  style={[
                    styles.explorerSwatch,
                    { backgroundColor: explorerTheme[explorerId].color },
                  ]}
                />
                {selected ? <Text style={styles.selectedMarker}>●</Text> : null}
                <Text style={styles.explorerButtonText}>{explorerTheme[explorerId].label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.stageNavRow}>
          <StageNavButton
            disabled={!canLoadPrevious}
            label="‹"
            onPress={() => onLoadLevel(levelIndex - 1)}
          />
          <View style={styles.stageCounter}>
            <Text style={styles.stageCounterTitle}>스테이지</Text>
            <Text style={styles.stageCounterText}>
              {levelIndex + 1} / {levelsCount}
            </Text>
          </View>
          <StageNavButton
            disabled={!canLoadNext}
            label="›"
            onPress={() => onLoadLevel(levelIndex + 1)}
          />
        </View>
      </View>
    </View>
  );
}

function SettingsPanel() {
  return (
    <View style={styles.settingsPanel}>
      <Text style={styles.settingsTitle}>설정</Text>
      <View style={styles.settingsRow}>
        <Text style={styles.settingsLabel}>이동 궤적</Text>
        <Text style={styles.settingsValue}>{settings.trailVisibleSeconds}초</Text>
      </View>
    </View>
  );
}

function StageNavButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stageNavButton,
        disabled ? styles.stageNavButtonDisabled : null,
        pressed ? styles.stageNavButtonPressed : null,
      ]}
    >
      <Text style={[styles.stageNavButtonText, disabled ? styles.stageNavButtonTextDisabled : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StartButton({
  disabled,
  label,
  onPress,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.startButton,
        disabled ? styles.startButtonDisabled : null,
        pressed ? styles.startButtonPressed : null,
      ]}
    >
      <Text style={[styles.startButtonText, disabled ? styles.startButtonTextDisabled : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function IconButton({
  active,
  disabled,
  label,
  onPress,
}: {
  active?: boolean;
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        active ? styles.iconButtonActive : null,
        disabled ? styles.iconButtonDisabled : null,
        pressed ? styles.iconButtonPressed : null,
      ]}
    >
      <Text style={[styles.iconButtonText, disabled ? styles.iconButtonTextDisabled : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  controlPanel: {
    width: '100%',
    maxWidth: 300,
    gap: 8,
  },
  panelLandscape: {
    width: 300,
    alignSelf: 'center',
  },
  panelPortrait: {
    maxWidth: 900,
  },
  hudRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  appTitle: {
    color: '#f8f4dc',
    fontSize: 30,
    fontWeight: '800',
  },
  levelTitle: {
    color: '#85fff7',
    fontSize: 15,
    fontWeight: '700',
  },
  statusBand: {
    minHeight: 74,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#11182d',
  },
  statusText: {
    color: '#f8f4dc',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
  },
  timerRow: {
    minHeight: 28,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timerLabel: {
    color: '#b8c3df',
    fontSize: 13,
    fontWeight: '700',
  },
  timerText: {
    color: '#f6c94d',
    fontSize: 18,
    fontWeight: '900',
  },
  stageText: {
    marginTop: 2,
    color: '#85fff7',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomControls: {
    gap: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  explorerButton: {
    flexBasis: 0,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 2,
    backgroundColor: '#0d1326',
  },
  explorerButtonSelected: {
    borderWidth: 3,
    backgroundColor: '#1f3150',
  },
  explorerSwatch: {
    width: 15,
    height: 15,
    borderRadius: 999,
  },
  explorerButtonText: {
    color: '#f8f4dc',
    fontSize: 14,
    fontWeight: '800',
  },
  selectedMarker: {
    color: '#f8f4dc',
    fontSize: 10,
    fontWeight: '900',
  },
  iconCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startButton: {
    flex: 1,
    minWidth: 118,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7cff58',
    backgroundColor: '#173a1d',
    paddingHorizontal: 18,
  },
  startButtonPressed: {
    backgroundColor: '#214d28',
  },
  startButtonDisabled: {
    borderColor: '#344461',
    backgroundColor: '#10172a',
  },
  startButtonText: {
    color: '#f8f4dc',
    fontSize: 15,
    fontWeight: '900',
  },
  startButtonTextDisabled: {
    color: '#7f8daa',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5a6d9b',
    backgroundColor: '#19243f',
  },
  iconButtonActive: {
    borderColor: '#7cff58',
    backgroundColor: '#173a1d',
  },
  iconButtonPressed: {
    backgroundColor: '#24365f',
  },
  iconButtonDisabled: {
    borderColor: '#26314f',
    backgroundColor: '#0d1326',
  },
  iconButtonText: {
    color: '#f8f4dc',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  iconButtonTextDisabled: {
    color: '#4f5b78',
  },
  settingsPanel: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#10172a',
  },
  settingsTitle: {
    color: '#f8f4dc',
    fontSize: 13,
    fontWeight: '900',
  },
  settingsRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settingsLabel: {
    color: '#b8c3df',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsValue: {
    color: '#85fff7',
    fontSize: 15,
    fontWeight: '900',
  },
  stageNavRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  stageNavButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#5a6d9b',
    backgroundColor: '#19243f',
  },
  stageNavButtonPressed: {
    backgroundColor: '#24365f',
  },
  stageNavButtonDisabled: {
    borderColor: '#26314f',
    backgroundColor: '#0d1326',
  },
  stageNavButtonText: {
    color: '#f8f4dc',
    fontSize: 22,
    fontWeight: '800',
  },
  stageNavButtonTextDisabled: {
    color: '#4f5b78',
  },
  stageCounter: {
    width: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#344461',
    backgroundColor: '#10172a',
  },
  stageCounterTitle: {
    color: '#7f8daa',
    fontSize: 10,
    fontWeight: '700',
  },
  stageCounterText: {
    marginTop: 1,
    color: '#f8f4dc',
    fontSize: 13,
    fontWeight: '800',
  },
});
