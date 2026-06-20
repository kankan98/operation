import { describe, expect, it, beforeEach, vi } from 'vitest';
import request from 'supertest';

const mockProductService = vi.hoisted(() => ({
  getProductById: vi.fn(),
}));

const mockRefreshService = vi.hoisted(() => ({
  refreshProduct: vi.fn(),
}));

const mockSnapshotService = vi.hoisted(() => ({
  getLatestSnapshot: vi.fn(),
  getSnapshotHistory: vi.fn(),
}));

const mockHealthService = vi.hoisted(() => ({
  getKeepaHealth: vi.fn(),
}));

vi.mock('../src/services/productService', () => ({
  ProductService: vi.fn(function ProductService() {
    return mockProductService;
  }),
}));

vi.mock('../src/services/marketSignalRefreshService', () => ({
  MarketSignalRefreshService: vi.fn(function MarketSignalRefreshService() {
    return mockRefreshService;
  }),
}));

vi.mock('../src/services/marketSignalSnapshotService', () => ({
  MarketSignalSnapshotService: vi.fn(function MarketSignalSnapshotService() {
    return mockSnapshotService;
  }),
}));

vi.mock('../src/services/marketSignalHealthService', () => ({
  MarketSignalHealthService: vi.fn(function MarketSignalHealthService() {
    return mockHealthService;
  }),
}));

import { createApp } from '../src/app';

const app = createApp();

const product = {
  id: 'product-1',
  platform: 'amazon',
  productUrl: 'https://amazon.com/dp/B000SIG001',
  asin: 'B000SIG001',
  title: 'Signal Product',
  currency: 'USD',
  isMonitoring: true,
  checkInterval: 24,
  createdAt: 1,
};

const snapshot = {
  id: 'snapshot-1',
  productId: product.id,
  platform: 'amazon',
  provider: 'keepa',
  source: 'third_party',
  asin: 'B000SIG001',
  marketplace: 'amazon.com',
  windowDays: 90,
  confidence: 0.82,
  freshnessMs: 3600,
  priceTrend: {
    current: 44.99,
    average: 49.99,
    lowest: 42.99,
    highest: 55.99,
    changePercent: -10,
    volatility: 0.12,
    direction: 'down',
    dataPoints: 12,
    firstObservedAt: 1000,
    lastObservedAt: 2000,
  },
  salesRankTrend: null,
  reviewVelocity: 1.2,
  ratingMovement: 0.1,
  missingSignals: [],
  metadata: { tokensLeft: 42 },
  createdAt: 2000,
};

describe('Market signals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProductService.getProductById.mockResolvedValue(product);
    mockRefreshService.refreshProduct.mockResolvedValue({
      success: true,
      productId: product.id,
      provider: 'keepa',
      source: 'third_party',
      snapshotId: snapshot.id,
      confidence: 0.82,
      timestamp: 2000,
      durationMs: 120,
    });
    mockSnapshotService.getLatestSnapshot.mockResolvedValue(snapshot);
    mockSnapshotService.getSnapshotHistory.mockResolvedValue([snapshot]);
    mockHealthService.getKeepaHealth.mockResolvedValue({
      provider: 'keepa',
      source: 'third_party',
      platform: 'amazon',
      status: 'healthy',
      window: { windowHours: 24, since: 1000, until: 2000 },
      attemptCount: 1,
      successCount: 1,
      failureCount: 0,
      successRate: 1,
      averageDurationMs: 120,
      latestSuccessTimestamp: 2000,
      latestFailureReason: null,
      failureReasons: {},
      rootCauses: {},
      recommendations: [],
    });
  });

  it('refreshes product market signals', async () => {
    const response = await request(app)
      .post('/api/products/product-1/market-signals/refresh')
      .expect(200);

    expect(mockProductService.getProductById).toHaveBeenCalledWith('product-1');
    expect(mockRefreshService.refreshProduct).toHaveBeenCalledWith(product);
    expect(response.body).toMatchObject({
      success: true,
      provider: 'keepa',
      source: 'third_party',
      snapshotId: 'snapshot-1',
    });
  });

  it('returns structured refresh failures without leaking credentials', async () => {
    mockRefreshService.refreshProduct.mockResolvedValue({
      success: false,
      productId: product.id,
      provider: 'keepa',
      source: 'third_party',
      failureReason: 'provider_unavailable',
      rootCause: 'quota_exhausted',
      error: 'Keepa token quota exhausted',
      diagnostics: {
        rootCause: 'quota_exhausted',
        tokensLeft: 0,
        sanitizedMessage: 'Quota exhausted',
      },
      timestamp: 2000,
      durationMs: 40,
    });

    const response = await request(app)
      .post('/api/products/product-1/market-signals/refresh')
      .expect(200);

    expect(response.body).toMatchObject({
      success: false,
      failureReason: 'provider_unavailable',
      rootCause: 'quota_exhausted',
    });
    expect(JSON.stringify(response.body)).not.toContain('KEEPA_API_KEY');
    expect(JSON.stringify(response.body)).not.toContain('Authorization');
  });

  it('returns unsupported product refresh failures as structured results', async () => {
    mockRefreshService.refreshProduct.mockResolvedValue({
      success: false,
      productId: product.id,
      provider: 'keepa',
      source: 'third_party',
      failureReason: 'unsupported_product',
      rootCause: 'unsupported_product',
      error: 'A deterministic Amazon ASIN is required',
      timestamp: 2000,
      durationMs: 0,
    });

    const response = await request(app)
      .post('/api/products/product-1/market-signals/refresh')
      .expect(200);

    expect(response.body.failureReason).toBe('unsupported_product');
    expect(response.body.rootCause).toBe('unsupported_product');
  });

  it('returns latest market signals and an explicit missing state', async () => {
    const fresh = await request(app)
      .get('/api/products/product-1/market-signals/latest')
      .expect(200);

    expect(fresh.body.status).toBe('fresh');
    expect(fresh.body.data.id).toBe(snapshot.id);
    expect(fresh.body.caveat).toContain('not verified sales');

    mockSnapshotService.getLatestSnapshot.mockResolvedValueOnce(null);

    const missing = await request(app)
      .get('/api/products/product-1/market-signals/latest')
      .expect(200);

    expect(missing.body).toMatchObject({
      data: null,
      status: 'missing',
      missingSignals: ['market_history'],
    });
  });

  it('returns bounded market signal history and validates limits', async () => {
    const response = await request(app)
      .get('/api/products/product-1/market-signals/history?limit=2')
      .expect(200);

    expect(mockSnapshotService.getSnapshotHistory).toHaveBeenCalledWith(
      'product-1',
      { limit: 2 }
    );
    expect(response.body.data).toHaveLength(1);

    await request(app)
      .get('/api/products/product-1/market-signals/history?limit=0')
      .expect(400);
  });

  it('returns Keepa market signal provider health and validates query params', async () => {
    const response = await request(app)
      .get('/api/market-signals/providers/keepa/health?windowHours=12&productId=product-1')
      .expect(200);

    expect(mockHealthService.getKeepaHealth).toHaveBeenCalledWith({
      windowHours: 12,
      productId: 'product-1',
    });
    expect(response.body.status).toBe('healthy');

    await request(app)
      .get('/api/market-signals/providers/keepa/health?windowHours=0')
      .expect(400);
  });

  it('returns 404 for unknown products', async () => {
    mockProductService.getProductById.mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/api/products/missing/market-signals/latest')
      .expect(404);

    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });
});
