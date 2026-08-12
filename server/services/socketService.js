import { Server } from 'socket.io';                                                                                                                                                                            
import { stockService } from './stockService.js';

class SocketService {
  constructor() {
    this.io = null;                                                                                                                                                                                            
    this.broadcastInterval = null;  
  };

  initialize(httpServer) {                                                                                                                                                                                     
    this.io = new Server(httpServer, {                                                                                                                                                                         
      cors: {                                                                                                                                                                                                  
        origin: "http://localhost:4200",                                                                                                                                                                       
        methods: ["GET", "POST"]                                                                                                                                                                               
      }                                                                                                                                                                                                        
    });                                                                                                                                                                                                        
                                                                                                                                                                                                                
    this.io.on('connection', (socket) => {                                                                                                                                                                     
      console.log(`Client connected: ${socket.id}`);                                                                                                                                                           
                                                                                                                                                                                                                
      socket.on('disconnect', () => {                                                                                                                                                                          
        console.log(`Client disconnected: ${socket.id}`);                                                                                                                                                      
      });                                                                                                                                                                                                      
    });                                                                                                                                                                                                        
                                                                                                                                                                                                                
    this.startBroadcasting();                                                                                                                                                                                  
  };
  
  startBroadcasting() {                                                                                                                                                                                        
    if (this.broadcastInterval) clearInterval(this.broadcastInterval);                                                                                                                                         
                                                                                                                                                                                                                
    this.broadcastInterval = setInterval(async () => {                                                                                                                                                         
      let { stocks, ihsg } = await stockService.getStocksData();                                                                                                                                               
                                                                                                                                                                                                                
      if (stocks.length === 0) return;                                                                                                                                                                         
                                                                                                                                                                                                                
      // Price fluctuations simulator                                                                                                                                                                          
      const updatedStocks = stocks.map(stock => {                                                                                                                                                              
        if (Math.random() > 0.3) return stock; // 30% chance of shifting                                                                                                                                       
                                                                                                                                                                                                                
        const pct = (Math.random() - 0.5) * 0.4;                                                                                                                                                               
        const priceChange = stock.price * (pct / 100);                                                                                                                                                         
        const newPrice = Math.max(10, Math.round(stock.price + priceChange));                                                                                                                                  
        const actualChange = Number((((newPrice - stock.prevPrice) / stock.prevPrice) * 100).toFixed(2));                                                                                                      
                                                                                                                                                                                                                
        const newHistory = [...stock.history.slice(1), newPrice];                                                                                                                                              
        const flashDirection = newPrice > stock.price ? 'up' : newPrice < stock.price ? 'down' : null;                                                                                                         
                                                                                                                                                                                                                
        return {                                                                                                                                                                                               
          ...stock,                                                                                                                                                                                            
          price: newPrice,                                                                                                                                                                                     
          change: actualChange,                                                                                                                                                                                
          history: newHistory,                                                                                                                                                                                 
          flashDirection                                                                                                                                                                                       
        };                                                                                                                                                                                                     
      });                                                                                                                                                                                                      
                                                                                                                                                                                                                
      // Update Service Cache                                                                                                                                                                                  
      stockService.cache.data = updatedStocks;                                                                                                                                                                 
                                                                                                                                                                                                                
      // Fluctuate IHSG Index                                                                                                                                                                                  
      const ihsgPct = ihsg.pct + (Math.random() - 0.5) * 0.05;                                                                                                                                                 
      stockService.cache.ihsg.pct = Number(ihsgPct.toFixed(2));                                                                                                                                                
      stockService.cache.ihsg.price = Number((7198.05 * (1 + ihsgPct/100)).toFixed(2));                                                                                                                        
      stockService.cache.ihsg.change = Number((stockService.cache.ihsg.price - 7198.05).toFixed(2));                                                                                                           
                                                                                                                                                                                                                
      // Emit to WebSocket                                                                                                                                                                                     
      this.io.emit('market-update', {                                                                                                                                                                          
        ihsg: stockService.cache.ihsg,                                                                                                                                                                         
        stocks: updatedStocks                                                                                                                                                                                  
      });                                                                                                                                                                                                      
    }, 3000);                                                                                                                                                                                                  
  }   

}

export const socketService = new SocketService();