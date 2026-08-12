import { Component, inject, input, output, signal } from '@angular/core';
import { StockService, IndexData } from '../../stock.service';
import { DecimalPipe, SlicePipe } from '@angular/common';

export interface SectorPerf {                                                              
  sector: string;                                                                          
  avgChange: number;                                                                       
  count: number;                                                                           
  advancing: number;                                                                       
  declining: number;                                                                       
}                                                                                          

@Component({
  selector: 'app-sector-sidebar',
  imports: [ DecimalPipe, SlicePipe ],
  templateUrl: './sector-sidebar.html',
  styleUrl: './sector-sidebar.css',
})


export class SectorSidebar {      
  private readonly stockService = inject(StockService);
  readonly stocks = this.stockService.stocks;

  ihsg = input.required<IndexData>();         
  selectedIndex = input.required<string>();

  sectors = input.required<SectorPerf[]>();                                                
  selectedSector = input.required<string>();                                               
  totalStocksCount = input.required<number>();                                             
                                                                                            
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

}  

