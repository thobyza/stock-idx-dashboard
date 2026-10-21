import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { StockService, CorporateAction, CorporateActionType } from '../../stock.service';

@Component({
  selector: 'app-corporate-actions',
  imports: [DecimalPipe, DatePipe, NgClass],
  templateUrl: './corporate-actions.html',
  styleUrl: './corporate-actions.css',
})
export class CorporateActions implements OnInit {
  private readonly stockService = inject(StockService);

  actions = signal<CorporateAction[]>([]);
  isLoading = signal<boolean>(true);

  // Filters
  searchQuery = signal<string>('');
  selectedType = signal<'ALL' | CorporateActionType>('ALL');

  // Pagination
  readonly pageSize = 6;
  currentPage = signal<number>(1);

  // KPI Metrics
  stats = computed(() => {
    const list = this.actions();
    const dividends = list.filter((a) => a.type === 'DIVIDEND');
    const rups = list.filter((a) => a.type === 'RUPS');
    const splits = list.filter((a) => a.type === 'STOCK_SPLIT' || a.type === 'RIGHTS_ISSUE');

    const totalYield = dividends.reduce((sum, d) => sum + (d.dividendYield || 0), 0);
    const avgYield = dividends.length > 0 ? (totalYield / dividends.length).toFixed(1) : '0';

    return {
      total: list.length,
      dividendCount: dividends.length,
      avgYield,
      rupsCount: rups.length,
      splitsCount: splits.length,
    };
  });

  filteredActions = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const type = this.selectedType();

    return this.actions().filter((item) => {
      const matchesType = type === 'ALL' || item.type === type;
      const matchesQuery =
        !query ||
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query);
      return matchesType && matchesQuery;
    });
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredActions().length / this.pageSize))
  );

  pagedActions = computed<CorporateAction[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredActions().slice(start, start + this.pageSize);
  });

  pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set<number>([1, total, current]);
    if (current - 1 > 1) pages.add(current - 1);
    if (current + 1 < total) pages.add(current + 1);

    return Array.from(pages).sort((a, b) => a - b);
  });

  ngOnInit() {
    this.stockService.getCorporateActions().subscribe({
      next: (data) => {
        this.actions.set(data.actions);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
    this.currentPage.set(1);
  }

  setType(type: 'ALL' | CorporateActionType) {
    this.selectedType.set(type);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
  }

  prevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  getTypeLabel(type: CorporateActionType): string {
    switch (type) {
      case 'DIVIDEND':
        return 'Cash Dividend';
      case 'RUPS':
        return 'RUPS / AGM';
      case 'STOCK_SPLIT':
        return 'Stock Split';
      case 'RIGHTS_ISSUE':
        return 'Rights Issue';
    }
  }

  getTypeBadgeClass(type: CorporateActionType): string {
    switch (type) {
      case 'DIVIDEND':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'RUPS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'STOCK_SPLIT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RIGHTS_ISSUE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  daysUntil(dateStr?: string): string {
    if (!dateStr) return '';
    const target = new Date(dateStr).getTime();
    const today = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `in ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)}d ago`;
  }
}
