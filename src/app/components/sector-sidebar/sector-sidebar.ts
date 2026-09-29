import { Component, inject, input, output, signal } from '@angular/core';
import { StockService, IndexData } from '../../stock.service';
import { DecimalPipe, SlicePipe, DatePipe } from '@angular/common';

export interface SectorPerf {                                                              
  sector: string;                                                                          
  avgChange: number;                                                                       
  count: number;                                                                           
  advancing: number;                                                                       
  declining: number;                                                                       
}                                                                                          

@Component({
  selector: 'app-sector-sidebar',
  imports: [ DecimalPipe, SlicePipe, DatePipe ],
  templateUrl: './sector-sidebar.html',
  styleUrl: './sector-sidebar.css',
})


export class SectorSidebar {      
  private readonly stockService = inject(StockService);
  readonly stocks = this.stockService.stocks;

  ihsg = input.required<IndexData>();         
  advancing = input.required<number>();                                                    
  unchanged = input.required<number>();                                                    
  declining = input.required<number>();                                                    
  total = input.required<number>();    

  selectedIndex = input.required<string>();

  sectors = input.required<SectorPerf[]>();                                                
  selectedSector = input.required<string>();                                               
  totalStocksCount = input.required<number>();                                             
                                        
  selectedDate = input<string>(new Date().toISOString().split('T')[0])
  sectorSelected = output<string>();         
  indexSelected = output<string>();        
  
  onSelectSector(sector: string) {                                                         
    this.sectorSelected.emit(sector);                                                      
  }                                           
  
  selectIndex(index: string) {
    this.indexSelected.emit(index); // 👈 Emit selected index to parent component 
  }

  // Helper method to count stocks belonging to a specific index  
  getIndexCount(index: string): number {
    return this.stocks().filter(s => s.indices.includes(index)).length;
  }

  getSparklinePoints(history?: number[]): string {                                                                                                                                                               
    if (!history || history.length < 2) return '';                                                                                                                                                               
    const min = Math.min(...history);                                                                                                                                                                            
    const max = Math.max(...history);                                                                                                                                                                            
    const range = max - min || 1;                                                                                                                                                                                
    const width = 180;                                                                                                                                                                                           
    const height = 36;                                                                                                                                                                                           
                                                                                                                                                                                                                  
    return history                                                                                                                                                                                               
      .map((price, idx) => {                                                                                                                                                                                     
        const x = (idx / (history.length - 1)) * width;                                                                                                                                                          
        const y = height - ((price - min) / range) * height;                                                                                                                                                     
        return `${x.toFixed(1)},${y.toFixed(1)}`;                                                                                                                                                                
      })                                                                                                                                                                                                         
      .join(' ');                                                                                                                                                                                                
  }     

}  

