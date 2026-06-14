## Context

The frontend (`frontend/`) is a React 19 + Vite 8 SPA styled with Tailwind v4. Its current visual language is a **data-focused brutalist** theme — blue primary (`#1E40AF`), 2px sharp borders, `rounded-sm`, `Fira Sans`/`JetBrains Mono` fonts — which is the explicit opposite of the target design system in `docs/style.md` ("Avoid: traditional ERP density, Chinese B2B aesthetics, gaming style"). Design tokens live in `src/index.css` under Tailwind v4's `@theme` block; shadcn/ui is configured (`components.json`) but few primitives exist; charts use `recharts`; icons use `lucide-react`.

Current modules: Dashboard, Products (list + detail), Alerts, Settings. **No Chat module and no i18n exist today**, though the proposal/specs require both. App shell is `src/components/layout/AppLayout.tsx` with a hardcoded 256px sidebar and English-only nav labels.

This change is a complete visual overhaul to the "Agent Purple" SaaS aesthetic (Stripe × Linear × ChatGPT × Shopify) plus a new bilingual (简体中文 / English) capability. The reference screenshot confirms: light neutral canvas, 240px white sidebar with rounded active states, KPI cards, soft 20px-radius cards, donut + line charts, priority-coded alerts, integration cards, and a copilot chat surface.

Stakeholders: product (market reach via i18n), merchants (reduced cognitive load), and future feature teams (the component library becomes the foundation).

## Goals / Non-Goals

**Goals:**
- Replace the brutalist token set with the `docs/style.md` design system as **CSS custom properties** consumed through Tailwind v4 `@theme`, so every component restyles by changing tokens, not markup.
- Ship light **and** dark mode driven entirely by token swaps (`.dark` class), never per-component color forks.
- Introduce i18n (zh-CN / en) with full string coverage, browser detection, persistence, and localized dates/numbers/currency (including 万/亿 units).
- Redesign all five existing modules and add the **Chat copilot** module + route.
- Establish a reusable component library (Button, Input, Badge, Card, KPICard, DataTable, charts) as the single source of UI truth.
- Keep all existing data wiring intact: react-query hooks, zustand store, axios `services/api.ts`, and routes continue to work.

**Non-Goals:**
- No backend/API changes, no new data models, no auth changes. Language preference persists client-side (localStorage), not to a user profile.
- No new charting or component framework — restyle `recharts` and build on `shadcn`/Tailwind rather than adopting MUI/Ant/Chakra.
- No content translation of dynamic API data (product names, alert bodies from backend) — only UI chrome strings are localized in this change.
- No responsive/mobile rework beyond ensuring the desktop layout degrades gracefully; full mobile breakpoints are a follow-up.
- No RTL support (zh/en are both LTR).

## Decisions

### D1 — Design tokens via Tailwind v4 `@theme` + CSS variables, dark mode by class
Define the full palette (Primary-50..900, Gray-50..900, semantic success/warning/error/info), radii (input 10 / button 12 / card 20 / modal 24 / badge 999), shadows (3 elevations), and font stacks as CSS custom properties in `src/index.css`. Map them into Tailwind's theme so utilities like `bg-primary-600`, `rounded-card`, `shadow-e2` exist. Dark mode = a `.dark` class on `<html>` that re-points the *semantic* tokens (`--color-bg`, `--color-surface`, `--color-text`, `--color-border`) to dark values (`#0F172A` bg, `#111827` card) while keeping the purple scale fixed.
- **Why:** Tailwind v4 already uses `@theme` here, and CSS-variable tokens are the only approach where a single token edit re-themes the whole app and dark mode is a free swap.
- **Alternatives:** styled-system / CSS-in-JS (adds a dependency and runtime cost, fights Tailwind); raw hex in components (unmaintainable, no dark mode). Rejected.
- **Token layering:** keep two tiers — *primitive* tokens (raw scale, e.g. `--color-primary-600`) and *semantic* tokens (role-based, e.g. `--color-text`, `--color-surface`) that components consume. Only semantic tokens change between light/dark.

### D2 — i18n with `react-i18next` + `i18next-browser-languagedetector`
Use `react-i18next` (the standard for Vite/React SPAs; `next-intl` is Next-only). JSON resource files per namespace (`common`, `navigation`, `dashboard`, `products`, `alerts`, `chat`, `settings`) under `src/i18n/locales/{en,zh}/`. Detection order: `localStorage → navigator` mapped so `zh-*` → `zh`, else `en`. Persist selection to `localStorage` key `lang`. A `<LanguageSwitcher>` lives in the app header.
- **Why:** mature, tree-shakeable, namespace + interpolation + plural support, integrates with React Suspense.
- **Alternatives:** hand-rolled context map (no pluralization/detection/format), `next-intl` (wrong framework), `lingui` (heavier build-time macro setup). Rejected.
- **Localized formatting:** wrap `Intl.NumberFormat`/`Intl.DateTimeFormat` in `src/lib/format.ts`. Chinese large-number 万/亿 abbreviation and `YYYY年MM月DD日` dates implemented there; `date-fns` (already a dep) supplies locale objects where needed. Components call `formatCurrency`/`formatNumber`/`formatDate` rather than touching `Intl` directly.

### D3 — Component library on shadcn primitives + `cva` variants
Build a small set of token-driven components in `src/components/ui/` (Button, Input, Badge, Card, KPICard, DataTable, Donut/Line chart wrappers). Use `class-variance-authority` (with existing `clsx`/`tailwind-merge`) for variants (primary/secondary/ghost; success/warning/error/info/neutral badges). shadcn is already configured, so structural primitives (Dialog, DropdownMenu for the language/user menu) come from there.
- **Why:** one styling vocabulary, consistent radii/shadows/heights from tokens, and existing pages migrate by swapping ad-hoc markup for these components.
- **Alternatives:** full shadcn generation of every component (more surface than needed), bespoke each page (inconsistent). Rejected.

### D4 — App shell: collapsible sidebar + header, state in zustand
Rework `AppLayout` into 240px sidebar (collapsible to 72px) + sticky header (page title, language switcher, theme toggle, user menu). Sidebar/theme/collapse state lives in the existing `useAppStore` (zustand) and persists to localStorage. Add the `/chat` route to `App.tsx` and a Chat nav item.
- **Why:** matches reference + spec; zustand already present so no new state lib.

### D5 — Restyle `recharts`, don't replace
Wrap recharts Line/Donut in themed components reading tokens (stroke width 3, dashed 20%-opacity grid, 14–18px donut thickness, center metric). Pass colors from CSS variables via JS where recharts needs literal values.
- **Why:** recharts is already used in `PriceTrendChart`; avoids a migration. Trade-off: some chart colors must be read from computed styles rather than pure utility classes.

### D6 — Fonts: self-host Inter, system PingFang SC
Add Inter via `@fontsource/inter` (bundled, no external request); rely on system `PingFang SC` / `Microsoft YaHei` fallbacks for Chinese (no CJK webfont shipped — too large). Font stack set on `--font-sans`.
- **Why:** avoids FOUT and CDN dependency for Latin; CJK webfonts are multi-MB and impractical to bundle.

## Risks / Trade-offs

- **Scope is large (full overhaul touching every page)** → Migrate incrementally behind a stable token layer: land tokens + shell + component library first so each page can be ported independently and the app stays runnable throughout. Sequence enforced in `tasks.md`.
- **Token rename breaks existing components** (they reference brutalist tokens like `bg-card`, `border-slate-200`, `rounded-sm`) → Introduce new semantic tokens alongside, port pages module-by-module, remove old tokens only after the last page is migrated. Keep tests (`*.test.tsx`) green per module.
- **i18n string extraction is tedious and easy to miss strings** → Add an ESLint guard / manual sweep for literal JSX text after migration; namespaces keep keys discoverable; default-language fallback disabled in dev so missing keys surface loudly.
- **Dark-mode contrast regressions** → Verify WCAG AA on semantic token pairs; never use pure black (`#0F172A` floor per spec).
- **Chart colors can't be pure Tailwind utilities** → Centralize chart color reads in the chart wrapper components so the coupling is contained.
- **CJK fallback fonts vary by OS** (Windows dev box lacks PingFang SC) → Acceptable; fallback chain ends at `Microsoft YaHei`/`sans-serif`. Document that visual QA of Chinese type should happen on macOS or with the fallback in mind.

## Migration Plan

1. **Token foundation** — Replace `@theme` block in `index.css` with the full Agent Purple system (primitive + semantic tokens, light/dark), radii, shadows, fonts. Add `@fontsource/inter`. App still renders (old utility classes resolve to new-ish values or are ported next).
2. **App shell + i18n bootstrap** — New `AppLayout` (sidebar/header/collapse/theme toggle), `i18n` setup, `LanguageSwitcher`, `format.ts`. Wire `/chat` route.
3. **Component library** — Build `ui/` primitives (Button, Input, Badge, Card, KPICard, DataTable, chart wrappers).
4. **Per-module migration** (each: restyle to components + extract strings to namespaces + keep tests green): Dashboard → Products → Alerts → Settings → Chat (new).
5. **Cleanup** — Remove brutalist tokens/classes, run lint + tests, light/dark + zh/en QA pass.

**Rollback:** purely client-side; revert the frontend commits. No data migration, so rollback is a code revert with zero state cleanup.

## Open Questions

- Should language preference eventually sync to a server-side user profile? (Out of scope now — localStorage only.)
- Is a CJK webfont (e.g. subset PingFang/Noto Sans SC) wanted for brand-consistent Chinese type, accepting the bundle-size cost? (Deferred to a follow-up.)
- Confirm the five integration logos to ship in Settings (Amazon, Shopify, eBay, TikTok Shop, Google Ads, Meta Ads) — are SVG assets available, or use text + status pills initially?
