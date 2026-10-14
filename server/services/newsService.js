import YahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const rssParser = new Parser({
  timeout: 8000,
  headers: { 'User-Agent': 'Mozilla/5.0' },
});

const RSS_FEEDS = [
  { name: 'Antara Ekonomi', url: 'https://www.antaranews.com/rss/ekonomi', lang: 'id' },
  { name: 'Tempo Bisnis',   url: 'https://rss.tempo.co/bisnis',            lang: 'id' },
];

const YAHOO_RSS_FEEDS = [
  { name: 'Yahoo Finance', url: 'https://finance.yahoo.com/rss/headline?s=%5EJKSE', lang: 'en' },
];

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
        for (const item of parsed.items.slice(0, 15)) {
          if (!item.link) continue;
          results.push({
            title: item.title?.trim() || 'Untitled',
            link: item.link,
            publisher: feed.name,
            publishedAt: item.pubDate
              ? new Date(item.pubDate).toISOString()
              : new Date().toISOString(),
            thumbnail: item.enclosure?.url || null,
            type: 'STORY',
            lang: feed.lang,
          });
        }
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
          results.push({
            title: article.title || 'Untitled',
            link: article.link,
            publisher: article.publisher || 'Yahoo Finance',
            publishedAt: article.providerPublishTime
              ? new Date(article.providerPublishTime * 1000).toISOString()
              : new Date().toISOString(),
            thumbnail: article.thumbnail?.resolutions?.[0]?.url || null,
            type: article.type || 'STORY',
            lang: 'en',
          });
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

    console.log(`[NewsService] Fetched ${rssArticles.length} RSS + ${yahooArticles.length} Yahoo = ${merged.length} total articles`);

    this.cache.articles = merged;
    this.cache.lastUpdated = now;
    return merged;
  }
}

export const newsService = new NewsService();
