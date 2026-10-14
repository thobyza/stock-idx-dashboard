import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const rssParser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)' },
});

// ── RSS feeds: all market/investment-specific sections ────────────
const RSS_FEEDS = [
  // CNBC Indonesia – market section (stocks, IHSG, IDX)
  { name: 'CNBC Indonesia', url: 'https://www.cnbcindonesia.com/market/rss', lang: 'id' },
  // Kontan – investment section (saham, reksa dana, obligasi)
  { name: 'Kontan Investasi', url: 'https://investasi.kontan.co.id/rss', lang: 'id' },
];

const YAHOO_RSS_FEEDS = [
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/headline?s=%5EJKSE', lang: 'en' },
];

// ── Keyword filter: keep only capital-market-relevant articles ────
// Applied to ALL sources as a safety net.
const MARKET_KEYWORDS_ID = [
  'saham', 'bursa', 'ihsg', 'idx', 'bei', 'emiten', 'ipo', 'right issue',
  'dividen', 'obligasi', 'reksa dana', 'pasar modal', 'investasi', 'portofolio',
  'indeks', 'kapitalisasi', 'fundamental', 'analis', 'rekomendasi saham',
  'harga saham', 'kinerja emiten', 'laba', 'pendapatan', 'laporan keuangan',
  'rupiah', 'kurs', 'bi rate', 'suku bunga', 'inflasi', 'neraca', 'ekspor',
  'impor', 'cadangan devisa', 'current account',
  // Ticker-adjacent: any 4-letter uppercase looks like a stock code, but we
  // can't match that easily in plain text – keywords above cover most cases.
];

const MARKET_KEYWORDS_EN = [
  'stock', 'shares', 'equity', 'market', 'idx', 'ihsg', 'jakarta', 'jkse',
  'indonesia', 'exchange', 'invest', 'ipo', 'dividend', 'bond', 'index',
  'analyst', 'earnings', 'revenue', 'profit', 'gdp', 'inflation', 'rate',
  'rupiah', 'idr', 'central bank', 'bi rate', 'portfolio', 'mutual fund',
];

function isMarketRelevant(article) {
  const title = (article.title || '').toLowerCase();
  const keywords = article.lang === 'id' ? MARKET_KEYWORDS_ID : MARKET_KEYWORDS_EN;
  return keywords.some(kw => title.includes(kw));
}

class NewsService {
  constructor() {
    this.cache = {
      articles: [],
      lastUpdated: 0,
    };
    this.CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  }

  // ── Fetch from RSS feeds ──────────────────────────────────────
  async fetchFromRSS() {
    const allFeeds = [...RSS_FEEDS, ...YAHOO_RSS_FEEDS];
    const results = [];

    for (const feed of allFeeds) {
      try {
        const parsed = await rssParser.parseURL(feed.url);
        let accepted = 0;
        for (const item of parsed.items.slice(0, 20)) {
          if (!item.link) continue;
          const article = {
            title: item.title?.trim() || 'Untitled',
            link: item.link,
            publisher: feed.name,
            publishedAt: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
            thumbnail: item.enclosure?.url || item['media:thumbnail']?.$.url || null,
            type: 'STORY',
            lang: feed.lang,
          };
          if (!isMarketRelevant(article)) continue; // skip off-topic articles
          results.push(article);
          accepted++;
        }
        console.log(`[NewsService] ${feed.name}: accepted ${accepted}/${Math.min(parsed.items.length, 20)} articles`);
      } catch (e) {
        console.warn(`[NewsService] RSS failed for ${feed.name}: ${e.message}`);
      }
    }

    return results;
  }

  // ── Fetch from Yahoo Finance search ──────────────────────────
  async fetchFromYahooSearch() {
    const queries = ['^JKSE', 'IHSG IDX Indonesia'];
    const results = [];
    const seenTitles = new Set();

    for (const query of queries) {
      try {
        const result = await yahooFinance.search(query, { newsCount: 10, quotesCount: 0 });
        for (const article of result?.news || []) {
          if (!article.link || seenTitles.has(article.title)) continue;
          seenTitles.add(article.title);
          const mapped = {
            title: article.title || 'Untitled',
            link: article.link,
            publisher: article.publisher || 'Yahoo Finance',
            publishedAt: article.providerPublishTime
              ? new Date(article.providerPublishTime * 1000).toISOString()
              : new Date().toISOString(),
            thumbnail: article.thumbnail?.resolutions?.[0]?.url || null,
            type: article.type || 'STORY',
            lang: 'en',
          };
          if (!isMarketRelevant(mapped)) continue; // safety net
          results.push(mapped);
        }
      } catch (e) {
        console.warn(`[NewsService] Yahoo search failed for "${query}": ${e.message}`);
      }
    }

    return results;
  }

  // ── Merge, deduplicate, sort ──────────────────────────────────
  merge(rssArticles, yahooArticles) {
    const seenLinks = new Set();
    const all = [...rssArticles, ...yahooArticles]; // RSS first (higher priority)

    return all
      .filter(a => {
        if (seenLinks.has(a.link)) return false;
        seenLinks.add(a.link);
        return true;
      })
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  // ── Public method ─────────────────────────────────────────────
  async getMarketNews() {
    const now = Date.now();
    if (this.cache.articles.length > 0 && now - this.cache.lastUpdated < this.CACHE_DURATION) {
      return this.cache.articles;
    }

    const [rssArticles, yahooArticles] = await Promise.all([
      this.fetchFromRSS(),
      this.fetchFromYahooSearch(),
    ]);

    const merged = this.merge(rssArticles, yahooArticles);

    console.log(`[NewsService] Total: ${rssArticles.length} RSS + ${yahooArticles.length} Yahoo = ${merged.length} articles after filtering`);

    this.cache.articles = merged;
    this.cache.lastUpdated = now;
    return merged;
  }
}

export const newsService = new NewsService();
