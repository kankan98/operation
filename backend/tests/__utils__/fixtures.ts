import { randomUUID } from 'crypto';

/**
 * Test data factory functions for creating mock entities.
 * Each factory returns a complete, valid object with sensible defaults.
 * Override specific fields by passing an object with the desired values.
 */

export interface MockProduct {
  id: string;
  platform: string;
  productUrl: string;
  asin: string | null;
  title: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  currentPrice: number | null;
  currency: string;
  isMonitoring: boolean;
  monitorType: string | null;
  checkInterval: number;
  userId: string | null;
  createdAt: number;
  updatedAt: number | null;
  lastCheckedAt: number | null;
  metadata: string | null;
}

export interface MockPriceSnapshot {
  id: string;
  productId: string;
  price: number;
  currency: string;
  availability: string;
  rating: number | null;
  reviewCount: number | null;
  salesRank: number | null;
  shippingCost: number | null;
  seller: string | null;
  condition: string | null;
  timestamp: number;
  metadata: string | null;
}

export interface MockAlert {
  id: string;
  ruleId: string | null;
  productId: string;
  alertType: string;
  severity: string;
  title: string;
  message: string | null;
  dataSnapshot: string | null;
  isRead: boolean;
  isArchived: boolean;
  notifiedAt: number | null;
  createdAt: number;
}

export interface MockAlertRule {
  id: string;
  productId: string;
  ruleType: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  severity: string;
  createdAt: number;
  updatedAt: number | null;
}

/**
 * Creates a mock product with realistic defaults.
 */
export function createMockProduct(overrides?: Partial<MockProduct>): MockProduct {
  const now = Date.now();
  return {
    id: randomUUID(),
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
    createdAt: now,
    updatedAt: now,
    lastCheckedAt: now,
    metadata: null,
    ...overrides,
  };
}

/**
 * Creates a mock price snapshot with realistic defaults.
 */
export function createMockPriceSnapshot(overrides?: Partial<MockPriceSnapshot>): MockPriceSnapshot {
  const now = Date.now();
  return {
    id: randomUUID(),
    productId: randomUUID(),
    price: 249.99,
    currency: 'USD',
    availability: 'In Stock',
    rating: 4.5,
    reviewCount: 12345,
    salesRank: 42,
    shippingCost: 0,
    seller: 'Amazon.com',
    condition: 'New',
    timestamp: now,
    metadata: null,
    ...overrides,
  };
}

/**
 * Creates a mock alert with realistic defaults.
 */
export function createMockAlert(overrides?: Partial<MockAlert>): MockAlert {
  const now = Date.now();
  return {
    id: randomUUID(),
    ruleId: randomUUID(),
    productId: randomUUID(),
    alertType: 'price_threshold',
    severity: 'info',
    title: 'Price dropped below threshold',
    message: 'The price has dropped to $199.99, which is below your threshold of $230.00',
    dataSnapshot: JSON.stringify({ price: 199.99, threshold: 230.0 }),
    isRead: false,
    isArchived: false,
    notifiedAt: null,
    createdAt: now,
    ...overrides,
  };
}

/**
 * Creates a mock alert rule with realistic defaults.
 */
export function createMockAlertRule(overrides?: Partial<MockAlertRule>): MockAlertRule {
  const now = Date.now();
  return {
    id: randomUUID(),
    productId: randomUUID(),
    ruleType: 'price_threshold',
    condition: 'below',
    threshold: 230.0,
    enabled: true,
    severity: 'info',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Creates multiple mock products at once.
 */
export function createMockProducts(count: number, overrides?: Partial<MockProduct>): MockProduct[] {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({
      title: `Test Product ${i + 1}`,
      asin: `B08N${String(i).padStart(6, '0')}`,
      ...overrides,
    })
  );
}

/**
 * Creates multiple mock price snapshots at once.
 */
export function createMockPriceSnapshots(
  count: number,
  productId: string,
  overrides?: Partial<MockPriceSnapshot>
): MockPriceSnapshot[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) =>
    createMockPriceSnapshot({
      productId,
      timestamp: now - i * 3600000, // 1 hour apart
      price: 249.99 - i * 10, // Price decreasing
      ...overrides,
    })
  );
}
