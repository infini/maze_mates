# MazeMates Mobile

MazeMates는 서버 없이 태블릿에서 로컬로 실행하는 미로 대결 앱입니다. Expo, React Native, TypeScript로 만들었고 미로 데이터와 이미지 리소스는 앱 번들 안에 포함됩니다.

## 실행

```sh
npm run start
```

USB로 연결한 Android 태블릿에서 실행할 때는 Expo Go 또는 Android 타깃을 사용합니다.

```sh
npm run android
```

## 게임 흐름

1. 하단의 `아빠` 또는 `아들`을 선택합니다.
2. `시작`을 누르면 선택한 플레이어의 타이머와 이동이 시작됩니다.
3. 같은 행 또는 열의 칸을 터치하면, 중간에 벽이 없을 때 그 위치까지 이동합니다.
4. `Ⅱ`로 일시정지하고, `▶`로 이어서 진행합니다.
5. 다음 선수로 넘길 때는 `아빠` 또는 `아들` 버튼을 선택합니다. 이전 선수의 타이머는 자동으로 멈춥니다.
6. 열쇠를 얻은 뒤 출구에 도착하면 해당 선수의 클리어 시간이 고정됩니다.

## 데이터

- 난이도는 `초보`, `중수`, `고수`, `초고수`, `신` 5단계입니다.
- 각 난이도는 50개 스테이지를 가지며 총 250개입니다.
- 스테이지 데이터는 `src/data/levels/stage-catalog.json`에 있습니다.
- 이동 궤적 표시 시간은 `src/data/game-settings.json`의 `trailVisibleSeconds` 값으로 조정합니다. 기본값은 5초입니다.

## 생성 스크립트

```sh
npm run generate:assets
npm run generate:levels
```

`generate:assets`는 타일과 크리퍼 스타일 캐릭터 PNG를 다시 만들고, `generate:levels`는 250개 스테이지를 재생성하고 검증합니다.

## 구조

자세한 구조는 `docs/architecture.md`에 정리되어 있습니다.
