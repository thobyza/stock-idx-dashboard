import { Injectable, signal, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, of, catchError } from 'rxjs';

export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  sectorDesc?: string;
  indices: string[];
  price: number;
  change: number;
  change1w?: number;
  prevPrice: number;
  volume: number;
  marketCap: number;
  history: number[];
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  flashDirection?: 'up' | 'down' | null;
}

export interface IndexData {
  price: number;
  change: number;
  pct: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  value?: number;
  history?: number[];
}

export interface NewsArticle {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  thumbnail: string | null;
  type: string;
  lang?: 'id' | 'en';
}

export type CorporateActionType = 'DIVIDEND' | 'RUPS' | 'STOCK_SPLIT' | 'RIGHTS_ISSUE';

export interface CorporateAction {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  type: CorporateActionType;
  title: string;
  description?: string;
  cumDate?: string;
  exDate?: string;
  recordingDate?: string;
  paymentDate?: string;
  eventDate?: string;
  amountPerShare?: number;
  dividendYield?: number;
  ratio?: string;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED';
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  private apiUrl = 'http://localhost:3000/api';
  private socket!: Socket;

  stocks = signal<Stock[]>([]);
  ihsg = signal<IndexData>({ price: 7230.45, change: 32.40, pct: 0.45 });
  isLive = signal<boolean>(false);

  currentSelectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  constructor(private http: HttpClient, private ngZone: NgZone) {
    this.fetchInitialData();
    this.connectWebSocket();
  }

  private fetchInitialData() {
    this.http.get<{ ihsg: IndexData; stocks: Stock[] }>(`${this.apiUrl}/stocks`)
      .subscribe({
        next: (data) => {
          this.stocks.set(data.stocks);
          this.ihsg.set(data.ihsg);
        },
        error: (err) => console.error('Failed to load initial stock data:', err)
      });
  }

  private connectWebSocket() {
    this.socket = io('http://localhost:3000');

    this.socket.on('connect', () => {
      this.ngZone.run(() => this.isLive.set(true));
      console.log('Connected to Stock Live Feed Server.');
    });

    this.socket.on('disconnect', () => {
      this.ngZone.run(() => this.isLive.set(false));
      console.log('Disconnected from Stock Live Feed.');
    });

    this.socket.on('market-update', (data: { ihsg: IndexData; stocks: Stock[] }) => {
      const todayStr = new Date().toISOString().split('T')[0];

      // Only apply live WebSocket updates if user is viewing TODAY'S date
      if (this.currentSelectedDate() === todayStr) {
        this.ngZone.run(() => {
          this.stocks.set(data.stocks);
          this.ihsg.set(data.ihsg);
        });
      }
    });
  }

  getHistory(symbol: string): Observable<{ date: string; close: number; volume: number }[]> {
    return this.http.get<{ date: string; close: number; volume: number }[]>(
      `${this.apiUrl}/stocks/${symbol}/history`
    );
  }

  getNews(): Observable<{ articles: NewsArticle[] }> {
    return this.http.get<{ articles: NewsArticle[] }>(`${this.apiUrl}/news`);
  }

  getCorporateActions(): Observable<{ actions: CorporateAction[] }> {
    return this.http.get<{ actions: CorporateAction[] }>(`${this.apiUrl}/corporate-actions`).pipe(
      catchError(() => of({ actions: this.getFallbackCorporateActions() }))
    );
  }

  fetchStocksByDate(date: string) {
    this.currentSelectedDate.set(date);
    this.http.get<{ ihsg: IndexData; stocks: Stock[] }>(`${this.apiUrl}/stocks?date=${date}`)
      .subscribe({
        next: (data) => {
          this.stocks.set(data.stocks);
          this.ihsg.set(data.ihsg);
        },
        error: (err) => console.error('Failed to load stock data for date:', err)
      });
  }

  private getFallbackCorporateActions(): CorporateAction[] {
    return [
      {
        id: 'ca-1',
        symbol: 'BBRI',
        name: 'Bank Rakyat Indonesia (Persero) Tbk',
        sector: 'IDXFINANCE',
        type: 'DIVIDEND',
        title: 'Interim Cash Dividend Fiscal Year 2026',
        description: 'Board resolution approved interim cash dividend distribution of Rp 84 per share.',
        cumDate: '2026-10-24',
        exDate: '2026-10-27',
        recordingDate: '2026-10-28',
        paymentDate: '2026-11-12',
        amountPerShare: 84,
        dividendYield: 1.7,
        status: 'UPCOMING'
      },
      {
        id: 'ca-2',
        symbol: 'ITMG',
        name: 'Indo Tambangraya Megah Tbk',
        sector: 'IDXENERGY',
        type: 'DIVIDEND',
        title: 'Interim Cash Dividend Distribution',
        description: 'Dividend payout from net income for period ending June 2026.',
        cumDate: '2026-10-28',
        exDate: '2026-10-29',
        recordingDate: '2026-10-30',
        paymentDate: '2026-11-18',
        amountPerShare: 1228,
        dividendYield: 4.8,
        status: 'UPCOMING'
      },
      {
        id: 'ca-3',
        symbol: 'ASII',
        name: 'Astra International Tbk',
        sector: 'IDXINDUST',
        type: 'DIVIDEND',
        title: 'Interim Cash Dividend 2026',
        description: 'Interim dividend approved for all eligible registered shareholders.',
        cumDate: '2026-10-22',
        exDate: '2026-10-23',
        recordingDate: '2026-10-24',
        paymentDate: '2026-11-05',
        amountPerShare: 98,
        dividendYield: 1.9,
        status: 'UPCOMING'
      },
      {
        id: 'ca-4',
        symbol: 'UNTR',
        name: 'United Tractors Tbk',
        sector: 'IDXINDUST',
        type: 'DIVIDEND',
        title: 'Interim Cash Dividend Distribution',
        description: 'Cash dividend distribution from operational earnings.',
        cumDate: '2026-10-26',
        exDate: '2026-10-27',
        recordingDate: '2026-10-28',
        paymentDate: '2026-11-14',
        amountPerShare: 667,
        dividendYield: 2.5,
        status: 'UPCOMING'
      },
      {
        id: 'ca-5',
        symbol: 'BMRI',
        name: 'Bank Mandiri (Persero) Tbk',
        sector: 'IDXFINANCE',
        type: 'RUPS',
        title: 'Extraordinary General Meeting (RUPSLB)',
        description: 'Meeting agenda: Approval of board restructuring & digital ecosystem expansion initiative.',
        eventDate: '2026-11-04',
        recordingDate: '2026-10-12',
        status: 'UPCOMING'
      },
      {
        id: 'ca-6',
        symbol: 'BBCA',
        name: 'Bank Central Asia Tbk',
        sector: 'IDXFINANCE',
        type: 'RUPS',
        title: 'Extraordinary Shareholders Meeting (RUPSLB)',
        description: 'Evaluation of Q3 performance milestones and capital investment plan.',
        eventDate: '2026-11-10',
        recordingDate: '2026-10-18',
        status: 'UPCOMING'
      },
      {
        id: 'ca-7',
        symbol: 'TLKM',
        name: 'Telkom Indonesia (Persero) Tbk',
        sector: 'IDXINFRA',
        type: 'DIVIDEND',
        title: 'Interim Cash Dividend',
        description: 'Distribution of interim dividend for fiscal year 2026.',
        cumDate: '2026-11-06',
        exDate: '2026-11-09',
        recordingDate: '2026-11-10',
        paymentDate: '2026-11-25',
        amountPerShare: 32,
        dividendYield: 1.1,
        status: 'UPCOMING'
      },
      {
        id: 'ca-8',
        symbol: 'ICBP',
        name: 'Indofood CBP Sukses Makmur Tbk',
        sector: 'IDXNONCYC',
        type: 'STOCK_SPLIT',
        title: 'Stock Split 1:2',
        description: 'Nominal share value adjustment from Rp 100 to Rp 50 per share to increase retail liquidity.',
        cumDate: '2026-11-15',
        exDate: '2026-11-16',
        ratio: '1:2',
        status: 'UPCOMING'
      },
      {
        id: 'ca-9',
        symbol: 'BRIS',
        name: 'Bank Syariah Indonesia Tbk',
        sector: 'IDXFINANCE',
        type: 'RIGHTS_ISSUE',
        title: 'Limited Public Offering II (PMHMETD)',
        description: 'Rights issue offering with preemptive rights to reinforce Tier 1 Islamic capital reserves.',
        cumDate: '2026-11-12',
        exDate: '2026-11-13',
        recordingDate: '2026-11-14',
        ratio: '100:18',
        amountPerShare: 2250,
        status: 'UPCOMING'
      },
      {
        id: 'ca-10',
        symbol: 'ADRO',
        name: 'Adaro Energy Indonesia Tbk',
        sector: 'IDXENERGY',
        type: 'DIVIDEND',
        title: 'Special Cash Dividend from Corporate Spin-off',
        description: 'Special dividend distribution preceding AAI business separation.',
        cumDate: '2026-11-20',
        exDate: '2026-11-21',
        recordingDate: '2026-11-22',
        paymentDate: '2026-12-08',
        amountPerShare: 350,
        dividendYield: 9.2,
        status: 'UPCOMING'
      },
      {
        id: 'ca-11',
        symbol: 'BBNI',
        name: 'Bank Negara Indonesia (Persero) Tbk',
        sector: 'IDXFINANCE',
        type: 'DIVIDEND',
        title: 'Interim Dividend 2026',
        description: 'Interim cash dividend for qualified registered shareholders.',
        cumDate: '2026-11-05',
        exDate: '2026-11-06',
        recordingDate: '2026-11-07',
        paymentDate: '2026-11-22',
        amountPerShare: 72,
        dividendYield: 1.4,
        status: 'UPCOMING'
      },
      {
        id: 'ca-12',
        symbol: 'PGAS',
        name: 'Perusahaan Gas Negara Tbk',
        sector: 'IDXINFRA',
        type: 'RUPS',
        title: 'Extraordinary General Meeting (RUPSLB)',
        description: 'Shareholder voting on national gas distribution infrastructure expansion.',
        eventDate: '2026-11-02',
        recordingDate: '2026-10-10',
        status: 'UPCOMING'
      }
    ];
  }
}
