import { Component, input, signal, computed, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Stock } from '../../stock.service';

export type MoverCategory = 'gainers' | 'losers' | 'turnover' | 'volume' | '52w-high' | '52w-low';
export type MoverSortColumn = 'symbol' | 'price' | 'change' | 'change1w' | '52w-range' | 'volume' | 'turnover' | 'marketCap';
export type SortDirection = 'asc' | 'desc';

export interface MoverSectorPerformance {
  sector: string;
  avgChange: number;
  count: number;
}

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

  // Table Sorting State
  sortColumn = signal<MoverSortColumn>('change');
  sortDirection = signal<SortDirection>('desc');

  // Custom Dropdown States
  isIndexOpen = signal<boolean>(false);
  isSectorOpen = signal<boolean>(false);

  readonly indicesList: string[] = ['All', 'KOMPAS100', 'LQ45', 'IDX80', 'JII', 'JII70', 'ISSI'];

  sectorsList = computed<string[]>(() => {
    const sectors = new Set<string>();
    this.stocks().forEach((s) => {
      if (s.sector) sectors.add(s.sector);
    });
    return ['All', ...Array.from(sectors).sort()];
  });

  sectorPerformances = computed<MoverSectorPerformance[]>(() => {
    const list = this.stocks();
    const uniqueSectors = Array.from(new Set(list.map((s) => s.sector).filter(Boolean)));
    return uniqueSectors
      .map((sec) => {
        const sectorStocks = list.filter((s) => s.sector === sec);
        const count = sectorStocks.length;
        const avgChange =
          count > 0
            ? Number((sectorStocks.reduce((sum, s) => sum + s.change, 0) / count).toFixed(2))
            : 0;
        return { sector: sec, avgChange, count };
      })
      .sort((a, b) => b.avgChange - a.avgChange);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      this.isIndexOpen.set(false);
      this.isSectorOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.isIndexOpen.set(false);
    this.isSectorOpen.set(false);
  }

  toggleIndexDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.isSectorOpen.set(false);
    this.isIndexOpen.update((v) => !v);
  }

  toggleSectorDropdown(event?: MouseEvent) {
    event?.stopPropagation();
    this.isIndexOpen.set(false);
    this.isSectorOpen.update((v) => !v);
  }

  selectIndex(index: string) {
    this.selectedIndex.set(index);
    this.isIndexOpen.set(false);
  }

  selectSector(sector: string) {
    this.selectedSector.set(sector);
    this.isSectorOpen.set(false);
  }

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

  sortColumnLabel = computed<string>(() => {
    switch (this.sortColumn()) {
      case 'symbol':
        return 'Ticker';
      case 'price':
        return 'Price';
      case 'change':
        return '1D Change';
      case 'change1w':
        return '1W Change';
      case '52w-range':
        return '52W Range';
      case 'volume':
        return 'Volume';
      case 'turnover':
        return 'Turnover';
      case 'marketCap':
        return 'Market Cap';
      default:
        return 'Rank';
    }
  });

  // Final ranked movers list sorted by column
  rankedStocks = computed(() => {
    const base = [...this.filteredBaseStocks()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const multiplier = dir === 'asc' ? 1 : -1;

    return base.sort((a, b) => {
      let comparison = 0;
      switch (col) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.change - b.change;
          break;
        case 'change1w':
          comparison = (a.change1w ?? 0) - (b.change1w ?? 0);
          break;
        case '52w-range': {
          const posA = this.get52WeekPosition(a.price, a.fiftyTwoWeekLow, a.fiftyTwoWeekHigh);
          const posB = this.get52WeekPosition(b.price, b.fiftyTwoWeekLow, b.fiftyTwoWeekHigh);
          comparison = posA - posB;
          break;
        }
        case 'volume':
          comparison = a.volume - b.volume;
          break;
        case 'turnover':
          comparison = (a.price * a.volume) - (b.price * b.volume);
          break;
        case 'marketCap':
          comparison = a.marketCap - b.marketCap;
          break;
      }
      return comparison * multiplier;
    });
  });

  onSort(column: MoverSortColumn) {
    if (this.sortColumn() === column) {
      this.sortDirection.update((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortColumn.set(column);
      // Ticker defaults to alphabetical A-Z (asc), numeric metrics default to highest first (desc)
      this.sortDirection.set(column === 'symbol' ? 'asc' : 'desc');
    }
  }

  setCategory(category: MoverCategory) {
    this.selectedCategory.set(category);
    switch (category) {
      case 'gainers':
        this.sortColumn.set(this.timeframe() === '1D' ? 'change' : 'change1w');
        this.sortDirection.set('desc');
        break;
      case 'losers':
        this.sortColumn.set(this.timeframe() === '1D' ? 'change' : 'change1w');
        this.sortDirection.set('asc');
        break;
      case 'turnover':
        this.sortColumn.set('turnover');
        this.sortDirection.set('desc');
        break;
      case 'volume':
        this.sortColumn.set('volume');
        this.sortDirection.set('desc');
        break;
      case '52w-high':
        this.sortColumn.set('52w-range');
        this.sortDirection.set('desc');
        break;
      case '52w-low':
        this.sortColumn.set('52w-range');
        this.sortDirection.set('asc');
        break;
    }
  }

  setTimeframe(tf: '1D' | '1W') {
    this.timeframe.set(tf);
    if (this.sortColumn() === 'change' || this.sortColumn() === 'change1w') {
      this.sortColumn.set(tf === '1D' ? 'change' : 'change1w');
    }
  }

  setIndex(idx: string) {
    this.selectIndex(idx);
  }

  setSector(sector: string) {
    this.selectSector(sector);
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
