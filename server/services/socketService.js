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
                                                                                                                                                                              
      // Periodically fetch & broadcast pure Yahoo Finance data                                                                                                             
      this.broadcastInterval = setInterval(async () => {                                                                                                                    
        let { stocks, ihsg } = await stockService.getStocksData();                                                                                                          
                                                                                                                                                                            
        if (stocks.length === 0) return;                                                                                                                                    
                                                                                                                                                                            
        this.io.emit('market-update', {                                                                                                                                     
          ihsg,                                                                                                                                                             
          stocks                                                                                                                                                            
        });                                                                                                                                                                 
      }, 60000); // Broadcasts every 60 seconds (or set duration as desired)                                                                                                                                                                                           
  }   

}

export const socketService = new SocketService();