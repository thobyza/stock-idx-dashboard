import { Component, input, signal, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Stock } from '../../stock.service';

export type MoverCategory = 'gainers' | 'losers' | 'turnover' | 'volume' | '52w-high' | '52w-low';

@Component({
  selector: 'app-market-movers',
  imports: [DecimalPipe],
  templateUrl: './market-movers.html',
  styleUrl: './market-movers.css',
})
export class MarketMovers {
  stocks = input.required<Stock[]>();

  // Filter & tab states
  selectedCategory = signal<MoverCategory>('gainers');
  timeframe = signal<'1D' | '1W'>('1D');
  selectedIndex = signal<string>('All');
  selectedSector = signal<string>('All');
  marketCapTier = signal<'ALL' | 'LARGE' | 'MID' | 'SMALL'>('ALL');
  searchQuery = signal<string>('');

  readonly indicesList: string[] = ['All', 'KOMPAS100', 'LQ45', 'IDX80', 'JII', 'JII70', 'ISSI'];

  sectorsList = computed<string[]>(() => {
    const sectors = new Set<string>();
    this.stocks().forEach((s) => {
      if (s.sector) sectors.add(s.sector);
    });
    return ['All', ...Array.from(sectors).sort()];
  });

  // KPI Highlights derived from full stock universe
  kpiStats = computed(() => {
    const list = this.stocks();
    if (!list || list.length === 0) return null;

    const sortedByChange = [...list].sort((a, b) => b.change - a.change);
    const topGainer = sortedByChange[0];
    const topLoser = sortedByChange[sortedByChange.length - 1];

    const sortedByTurnover = [...list].sort((a, b) => (b.price * b.volume) - (a.price * a.volume));
    const topTurnover = sortedByTurnover[0];

    const near52wHigh = list.filter((s) => {
      if (!s.fiftyTwoWeekHigh) return false;
      return s.price >= s.fiftyTwoWeekHigh * 0.96;
    }).length;

    return {
      topGainer,
      topLoser,
      topTurnover,
      near52wHighCount: near52wHigh,
    };
  });

  // Base filtered stocks
  filteredBaseStocks = computed(() => {
    let list = this.stocks();
    const index = this.selectedIndex();
    const sector = this.selectedSector();
    const capTier = this.marketCapTier();
    const query = this.searchQuery().toLowerCase().trim();

    // 1. Index filter
    if (index !== 'All') {
      list = list.filter((s) => s.indices && s.indices.includes(index));
    }

    // 2. Sector filter
    if (sector !== 'All') {
      list = list.filter((s) => s.sector === sector);
    }

    // 3. Market Cap Tier filter (>50T, 10-50T, <10T)
    if (capTier === 'LARGE') {
      list = list.filter((s) => s.marketCap >= 50e12);
    } else if (capTier === 'MID') {
      list = list.filter((s) => s.marketCap >= 10e12 && s.marketCap < 50e12);
    } else if (capTier === 'SMALL') {
      list = list.filter((s) => s.marketCap < 10e12);
    }

    // 4. Search query
    if (query) {
      list = list.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query)
      );
    }

    return list;
  });

  // Final ranked movers list
  rankedStocks = computed(() => {
    const base = [...this.filteredBaseStocks()];
    const category = this.selectedCategory();
    const tf = this.timeframe();

    switch (category) {
      case 'gainers':
        return base.sort((a, b) => {
          const valA = tf === '1D' ? a.change : (a.change1w || 0);
          const valB = tf === '1D' ? b.change : (b.change1w || 0);
          return valB - valA;
        });

      case 'losers':
        return base.sort((a, b) => {
          const valA = tf === '1D' ? a.change : (a.change1w || 0);
          const valB = tf === '1D' ? b.change : (b.change1w || 0);
          return valA - valB;
        });

      case 'turnover':
        return base.sort((a, b) => (b.price * b.volume) - (a.price * a.volume));

      case 'volume':
        return base.sort((a, b) => b.volume - a.volume);

      case '52w-high':
        return base
          .filter((s) => s.fiftyTwoWeekHigh && s.fiftyTwoWeekHigh > 0)
          .map((s) => ({
            stock: s,
            diffPct: ((s.fiftyTwoWeekHigh! - s.price) / s.fiftyTwoWeekHigh!) * 100,
          }))
          .sort((a, b) => a.diffPct - b.diffPct)
          .map((item) => item.stock);

      case '52w-low':
        return base
          .filter((s) => s.fiftyTwoWeekLow && s.fiftyTwoWeekLow > 0)
          .map((s) => ({
            stock: s,
            diffPct: ((s.price - s.fiftyTwoWeekLow!) / s.fiftyTwoWeekLow!) * 100,
          }))
          .sort((a, b) => a.diffPct - b.diffPct)
          .map((item) => item.stock);
    }
  });

  setCategory(category: MoverCategory) {
    this.selectedCategory.set(category);
  }

  setTimeframe(tf: '1D' | '1W') {
    this.timeframe.set(tf);
  }

  setIndex(idx: string) {
    this.selectedIndex.set(idx);
  }

  setSector(sector: string) {
    this.selectedSector.set(sector);
  }

  setCapTier(tier: 'ALL' | 'LARGE' | 'MID' | 'SMALL') {
    this.marketCapTier.set(tier);
  }

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery.set(target.value);
  }

  get52WeekPosition(price: number, low?: number, high?: number): number {
    if (!low || !high || high === low) return 50;
    const pct = ((price - low) / (high - low)) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  formatTurnover(stock: Stock): string {
    const val = stock.price * stock.volume;
    if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
    if (val >= 1e9)  return `Rp ${(val / 1e9).toFixed(2)} B`;
    if (val >= 1e6)  return `Rp ${(val / 1e6).toFixed(2)} M`;
    return `Rp ${val.toLocaleString()}`;
  }

  formatMarketCap(cap: number): string {
    return `Rp ${(cap / 1e12).toFixed(2)} T`;
  }
}
