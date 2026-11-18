import YahooFinance from 'yahoo-finance2';
import { STOCK_DETAILS } from '../config/constants.js';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export const TRACKED_INDICES = [
  {
    code: 'IHSG',
    symbol: '^JKSE',
    name: 'IDX Composite',
    description: 'Composite index of all stocks listed on the Indonesia Stock Exchange',
  },
  {
    code: 'KOMPAS100',
    symbol: 'KOMPAS100.JK',
    name: 'Kompas 100 Index',
    description: '100 liquid stocks chosen in collaboration with Kompas Gramedia',
  },
  {
    code: 'LQ45',
    symbol: '^JKLQ45',
    name: 'LQ45 Index',
    description: '45 most liquid stocks with high market capitalization and sound fundamentals',
  },
  {
    code: 'IDX30',
    symbol: 'IDX30.JK',
    name: 'IDX30 Index',
    description: '30 leading stocks with superior liquidity, selected from the LQ45',
  },
  {
    code: 'IDX80',
    symbol: 'IDX80.JK',
    name: 'IDX80 Index',
    description: '80 liquid stocks with high transaction value and solid fundamentals',
  },
  {
    code: 'IDXHIDIV20',
    symbol: 'IDXHIDIV20.JK',
    name: 'IDX High Dividend 20',
    description: '20 stocks that consistently distribute high cash dividends over 3 years',
  },
  {
    code: 'IDX-SMCLIQ',
    symbol: 'IDXSMC-LIQ.JK',
    name: 'IDX Small-Mid Cap Liquid',
    description: 'Liquid small and medium capitalization stocks',
  },
  {
    code: 'JII',
    symbol: '^JKII',
    name: 'Jakarta Islamic Index',
    description: '30 leading liquid Sharia-compliant stocks',
  },
  {
    code: 'JII70',
    symbol: 'JII70.JK',
    name: 'Jakarta Islamic Index 70',
    description: '70 liquid Sharia-compliant stocks with proven financial track records',
  },
];

class IndexService {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 3 * 60 * 1000; // 3 minutes
  }

  getTimeframeConfig(timeframe = '1D') {
    const now = new Date();
    switch (timeframe.toUpperCase()) {
      case '1D': {
        const period1 = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '15m' };
      }
      case '1W': {
        const period1 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '1h' };
      }
      case '3M': {
        const period1 = new Date(now.getTime() - 90 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '1h' };
      }
      case '6M': {
        const period1 = new Date(now.getTime() - 180 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '1h' };
      }
      case 'YTD': {
        const period1 = new Date(now.getFullYear(), 0, 1);
        return { period1, period2: now, interval: '1h' };
      }
      case '1Y': {
        const period1 = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '1h' };
      }
      case '2Y': {
        // ~700 days — max range for 1h interval on .JK suffix indices
        const period1 = new Date(now.getTime() - 700 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '1h' };
      }
      case '5Y': {
        // Only ^JKSE, ^JKLQ45, ^JKII return data for 1wk interval over 5 years
        // .JK suffix indices will return minimal data (expected)
        const period1 = new Date(now.getTime() - 5 * 365 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '1wk' };
      }
      default: {
        const period1 = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
        return { period1, period2: now, interval: '15m' };
      }
    }
  }

  downsample(data, maxPoints = 60) {
    if (!data || data.length <= maxPoints) return data;
    const step = Math.ceil(data.length / maxPoints);
    const sampled = [];
    for (let i = 0; i < data.length; i += step) {
      sampled.push(data[i]);
    }
    // Always include the latest point
    if (sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1]);
    }
    return sampled;
  }

  async getComparisonData(timeframe = '1D') {
    const tf = timeframe.toUpperCase();
    const cacheKey = `comparison_${tf}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const { period1, period2, interval } = this.getTimeframeConfig(tf);

    // Fetch official index data
    const fetchPromises = TRACKED_INDICES.map(async (idx) => {
      if (idx.isCustom) return null;

      try {
        const [quoteRes, chartRes] = await Promise.allSettled([
          yahooFinance.quote(idx.symbol),
          yahooFinance.chart(idx.symbol, { period1, period2, interval }),
        ]);

        const quote = quoteRes.status === 'fulfilled' ? quoteRes.value : null;
        const chart = chartRes.status === 'fulfilled' ? chartRes.value : null;

        const validQuotes = chart?.quotes?.filter((q) => q.close != null) || [];

        let currentPrice = quote?.regularMarketPrice || 0;
        let change = quote?.regularMarketChange || 0;
        let changePercent = quote?.regularMarketChangePercent || 0;
        let startPrice = quote?.regularMarketPreviousClose || currentPrice;
        let high = quote?.regularMarketDayHigh || currentPrice;
        let low = quote?.regularMarketDayLow || currentPrice;

        let historyPoints = [];

        if (validQuotes.length > 0) {
          if (!currentPrice) {
            currentPrice = validQuotes[validQuotes.length - 1].close;
          }

          if (tf === '1D') {
            // For 1D, use official regularMarketChange & changePercent from previous close
            if (quote?.regularMarketChangePercent != null) {
              changePercent = quote.regularMarketChangePercent;
              change = quote.regularMarketChange || 0;
              startPrice = quote.regularMarketPreviousClose || validQuotes[0].close;
            } else {
              startPrice = validQuotes[0].close;
              change = currentPrice - startPrice;
              changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
            }
          } else {
            // For multi-day timeframes, calculate from the starting candle of the timeframe
            startPrice = validQuotes[0].close;
            change = currentPrice - startPrice;
            changePercent = startPrice > 0 ? (change / startPrice) * 100 : 0;
          }

          const closes = validQuotes.map((q) => q.close);
          high = Math.max(...closes);
          low = Math.min(...closes);

          // Build normalized percentage and value points
          historyPoints = validQuotes.map((q) => {
            const dateStr = q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString();
            const pct = startPrice > 0 ? Number((((q.close - startPrice) / startPrice) * 100).toFixed(2)) : 0;
            return {
              date: dateStr,
              value: Number(q.close.toFixed(2)),
              percent: pct,
            };
          });
        }

        const downsampledHistory = this.downsample(historyPoints, 60);
        const sparkline = downsampledHistory.map((h) => h.value);

        return {
          code: idx.code,
          symbol: idx.symbol,
          name: idx.name,
          description: idx.description,
          price: Number(currentPrice.toFixed(2)),
          change: Number(change.toFixed(2)),
          changePercent: Number(changePercent.toFixed(2)),
          startPrice: Number(startPrice.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          sparkline,
          history: downsampledHistory,
        };
      } catch (err) {
        console.warn(`[IndexService] Failed to fetch ${idx.code}:`, err.message);
        return {
          code: idx.code,
          symbol: idx.symbol,
          name: idx.name,
          description: idx.description,
          price: 0,
          change: 0,
          changePercent: 0,
          startPrice: 0,
          high: 0,
          low: 0,
          sparkline: [],
          history: [],
        };
      }
    });

    const indexResults = (await Promise.all(fetchPromises)).filter(Boolean);

    const payload = {
      timeframe: tf,
      updatedAt: new Date().toISOString(),
      indices: indexResults,
    };

    this.cache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return payload;
  }
}

export const indexService = new IndexService();
