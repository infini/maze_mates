import type { ExplorerId } from '../../game/types';

export const explorerTheme: Record<ExplorerId, { label: string; color: string; trail: string }> = {
  parent: {
    label: '아빠',
    color: '#7cff58',
    trail: '#7cff58',
  },
  child: {
    label: '아들',
    color: '#58e0ff',
    trail: '#4ee6ff',
  },
};

export const explorerOrder: ExplorerId[] = ['parent', 'child'];
