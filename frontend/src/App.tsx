import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ProductsList } from '@/pages/ProductsList';
import { ProductDetail } from '@/pages/ProductDetail';
import { AlertsCenter } from '@/pages/AlertsCenter';
import { Chat } from '@/pages/Chat';
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
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/alerts" element={<AlertsCenter />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

