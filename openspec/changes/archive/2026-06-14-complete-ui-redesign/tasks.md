## 1. Design Token Foundation

- [x] 1.1 Add `@fontsource/inter` and `class-variance-authority` to `frontend/package.json` and install
- [x] 1.2 Replace the `@theme` block in `src/index.css` with primitive tokens: Primary-50..900 (#F5F3FF..#4C1D95), Gray-50..900, semantic success `#22C55E` / warning `#F59E0B` / error `#EF4444` / info `#3B82F6`
- [x] 1.3 Add semantic role tokens (`--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-border`) for light mode and override them under a `.dark` selector (bg `#0F172A`, surface `#111827`, never pure black)
- [x] 1.4 Add radius tokens (`--radius-input:10px`, `--radius-button:12px`, `--radius-card:20px`, `--radius-modal:24px`, `--radius-badge:999px`) and shadow tokens (e1/e2/e3 per spec) wired into Tailwind theme
- [x] 1.5 Set font stacks: `--font-sans: Inter, 'PingFang SC', 'SF Pro Display', 'HarmonyOS Sans', 'Microsoft YaHei', system-ui, sans-serif`; import Inter; update `body`/heading base styles
- [x] 1.6 Add allowed motion utilities (fade, scale 98→100, slide 8px, skeleton) using 150/200/250ms ease-out durations
- [x] 1.7 Verify app still builds and renders (`npm run build`) before porting pages

## 2. Internationalization Bootstrap

- [x] 2.1 Add `react-i18next`, `i18next`, `i18next-browser-languagedetector` to dependencies and install
- [x] 2.2 Create `src/i18n/index.ts` initializing i18next with detection order `localStorage → navigator`, mapping `zh-*` → `zh` else `en`, persisting to `localStorage` key `lang`, fallback `en`
- [x] 2.3 Create namespace JSON files under `src/i18n/locales/{en,zh}/`: `common`, `navigation`, `dashboard`, `products`, `alerts`, `chat`, `settings`
- [x] 2.4 Wrap the app with i18n init in `src/main.tsx` (Suspense for resource load)
- [x] 2.5 Create `src/lib/format.ts`: `formatCurrency` (¥/$ by locale), `formatNumber` (万/亿 for zh, thousand separators for en), `formatDate` (`YYYY年MM月DD日` for zh, locale date for en) using `Intl` + `date-fns` locales
- [x] 2.6 Build `src/components/ui/LanguageSwitcher.tsx` (zh/en toggle) that calls `i18n.changeLanguage` and persists

## 3. Component Library

- [x] 3.1 Add `cva` variant helpers; ensure `cn` util uses `clsx` + `tailwind-merge`
- [x] 3.2 `ui/Button.tsx` — primary (Primary-600 bg, white, 44px, radius 12, hover Primary-700), secondary (white + gray border), ghost (transparent, hover Gray-100)
- [x] 3.3 `ui/Input.tsx` — 44px height, radius 10, Gray-200 border, focus 2px Primary-200 ring; include validation/error state
- [x] 3.4 `ui/Badge.tsx` — pill (radius 999, 24px height), variants success/warning/error/info/neutral from semantic tokens
- [x] 3.5 `ui/Card.tsx` — radius 20, 24px padding, 1px Gray-100 border, elevation-1 shadow, optional title/description/action slots
- [x] 3.6 `ui/KPICard.tsx` — metric label + value + trend (green ↑ / red ↓), 120px height, 24px padding
- [x] 3.7 `ui/DataTable.tsx` — 64px rows, 48px header, 16px cell padding, hover Gray-50, selected Primary-50, row actions hidden until hover
- [x] 3.8 `ui/charts/LineChart.tsx` and `ui/charts/DonutChart.tsx` — themed recharts wrappers (stroke 3, dashed 20% grid, donut 14–18px thickness + center metric) reading colors from tokens
- [x] 3.9 Install needed shadcn primitives for menus/overlays (DropdownMenu, Dialog) styled with modal radius 24 + elevation-3

## 4. App Shell & Navigation

- [x] 4.1 Rebuild `src/components/layout/AppLayout.tsx`: 240px white sidebar with soft separators, icon-first items (44px height, 12px gap), rounded active state (Primary-50 bg, Primary-600 text/icon), hover Gray-100
- [x] 4.2 Add collapse support (240px ↔ 72px) with state in `useAppStore` (zustand), persisted to localStorage
- [x] 4.3 Add sticky header: page title, `LanguageSwitcher`, dark-mode toggle (writes `.dark` on `<html>`, persisted), user menu
- [x] 4.4 Add `Chat` nav item and register `/chat` route in `src/App.tsx`; set content max-width 1600px, padding 32px
- [x] 4.5 Replace hardcoded nav labels with `navigation` namespace keys

## 5. Module Redesign — Dashboard

- [x] 5.1 Rebuild `src/pages/Dashboard.tsx` with KPI card row (sales, orders, ROAS, inventory) using `KPICard`
- [x] 5.2 Add trend line chart + donut breakdown using themed chart wrappers
- [x] 5.3 Add product performance table (`DataTable`) and alert summary panel (reuse `RecentAlerts`)
- [x] 5.4 Restyle `components/dashboard/MetricCard.tsx` / `RecentAlerts.tsx` to tokens; extract strings to `dashboard` namespace; keep `MetricCard.test.tsx` green

## 6. Module Redesign — Products

- [x] 6.1 Rebuild `src/pages/ProductsList.tsx` and `ProductCard.tsx`: image card, status badge, revenue metric, trend, actions, AI recommendation callout (info styling)
- [x] 6.2 Rebuild `src/pages/ProductDetail.tsx` with card hierarchy (status / pricing / performance / advertising / inventory)
- [x] 6.3 Restyle `ProductForm.tsx` with `Input`/`Button`; restyle `PriceTrendChart.tsx` via chart wrapper
- [x] 6.4 Extract strings to `products` namespace; keep `ProductCard.test.tsx` green

## 7. Module Redesign — Alerts

- [x] 7.1 Rebuild `src/pages/AlertsCenter.tsx` and `components/alerts/AlertItem.tsx` with priority levels (Critical=red, Warning=orange, Info=blue)
- [x] 7.2 Ensure each alert shows what happened / why it matters / recommended action (anxiety-reducing layout)
- [x] 7.3 Extract strings to `alerts` namespace

## 8. Module Redesign — Settings

- [x] 8.1 Rebuild `src/pages/Settings.tsx` with categorized sections (General, Account, Integrations, Notifications, Billing, API, Team)
- [x] 8.2 Integration cards (logo + connection status badge) for Amazon, Shopify, eBay, TikTok Shop, Google Ads, Meta Ads
- [x] 8.3 Surface language preference in Settings (mirrors header switcher); extract strings to `settings` namespace

## 9. New Module — Chat Copilot

- [x] 9.1 Create `src/pages/Chat.tsx` with layout: conversation thread + composer + suggested actions
- [x] 9.2 Message bubbles — assistant (Gray-50, radius 20), user (Primary-50, radius 20)
- [x] 9.3 Suggested action chips (Analyze sales trends, Find winning products, Summarize alerts, Optimize ad spend, Forecast inventory)
- [x] 9.4 Extract strings to `chat` namespace (note: chat may be UI-only/stubbed if no backend endpoint exists)

## 10. Cleanup & Verification

- [x] 10.1 Remove obsolete brutalist tokens/classes (`Fira Sans`, `border-2`, `rounded-sm`, old blue `--color-primary`) once all pages are migrated
- [x] 10.2 Sweep for untranslated literal JSX strings across pages/components; confirm zh and en have complete coverage per namespace
- [x] 10.3 Verify dark mode token pairs meet WCAG AA contrast; check ≥44px click targets and visible focus states
- [x] 10.4 Run `npm run lint`, `npm run test`, `npm run build` — all green
- [x] 10.5 Manual QA matrix: {light, dark} × {zh, en} across Dashboard, Products, Alerts, Settings, Chat
