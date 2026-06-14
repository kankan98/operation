import { Product, Alert, PriceSnapshot, PriceStats } from '../../src/types';

/**
 * Mock data factories for frontend tests.
 */

export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: 'test-product-1',
    platform: 'amazon',
    productUrl: 'https://www.amazon.com/dp/B08N5WRWNW',
    asin: 'B08N5WRWNW',
    title: 'Apple AirPods Pro (2nd Generation)',
    brand: 'Apple',
    category: 'Electronics',
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg',
    currentPrice: 249.99,
    currency: 'USD',
    isMonitoring: true,
    monitorType: 'automatic',
    checkInterval: 3600,
    userId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastCheckedAt: Date.now(),
    metadata: null,
    ...overrides,
  };
}

export function createMockProducts(count: number): Product[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({
      id: `test-product-${i + 1}`,
      title: `Test Product ${i + 1}`,
      asin: `B08N${String(i).padStart(6, '0')}`,
      currentPrice: 99.99 + i * 10,
    })
  );
}

export function createMockAlert(overrides?: Partial<Alert>): Alert {
  return {
    id: 'test-alert-1',
    ruleId: 'test-rule-1',
    productId: 'test-product-1',
    alertType: 'price_threshold',
    severity: 'info',
    title: 'Price dropped below threshold',
    message: 'The price has dropped to $199.99',
    dataSnapshot: JSON.stringify({ price: 199.99, threshold: 230.0 }),
    isRead: false,
    isArchived: false,
    notifiedAt: null,
    createdAt: Date.now(),
    ...overrides,
  };
}

export function createMockAlerts(count: number): Alert[] {
  const severities: Array<'info' | 'warning' | 'critical'> = ['info', 'warning', 'critical'];
  return Array.from({ length: count }, (_, i) =>
    createMockAlert({
      id: `test-alert-${i + 1}`,
      title: `Alert ${i + 1}`,
      severity: severities[i % 3],
      isRead: i % 2 === 0,
    })
  );
}

export function createMockPriceSnapshot(overrides?: Partial<PriceSnapshot>): PriceSnapshot {
  return {
    id: 'test-snapshot-1',
    productId: 'test-product-1',
    price: 249.99,
    currency: 'USD',
    availability: 'In Stock',
    rating: 4.5,
    reviewCount: 12345,
    salesRank: 42,
    shippingCost: 0,
    seller: 'Amazon.com',
    condition: 'New',
    timestamp: Date.now(),
    metadata: null,
    ...overrides,
  };
}

export function createMockPriceSnapshots(count: number, productId: string): PriceSnapshot[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) =>
    createMockPriceSnapshot({
      id: `test-snapshot-${i + 1}`,
      productId,
      timestamp: now - i * 3600000, // 1 hour apart
      price: 249.99 - i * 10, // Decreasing price
    })
  );
}

export function createMockPriceStats(overrides?: Partial<PriceStats>): PriceStats {
  return {
    currentPrice: 249.99,
    highestPrice: 299.99,
    lowestPrice: 199.99,
    averagePrice: 249.99,
    priceChange: -50.0,
    priceChangePercent: -16.67,
    dataPoints: 10,
    ...overrides,
  };
}
