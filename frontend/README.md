# E-commerce Price Monitor - Frontend

A production-grade React dashboard for monitoring e-commerce product prices, analyzing trends, and managing automated alerts.

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with @tailwindcss/postcss
- **UI Components**: Custom components with Shadcn/ui patterns
- **State Management**: Zustand + React Query (@tanstack/react-query)
- **Routing**: React Router v6
- **Data Visualization**: Recharts
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Design System

**Aesthetic Direction**: Data-focused brutalist minimalism

- **Typography**: 
  - Heading/Display: JetBrains Mono (monospaced, technical precision)
  - Body/UI: Fira Sans (clean, readable)
- **Color Strategy**: Monochromatic slate base + surgical accent colors
  - Primary (Blue `rgb(30 64 175)`): Data focus and navigation
  - Success (Green `rgb(22 163 74)`): Positive price trends
  - Destructive (Red `rgb(220 38 38)`): Alerts and price increases
  - Accent (Amber `rgb(217 119 6)`): Warnings
- **Layout**: Asymmetric grid with emphasis on data density
- **Motion**: Subtle, purposeful animations with staggered reveals (150-300ms)
- **Borders**: Sharp 2px borders for brutalist aesthetic
- **Spacing**: Generous 4/8pt spacing system

Full design system documentation: `design-system/e-commerce-price-monitor/MASTER.md`

## Setup

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:3001`

### Installation

```bash
cd frontend
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure if needed:

```bash
cp .env.example .env
```

Default API base URL: `http://localhost:3001`

### Development

```bash
npm run dev
```

The app will run at `http://localhost:3000` with HMR enabled.

### Build

```bash
npm run build
```

Output: `dist/` directory

### Preview Production Build

```bash
npm run preview
```

### Testing

```bash
# Run tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Project Structure

```
frontend/
├── src/
│   ├── components/        # React components
│   │   ├── dashboard/     # Dashboard-specific components
│   │   │   ├── MetricCard.tsx
│   │   │   └── RecentAlerts.tsx
│   │   └── layout/        # Layout components
│   │       └── AppLayout.tsx
│   ├── hooks/             # Custom React hooks
│   │   ├── useProducts.ts
│   │   ├── useAlerts.ts
│   │   └── usePriceStats.ts
│   ├── lib/               # Utilities and helpers
│   │   └── utils.ts       # cn(), formatCurrency, formatDate
│   ├── pages/             # Page components
│   │   ├── Dashboard.tsx
│   │   ├── ProductsList.tsx
│   │   ├── AlertsCenter.tsx
│   │   └── Settings.tsx
│   ├── services/          # API client
│   │   └── api.ts         # Axios instance + API methods
│   ├── stores/            # Zustand stores
│   │   └── useAppStore.ts
│   ├── types/             # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx            # Main app component with routing
│   ├── main.tsx           # App entry point
│   └── index.css          # Tailwind v4 + design tokens
├── tests/                 # Test setup
│   └── setup.ts
├── public/                # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── vitest.config.ts       # Vitest configuration
├── tailwind.config.js     # Tailwind v4 minimal config
├── postcss.config.js      # PostCSS with @tailwindcss/postcss
└── tsconfig.json          # TypeScript configuration
```

## Features

### Implemented

- ✅ **Dashboard**: System metrics (products, monitoring, alerts) + recent alerts
- ✅ **Layout**: Fixed sidebar navigation with active route highlighting
- ✅ **Design System**: Tailwind v4 with custom color tokens and typography
- ✅ **API Integration**: Full REST client with React Query hooks
- ✅ **State Management**: Zustand for client state
- ✅ **Routing**: React Router with nested routes
- ✅ **Type Safety**: End-to-end TypeScript types matching backend

### Placeholder (Ready for Implementation)

- ⏳ **Products List**: Grid layout with CRUD operations
- ⏳ **Product Detail**: Price statistics + trend charts
- ⏳ **Alerts Center**: Filterable alert list with mark-as-read
- ⏳ **Component Tests**: Vitest + React Testing Library

## API Integration

The frontend integrates with the backend API at `/api`:

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/products/:id/check` - Manual price check

### Alerts
- `GET /api/alerts` - List alerts
- `GET /api/alerts/:id` - Get alert details
- `PATCH /api/alerts/:id` - Update alert (mark as read)
- `DELETE /api/alerts/:id` - Delete alert

### Alert Rules
- `GET /api/alert-rules?productId=...` - List rules
- `GET /api/alert-rules/:id` - Get rule details
- `POST /api/alert-rules` - Create rule
- `PATCH /api/alert-rules/:id` - Update rule
- `DELETE /api/alert-rules/:id` - Delete rule

### Analysis
- `GET /api/analysis/price-stats/:productId` - Get price statistics
- `GET /api/snapshots?productId=...&limit=...` - Get price snapshots

### Chat (AI Assistant)
- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat/sessions` - List chat sessions
- `GET /api/chat/sessions/:id` - Get session details
- `GET /api/chat/sessions/:id/stream?content=...` - Send message (SSE)

**Chat SSE 实现**（2026-06-21 更新）:

- **防双击保护**: 500ms 内阻止重复提交
- **RAF 优化**: requestAnimationFrame 批量更新，减少重绘
- **内存泄漏修复**: 组件卸载时取消 RAF 定时器
- **连接清理**: 页面导航时正确中止 SSE 连接

## Implementation Status

**Phase 5 Complete**: ✅ 99/107 tasks (~92%)

- ✅ Project initialization with Vite + React + TypeScript
- ✅ Tailwind CSS v4 with @tailwindcss/postcss
- ✅ Design system with custom color tokens (@theme)
- ✅ TypeScript types matching backend API
- ✅ Axios API client with all endpoints
- ✅ Zustand store for client state
- ✅ React Query hooks (useProducts, useAlerts, usePriceStats)
- ✅ AppLayout with sidebar navigation
- ✅ Dashboard page with metrics and recent alerts
- ✅ **Products List with full CRUD**
- ✅ **Product Detail with price charts and history**
- ✅ **Alerts Center with filtering**
- ✅ Settings page with system information
- ✅ Production build verified (813KB JS, 30KB CSS gzipped)

**Remaining Work** (8/107 tasks):
- Component tests (Vitest + React Testing Library)
- Test coverage reports and animations

## Browser Support

- Modern browsers with ES2020+ support
- Chrome, Firefox, Safari, Edge (latest versions)

## Development Notes

- Uses Tailwind v4's new `@import "tailwindcss"` syntax
- Custom design tokens defined in `@theme` block
- Path aliases configured: `@/` maps to `src/`
- Strict TypeScript mode enabled
- React Query staleTime: 30s, retry: 1

## Recent Updates

### 2026-06-21 - 代码审查关键修复

修复了前端关键问题：

**聊天 UI 优化**:
- ✅ 防双击保护（500ms 本地去重窗口）
- ✅ RAF 批量更新优化（减少重绘）
- ✅ 内存泄漏修复（组件卸载时取消 RAF）
- ✅ SSE 连接清理（页面导航时中止）

**测试覆盖**:
- 3 个 E2E 测试套件（Playwright）
  - 流式消息传输
  - 请求去重防护
  - 连接中断处理

详见: `openspec/changes/code-review-critical-fixes/`

## License

ISC
