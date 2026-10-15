import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { StockService, NewsArticle } from '../../stock.service';

@Component({
  selector: 'app-market-news',
  imports: [DatePipe, NgClass],
  templateUrl: './market-news.html',
  styleUrl: './market-news.css',
})
export class MarketNews implements OnInit {
  private stockService = inject(StockService);

  articles = signal<NewsArticle[]>([]);
  isLoading = signal<boolean>(true);
  hasError = signal<boolean>(false);

  // ── Pagination ────────────────────────────────────────────────
  readonly pageSize = 12;
  currentPage = signal<number>(1);

  totalPages = computed(() => Math.max(1, Math.ceil(this.articles().length / this.pageSize)));

  pagedArticles = computed<NewsArticle[]>(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.articles().slice(start, start + this.pageSize);
  });

  pageNumbers = computed<number[]>(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    // Always show first, last and a window around current
    const pages = new Set<number>([1, total, current]);
    if (current - 1 > 1) pages.add(current - 1);
    if (current + 1 < total) pages.add(current + 1);

    return Array.from(pages).sort((a, b) => a - b);
  });

  ngOnInit() {
    this.stockService.getNews().subscribe({
      next: (data) => {
        this.articles.set(data.articles);
        this.isLoading.set(false);
      },
      error: () => {
        this.hasError.set(true);
        this.isLoading.set(false);
      }
    });
  }

  goToPage(page: number): void {
    const clamped = Math.max(1, Math.min(page, this.totalPages()));
    this.currentPage.set(clamped);
  }

  prevPage(): void { this.goToPage(this.currentPage() - 1); }
  nextPage(): void { this.goToPage(this.currentPage() + 1); }

  timeAgo(isoString: string): string {
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
  }
}
