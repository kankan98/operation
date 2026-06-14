## Context

The e-commerce monitoring system backend (Phases 1-4) provides a complete REST API for product monitoring, price tracking, automated scraping, and intelligent alerts. The system currently lacks a user interface, requiring users to interact via direct API calls. This design establishes a production-grade web dashboard to make the system accessible to end users.

**Current State:**
- Backend API running on `localhost:3001` with endpoints for products, alerts, alert-rules, price snapshots, and analysis
- SQLite database with products, price_snapshots, alerts, and alert_rules tables
- Automated scraping service with cron-based scheduling
- Price analysis and alert trigger services generating intelligent notifications

**Technical Constraints:**
- Must be a separate frontend application to enable independent deployment
- Must integrate with existing backend API without requiring backend changes
- Must support responsive design for desktop and tablet use
- Must maintain type safety end-to-end with TypeScript
- Must be production-ready with testing coverage

**User Profile:**
- Individual e-commerce sellers monitoring competitor products
- Comfortable with technical tools but need visual interface for daily operations
- Primary workflows: viewing price trends, responding to alerts, adding new products to monitor

**Design Approach:**
This design uses **frontend-design** and **ui-ux-pro-max** skills to create a distinctive, production-grade interface that avoids generic aesthetics. The UI will feature:
- **Aesthetic Direction**: Data-focused brutalist minimalism with typographic sophistication
- **Typography**: Sharp, technical typefaces (e.g., JetBrains Mono for data, DM Sans for UI text) paired with generous spacing
- **Color Strategy**: Monochromatic base (slate grays) with surgical accent colors for status indicators (green for positive trends, red for alerts, amber for warnings)
- **Motion**: Subtle, purposeful animations on data updates and state changes - staggered reveals on page load, smooth chart transitions
- **Layout**: Asymmetric grid with emphasis on data density - charts and metrics dominate, chrome is minimal
- **Details**: Custom data visualizations, gradient overlays on charts for depth, sharp borders, monospace numbers for price data

---

## Goals / Non-Goals

**Goals:**
- Create a functional, tested web UI that exposes all backend capabilities
- Implement responsive layouts optimized for desktop (1280px+) and tablet (768px+) viewports
- Establish reusable component patterns and hooks for future feature additions
- Ensure type-safe integration with backend API using generated TypeScript types
- Deliver production-ready code with component test coverage
- Create a visually distinctive interface that elevates the monitoring experience

**Non-Goals:**
- Mobile-first responsive design (desktop/tablet only for Phase 5)
- Real-time WebSocket updates (use polling/refetch for now)
- Offline-first / PWA capabilities
- User authentication (single-user system for Phase 5)
- Advanced data export features (CSV, PDF reports)
- Multi-language i18n support
- Dark mode toggle (will be implemented as default aesthetic choice)

---

## Decisions

### 1. Framework Choice: React 18 + Vite

**Decision**: Use React 18 with Vite as the build tool.

**Rationale**:
- React 18 provides mature ecosystem with extensive component libraries
- Vite offers fast HMR and optimal build performance vs. Create React App or webpack
- TypeScript support is first-class in both React and Vite
- Aligns with modern frontend standards for maintainability

**Alternatives Considered**:
- Vue 3: Excellent developer experience but smaller ecosystem for UI component libraries
- Next.js: Overkill for SPA without SSR requirements; adds complexity
- Plain TypeScript + Lit: More lightweight but requires building more components from scratch

### 2. UI Component Library: Shadcn/ui + Radix UI

**Decision**: Use Shadcn/ui components built on Radix UI primitives with Tailwind CSS.

**Rationale**:
- Copy-paste component approach gives full control over styling and behavior
- Radix UI provides accessible primitives (dialogs, dropdowns, forms) out of the box
- Tailwind CSS enables rapid custom styling to match distinctive aesthetic
- No runtime bundle cost - components are owned in source code
- Easy to customize typography, colors, spacing to avoid generic look

**Alternatives Considered**:
- Material-UI: Heavy bundle size, harder to customize away from Material Design aesthetic
- Ant Design: Opinionated Chinese design system, doesn't fit brutalist minimalism aesthetic
- Chakra UI: Runtime CSS-in-JS has performance overhead
- Build from scratch: Too time-consuming for production timeline

### 3. State Management: Zustand + React Query

**Decision**: Use Zustand for client state and React Query (@tanstack/react-query) for server state.

**Rationale**:
- Zustand: Minimal boilerplate, no context providers, simple API, <1KB bundle
- React Query: Handles caching, background refetching, optimistic updates automatically
- Clear separation: Zustand for UI state (current filters, selected items), React Query for API data
- Both integrate seamlessly with TypeScript

**Alternatives Considered**:
- Redux Toolkit: Too much boilerplate for this scale; React Query handles most server state needs
- Jotai/Recoil: More atomic but Zustand's single store pattern is simpler here
- React Context only: Would need manual caching and refetch logic

### 4. Data Visualization: Recharts

**Decision**: Use Recharts for price trend charts.

**Rationale**:
- React-native component API (declarative, JSX-based)
- Responsive by default with ResponsiveContainer
- Built on D3 but simpler API for common chart types (line, bar)
- Good TypeScript support
- Moderate bundle size (~100KB gzipped) acceptable for this use case

**Alternatives Considered**:
- Chart.js: Imperative API, less React-friendly
- D3.js directly: Too low-level, would need to build chart components from scratch
- Victory: Similar to Recharts but smaller community
- Lightweight canvas library (uPlot): Faster but limited styling options for aesthetic vision

### 5. Form Validation: React Hook Form + Zod

**Decision**: Use React Hook Form for form state management with Zod for schema validation.

**Rationale**:
- React Hook Form: Minimal re-renders, uncontrolled inputs by default, excellent performance
- Zod: TypeScript-first schema validation, inferred types, composable schemas
- Together they provide type-safe forms with clear error messages
- Integrates well with Shadcn/ui form components via @hookform/resolvers

**Alternatives Considered**:
- Formik: More boilerplate, larger bundle, older patterns
- Yup validation: Less TypeScript-friendly than Zod
- Browser native validation: Limited customization, poor UX

### 6. Routing: React Router v6

**Decision**: Use React Router v6 for client-side routing.

**Rationale**:
- Industry standard for React SPAs
- Declarative routing with nested routes support
- Good TypeScript support with typed params
- Stable API after v6 refactor

**Alternatives Considered**:
- TanStack Router: Newer, type-safe but less mature ecosystem
- Wouter: Minimal but lacks nested route features needed for layout

### 7. Testing Strategy: Vitest + React Testing Library

**Decision**: Use Vitest for test runner with React Testing Library for component tests.

**Rationale**:
- Vitest: Vite-native test runner, fast, Jest-compatible API, built-in TypeScript support
- React Testing Library: Encourages testing user behavior over implementation details
- Both align with modern frontend testing best practices

**Scope**: Focus on critical path components (form validation, data display logic). Full E2E testing deferred to Phase 6.

**Alternatives Considered**:
- Jest: Requires additional config for ESM/Vite, slower than Vitest
- Cypress component tests: Heavier, better for E2E

### 8. Aesthetic Implementation Strategy

**Decision**: Use CSS variables + Tailwind utilities with custom typeface loading and animation library integration.

**Approach**:
- Define CSS custom properties in `index.css` for color system (monochrome slate scale + accent colors)
- Load custom typefaces (JetBrains Mono, DM Sans) via Google Fonts or local files
- Use Tailwind's `animation-delay` utilities for staggered page load reveals
- Implement gradient overlays and borders via Tailwind arbitrary values and custom classes
- Use Recharts customization props for chart styling (stroke colors, grid styling, tooltip formatting)

**Key Styling Patterns**:
- Monospace numbers everywhere prices appear: `className="font-mono"`
- Sharp borders: `border-2` instead of default `border`
- Generous spacing: `gap-6` or `gap-8` instead of `gap-4`
- Muted backgrounds with overlays: `bg-gradient-to-br from-slate-50 to-slate-100`
- Accent color usage: Green for positive price changes, Red for negative/alerts, Amber for warnings

---

## Risks / Trade-offs

### 1. Bundle Size
**Risk**: Recharts + Shadcn/ui + React Router could push bundle over 500KB.
**Mitigation**: 
- Use code splitting via React.lazy for routes
- Tree-shake unused Recharts components
- Monitor bundle with `vite-plugin-visualizer`
- Target: Keep initial bundle under 300KB gzipped

### 2. API Latency on Slow Networks
**Risk**: Sequential API calls (products, then stats, then snapshots) could make page load slow.
**Mitigation**:
- Use React Query's parallel fetching where possible
- Show skeleton loaders during data fetch
- Implement stale-while-revalidate caching strategy
- Consider adding loading states with progress indicators

### 3. Type Drift Between Frontend and Backend
**Risk**: Backend API types could change without frontend knowing, causing runtime errors.
**Mitigation**:
- Maintain shared types in `frontend/src/types/index.ts` mirroring backend types
- Document type changes in backend API as breaking changes
- Future: Generate types from OpenAPI spec (deferred to Phase 6)

### 4. Chart Performance with Large Datasets
**Risk**: Rendering 1000+ price snapshots in Recharts could cause lag.
**Mitigation**:
- Limit snapshots fetched to last 30 days by default (handled in usePriceSnapshots hook)
- Add "Show More" pagination if needed
- Consider switching to canvas-based chart (uPlot) if performance issues arise

### 5. Aesthetic Consistency Across Components
**Risk**: Distinctive design direction could feel inconsistent if not applied uniformly.
**Mitigation**:
- Establish clear design tokens in CSS variables (typography scale, spacing scale, color palette)
- Create reusable component patterns (Card variants, Badge variants)
- Document component usage patterns in Storybook (deferred) or component JSDoc
- Use Tailwind's `@apply` for repeated style patterns

### 6. Mobile Responsive Behavior
**Risk**: Desktop-first design may not gracefully degrade to mobile.
**Trade-off**: Accepted for Phase 5 - explicitly targeting desktop/tablet only
**Future**: Add mobile-specific layouts in Phase 6 if user demand exists

### 7. Accessibility Compliance
**Risk**: Custom styling may break keyboard navigation or screen reader compatibility.
**Mitigation**:
- Use Radix UI primitives which have built-in a11y
- Test keyboard navigation on all interactive elements
- Ensure color contrast meets WCAG AA standards (4.5:1 for text)
- Add ARIA labels where semantic HTML isn't sufficient
- Use React Testing Library's a11y assertions in tests

---

## Open Questions

1. **Should we add alert rule creation/editing in the UI?**
   - Currently alerts are created by the backend trigger service
   - Adding CRUD for alert rules would require AlertRuleForm component
   - **Decision**: Defer to Phase 6 - focus on viewing existing alerts first

2. **Should we add manual "Check Now" button for products?**
   - Backend has `POST /api/products/:id/check` endpoint
   - Would require calling scraperService directly
   - **Decision**: Include in Product Detail page as "Refresh Price" button

3. **How should we handle stale data indication?**
   - Products not checked in 24+ hours could show staleness indicator
   - **Decision**: Add visual indicator (amber badge) on ProductCard if `lastCheckedAt` is >24h old

4. **Should Dashboard show price change trends over time?**
   - Could add small sparkline charts to metric cards
   - **Decision**: Defer - keep Dashboard simple with static metrics for Phase 5

5. **How should we handle concurrent edits?**
   - Multiple browser tabs could have conflicting product updates
   - **Decision**: Rely on React Query's refetch-on-focus to surface conflicts; no optimistic locking for Phase 5
