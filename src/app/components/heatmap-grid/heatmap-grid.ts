import { Component, input, output, signal, computed, HostListener } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Stock } from '../../stock.service';

@Component({
  selector: 'app-heatmap-grid',
  imports: [DecimalPipe],
  templateUrl: './heatmap-grid.html',
  styleUrl: './heatmap-grid.css',
})
export class HeatmapGrid {
  stocks = input.required<Stock[]>();
  selectedStockSymbol = input<string | null>(null);

  stockSelected = output<string>();

  // ── Popup state ───────────────────────────────────────────────
  popupStock = signal<Stock | null>(null);

  openPopup(stock: Stock, event: MouseEvent): void {
    event.stopPropagation();
    this.popupStock.set(stock);
  }

  closePopup(): void {
    this.popupStock.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closePopup();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('popup-backdrop')) {
      this.closePopup();
    }
  }

  // ── Derived popup values ──────────────────────────────────────
  turnover(stock: Stock): string {
    const val = stock.price * stock.volume;
    if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
    if (val >= 1e9)  return `Rp ${(val / 1e9).toFixed(2)} B`;
    if (val >= 1e6)  return `Rp ${(val / 1e6).toFixed(2)} M`;
    return `Rp ${val.toLocaleString()}`;
  }

  marketCapFormatted(stock: Stock): string {
    return `Rp ${(stock.marketCap / 1e12).toFixed(2)} T`;
  }

  get52WeekPosition(price: number, low?: number, high?: number): number {
    if (!low || !high || high === low) return 50;
    return Math.max(0, Math.min(100, Math.round(((price - low) / (high - low)) * 100)));
  }

  // ── Heatmap colour logic ───────────────────────────────────────
  onSelectStock(symbol: string) {
    this.stockSelected.emit(symbol);
  }

  getHeatClass(change: number): string {
    if (this.selectedStockSymbol() === null) return 'border';
    return 'border';
  }

  getHeatStyle(change: number): string {
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const intensity = clamp(Math.abs(change) / 5, 0, 1);

    if (change > 0.05) {
      const alpha = 0.08 + intensity * 0.72;
      const textColor = 'rgb(6, 95, 70)';
      const borderColor = `rgba(16, 185, 129, ${0.15 + intensity * 0.35})`;
      return `background-color: rgba(16, 185, 129, ${alpha}); color: ${textColor}; border-color: ${borderColor};`;
    } else if (change < -0.05) {
      const alpha = 0.08 + intensity * 0.72;
      const textColor = 'rgb(185, 28, 28)';
      const borderColor = `rgba(239, 68, 68, ${0.15 + intensity * 0.35})`;
      return `background-color: rgba(239, 68, 68, ${alpha}); color: ${textColor}; border-color: ${borderColor};`;
    } else {
      return `background-color: rgb(241, 245, 249); color: rgb(71, 85, 105); border-color: rgb(226, 232, 240);`;
    }
  }
}