export function getBoardSize({
  height,
  isLandscape,
  width,
}: {
  height: number;
  isLandscape: boolean;
  width: number;
}) {
  const panelWidth = 300;
  const boardLimitByWidth = isLandscape ? width - panelWidth - 28 : width - 12;
  const boardLimitByHeight = isLandscape ? height - 24 : height * 0.64;

  return Math.max(
    286,
    Math.floor(Math.min(boardLimitByWidth, boardLimitByHeight, isLandscape ? 900 : 1180)),
  );
}

export function movementDuration(distance: number) {
  return Math.min(180, Math.max(90, distance * 45));
}
