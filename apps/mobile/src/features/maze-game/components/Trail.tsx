import { StyleSheet, View } from 'react-native';
import type { Direction } from '../../../game/types';

export function Trail({
  color,
  directions,
  narrow,
}: {
  color: string;
  directions: Set<Direction>;
  narrow: boolean;
}) {
  const sizeStyle = narrow ? styles.trailNarrow : styles.trailWide;

  return (
    <View style={styles.trailLayer}>
      {directions.has('up') ? (
        <View style={[styles.trailSegment, sizeStyle, styles.trailUp, { backgroundColor: color }]} />
      ) : null}
      {directions.has('right') ? (
        <View
          style={[styles.trailSegment, sizeStyle, styles.trailRight, { backgroundColor: color }]}
        />
      ) : null}
      {directions.has('down') ? (
        <View
          style={[styles.trailSegment, sizeStyle, styles.trailDown, { backgroundColor: color }]}
        />
      ) : null}
      {directions.has('left') ? (
        <View
          style={[styles.trailSegment, sizeStyle, styles.trailLeft, { backgroundColor: color }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  trailLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  trailSegment: {
    position: 'absolute',
    borderRadius: 999,
    shadowColor: '#7cff58',
    shadowOpacity: 0.5,
    shadowRadius: 3,
  },
  trailWide: {
    width: '12%',
    height: '12%',
  },
  trailNarrow: {
    width: '8%',
    height: '8%',
  },
  trailUp: {
    top: 0,
    left: '44%',
    height: '56%',
  },
  trailRight: {
    right: 0,
    top: '44%',
    width: '56%',
  },
  trailDown: {
    bottom: 0,
    left: '44%',
    height: '56%',
  },
  trailLeft: {
    left: 0,
    top: '44%',
    width: '56%',
  },
});
