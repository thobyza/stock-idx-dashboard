import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { StockService, ComparisonTimeframe, IndexComparisonItem } from '../../stock.service';

export interface ChartIndexLine {
  code: string;
  name: string;
  color: string;
  path: string;
  currentPercent: number;
  currentValue: number;
}

export interface GridLine {
  percent: number;
  y: number;
  isZero: boolean;
}

export interface HoverPointItem {
  code: string;
  name: string;
  color: string;
  percent: number;
  value: number;
}

export interface HoverData {
  x: number;
  dateStr: string;
  items: HoverPointItem[];
}

@Component({
  selector: 'app-index-comparison',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './index-comparison.html',
  styleUrl: './index-comparison.css',
})
export class IndexComparison implements OnInit {
  private stockService = inject(StockService);

  readonly timeframes: ComparisonTimeframe[] = ['1D', '1W', '3M', '6M', 'YTD', '1Y', '2Y', '5Y'];
  selectedTimeframe = signal<ComparisonTimeframe>('1D');
  viewMode = signal<'grid' | 'chart'>('grid');

  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  indices = signal<IndexComparisonItem[]>([]);
  sortBy = signal<'performance-desc' | 'performance-asc' | 'name' | 'default'>('performance-desc');

  // Chart configuration & selection
  selectedIndices = signal<string[]>(['IHSG', 'LQ45', 'IDXHIDIV20']);
  hoverData = signal<HoverData | null>(null);

  readonly chartWidth = 860;
  readonly chartHeight = 330;
  readonly chartPadding = { top: 20, right: 65, bottom: 35, left: 15 };

  readonly INDEX_COLORS: Record<string, string> = {
    IHSG: '#3b82f6', // Bright Blue (Benchmark)
    LQ45: '#10b981', // Emerald Green
    KOMPAS100: '#f59e0b', // Amber / Gold
    IDX30: '#8b5cf6', // Purple / Violet
    IDX80: '#06b6d4', // Cyan
    IDXHIDIV20: '#f97316', // Orange
    'IDX-SMCLIQ': '#ec4899', // Pink
    JII: '#14b8a6', // Teal
    JII70: '#6366f1', // Indigo
  };

  private readonly FIVE_YEAR_INDICES = new Set(['IHSG', 'JII', 'LQ45']);

  // Sorted list for the Grid view
  sortedIndices = computed(() => {
    let list = [...this.indices()];

    if (this.selectedTimeframe() === '5Y') {
      list = list.filter((idx) => this.FIVE_YEAR_INDICES.has(idx.code));
    }

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

  // Active indices selected for the chart
  activeChartIndices = computed(() => {
    const selected = new Set(this.selectedIndices());
    return this.indices().filter((i) => {
      if (this.selectedTimeframe() === '5Y' && !this.FIVE_YEAR_INDICES.has(i.code)) {
        return false;
      }
      return selected.has(i.code);
    });
  });

  // Chart Scale & Bounds
  chartScale = computed(() => {
    const active = this.activeChartIndices();
    if (!active.length) {
      return {
        minPercent: -2,
        maxPercent: 2,
        gridLines: [] as GridLine[],
        yForPercent: (p: number) => 165,
        zeroY: 165,
      };
    }

    let min = 0;
    let max = 0;

    for (const idx of active) {
      for (const pt of idx.history) {
        if (pt.percent < min) min = pt.percent;
        if (pt.percent > max) max = pt.percent;
      }
    }

    // Add 15% headroom above and below
    const diff = Math.max(max - min, 1);
    const minPercent = Math.floor(min - diff * 0.12);
    const maxPercent = Math.ceil(max + diff * 0.12);
    const range = maxPercent - minPercent || 1;

    const plotHeight = this.chartHeight - this.chartPadding.top - this.chartPadding.bottom;

    const yForPercent = (p: number) => {
      const clamped = Math.max(minPercent, Math.min(maxPercent, p));
      return (
        this.chartHeight - this.chartPadding.bottom - ((clamped - minPercent) / range) * plotHeight
      );
    };

    const zeroY = yForPercent(0);

    // Generate 5-6 horizontal gridlines
    const step = diff / 5;
    const gridLines: GridLine[] = [];
    for (let p = minPercent; p <= maxPercent; p += Math.max(step, 0.5)) {
      gridLines.push({
        percent: Number(p.toFixed(1)),
        y: yForPercent(p),
        isZero: Math.abs(p) < 0.15,
      });
    }

    // Always include exact zero line
    if (!gridLines.some((g) => g.isZero)) {
      gridLines.push({ percent: 0, y: zeroY, isZero: true });
    }

    return {
      minPercent,
      maxPercent,
      gridLines,
      yForPercent,
      zeroY,
    };
  });

  // Chart Lines
  chartLines = computed<ChartIndexLine[]>(() => {
    const active = this.activeChartIndices();
    const scale = this.chartScale();
    const plotWidth = this.chartWidth - this.chartPadding.left - this.chartPadding.right;

    return active.map((idx) => {
      const history = idx.history;
      const color = this.INDEX_COLORS[idx.code] || '#94a3b8';

      if (!history || history.length < 2) {
        return {
          code: idx.code,
          name: idx.name,
          color,
          path: '',
          currentPercent: idx.changePercent,
          currentValue: idx.price,
        };
      }

      const points = history.map((pt, i) => {
        const x = this.chartPadding.left + (i / (history.length - 1)) * plotWidth;
        const y = scale.yForPercent(pt.percent);
        return { x, y };
      });

      // Construct smooth curve path
      let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        path += ` C ${midX.toFixed(1)} ${prev.y.toFixed(1)}, ${midX.toFixed(1)} ${curr.y.toFixed(1)}, ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
      }

      return {
        code: idx.code,
        name: idx.name,
        color,
        path,
        currentPercent: idx.changePercent,
        currentValue: idx.price,
      };
    });
  });

  // X-Axis Date Labels
  xAxisLabels = computed(() => {
    const active = this.activeChartIndices();
    if (!active.length || !active[0].history || active[0].history.length < 2) return [];

    const history = active[0].history;
    const plotWidth = this.chartWidth - this.chartPadding.left - this.chartPadding.right;
    const numLabels = 5;
    const step = Math.floor((history.length - 1) / (numLabels - 1));

    const labels = [];
    for (let i = 0; i < history.length; i += step) {
      const x = this.chartPadding.left + (i / (history.length - 1)) * plotWidth;
      const rawDate = history[i].date;
      const formatted = this.formatDateLabel(rawDate, this.selectedTimeframe());
      labels.push({ x, text: formatted });
    }

    return labels;
  });

  ngOnInit(): void {
    this.loadData(this.selectedTimeframe());
  }

  setViewMode(mode: 'grid' | 'chart'): void {
    this.viewMode.set(mode);
  }

  setTimeframe(tf: ComparisonTimeframe): void {
    if (this.selectedTimeframe() === tf) return;
    this.selectedTimeframe.set(tf);
    this.loadData(tf);
  }

  setSortBy(sort: 'performance-desc' | 'performance-asc' | 'name' | 'default'): void {
    this.sortBy.set(sort);
  }

  toggleIndexSelection(code: string): void {
    this.selectedIndices.update((current) => {
      if (current.includes(code)) {
        if (current.length === 1) return current; // Keep at least one
        return current.filter((c) => c !== code);
      } else {
        return [...current, code];
      }
    });
  }

  selectAllIndices(): void {
    this.selectedIndices.set(this.indices().map((i) => i.code));
  }

  selectDefaultIndices(): void {
    this.selectedIndices.set(['IHSG', 'LQ45', 'IDXHIDIV20']);
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

  // Mouse Crosshair Interaction
  onChartMouseMove(event: MouseEvent): void {
    const active = this.activeChartIndices();
    if (!active.length || !active[0].history || active[0].history.length < 2) return;

    const svg = (event.currentTarget as SVGElement).getBoundingClientRect();
    const mouseX = event.clientX - svg.left;
    const ratio = mouseX / svg.width;
    const svgX = ratio * this.chartWidth;

    const plotWidth = this.chartWidth - this.chartPadding.left - this.chartPadding.right;
    const clampedX = Math.max(
      this.chartPadding.left,
      Math.min(this.chartWidth - this.chartPadding.right, svgX),
    );
    const normalized = (clampedX - this.chartPadding.left) / plotWidth;

    const historyLen = active[0].history.length;
    const ptIndex = Math.min(
      historyLen - 1,
      Math.max(0, Math.round(normalized * (historyLen - 1))),
    );

    const targetDate = active[0].history[ptIndex]?.date || '';
    const dateStr = this.formatDateTooltip(targetDate, this.selectedTimeframe());

    const items: HoverPointItem[] = active.map((idx) => {
      const pt = idx.history[ptIndex] || idx.history[idx.history.length - 1];
      return {
        code: idx.code,
        name: idx.name,
        color: this.INDEX_COLORS[idx.code] || '#94a3b8',
        percent: pt ? pt.percent : idx.changePercent,
        value: pt ? pt.value : idx.price,
      };
    });

    items.sort((a, b) => b.percent - a.percent);

    this.hoverData.set({
      x: clampedX,
      dateStr,
      items,
    });
  }

  onChartMouseLeave(): void {
    this.hoverData.set(null);
  }

  // SVG Sparkline helpers for Grid View
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

  private formatDateLabel(dateStr: string, timeframe: ComparisonTimeframe): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    if (timeframe === '1D') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (timeframe === '1W') {
      return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', hour12: false });
    }
    if (timeframe === '3M' || timeframe === '6M' || timeframe === 'YTD' || timeframe === '1Y') {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    // 2Y and 5Y
    return d.toLocaleDateString([], { month: 'short', year: '2-digit' });
  }

  private formatDateTooltip(dateStr: string, timeframe: ComparisonTimeframe): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';

    if (timeframe === '1D') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (timeframe === '1W') {
      return `${d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
