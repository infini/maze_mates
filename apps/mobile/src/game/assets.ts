import type { ImageSourcePropType } from 'react-native';
import type { CellKind, ExplorerId } from './types';

export const tileImages: Record<CellKind, ImageSourcePropType> = {
  floor: require('../../assets/tiles/floor.png'),
  wall: require('../../assets/tiles/wall.png'),
  key: require('../../assets/tiles/key.png'),
  exit: require('../../assets/tiles/exit.png'),
};

export const explorerImages: Record<ExplorerId, ImageSourcePropType> = {
  parent: require('../../assets/characters/parent.png'),
  child: require('../../assets/characters/child.png'),
};
