# MazeMates Architecture

이 문서는 MazeMates 모바일 앱의 코드 구조와 변경 지점을 설명합니다.

## App Entry

`App.tsx`는 앱 진입점만 담당합니다. 실제 게임 화면은 `MazeGameScreen`으로 분리했습니다.

```txt
App.tsx
└── src/features/maze-game/MazeGameScreen.tsx
```

## Feature Structure

게임 UI와 동작은 `src/features/maze-game` 아래에 기능별로 분리했습니다.

```txt
src/features/maze-game/
├── MazeGameScreen.tsx
├── components/
│   ├── GameHud.tsx
│   ├── MazeBoard.tsx
│   └── Trail.tsx
├── hooks/
│   ├── useAnimatedToken.ts
│   └── useMazeGame.ts
├── utils/
│   ├── game-state.ts
│   ├── layout.ts
│   └── timer.ts
└── constants.ts
```

## Game State

`useMazeGame`은 현재 스테이지, 선택된 플레이어, 플레이어별 타이머, 플레이어별 진행 상태를 관리합니다.

- `아빠`와 `아들`은 같은 시작 위치에서 출발합니다.
- 선택된 플레이어 하나만 보드에 표시됩니다.
- 플레이어를 바꾸면 이전 플레이어의 타이머는 자동으로 멈춥니다.
- 타이머는 `시작` 버튼을 누르기 전에는 시작하지 않습니다.

## Movement

터치 이동은 `src/game/maze.ts`의 `moveExplorerTo`에서 처리합니다.

- 같은 행 또는 같은 열의 목표만 허용합니다.
- 이동 경로 중간에 벽이 있으면 이동하지 않습니다.
- 열쇠를 얻기 전에는 출구 칸으로 이동할 수 없습니다.
- 이동 애니메이션 중에도 새 터치를 받을 수 있습니다.

`useAnimatedToken`은 React Native `Animated.ValueXY`로 토큰 위치를 움직입니다. 새 이동 목표가 들어오면 기존 애니메이션을 중단하고 새 목표로 바로 이동합니다.

## Timer

타이머 로직은 `src/features/maze-game/utils/timer.ts`에 있습니다.

- `startTimer`: 시작 또는 일시정지 해제
- `pauseTimer`: 현재 플레이어 시간 멈춤
- `togglePause`: 일시정지 토글
- `finishTimer`: 클리어 시간 고정
- `formatElapsedTime`: 화면 표시용 시간 포맷

## Trails

이동 궤적 데이터는 `GameState.trails`에 남고, `buildTrailMap`으로 화면 표시용 맵을 만듭니다.

표시 시간은 `src/data/game-settings.json`에서 관리합니다.

```json
{
  "trailVisibleSeconds": 5
}
```

궤적 UI는 `src/features/maze-game/components/Trail.tsx`에서 조정합니다. 현재는 얇은 선만 표시하고 중간 점은 표시하지 않습니다.

## Levels

레벨 데이터는 `src/data/levels/stage-catalog.json` 하나를 사용합니다.

`scripts/generate-levels.mjs`를 실행하면 5개 난이도와 난이도별 50개 스테이지를 생성하고 검증합니다.

## Assets

타일과 캐릭터 이미지는 `scripts/generate-assets.mjs`에서 생성합니다.

- `assets/tiles`: 바닥, 벽, 열쇠, 출구
- `assets/characters/parent.png`: 녹색 아빠 크리퍼
- `assets/characters/child.png`: 파란색 아들 크리퍼
