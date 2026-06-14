## Why

The backend monitoring system (Phases 1-4) has built a complete data collection and analysis infrastructure with product monitoring, price tracking, automated scraping, and intelligent alerts. However, users currently have no visual interface to interact with the system. A web-based dashboard is essential to make the system accessible, allowing users to view products, analyze price trends, manage alerts, and configure monitoring rules through an intuitive UI.

## What Changes

- Create a React + TypeScript frontend application with Vite build tooling
- Implement responsive dashboard UI with sidebar navigation using Shadcn/ui components
- Add Dashboard overview page displaying key metrics (product count, monitoring status, unread alerts)
- Add Products list page with CRUD operations (add, edit, delete products)
- Add Product detail page with price trend visualization using Recharts
- Add Alerts center page with filtering and management (mark as read, delete)
- Add Settings page for system configuration
- Integrate with existing backend API using axios for HTTP requests
- Implement state management with Zustand for global app state
- Add form validation using React Hook Form + Zod
- Include component tests using Vitest + React Testing Library

## Capabilities

### New Capabilities
- `dashboard-overview`: Display system-wide metrics including total products, monitoring count, unread alerts, and recent alert feed
- `product-list-ui`: Browse, filter, and manage products with card-based layout supporting CRUD operations via dialog forms
- `product-detail-ui`: View individual product information with price history chart, statistics (current/highest/lowest/average prices), and price change indicators
- `price-chart-visualization`: Interactive line chart showing price trends over time using Recharts with formatted tooltips and responsive design
- `alert-center-ui`: View, filter (by severity, read status), and manage alerts with bulk operations (mark all as read)
- `settings-ui`: Display system information and configuration options
- `app-layout`: Responsive application layout with sidebar navigation, routing, and consistent styling using Tailwind CSS

### Modified Capabilities
<!-- No existing capabilities are being modified - this is a net-new frontend layer -->

## Impact

**New Components:**
- `frontend/` directory with complete React application structure
- 5 page components: Dashboard, ProductsList, ProductDetail, AlertsCenter, Settings
- Reusable UI components: ProductCard, ProductForm, AlertCard, MetricCard, PriceTrendChart, Sidebar, AppLayout
- Custom hooks for data fetching: useProducts, useAlerts, usePriceStats, usePriceSnapshots
- Zustand store for client-side state management
- API service layer with typed axios client

**Dependencies:**
- New npm packages: react, react-router-dom, @tanstack/react-query, zustand, recharts, react-hook-form, zod, tailwindcss, shadcn/ui components, lucide-react icons

**Backend Integration:**
- Consumes all existing backend APIs (products, alerts, alert-rules, analysis endpoints)
- No backend changes required - frontend is a pure consumer layer
- Proxy configuration in Vite for `/api` requests to `localhost:3001`

**Development Workflow:**
- Separate dev server on port 3000
- Independent build and deployment from backend
- Can be developed and tested in parallel with backend changes
