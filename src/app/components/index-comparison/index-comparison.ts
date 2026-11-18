import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { StockService, ComparisonTimeframe, IndexComparisonItem } from '../../stock.service';

@Component({
  selector: 'app-index-comparison',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './index-comparison.html',
  styleUrl: './index-comparison.css',
})
export class IndexComparison implements OnInit {
  private stockService = inject(StockService);

  readonly timeframes: ComparisonTimeframe[] = ['1D', '1W', '3M', 'YTD', '1Y', '3Y', '5Y'];
  selectedTimeframe = signal<ComparisonTimeframe>('1D');
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  indices = signal<IndexComparisonItem[]>([]);
  sortBy = signal<'performance-desc' | 'performance-asc' | 'name' | 'default'>('performance-desc');

  // Sorted list based on active sort option
  sortedIndices = computed(() => {
    const list = [...this.indices()];
    switch (this.sortBy()) {
      case 'performance-desc':
        return list.sort((a, b) => b.changePercent - a.changePercent);
      case 'performance-asc':
        return list.sort((a, b) => a.changePercent - b.changePercent);
      case 'name':
        return list.sort((a, b) => a.code.localeCompare(b.code));
      case 'default':
      default:
        return list;
    }
  });

  ngOnInit(): void {
    this.loadData(this.selectedTimeframe());
  }

  setTimeframe(tf: ComparisonTimeframe): void {
    if (this.selectedTimeframe() === tf) return;
    this.selectedTimeframe.set(tf);
    this.loadData(tf);
  }

  setSortBy(sort: 'performance-desc' | 'performance-asc' | 'name' | 'default'): void {
    this.sortBy.set(sort);
  }

  loadData(timeframe: ComparisonTimeframe): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.stockService.getIndexComparison(timeframe).subscribe({
      next: (res) => {
        this.indices.set(res.indices || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load index comparison data:', err);
        this.errorMessage.set('Failed to load indices data. Please try again.');
        this.isLoading.set(false);
      },
    });
  }

  // SVG Sparkline helpers
  getSparklineLine(points: number[], width = 120, height = 34): string {
    if (!points || points.length < 2) return '';
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const padding = 2;
    const h = height - padding * 2;

    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - padding - ((p - min) / range) * h;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  getSparklineArea(points: number[], width = 120, height = 34): string {
    if (!points || points.length < 2) return '';
    const linePath = this.getSparklineLine(points, width, height);
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  }
}
