import { Component, input, output, inject } from '@angular/core';
import { IndexData } from '../../stock.service';
import { ThemeService } from '../../theme.service';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { LucideTrendingUp, LucideTextAlignStart, LucideLayoutGrid, LucideWorkflow, 
   LucideSun, LucideMoon, LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

@Component({
  selector: 'app-sector-sidebar',
  imports: [
    NgClass,
    DecimalPipe,
    DatePipe,
    LucideTrendingUp,
    LucideTextAlignStart,
    LucideLayoutGrid,
    LucideWorkflow,
    LucideSun,
    LucideMoon,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './sector-sidebar.html',
  styleUrl: './sector-sidebar.css',
})
export class SectorSidebar {
  readonly themeService = inject(ThemeService);

  ihsg = input.required<IndexData>();
  advancing = input.required<number>();
  unchanged = input.required<number>();
  declining = input.required<number>();
  total = input.required<number>();
  selectedDate = input<string>(new Date().toISOString().split('T')[0]);

  collapsed = input<boolean>(false);
  toggleCollapse = output<void>();

  activePage = input<'dashboard' | 'news' | 'calendar' | 'movers' | 'index'>('dashboard');
  pageSelected = output<'dashboard' | 'news' | 'calendar' | 'movers' | 'index'>();

  getBasePrice(): number | undefined {
    const data = this.ihsg();
    if (!data || data.price == null) return undefined;
    if (data.change != null) {
      return Number((data.price - data.change).toFixed(2));
    }
    return data.open;
  }

  getZeroLineY(history?: number[], basePrice?: number, height = 32): number | null {
    if (!history || history.length < 2 || basePrice == null || isNaN(basePrice)) return null;
    const prices = [...history, basePrice];
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = 2;
    const h = height - padding * 2;
    const y = height - padding - ((basePrice - min) / range) * h;
    return Number(y.toFixed(1));
  }

  getSparklineLine(history?: number[], width = 180, height = 32, basePrice?: number): string {
    if (!history || history.length < 2) return '';
    const prices = basePrice != null && !isNaN(basePrice) ? [...history, basePrice] : history;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const padding = 2;
    const h = height - padding * 2;

    return history
      .map((price, idx) => {
        const x = (idx / (history.length - 1)) * width;
        const y = height - padding - ((price - min) / range) * h;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  getSparklineArea(history?: number[], width = 180, height = 32, basePrice?: number): string {
    if (!history || history.length < 2) return '';
    const linePath = this.getSparklineLine(history, width, height, basePrice);
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  }

  onSelectPage(page: 'dashboard' | 'news' | 'calendar' | 'movers' | 'index') {
    this.pageSelected.emit(page);
  }

  onToggle() {
    this.toggleCollapse.emit();
  }
}  
