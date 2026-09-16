import { Component, input, output } from '@angular/core';                                                                                                                                                    
import { DecimalPipe } from '@angular/common';                                                                                                                                                               
import { Stock } from '../../stock.service';                                                                                                                                                                 
import { HeatmapGrid } from '../heatmap-grid/heatmap-grid'; 

export interface SectorPerformance {                                                                                                                                                                         
  sector: string;                                                                                                                                                                                            
  avgChange: number;                                                                                                                                                                                         
  count: number;                                                                                                                                                                                             
  advancing: number;                                                                                                                                                                                         
  declining: number;                                                                                                                                                                                         
}  

@Component({
  selector: 'app-heatmap-board',
  imports: [HeatmapGrid, DecimalPipe],
  templateUrl: './heatmap-board.html',
  styleUrl: './heatmap-board.css',
})

export class HeatmapBoard {
  // Inputs                                                                                                                                                                                                  
  searchQuery = input<string>('');    
  selectedDate = input<string>(new Date().toISOString().split('T')[0]);                                                                                                                                                                       
  viewMode = input<'grid' | 'list' | 'sectors'>('grid');                                                                                                                                                     
  sortBy = input<'change' | 'change1w' | 'symbol' | 'price' | 'marketCap'>('change');                                                                                                                                     
  filteredStocks = input.required<Stock[]>();                                                                                                                                                                
  sectorPerformances = input.required<SectorPerformance[]>();  

  // Outputs / Event Emitters                                                                                                                                                                                
  searchQueryChange = output<string>();   
  dateChange = output<string>();                                                                                                                                               
  viewModeChange = output<'grid' | 'list' | 'sectors'>();                                                                                                                                                    
  sortByChange = output<'change' | 'change1w' | 'symbol' | 'price' | 'marketCap'>();                                                                                                                                      
  sectorSelected = output<string>();

  // ..                                                                                                                                                                         
  readonly maxDate = new Date().toISOString().split('T')[0];

  onSearchInput(event: Event) {                                                                                                                                                                              
    const target = event.target as HTMLInputElement;                                                                                                                                                         
    this.searchQueryChange.emit(target.value);                                                                                                                                                               
  }      
  
  onDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.dateChange.emit(target.value);
  }
                                                                                                                                                                                                              
  setViewMode(mode: 'grid' | 'list' | 'sectors') {                                                                                                                                                           
    this.viewModeChange.emit(mode);                                                                                                                                                                          
  }                                                                                                                                                                                                          
                                                                                                                                                                                                              
  setSortBy(field: 'change' | 'change1w' | 'symbol' | 'price' | 'marketCap') {                                                                                                                                            
    this.sortByChange.emit(field);                                                                                                                                                                           
  }                                                                                                                                                                                                          
                                                                                                                                                                                                              
  onSelectSector(sector: string) {                                                                                                                                                                           
    this.sectorSelected.emit(sector);                                                                                                                                                                        
  }                                                                                                                                                                                                          
                                                                                                                                                                                                              
  getSparklinePoints(history: number[]): string {                                                                                                                                                            
    if (!history || history.length === 0) return '';                                                                                                                                                         
    const min = Math.min(...history);                                                                                                                                                                        
    const max = Math.max(...history);                                                                                                                                                                        
    const range = max - min || 1;                                                                                                                                                                            
    const width = 120;                                                                                                                                                                                       
    const height = 40;                                                                                                                                                                                       
                                                                                                                                                                                                              
    return history                                                                                                                                                                                           
      .map((price, idx) => {                                                                                                                                                                                 
        const x = (idx / (history.length - 1)) * width;                                                                                                                                                      
        const y = height - ((price - min) / range) * height;                                                                                                                                                 
        return `${x.toFixed(1)},${y.toFixed(1)}`;                                                                                                                                                            
      })                                                                                                                                                                                                     
      .join(' ');                                                                                                                                                                                            
  }                

  get52WeekPosition(price: number, low?: number, high?: number): number {                                                                                                                                    
    if (!low || !high || high === low) return 50;                                                                                                                                                            
    const pct = ((price - low) / (high - low)) * 100;                                                                                                                                                        
    return Math.max(0, Math.min(100, Math.round(pct)));                                                                                                                                                      
  }      



}
