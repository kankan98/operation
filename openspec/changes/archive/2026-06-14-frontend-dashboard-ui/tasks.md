# Frontend Dashboard UI - Implementation Tasks

## 1. Project Initialization and Dependencies

- [x] 1.1 Create frontend directory using Vite with React-TypeScript template
- [x] 1.2 Install core dependencies (react-router-dom, zustand, axios, zod, react-hook-form, @hookform/resolvers)
- [x] 1.3 Install UI dependencies (@tanstack/react-query, recharts, date-fns, clsx, tailwind-merge, lucide-react)
- [x] 1.4 Install dev dependencies (tailwindcss, postcss, autoprefixer, vitest, @testing-library/react, @testing-library/jest-dom, jsdom)
- [x] 1.5 Initialize Tailwind CSS with postcss config
- [x] 1.6 Configure vite.config.ts with path aliases, proxy, and test setup
- [x] 1.7 Update tsconfig.json with path mapping and strict mode
- [x] 1.8 Create tests/setup.ts for Vitest configuration
- [x] 1.9 Create index.html with root div
- [x] 1.10 Update package.json scripts (dev, build, preview, test)

## 2. Base Styles and Design System

- [x] 2.1 Initialize Shadcn/ui with components.json config
- [x] 2.2 Create src/index.css with CSS variables for color system (monochromatic slate + green/red/amber accents)
- [x] 2.3 Load custom fonts (JetBrains Mono for monospace, DM Sans for UI)
- [x] 2.4 Install Shadcn/ui components (button, card, input, label, select, badge, table, dialog, form, dropdown-menu)
- [x] 2.5 Create src/lib/utils.ts with cn() helper and formatting utilities (formatCurrency, formatDate, formatDateTime)

## 3. TypeScript Types and API Client

- [x] 3.1 Create src/types/index.ts with all backend types (Product, PriceSnapshot, Alert, AlertRule, PriceStats, DashboardStats)
- [x] 3.2 Create src/services/api.ts with axios instance configured for /api base URL
- [x] 3.3 Implement productsApi methods (list, get, create, update, delete, checkNow)
- [x] 3.4 Implement snapshotsApi methods (list by productId)
- [x] 3.5 Implement alertsApi methods (list, get, update, delete)
- [x] 3.6 Implement alertRulesApi methods (list, get, create, update, delete)
- [x] 3.7 Implement analysisApi methods (priceStats)

## 4. State Management

- [x] 4.1 Create src/stores/useAppStore.ts with Zustand store
- [x] 4.2 Implement products state (products array, setProducts, addProduct, updateProduct, removeProduct)
- [x] 4.3 Implement alerts state (alerts array, setAlerts, markAlertAsRead, removeAlert)

## 5. Custom Hooks

- [x] 5.1 Create src/hooks/useProducts.ts with useProducts hook (useQuery with filters)
- [x] 5.2 Implement useProduct hook for single product fetch
- [x] 5.3 Implement useCreateProduct mutation with optimistic update
- [x] 5.4 Implement useUpdateProduct mutation with cache invalidation
- [x] 5.5 Implement useDeleteProduct mutation
- [x] 5.6 Create src/hooks/useAlerts.ts with useAlerts hook (useQuery with filters)
- [x] 5.7 Implement useMarkAlertAsRead mutation
- [x] 5.8 Implement useDeleteAlert mutation
- [x] 5.9 Create src/hooks/usePriceStats.ts with usePriceStats hook
- [x] 5.10 Implement usePriceSnapshots hook

## 6. Layout Components

- [x] 6.1 Create src/components/layout/AppLayout.tsx with sidebar and main content area
- [x] 6.2 Implement Sidebar with navigation links (Dashboard, Products, Alerts, Settings)
- [x] 6.3 Add active route highlighting to sidebar links
- [x] 6.4 Add Lucide React icons to navigation items
- [x] 6.5 Create responsive layout with Outlet for nested routes

## 7. Dashboard Components

- [x] 7.1 Create src/components/dashboard/MetricCard.tsx displaying title, value, icon, and description
- [x] 7.2 Create src/components/dashboard/RecentAlerts.tsx showing last 5 alerts with severity badges
- [x] 7.3 Implement alert click handler to navigate to alerts center
- [x] 7.4 Create src/pages/Dashboard.tsx fetching products and alerts data
- [x] 7.5 Calculate dashboard metrics (total products, monitoring count, unread alerts)
- [x] 7.6 Render 4 MetricCard components in grid layout
- [x] 7.7 Render RecentAlerts component

## 8. Products List Components

- [x] 8.1 Create src/components/products/ProductCard.tsx displaying product info in card format
- [x] 8.2 Add product image, title, platform, price, and monitoring badge to card
- [x] 8.3 Implement action buttons (View, Edit, External Link, Delete) on card footer
- [x] 8.4 Create src/components/products/ProductForm.tsx with React Hook Form
- [x] 8.5 Implement form validation using Zod schema (platform, productUrl, asin, title, currency, isMonitoring, checkInterval)
- [x] 8.6 Add platform select dropdown (Amazon, Walmart, AliExpress, eBay, Other)
- [x] 8.7 Add conditional checkInterval input shown only when isMonitoring is true
- [x] 8.8 Create src/pages/ProductsList.tsx with products grid layout
- [x] 8.9 Implement Add Product dialog with ProductForm
- [x] 8.10 Implement Edit Product dialog pre-filled with selected product data
- [x] 8.11 Implement delete confirmation dialog
- [x] 8.12 Wire up CRUD operations using custom hooks

## 9. Product Detail Components

- [x] 9.1 Create src/components/products/PriceTrendChart.tsx using Recharts
- [x] 9.2 Configure LineChart with x-axis (formatted dates, -45 degree rotation), y-axis (formatted prices)
- [x] 9.3 Add CartesianGrid, Tooltip with formatted currency values
- [x] 9.4 Create src/pages/ProductDetail.tsx with product details layout
- [x] 9.5 Add back navigation button and external product link
- [x] 9.6 Render price statistics cards (current, highest, lowest, average, change, change %)
- [x] 9.7 Display PriceTrendChart component with last 30 snapshots
- [x] 9.8 Create price snapshots history table with columns (timestamp, price, availability, rating)
- [x] 9.9 Add price change indicators (up/down arrows) in table rows
- [x] 9.10 Implement "Check Now" button to manually trigger price check
- [x] 9.11 Show monitoring status badge and platform badge
- [x] 9.12 Display brand and product title in header
- [x] 9.13 Handle loading and error states
- [x] 9.14 Add responsive grid layout for statistics cards

## 10. Alerts Center Components

- [x] 10.1 Create src/components/alerts/AlertItem.tsx with severity-based styling
- [x] 10.2 Add Mark as Read and Delete action buttons to alert items
- [x] 10.3 Create src/pages/AlertsCenter.tsx with alerts list layout
- [x] 10.4 Implement filter tabs (All, Unread, Critical, Warning, Info) with counts
- [x] 10.5 Add advanced filter dropdowns (severity, alert type)
- [x] 10.6 Wire up filter logic to alerts list
- [x] 10.7 Add empty state for when no alerts match filters

## 11. Settings Page

- [x] 11.1 Create src/pages/Settings.tsx with settings layout
- [x] 11.2 Add system information section (backend status, API version, frontend version)
- [x] 11.3 Add about section with application description

## 12. Routing and App Entry

- [x] 12.1 Create src/App.tsx with BrowserRouter and Routes
- [x] 12.2 Configure QueryClientProvider with default options
- [x] 12.3 Define routes (/, /products, /products/:id, /alerts, /settings)
- [x] 12.4 Wrap routes with AppLayout component
- [x] 12.5 Add Outlet to AppLayout for nested route rendering
- [x] 12.6 Update src/main.tsx to render App with StrictMode
- [x] 12.7 Import index.css in main.tsx

## 13. Component Tests

- [x] 13.1 Write test for MetricCard component (renders title, value, description)
- [x] 13.2 Write test for ProductCard component (displays product info, handles button clicks)
- [x] 13.3 Write test for formatCurrency utility (formats USD correctly)
- [x] 13.4 Write test for formatDate utility (formats timestamp correctly)
- [x] 13.5 Run all tests and verify they pass

## 14. Final Integration and Polish

- [x] 14.1 Create frontend/.env.example with VITE_API_BASE_URL
- [x] 14.2 Create frontend/README.md with setup instructions and tech stack
- [x] 14.3 Test dev server startup (npm run dev)
- [x] 14.4 Test navigation between all pages
- [x] 14.5 Test product CRUD flow end-to-end
- [x] 14.6 Test alert management flow
- [x] 14.7 Test price chart rendering with real data
- [x] 14.8 Verify responsive layout on different screen sizes
- [x] 14.9 Run production build (npm run build)
- [x] 14.10 Verify build succeeds with no errors or warnings

