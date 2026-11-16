export const INDICES_LIST = [
  'KOMPAS100',
  'BLUE-CHIP',
  'LQ45',
  'IDX80',
  'IDX30',
  'IDX-SMCLIQ',
  'JII',
  'JII70',
] as const;

export type IndexCode = (typeof INDICES_LIST)[number];

export const INDEX_DESCRIPTIONS: Record<string, string> = {
  'KOMPAS100': 'Kompas 100 Index',
  'BLUE-CHIP': 'Blue Chip stocks',
  'LQ45': 'LQ45 Index',
  'IDX80': 'IDX80 Index',
  'IDX30': 'IDX30 Index',
  'IDX-SMCLIQ': 'IDX Small-Mid Cap Liquid',
  'JII': 'Jakarta Islamic Index',
  'JII70': 'Jakarta Islamic Index 70',
};
