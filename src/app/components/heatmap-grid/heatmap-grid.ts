import { Component, input, output } from '@angular/core';                                                                                                                                                      
import { Stock } from '../../stock.service';                                                                                                                                                                   
import { DecimalPipe } from '@angular/common';                                                                                                                                                                 
                                                                                                                                                                                                                
@Component({                                                                                                                                                                                                   
  selector: 'app-heatmap-grid',                                                                                                                                                                                
  imports: [DecimalPipe],                                                                                                                                                                                      
  templateUrl: './heatmap-grid.html',                                                                                                                                                                          
  styleUrl: './heatmap-grid.css',                                                                                                                                                                              
})                                                                                                                                                                                                             
export class HeatmapGrid {                                                                                                                                                                                     
  stocks = input.required<Stock[]>();                                                                                                                                                                          
  selectedStockSymbol = input<string | null>(null);                                                                                                                                                            
                                                                                                                                                                                                                
  stockSelected = output<string>();                                                                                                                                                                            
                                                                                                                                                                                                                
  onSelectStock(symbol: string) {                                                                                                                                                                              
    this.stockSelected.emit(symbol);                                                                                                                                                                           
  }                                                                                                                                                                                                            
                                                                                                                                                                                                                
  getHeatClass(change: number): string {                                                                                                                                                                                                                                                                                                       
    // if (change >= 3.0) return 'border-emerald-500';                                                                                                                                                              
    // if (change >= 1.5) return 'border-emerald-600';                                                                                                                                                              
    // if (change > 0.05) return 'border-emerald-900';                                                                                                                                                              
    // if (change >= -0.05) return 'border-slate-700';                                                                                                                                                              
    // if (change > -1.5) return 'border-rose-900';                                                                                                                                                                 
    // if (change > -3.0) return 'border-rose-600';                                                                                                                                                                 
    // return 'border-rose-500';    
    
    if (this.selectedStockSymbol() === null) return 'border';                                                                                                                                                                
    return 'border'; 
  }                
  
  getHeatStyle(change: number): string {
    // const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));                                                                                                                  
    // const intensity = clamp(Math.abs(change) / 5, 0, 1); // 0% to 100% at ±5% 

    // if (change > 0.05) {                                                                                                                                                                                                                                                                                                                                                   
    //   const r = Math.round(2 + intensity * 4);                                                                                                                                                                   
    //   const g = Math.round(20 + intensity * 100);                                                                                                                                                                
    //   const b = Math.round(2 + intensity * 30);                                                                                                                                                                  
    //   return `background-color: rgb(${r}, ${g}, ${b});`;                                                                                                                                                         
    // } else if (change < -0.05) {                                                                                                                                                                                                                                                                                                                                     
    //   const r = Math.round(20 + intensity * 140);                                                                                                                                                                
    //   const g = Math.round(2 + intensity * 10);                                                                                                                                                                  
    //   const b = Math.round(2 + intensity * 20);                                                                                                                                                                  
    //   return `background-color: rgb(${r}, ${g}, ${b});`;                                                                                                                                                         
    // } else {                                                                                                                                                                                                                                                                                                                                                                          
    //   return `background-color: rgb(30, 32, 40);`;                                                                                                                                                               
    // }   

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));                                                                                                                              
    const intensity = clamp(Math.abs(change) / 5, 0, 1); // 0% to 100% scale at ±5% change                                                                                                                                   
                                                                                                                                                                                                                              
    if (change > 0.05) {                                                                                                                                                                                                     
      // Positive: Soft pastel green background with high-contrast dark green text                                                                                                                                           
      const alpha = 0.08 + intensity * 0.72; // rgba opacity range                                                                                                                                                           
      const textColor = 'rgb(6, 95, 70)'; // emerald-800                                                                                                                                                                     
      const borderColor = `rgba(16, 185, 129, ${0.15 + intensity * 0.35})`;                                                                                                                                                  
      return `background-color: rgba(16, 185, 129, ${alpha}); color: ${textColor}; border-color: ${borderColor};`;                                                                                                           
    } else if (change < -0.05) {                                                                                                                                                                                             
      // Negative: Soft pastel red background with high-contrast dark red text                                                                                                                                               
      const alpha = 0.08 + intensity * 0.72;                                                                                                                                                                                 
      const textColor = 'rgb(185, 28, 28)'; // red-700                                                                                                                                                                       
      const borderColor = `rgba(239, 68, 68, ${0.15 + intensity * 0.35})`;                                                                                                                                                   
      return `background-color: rgba(239, 68, 68, ${alpha}); color: ${textColor}; border-color: ${borderColor};`;                                                                                                            
    } else {                                                                                                                                                                                                                 
      // Flat/Unchanged: Muted light slate background with slate-600 text                                                                                                                                                    
      return `background-color: rgb(241, 245, 249); color: rgb(71, 85, 105); border-color: rgb(226, 232, 240);`;                                                                                                             
    }     
  }


}                                                                                                                                                                                                              
          