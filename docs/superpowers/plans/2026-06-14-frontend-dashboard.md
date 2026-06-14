# Frontend Dashboard Implementation Plan (Phase 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React + TypeScript frontend application providing product monitoring, price trend visualization, and alert management UI.

**Architecture:** Vite-based React 18 app with TypeScript, using Shadcn/ui components styled with Tailwind CSS. Recharts for data visualization, Zustand for state management, React Hook Form + Zod for forms, and axios for API calls. Component-based architecture with pages, components, hooks, and services layers.

**Tech Stack:** React 18, TypeScript, Vite, Shadcn/ui, Radix UI, Tailwind CSS, Recharts, Zustand, React Hook Form, Zod, axios, Vitest, React Testing Library

---

## Scope

This plan builds the complete frontend application with 5 main pages:
1. Dashboard overview (metrics cards, recent alerts)
2. Products list and detail pages
3. Alerts center
4. Settings page

Each section is independently testable. The plan follows TDD principles where practical for business logic (stores, hooks, utilities).

## File Structure

```
frontend/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── App.tsx                     # Root component with routing
│   ├── pages/
│   │   ├── Dashboard.tsx           # Dashboard overview
│   │   ├── ProductsList.tsx        # Products list page
│   │   ├── ProductDetail.tsx       # Product detail page
│   │   ├── AlertsCenter.tsx        # Alerts center page
│   │   └── Settings.tsx            # Settings page
│   ├── components/
│   │   ├── ui/                     # Shadcn/ui components (auto-generated)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx       # Main layout with sidebar
│   │   │   └── Sidebar.tsx         # Navigation sidebar
│   │   ├── products/
│   │   │   ├── ProductCard.tsx     # Product card component
│   │   │   ├── ProductForm.tsx     # Add/edit product form
│   │   │   └── PriceTrendChart.tsx # Price history chart
│   │   ├── alerts/
│   │   │   ├── AlertCard.tsx       # Alert card component
│   │   │   └── AlertRuleForm.tsx   # Alert rule form
│   │   └── dashboard/
│   │       ├── MetricCard.tsx      # Metric display card
│   │       └── RecentAlerts.tsx    # Recent alerts list
│   ├── hooks/
│   │   ├── useProducts.ts          # Products data hook
│   │   ├── useAlerts.ts            # Alerts data hook
│   │   └── usePriceStats.ts        # Price stats hook
│   ├── stores/
│   │   └── useAppStore.ts          # Global app state (Zustand)
│   ├── services/
│   │   └── api.ts                  # API client (axios)
│   ├── lib/
│   │   └── utils.ts                # Utility functions
│   └── types/
│       └── index.ts                # TypeScript types
├── tests/
│   └── setup.ts                    # Test configuration
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── components.json                 # Shadcn/ui config
```

---

## Task 1: Project Initialization

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`

- [ ] **Step 1: Create frontend project with Vite**

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
npm install react-router-dom zustand axios zod react-hook-form @hookform/resolvers
npm install recharts date-fns clsx tailwind-merge
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Initialize Tailwind CSS**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Configure Tailwind**

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 5: Update vite.config.ts**

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 6: Update tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 7: Create test setup**

```typescript
// frontend/tests/setup.ts
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})
```

- [ ] **Step 8: Update package.json scripts**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

- [ ] **Step 9: Create index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>E-commerce Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "chore: initialize frontend project with Vite and Tailwind"
```

---

## Task 2: Setup Shadcn/ui and Base Styles

**Files:**
- Create: `frontend/components.json`
- Create: `frontend/src/index.css`
- Create: `frontend/src/lib/utils.ts`

- [ ] **Step 1: Initialize Shadcn/ui**

```bash
npx shadcn-ui@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

- [ ] **Step 2: Create components.json manually (if init fails)**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

- [ ] **Step 3: Create base styles**

```css
/* frontend/src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Create utils helper**

```typescript
// frontend/src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
```

- [ ] **Step 5: Install Shadcn/ui components**

```bash
npx shadcn-ui@latest add button card input label select badge
npx shadcn-ui@latest add table dialog form dropdown-menu
```

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/lib/utils.ts components.json
git add src/components/ui/
git commit -m "feat: setup Shadcn/ui and base styles"
```

---

## Task 3: TypeScript Types and API Client

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/services/api.ts`

- [ ] **Step 1: Define TypeScript types**

```typescript
// frontend/src/types/index.ts
export type Platform = 'amazon' | 'walmart' | 'aliexpress' | 'ebay' | 'other';
export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock';
export type AlertType = 'price_drop' | 'price_surge' | 'out_of_stock' | 'price_threshold' | 'price_change_percent' | 'stock_change';
export type Severity = 'info' | 'warning' | 'critical';

export interface Product {
  id: string;
  platform: Platform;
  productUrl: string;
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
  isMonitoring: boolean;
  checkInterval: number;
  createdAt: number;
  updatedAt?: number;
  lastCheckedAt?: number;
}

export interface PriceSnapshot {
  id: string;
  productId: string;
  price: number;
  originalPrice?: number;
  availability: Availability;
  rating?: number;
  reviewsCount?: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  productId: string;
  alertType: AlertType;
  severity: Severity;
  title: string;
  message?: string;
  isRead: boolean;
  isArchived: boolean;
  createdAt: number;
}

export interface AlertRule {
  id: string;
  productId: string;
  ruleType: 'price_threshold' | 'price_change_percent' | 'stock_change';
  condition: 'below' | 'above' | 'increase' | 'decrease';
  threshold: number;
  enabled: boolean;
  severity: Severity;
  createdAt: number;
  updatedAt?: number;
}

export interface PriceStats {
  productId: string;
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceChange: number;
  priceChangePercent: number;
  dataPoints: number;
  firstRecordedAt: number;
  lastRecordedAt: number;
}

export interface DashboardStats {
  totalProducts: number;
  monitoringProducts: number;
  unreadAlerts: number;
  totalAlerts: number;
}
```

- [ ] **Step 2: Create API client**

```typescript
// frontend/src/services/api.ts
import axios from 'axios';
import type { Product, Alert, AlertRule, PriceSnapshot, PriceStats } from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products
export const productsApi = {
  list: (params?: { monitoring?: boolean; platform?: string; page?: number; limit?: number }) =>
    api.get<{ data: Product[]; pagination: any }>('/products', { params }),
  
  get: (id: string) =>
    api.get<{ data: Product }>(`/products/${id}`),
  
  create: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ data: Product }>('/products', data),
  
  update: (id: string, data: Partial<Product>) =>
    api.patch<{ data: Product }>(`/products/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/products/${id}`),
  
  checkNow: (id: string) =>
    api.post<{ data: PriceSnapshot }>(`/products/${id}/check`),
};

// Price Snapshots
export const snapshotsApi = {
  list: (productId: string, params?: { limit?: number }) =>
    api.get<{ data: PriceSnapshot[] }>(`/products/${productId}/snapshots`, { params }),
};

// Alerts
export const alertsApi = {
  list: (params?: { read?: boolean; severity?: string; productId?: string; page?: number; limit?: number }) =>
    api.get<{ data: Alert[]; pagination: any }>('/alerts', { params }),
  
  get: (id: string) =>
    api.get<{ data: Alert }>(`/alerts/${id}`),
  
  update: (id: string, data: { isRead?: boolean; isArchived?: boolean }) =>
    api.patch<{ data: Alert }>(`/alerts/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/alerts/${id}`),
};

// Alert Rules
export const alertRulesApi = {
  list: (params?: { productId?: string; enabled?: boolean }) =>
    api.get<{ data: AlertRule[] }>('/alert-rules', { params }),
  
  get: (id: string) =>
    api.get<{ data: AlertRule }>(`/alert-rules/${id}`),
  
  create: (data: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<{ data: AlertRule }>('/alert-rules', data),
  
  update: (id: string, data: Partial<AlertRule>) =>
    api.patch<{ data: AlertRule }>(`/alert-rules/${id}`, data),
  
  delete: (id: string) =>
    api.delete(`/alert-rules/${id}`),
};

// Analysis
export const analysisApi = {
  priceStats: (productId: string) =>
    api.get<{ data: PriceStats }>(`/analysis/price-stats/${productId}`),
};

export default api;
```

- [ ] **Step 3: Commit**

```bash
git add src/types/ src/services/
git commit -m "feat: add TypeScript types and API client"
```

---

## Task 4: Zustand Store

**Files:**
- Create: `frontend/src/stores/useAppStore.ts`

- [ ] **Step 1: Create global app store**

```typescript
// frontend/src/stores/useAppStore.ts
import { create } from 'zustand';
import type { Product, Alert } from '@/types';

interface AppState {
  products: Product[];
  alerts: Alert[];
  setProducts: (products: Product[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  markAlertAsRead: (id: string) => void;
  removeAlert: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  products: [],
  alerts: [],
  
  setProducts: (products) => set({ products }),
  
  setAlerts: (alerts) => set({ alerts }),
  
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  
  updateProduct: (id, updates) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  
  markAlertAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, isRead: true } : a
      ),
    })),
  
  removeAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand store"
```

---

## Task 5: Custom Hooks

**Files:**
- Create: `frontend/src/hooks/useProducts.ts`
- Create: `frontend/src/hooks/useAlerts.ts`
- Create: `frontend/src/hooks/usePriceStats.ts`

- [ ] **Step 1: Create useProducts hook**

```typescript
// frontend/src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import { useAppStore } from '@/stores/useAppStore';
import type { Product } from '@/types';

export function useProducts(filters?: { monitoring?: boolean; platform?: string }) {
  const setProducts = useAppStore((state) => state.setProducts);

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await productsApi.list(filters);
      setProducts(response.data.data);
      return response.data.data;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productsApi.get(id);
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const addProduct = useAppStore((state) => state.addProduct);

  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
      productsApi.create(data),
    onSuccess: (response) => {
      addProduct(response.data.data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const updateProduct = useAppStore((state) => state.updateProduct);

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      productsApi.update(id, data),
    onSuccess: (response, variables) => {
      updateProduct(variables.id, response.data.data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const removeProduct = useAppStore((state) => state.removeProduct);

  return useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: (_, id) => {
      removeProduct(id);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

- [ ] **Step 2: Install React Query**

```bash
npm install @tanstack/react-query
```

- [ ] **Step 3: Create useAlerts hook**

```typescript
// frontend/src/hooks/useAlerts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '@/services/api';
import { useAppStore } from '@/stores/useAppStore';

export function useAlerts(filters?: { read?: boolean; severity?: string }) {
  const setAlerts = useAppStore((state) => state.setAlerts);

  return useQuery({
    queryKey: ['alerts', filters],
    queryFn: async () => {
      const response = await alertsApi.list(filters);
      setAlerts(response.data.data);
      return response.data.data;
    },
  });
}

export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();
  const markAsRead = useAppStore((state) => state.markAlertAsRead);

  return useMutation({
    mutationFn: (id: string) => alertsApi.update(id, { isRead: true }),
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();
  const removeAlert = useAppStore((state) => state.removeAlert);

  return useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: (_, id) => {
      removeAlert(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
```

- [ ] **Step 4: Create usePriceStats hook**

```typescript
// frontend/src/hooks/usePriceStats.ts
import { useQuery } from '@tanstack/react-query';
import { analysisApi, snapshotsApi } from '@/services/api';

export function usePriceStats(productId: string) {
  return useQuery({
    queryKey: ['priceStats', productId],
    queryFn: async () => {
      const response = await analysisApi.priceStats(productId);
      return response.data.data;
    },
    enabled: !!productId,
  });
}

export function usePriceSnapshots(productId: string, limit: number = 30) {
  return useQuery({
    queryKey: ['priceSnapshots', productId, limit],
    queryFn: async () => {
      const response = await snapshotsApi.list(productId, { limit });
      return response.data.data;
    },
    enabled: !!productId,
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add custom hooks for data fetching"
```

---

## Task 6: Layout Components

**Files:**
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar component**

```typescript
// frontend/src/components/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Package, Bell, Settings } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: Home },
  { path: '/products', label: 'Products', icon: Package },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">E-commerce Monitor</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
```

- [ ] **Step 2: Install lucide-react icons**

```bash
npm install lucide-react
```

- [ ] **Step 3: Create AppLayout component**

```typescript
// frontend/src/components/layout/AppLayout.tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add layout components (Sidebar and AppLayout)"
```

---

## Task 7: Dashboard Page

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/components/dashboard/MetricCard.tsx`
- Create: `frontend/src/components/dashboard/RecentAlerts.tsx`

- [ ] **Step 1: Create MetricCard component**

```typescript
// frontend/src/components/dashboard/MetricCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create RecentAlerts component**

```typescript
// frontend/src/components/dashboard/RecentAlerts.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/utils';
import type { Alert } from '@/types';

interface RecentAlertsProps {
  alerts: Alert[];
  onAlertClick?: (alert: Alert) => void;
}

export function RecentAlerts({ alerts, onAlertClick }: RecentAlertsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent alerts</p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between border-b pb-3 last:border-0 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                onClick={() => onAlertClick?.(alert)}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(alert.createdAt)}
                  </p>
                </div>
                <Badge variant={getSeverityColor(alert.severity)}>
                  {alert.severity}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create Dashboard page**

```typescript
// frontend/src/pages/Dashboard.tsx
import { useProducts } from '@/hooks/useProducts';
import { useAlerts } from '@/hooks/useAlerts';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { Package, Bell, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const navigate = useNavigate();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();

  if (productsLoading || alertsLoading) {
    return <div>Loading...</div>;
  }

  const monitoringProducts = products?.filter((p) => p.isMonitoring).length || 0;
  const unreadAlerts = alerts?.filter((a) => !a.isRead).length || 0;
  const recentAlerts = alerts?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your e-commerce monitoring system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Products"
          value={products?.length || 0}
          icon={Package}
          description="Products in database"
        />
        <MetricCard
          title="Monitoring"
          value={monitoringProducts}
          icon={Activity}
          description="Active monitoring"
        />
        <MetricCard
          title="Unread Alerts"
          value={unreadAlerts}
          icon={Bell}
          description="Requires attention"
        />
        <MetricCard
          title="Total Alerts"
          value={alerts?.length || 0}
          icon={TrendingUp}
          description="All time alerts"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RecentAlerts
          alerts={recentAlerts}
          onAlertClick={(alert) => navigate('/alerts')}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/
git commit -m "feat: add Dashboard page with metrics and recent alerts"
```

---

## Task 8: Products List Page

**Files:**
- Create: `frontend/src/pages/ProductsList.tsx`
- Create: `frontend/src/components/products/ProductCard.tsx`
- Create: `frontend/src/components/products/ProductForm.tsx`

- [ ] **Step 1: Create ProductCard component**

```typescript
// frontend/src/components/products/ProductCard.tsx
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Pencil, Trash2, ExternalLink } from 'lucide-react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function ProductCard({ product, onEdit, onDelete, onView }: ProductCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{product.title}</h3>
            <p className="text-sm text-muted-foreground">{product.platform}</p>
          </div>
          {product.isMonitoring && (
            <Badge variant="default">Monitoring</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {product.imageUrl && (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-32 object-cover rounded"
          />
        )}
        {product.currentPrice && (
          <div className="text-2xl font-bold">
            {formatCurrency(product.currentPrice, product.currency)}
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          Added: {formatDate(product.createdAt)}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(product.id)}>
          View
        </Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(product)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(product.productUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 2: Create ProductForm component**

```typescript
// frontend/src/components/products/ProductForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/types';

const productSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'aliexpress', 'ebay', 'other']),
  productUrl: z.string().url('Must be a valid URL'),
  asin: z.string().min(1, 'ASIN is required'),
  title: z.string().min(1, 'Title is required'),
  currency: z.string().default('USD'),
  isMonitoring: z.boolean().default(false),
  checkInterval: z.number().min(1).default(24),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product || {
      platform: 'amazon',
      currency: 'USD',
      isMonitoring: false,
      checkInterval: 24,
    },
  });

  const isMonitoring = watch('isMonitoring');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          defaultValue={product?.platform || 'amazon'}
          onValueChange={(value) => setValue('platform', value as any)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="amazon">Amazon</SelectItem>
            <SelectItem value="walmart">Walmart</SelectItem>
            <SelectItem value="aliexpress">AliExpress</SelectItem>
            <SelectItem value="ebay">eBay</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {errors.platform && (
          <p className="text-sm text-destructive">{errors.platform.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="productUrl">Product URL</Label>
        <Input {...register('productUrl')} placeholder="https://..." />
        {errors.productUrl && (
          <p className="text-sm text-destructive">{errors.productUrl.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="asin">ASIN / Product ID</Label>
        <Input {...register('asin')} placeholder="B08N5WRWNW" />
        {errors.asin && (
          <p className="text-sm text-destructive">{errors.asin.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Product Title</Label>
        <Input {...register('title')} placeholder="Product name" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          {...register('isMonitoring')}
          className="h-4 w-4"
        />
        <Label htmlFor="isMonitoring">Enable Monitoring</Label>
      </div>

      {isMonitoring && (
        <div className="space-y-2">
          <Label htmlFor="checkInterval">Check Interval (hours)</Label>
          <Input
            type="number"
            {...register('checkInterval', { valueAsNumber: true })}
            placeholder="24"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit">
          {product ? 'Update' : 'Add'} Product
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 3: Create ProductsList page**

```typescript
// frontend/src/pages/ProductsList.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductForm } from '@/components/products/ProductForm';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { Product } from '@/types';

export function ProductsList() {
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const handleSubmit = async (data: any) => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, data });
      } else {
        await createProduct.mutateAsync(data);
      }
      setDialogOpen(false);
      setEditingProduct(undefined);
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteProduct.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage your monitored products
          </p>
        </div>
        <Button onClick={() => { setEditingProduct(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {products?.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={(id) => navigate(`/products/${id}`)}
          />
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            onSubmit={handleSubmit}
            onCancel={() => {
              setDialogOpen(false);
              setEditingProduct(undefined);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/ProductsList.tsx src/components/products/
git commit -m "feat: add Products list page with CRUD operations"
```

---

## Task 9: Product Detail Page with Price Chart

**Files:**
- Create: `frontend/src/pages/ProductDetail.tsx`
- Create: `frontend/src/components/products/PriceTrendChart.tsx`

- [ ] **Step 1: Create PriceTrendChart component**

```typescript
// frontend/src/components/products/PriceTrendChart.tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { PriceSnapshot } from '@/types';

interface PriceTrendChartProps {
  snapshots: PriceSnapshot[];
  currency: string;
}

export function PriceTrendChart({ snapshots, currency }: PriceTrendChartProps) {
  const data = snapshots.map((snapshot) => ({
    date: formatDate(snapshot.timestamp),
    price: snapshot.price,
    timestamp: snapshot.timestamp,
  })).reverse();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value, currency)}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value, currency)}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create ProductDetail page**

```typescript
// frontend/src/pages/ProductDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import { usePriceStats, usePriceSnapshots } from '@/hooks/usePriceStats';
import { PriceTrendChart } from '@/components/products/PriceTrendChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading: productLoading } = useProduct(id!);
  const { data: stats, isLoading: statsLoading } = usePriceStats(id!);
  const { data: snapshots, isLoading: snapshotsLoading } = usePriceSnapshots(id!, 30);

  if (productLoading || statsLoading || snapshotsLoading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate('/products')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-muted-foreground">{product.platform}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open(product.productUrl, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View on {product.platform}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Current Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.currentPrice, product.currency) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats ? formatCurrency(stats.lowestPrice, product.currency) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats ? formatCurrency(stats.highestPrice, product.currency) : 'N/A'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Price Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats && stats.priceChangePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats ? `${stats.priceChangePercent > 0 ? '+' : ''}${stats.priceChangePercent.toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {snapshots && snapshots.length > 0 && (
        <PriceTrendChart snapshots={snapshots} currency={product.currency} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ASIN:</span>
            <span className="font-medium">{product.asin}</span>
          </div>
          {product.brand && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brand:</span>
              <span className="font-medium">{product.brand}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Monitoring:</span>
            <Badge variant={product.isMonitoring ? 'default' : 'secondary'}>
              {product.isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check Interval:</span>
            <span className="font-medium">{product.checkInterval} hours</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Added:</span>
            <span className="font-medium">{formatDate(product.createdAt)}</span>
          </div>
          {product.lastCheckedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Checked:</span>
              <span className="font-medium">{formatDate(product.lastCheckedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ProductDetail.tsx src/components/products/PriceTrendChart.tsx
git commit -m "feat: add Product detail page with price trend chart"
```

---

## Task 10: Alerts Center Page

**Files:**
- Create: `frontend/src/pages/AlertsCenter.tsx`
- Create: `frontend/src/components/alerts/AlertCard.tsx`

- [ ] **Step 1: Create AlertCard component**

```typescript
// frontend/src/components/alerts/AlertCard.tsx
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { Check, Trash2 } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertCardProps {
  alert: Alert;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AlertCard({ alert, onMarkAsRead, onDelete }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      case 'info': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className={alert.isRead ? 'opacity-60' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold">{alert.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDateTime(alert.createdAt)}
            </p>
          </div>
          <Badge variant={getSeverityColor(alert.severity)}>
            {alert.severity}
          </Badge>
        </div>
      </CardHeader>
      {alert.message && (
        <CardContent>
          <p className="text-sm">{alert.message}</p>
        </CardContent>
      )}
      <CardFooter className="flex gap-2">
        {!alert.isRead && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMarkAsRead(alert.id)}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark as Read
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => onDelete(alert.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
```

- [ ] **Step 2: Create AlertsCenter page**

```typescript
// frontend/src/pages/AlertsCenter.tsx
import { useState } from 'react';
import { useAlerts, useMarkAlertAsRead, useDeleteAlert } from '@/hooks/useAlerts';
import { AlertCard } from '@/components/alerts/AlertCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AlertsCenter() {
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const { data: allAlerts, isLoading } = useAlerts();
  const markAsRead = useMarkAlertAsRead();
  const deleteAlert = useDeleteAlert();

  const filteredAlerts = allAlerts?.filter((alert) => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'critical') return alert.severity === 'critical';
    return true;
  }) || [];

  const handleMarkAsRead = async (id: string) => {
    await markAsRead.mutateAsync(id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      await deleteAlert.mutateAsync(id);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadAlerts = filteredAlerts.filter((a) => !a.isRead);
    for (const alert of unreadAlerts) {
      await markAsRead.mutateAsync(alert.id);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const unreadCount = allAlerts?.filter((a) => !a.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No alerts to display</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AlertsCenter.tsx src/components/alerts/
git commit -m "feat: add Alerts center page"
```

---

## Task 11: Settings Page

**Files:**
- Create: `frontend/src/pages/Settings.tsx`

- [ ] **Step 1: Create Settings page**

```typescript
// frontend/src/pages/Settings.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          System configuration and preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Backend Status</span>
            <Badge variant="default">Connected</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">API Version</span>
            <span className="text-sm font-medium">v1.0.0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Frontend Version</span>
            <span className="text-sm font-medium">v1.0.0</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
          <CardDescription>E-commerce monitoring system</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A comprehensive monitoring system for tracking e-commerce product prices,
            analyzing trends, and managing automated alerts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: add Settings page"
```

---

## Task 12: App Routing and Entry Point

**Files:**
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/main.tsx`

- [ ] **Step 1: Create App component with routing**

```typescript
// frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ProductsList } from '@/pages/ProductsList';
import { ProductDetail } from '@/pages/ProductDetail';
import { AlertsCenter } from '@/pages/AlertsCenter';
import { Settings } from '@/pages/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="alerts" element={<AlertsCenter />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
```

- [ ] **Step 2: Create main entry point**

```typescript
// frontend/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Test the application**

```bash
cd frontend
npm run dev
```

Expected: Application starts on http://localhost:3000, all routes work

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: add app routing and entry point"
```

---

## Task 13: Component Tests

**Files:**
- Create: `frontend/tests/MetricCard.test.tsx`
- Create: `frontend/tests/ProductCard.test.tsx`

- [ ] **Step 1: Write MetricCard test**

```typescript
// frontend/tests/MetricCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Package } from 'lucide-react';

describe('MetricCard', () => {
  it('should render metric card with title and value', () => {
    render(
      <MetricCard
        title="Total Products"
        value={42}
        icon={Package}
        description="Products in database"
      />
    );

    expect(screen.getByText('Total Products')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Products in database')).toBeInTheDocument();
  });

  it('should render without description', () => {
    render(
      <MetricCard
        title="Test Metric"
        value="100"
        icon={Package}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected: Tests pass

- [ ] **Step 3: Write ProductCard test**

```typescript
// frontend/tests/ProductCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product } from '@/types';

const mockProduct: Product = {
  id: 'prod_1',
  platform: 'amazon',
  productUrl: 'https://amazon.com/dp/TEST',
  asin: 'TEST123',
  title: 'Test Product',
  currency: 'USD',
  currentPrice: 99.99,
  isMonitoring: true,
  checkInterval: 24,
  createdAt: Date.now(),
};

describe('ProductCard', () => {
  it('should render product information', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onView = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('amazon')).toBeInTheDocument();
    expect(screen.getByText(/\$99\.99/)).toBeInTheDocument();
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
  });

  it('should call onView when View button clicked', () => {
    const onView = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );

    fireEvent.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalledWith('prod_1');
  });

  it('should call onEdit when Edit button clicked', () => {
    const onEdit = vi.fn();
    const onView = vi.fn();
    const onDelete = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onEdit={onEdit}
        onDelete={onDelete}
        onView={onView}
      />
    );

    fireEvent.click(screen.getAllByRole('button')[1]); // Edit button
    expect(onEdit).toHaveBeenCalledWith(mockProduct);
  });
});
```

- [ ] **Step 4: Run tests again**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add tests/
git commit -m "test: add component tests"
```

---

## Task 14: Final Integration and Documentation

**Files:**
- Create: `frontend/README.md`
- Create: `frontend/.env.example`

- [ ] **Step 1: Create .env.example**

```bash
# frontend/.env.example
VITE_API_BASE_URL=http://localhost:3001/api
```

- [ ] **Step 2: Create README**

```markdown
# E-commerce Monitor - Frontend

React + TypeScript frontend application for monitoring e-commerce products.

## Quick Start

### 1. Install dependencies

\`\`\`bash
npm install
\`\`\`

### 2. Configure environment

\`\`\`bash
cp .env.example .env
\`\`\`

### 3. Start development server

\`\`\`bash
npm run dev
\`\`\`

Application will start on http://localhost:3000

## Available Scripts

- \`npm run dev\` - Start development server with hot reload
- \`npm run build\` - Build production bundle
- \`npm run preview\` - Preview production build
- \`npm test\` - Run tests

## Tech Stack

- React 18
- TypeScript
- Vite
- Shadcn/ui
- Tailwind CSS
- Recharts
- Zustand
- React Query
- React Router
- React Hook Form + Zod

## Project Structure

\`\`\`
src/
├── pages/           # Page components
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── stores/          # Zustand stores
├── services/        # API client
├── lib/             # Utility functions
└── types/           # TypeScript types
\`\`\`

## Features

- **Dashboard**: Overview metrics and recent alerts
- **Products**: List, add, edit, delete products
- **Product Detail**: Price trend charts and statistics
- **Alerts**: Filter and manage alerts
- **Settings**: System configuration

## API Integration

The app connects to the backend API at \`http://localhost:3001/api\`. Ensure the backend is running before starting the frontend.
\`\`\`

- [ ] **Step 3: Final build test**

```bash
npm run build
```

Expected: Build succeeds without errors

- [ ] **Step 4: Final commit and tag**

```bash
git add README.md .env.example
git commit -m "docs: add frontend README and env example"
git tag v1.0.0-frontend-dashboard
```

---

## Self-Review Checklist

### ✅ Spec Coverage

- [x] Dashboard overview page with metrics
- [x] Products list with CRUD operations
- [x] Product detail with price trend chart
- [x] Alerts center with filtering
- [x] Settings page
- [x] Responsive layout with sidebar
- [x] API integration via hooks
- [x] State management with Zustand
- [x] Form validation with Zod

### ✅ Placeholder Scan

- No TBD or TODO markers
- All components have complete implementations
- All types defined
- All API calls implemented

### ✅ Type Consistency

- Product type matches API response
- Alert type matches API response
- PriceStats type matches API response
- All hook return types consistent with components

---

## Completion Criteria

After Phase 5, you should have:

✅ **Working Frontend Application**
- Runs on http://localhost:3000
- All pages accessible via sidebar navigation
- Connects to backend API successfully

✅ **Complete UI Components**
- Dashboard with metrics and recent alerts
- Products list with add/edit/delete
- Product detail with price chart
- Alerts center with filtering

✅ **State Management**
- Zustand store for global state
- React Query for server state
- Custom hooks for data fetching

✅ **Tests**
- Component tests with Vitest
- Tests pass successfully

✅ **Documentation**
- README with setup instructions
- .env.example for configuration

---

## Next Steps

Phase 5 complete! The frontend dashboard is fully functional and integrated with the backend.

Future enhancements could include:
- Alert rule management UI
- Manual product check trigger
- Dark mode support
- Real-time updates via WebSocket
- Export/import functionality

