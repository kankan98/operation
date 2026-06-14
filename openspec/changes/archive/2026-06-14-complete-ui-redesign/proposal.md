## Why

The current platform interface lacks the modern, professional aesthetic required for an AI-native cross-border e-commerce SaaS product. Users report the UI feels dated, cluttered, and doesn't inspire confidence compared to contemporary platforms like Stripe, Linear, and Shopify. With the AI agent capabilities at the core of this platform, the interface must reflect the intelligence and professionalism of the underlying system while remaining approachable and efficient for merchants managing complex international operations.

## What Changes

- **Complete visual redesign** following the established design system (docs/style.md) with Agent Purple (#8B5CF6) as primary brand color
- **Modernize layout structure** with 240px collapsible sidebar, card-based content organization, and soft 20px border radius throughout
- **Implement comprehensive design tokens** including 8pt spacing grid, Inter/PingFang SC typography system, and elevation-based shadow hierarchy
- **Add i18n support** for Chinese (简体中文) and English with language switcher in navigation
- **Redesign all major modules**: Dashboard with KPI cards, Product catalog with performance metrics, Alerts with priority-based visual hierarchy, Chat interface as AI copilot, Settings with integration cards
- **Establish component library** with standardized buttons (12px radius, 44px height), inputs (10px radius), badges (pill-shaped), data tables (64px rows), and chart components
- **Implement dark mode support** with #0F172A background maintaining the same visual elegance
- **Add micro-interactions** using 150-250ms ease-out transitions for hover, focus, and state changes

## Capabilities

### New Capabilities

- `design-system-tokens`: Design token system with colors (primary purple scale, neutrals, semantic), typography (Inter/PingFang SC with defined scales), spacing (8pt grid), shadows (3 elevation levels), and border radius values
- `i18n-framework`: Internationalization framework supporting Chinese and English with language detection, persistent user preference, and translation coverage for all UI strings
- `component-library`: Reusable component library including buttons (primary/secondary/ghost), inputs with validation states, badges with semantic colors, KPI cards with trend indicators, data tables with sorting/filtering, and chart components (line/donut with minimal styling)
- `navigation-system`: Sidebar navigation with collapsible state (240px ↔ 72px), icon-first hierarchy, rounded active states, and module organization (Dashboard, Products, Alerts, Chat, Settings)
- `dashboard-layout`: Dashboard module with KPI metric cards (sales, orders, ROAS, inventory), trend visualizations, product performance table, and alert summary
- `product-module`: Product catalog interface with image cards, status badges, revenue metrics, performance trends, inventory tracking, and AI recommendation callouts
- `alerts-module`: Priority-based alerts system with critical/warning/info levels, actionable recommendations, and anxiety-reducing presentation (what/why/action structure)
- `chat-interface`: AI copilot chat interface with suggested actions, message bubbles (assistant in Gray-50, user in Primary-50), and merchant-focused conversation patterns
- `settings-module`: Settings interface with categorized sections, integration cards showing logo + status, and team management

### Modified Capabilities

<!-- No existing capabilities are being modified - this is a complete redesign introducing new UI architecture -->

## Impact

**Frontend (Complete Overhaul)**
- All pages, components, and layouts require redesign
- Current styling (if any) will be replaced with new design system
- Component structure may need refactoring for consistency

**Dependencies & Tooling**
- Add i18n library (e.g., react-i18next, vue-i18n, or next-intl depending on stack)
- Add design token management system (CSS variables or styled-system)
- May require icon library matching reference aesthetic (Lucide, Phosphor, or Untitled UI icons)

**User Experience**
- **BREAKING**: Visual appearance changes completely - may require user onboarding for new navigation patterns
- Language switcher enables broader market reach (Chinese + English)
- Improved information hierarchy reduces cognitive load

**Development Workflow**
- Establishes component-driven development pattern
- Design tokens enable consistent theming and future customization
- Component library serves as foundation for future feature development

**Assets & Resources**
- Need to source/create brand assets (logo variants for light/dark mode)
- Integration logos for Settings module (Amazon, Shopify, eBay, TikTok Shop, Google Ads, Meta Ads)
- Placeholder images for product cards during development
