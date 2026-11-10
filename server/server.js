import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { socketService } from './services/socketService.js';
import stockRoutes from './routes/stockRoutes.js';
import newsRoutes from './routes/newsRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/news', newsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create server and initialize WebSockets for local standalone mode
const httpServer = createServer(app);
socketService.initialize(httpServer);

// Only listen on port when run directly (not inside Vercel serverless functions)
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Backend server running at http://localhost:${PORT}`);
  });
}

export default app;
