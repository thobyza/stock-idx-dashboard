import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>('light');

  constructor() {
    // Read saved preference or default to 'light' (current style)
    const saved = localStorage.getItem('app-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      this.theme.set(saved);
    } else {
      this.theme.set('light');
    }

    // Reactively update HTML class and localStorage whenever theme changes
    effect(() => {
      const current = this.theme();
      localStorage.setItem('app-theme', current);

      if (current === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    });
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }
}
