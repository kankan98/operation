import { create } from 'zustand';
import type { Product, Alert } from '@/types';

type Theme = 'light' | 'dark';

function initialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem('theme', theme);
}

interface AppState {
  products: Product[];
  alerts: Alert[];
  // UI state
  sidebarCollapsed: boolean;
  theme: Theme;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  setAlerts: (alerts: Alert[]) => void;
  markAlertAsRead: (id: string) => void;
  removeAlert: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  alerts: [],
  sidebarCollapsed:
    typeof window !== 'undefined' && localStorage.getItem('sidebarCollapsed') === 'true',
  theme: initialTheme(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem('sidebarCollapsed', String(next));
      return { sidebarCollapsed: next };
    }),
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    }),
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...product } : p)),
    })),
  removeProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
  setAlerts: (alerts) => set({ alerts }),
  markAlertAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)),
    })),
  removeAlert: (id) => set((state) => ({ alerts: state.alerts.filter((a) => a.id !== id) })),
}));
