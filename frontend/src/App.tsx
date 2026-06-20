import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const ProductsList = lazy(() => import('@/pages/ProductsList').then((module) => ({ default: module.ProductsList })));
const ProductDetail = lazy(() => import('@/pages/ProductDetail').then((module) => ({ default: module.ProductDetail })));
const Opportunities = lazy(() => import('@/pages/Opportunities').then((module) => ({ default: module.Opportunities })));
const AlertsCenter = lazy(() => import('@/pages/AlertsCenter').then((module) => ({ default: module.AlertsCenter })));
const Chat = lazy(() => import('@/pages/Chat').then((module) => ({ default: module.Chat })));
const Settings = lazy(() => import('@/pages/Settings').then((module) => ({ default: module.Settings })));

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
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<ProductsList />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/alerts" element={<AlertsCenter />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:sessionId" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
