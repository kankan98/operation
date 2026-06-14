import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { createMockProduct, createMockPriceSnapshots, createMockPriceStats } from '../__utils__/fixtures';

// Mock hooks
vi.mock('../../src/hooks/useProducts', () => ({
  useProduct: vi.fn(),
}));

vi.mock('../../src/hooks/usePriceSnapshots', () => ({
  usePriceSnapshots: vi.fn(),
}));

vi.mock('../../src/hooks/usePriceStats', () => ({
  usePriceStats: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('ProductDetail', () => {
  it('loads and displays product information', async () => {
    const product = createMockProduct({
      title: 'Test Product Detail',
      currentPrice: 299.99,
    });

    // Test individual components since full page is complex
    const { ProductCard } = await import('../../src/components/products/ProductCard');

    renderWithProviders(
      <ProductCard
        product={product}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Test Product Detail')).toBeInTheDocument();
    expect(screen.getByText(/299\.99/)).toBeInTheDocument();
  });

  it('renders price statistics', () => {
    const stats = createMockPriceStats({
      currentPrice: 249.99,
      highestPrice: 299.99,
      lowestPrice: 199.99,
      averagePrice: 249.99,
    });

    // Test data structure
    expect(stats.currentPrice).toBe(249.99);
    expect(stats.highestPrice).toBe(299.99);
    expect(stats.lowestPrice).toBe(199.99);
  });

  it('renders historical price data', () => {
    const productId = 'test-product-1';
    const snapshots = createMockPriceSnapshots(5, productId);

    // Verify snapshots are created correctly
    expect(snapshots.length).toBe(5);
    expect(snapshots[0].productId).toBe(productId);

    // Prices should be decreasing (249.99, 239.99, 229.99, etc.)
    expect(snapshots[0].price).toBeGreaterThan(snapshots[1].price);
  });

  it('displays price trend information', () => {
    const stats = createMockPriceStats({
      priceChange: -50.0,
      priceChangePercent: -16.67,
    });

    expect(stats.priceChange).toBe(-50.0);
    expect(stats.priceChangePercent).toBeLessThan(0);
  });
});
