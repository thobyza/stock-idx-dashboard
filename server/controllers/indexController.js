import { indexService } from '../services/indexService.js';

export const getIndexComparison = async (req, res) => {
  try {
    const { timeframe = '1D' } = req.query;
    const data = await indexService.getComparisonData(timeframe);
    res.json(data);
  } catch (error) {
    console.error('Error in getIndexComparison:', error);
    res.status(500).json({ error: 'Failed to retrieve index comparison data' });
  }
};
