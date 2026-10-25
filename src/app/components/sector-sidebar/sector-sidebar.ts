import { Component, input, output } from '@angular/core';
import { IndexData } from '../../stock.service';
import { DecimalPipe, DatePipe } from '@angular/common';
import { LucideTrendingUp, LucideTextAlignStart, LucideLayoutGrid, LucideWorkflow, LucideArrowRight, LucideArrowLeft } from '@lucide/angular';

@Component({
  selector: 'app-sector-sidebar',
  imports: [DecimalPipe, DatePipe, LucideTrendingUp, LucideTextAlignStart, LucideLayoutGrid, LucideWorkflow, LucideArrowRight, LucideArrowLeft],
  templateUrl: './sector-sidebar.html',
  styleUrl: './sector-sidebar.css',
})
export class SectorSidebar {
  ihsg = input.required<IndexData>();
  advancing = input.required<number>();
  unchanged = input.required<number>();
  declining = input.required<number>();
  total = input.required<number>();
  selectedDate = input<string>(new Date().toISOString().split('T')[0]);

  collapsed = input<boolean>(false);
  toggleCollapse = output<void>();

  activePage = input<'dashboard' | 'news' | 'calendar' | 'movers'>('dashboard'); 
  pageSelected = output<'dashboard' | 'news' | 'calendar' | 'movers'>();

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

  onSelectPage(page: 'dashboard' | 'news' | 'calendar' | 'movers') {                                                                                                                                                                     
    this.pageSelected.emit(page);                                                                                                                                                                                
  } 

  onToggle() {
    this.toggleCollapse.emit();
  }
}  
