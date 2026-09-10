import { Injectable, signal, NgZone } from '@angular/core';                                                                                                                                                    
import { HttpClient } from '@angular/common/http';                                                                                                                                                             
import { io, Socket } from 'socket.io-client';                                                                                                                                                                 
import { Observable } from 'rxjs';      

export interface Stock {
  symbol: string;                                                                                                                                                                                              
  name: string;                                                                                                                                                                                                
  sector: string;                                                                                                                                                                                              
  indices: string[];                                                                                                                                                                                           
  price: number;                                                                                                                                                                                               
  change: number;                                                                                                                                                                                              
  prevPrice: number;                                                                                                                                                                                           
  volume: number;                                                                                                                                                                                              
  marketCap: number;                                                                                                                                                                                           
  history: number[];                                                                                                                                                                                           
  flashDirection?: 'up' | 'down' | null;
}

export interface IndexData {
  price: number;                                                                                                                                                                                               
  change: number;                                                                                                                                                                                              
  pct: number;   
}

@Injectable({
  providedIn: 'root'
})

export class StockService {
  private apiUrl = 'http://localhost:3000/api';                                                                                                                                                                
  private socket!: Socket; 
                                                                                                                                                                                                   
  stocks = signal<Stock[]>([]);                                                                                                                                                                                
  ihsg = signal<IndexData>({ price: 7230.45, change: 32.40, pct: 0.45 });                                                                                                                                      
  isLive = signal<boolean>(false); 

  currentSelectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  constructor(private http: HttpClient, private ngZone: NgZone) {                                                                                                                                              
    this.fetchInitialData();                                                                                                                                                                                   
    this.connectWebSocket();                                                                                                                                                                                   
  }

  private fetchInitialData() {                                                                                                                                                                                 
    this.http.get<{ ihsg: IndexData; stocks: Stock[] }>(`${this.apiUrl}/stocks`)                                                                                                                               
      .subscribe({                                                                                                                                                                                             
        next: (data) => {                                                                                                                                                                                      
          this.stocks.set(data.stocks);                                                                                                                                                                        
          this.ihsg.set(data.ihsg);                                                                                                                                                                            
        },                                                                                                                                                                                                     
        error: (err) => console.error('Failed to load initial stock data:', err)                                                                                                                               
      });                                                                                                                                                                                                      
  }

  private connectWebSocket() {                                                                                                                                                                               
    this.socket = io('http://localhost:3000');                                                                                                                                                               
                                                                                                                                                                                                              
    this.socket.on('connect', () => {                                                                                                                                                                        
      this.ngZone.run(() => this.isLive.set(true));                                                                                                                                                          
      console.log('Connected to Stock Live Feed Server.');                                                                                                                                                   
    });                                                                                                                                                                                                      
                                                                                                                                                                                                              
    this.socket.on('disconnect', () => {                                                                                                                                                                     
      this.ngZone.run(() => this.isLive.set(false));                                                                                                                                                         
      console.log('Disconnected from Stock Live Feed.');                                                                                                                                                     
    });                                                                                                                                                                                                      
                                                                                                                                                                                                              
    this.socket.on('market-update', (data: { ihsg: IndexData; stocks: Stock[] }) => {                                                                                                                        
      const todayStr = new Date().toISOString().split('T')[0];                                                                                                                                               
                                                                                                                                                                                                              
      // 👈 Only apply live WebSocket updates if user is viewing TODAY'S date                                                                                                                                
      if (this.currentSelectedDate() === todayStr) {                                                                                                                                                         
        this.ngZone.run(() => {                                                                                                                                                                              
          this.stocks.set(data.stocks);                                                                                                                                                                      
          this.ihsg.set(data.ihsg);                                                                                                                                                                          
        });                                                                                                                                                                                                  
      }                                                                                                                                                                                                      
    });                                                                                                                                                                                                      
  }                                                                                                                                                                                                              
    
  getHistory(symbol: string): Observable<{ date: string; close: number; volume: number }[]> {                                                                                                                  
    return this.http.get<{ date: string; close: number; volume: number }[]>(                                                                                                                                 
      `${this.apiUrl}/stocks/${symbol}/history`                                                                                                                                                              
    );     
  }  

  fetchStocksByDate(date: string) {                                                                                                                                                                          
    this.http.get<{ ihsg: IndexData; stocks: Stock[] }>(`${this.apiUrl}/stocks?date=${date}`)                                                                                                                
      .subscribe({                                                                                                                                                                                           
        next: (data) => {                                                                                                                                                                                    
          this.stocks.set(data.stocks);                                                                                                                                                                      
          this.ihsg.set(data.ihsg);                                                                                                                                                                          
        },                                                                                                                                                                                                   
        error: (err) => console.error('Failed to load stock data for date:', err)                                                                                                                            
      });                                                                                                                                                                                                    
  } 

}



