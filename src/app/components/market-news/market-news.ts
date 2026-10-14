import { Component, inject, signal, OnInit } from '@angular/core';
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
