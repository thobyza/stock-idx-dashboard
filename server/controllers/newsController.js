import { newsService } from '../services/newsService.js';

export const getNews = async (req, res) => {
  try {
    const articles = await newsService.getMarketNews();
    res.json({ articles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve market news' });
  }
};
