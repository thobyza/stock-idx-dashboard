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
                                                                                                                                                                                                                
// Create server and initialize WebSockets                                                                                                                                                                     
const httpServer = createServer(app);                                                                                                                                                                          
socketService.initialize(httpServer);                                                                                                                                                                          
                                                                                                                                                                                                                
const PORT = 3000;                                                                                                                                                                                             
httpServer.listen(PORT, () => {                                                                                                                                                                                
  console.log(`Modular backend server running at http://localhost:${PORT}`);                                                                                                                                   
});   