export const INDICES_LIST = [
  'KOMPAS100',
  'BLUE-CHIP',
  'LQ45',
  'IDX80',
  'IDX30',
  'IDX-SMCLIQ',
  'IDXHIDIV20',
  'JII',
  'JII70',
] as const;

export type IndexCode = (typeof INDICES_LIST)[number];

export interface IndexInfo {
  name: string;
  description: string;
}

export const INDICES_METADATA: Record<IndexCode, IndexInfo> = {
  KOMPAS100: {
    name: 'Kompas 100 Index',
    description:
      'Measures the price performance of 100 stocks characterized by high liquidity and large market capitalization, managed in collaboration with Kompas Gramedia Group.',
  },
  'BLUE-CHIP': {
    name: 'Blue Chip stocks',
    description:
      'Represents premier, long-established companies with stable earnings, solid balance sheets, and high investor confidence, typically drawn from the LQ45 or IDX30.',
  },
  LQ45: {
    name: 'LQ45 Index',
    description:
      'Tracks the price performance of 45 highly liquid stocks with large market capitalization, backed by solid financial fundamentals.',
  },
  IDX80: {
    name: 'IDX80 Index',
    description:
      'Measures the price performance of 80 highly liquid stocks with substantial market capitalization and sound company fundamentals.',
  },
  IDX30: {
    name: 'IDX30 Index',
    description:
      'Tracks the price performance of 30 leading stocks with superior liquidity and large market capitalization, selected from the LQ45.',
  },
  'IDX-SMCLIQ': {
    name: 'IDX Small-Mid Cap Liquid',
    description:
      'Tracks the price performance of small- and mid-cap stocks characterized by active trading liquidity.',
  },
  IDXHIDIV20: {
    name: 'IDX High Dividend 20',
    description: 
    `Measures the price performance of 20 stocks that consistently distribute high cash dividends over the past 3 years and have a high dividend yield.`,
  },
  JII: {
    name: 'Jakarta Islamic Index',
    description:
      'Measures the price performance of 30 sharia-compliant stocks with solid financial track records and high trading liquidity.',
  },
  JII70: {
    name: 'Jakarta Islamic Index 70',
    description:
      'Tracks the price performance of 70 liquid sharia-compliant stocks with proven financial performance and active market turnover.',
  },
};

// Backward compatibility alias if needed
export const INDEX_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  Object.entries(INDICES_METADATA).map(([key, val]) => [key, val.name])
);
