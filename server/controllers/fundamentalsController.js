import yahooFinance from 'yahoo-finance2';

// Simple in-memory cache to avoid hammering Yahoo Finance on every popup open
const cache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const getFundamentals = async (req, res) => {
  const { symbol } = req.params;

  // IDX tickers need the ".JK" suffix for Yahoo Finance
  const yfSymbol = symbol.toUpperCase().endsWith('.JK')
    ? symbol.toUpperCase()
    : `${symbol.toUpperCase()}.JK`;

  // Return cached result if still fresh
  const cached = cache.get(yfSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json(cached.data);
  }

  try {
    const info = await yahooFinance.quoteSummary(yfSymbol, {
      modules: ['summaryDetail', 'defaultKeyStatistics', 'financialData'],
    });

    const sd  = info.summaryDetail        || {};
    const ks  = info.defaultKeyStatistics || {};
    const fd  = info.financialData        || {};

    const result = {
      // Valuation
      trailingPE:          ks.trailingPE          ?? null,
      forwardPE:           ks.forwardPE            ?? null,
      priceToBook:         ks.priceToBook          ?? null,
      enterpriseToEbitda:  ks.enterpriseToEbitda   ?? null,
      pegRatio:            ks.pegRatio             ?? null,
      // Per-share
      trailingEps:         ks.trailingEps          ?? null,
      forwardEps:          ks.forwardEps           ?? null,
      bookValue:           ks.bookValue            ?? null,
      dividendYield:       sd.dividendYield        ?? null,
      payoutRatio:         sd.payoutRatio          ?? null,
      beta:                sd.beta                 ?? ks.beta ?? null,
      // Profitability
      profitMargins:       fd.profitMargins        ?? null,
      operatingMargins:    fd.operatingMargins     ?? null,
      returnOnAssets:      fd.returnOnAssets       ?? null,
      returnOnEquity:      fd.returnOnEquity       ?? null,
      revenueGrowth:       fd.revenueGrowth        ?? null,
      earningsGrowth:      fd.earningsGrowth       ?? null,
    };

    cache.set(yfSymbol, { data: result, timestamp: Date.now() });
    res.json(result);
  } catch (error) {
    console.error(`[Fundamentals] Failed to fetch data for ${yfSymbol}:`, error.message);
    // Return empty object — frontend will show N/A gracefully
    res.json({});
  }
};
