import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../src/db';
import {
  alertRules,
  alerts,
  marketSignalAttempts,
  marketSignalSnapshots,
  priceSnapshots,
  productBusinessSignals,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { KeepaMarketSignalProvider } from '../src/providers/keepaMarketSignalProvider';
import { MarketSignalHealthService } from '../src/services/marketSignalHealthService';
import { MarketSignalRefreshService } from '../src/services/marketSignalRefreshService';
import { MarketSignalSnapshotService } from '../src/services/marketSignalSnapshotService';
import { ProductService } from '../src/services/productService';
import { Product } from '../src/types';

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function response(payload: unknown, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => payload,
  };
}

function keepaPayload() {
  return response({
    products: [
      {
        asin: 'B000SIG001',
        title: 'Signal Product',
        priceHistory: [
          { timestamp: NOW - 10 * DAY, value: 49.99 },
          { timestamp: NOW - DAY, value: 44.99 },
        ],
        salesRankHistory: [
          { timestamp: NOW - 10 * DAY, value: 2000 },
          { timestamp: NOW - DAY, value: 1300 },
        ],
        reviewCountHistory: [
          { timestamp: NOW - 10 * DAY, value: 50 },
          { timestamp: NOW - DAY, value: 62 },
        ],
        ratingHistory: [
          { timestamp: NOW - 10 * DAY, value: 4.1 },
          { timestamp: NOW - DAY, value: 4.3 },
        ],
      },
    ],
  });
}

describe('market signal services', () => {
  const productService = new ProductService();
  const snapshotService = new MarketSignalSnapshotService();
  const healthService = new MarketSignalHealthService();
  let product: Product;

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    for (const migrationName of [
      '002-product-data-acquisition.sql',
      '003-opportunity-business-signals.sql',
      '004-ebay-browse-provider.sql',
      '005-keepa-market-signals.sql',
    ]) {
      sqlite.exec(
        fs.readFileSync(path.resolve('migrations', migrationName), 'utf-8')
      );
    }
    sqlite.close();
  });

  beforeEach(async () => {
    await db.delete(productBusinessSignals);
    await db.delete(marketSignalAttempts);
    await db.delete(marketSignalSnapshots);
    await db.delete(scrapeAttempts);
    await db.delete(scrapeJobs);
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(alertRules);
    await db.delete(products);

    product = await productService.createProduct({
      platform: 'amazon',
      productUrl: `https://amazon.com/dp/B000SIG001-${Date.now()}`,
      asin: 'B000SIG001',
      title: 'Signal Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
  });

  it('creates latest and bounded historical market signal snapshots', async () => {
    await snapshotService.createSnapshot({
      productId: product.id,
      platform: 'amazon',
      provider: 'keepa',
      source: 'third_party',
      asin: product.asin,
      marketplace: 'amazon.com',
      windowDays: 90,
      confidence: 0.75,
      freshnessMs: 1000,
      priceTrend: {
        current: 49,
        average: 50,
        lowest: 45,
        highest: 55,
        changePercent: -3,
        volatility: 0.1,
        direction: 'down',
        dataPoints: 2,
        firstObservedAt: 100,
        lastObservedAt: 200,
      },
      missingSignals: ['review_velocity'],
    });
    await snapshotService.createSnapshot({
      productId: product.id,
      platform: 'amazon',
      provider: 'keepa',
      source: 'third_party',
      asin: product.asin,
      marketplace: 'amazon.com',
      windowDays: 90,
      confidence: 0.85,
      freshnessMs: 500,
      salesRankTrend: {
        current: 1200,
        average: 1400,
        lowest: 1000,
        highest: 1800,
        changePercent: -20,
        volatility: 0.2,
        direction: 'down',
        dataPoints: 3,
        firstObservedAt: 100,
        lastObservedAt: 300,
      },
      missingSignals: [],
    });

    const latest = await snapshotService.getLatestSnapshot(product.id);
    const history = await snapshotService.getSnapshotHistory(product.id, {
      limit: 1,
    });

    expect(latest?.confidence).toBe(0.85);
    expect(latest?.salesRankTrend?.direction).toBe('down');
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(latest?.id);
  });

  it('refreshes market signals, persists a snapshot, and records a success attempt', async () => {
    const fetchImpl = vi.fn(async () => keepaPayload()) as unknown as typeof fetch;
    const provider = new KeepaMarketSignalProvider({
      apiKey: 'keepa-key',
      fetchImpl,
      now: () => NOW,
    });
    const service = new MarketSignalRefreshService({ provider, snapshotService });

    const result = await service.refreshProduct(product);

    expect(result.success).toBe(true);
    expect(result.snapshotId).toBeDefined();

    const latest = await snapshotService.getLatestSnapshot(product.id);
    const attempts = await db
      .select()
      .from(marketSignalAttempts);

    expect(latest?.provider).toBe('keepa');
    expect(latest?.missingSignals).toEqual([]);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({
      productId: product.id,
      provider: 'keepa',
      source: 'third_party',
      status: 'success',
      snapshotId: result.snapshotId,
    });
  });

  it('records failed refresh attempts with root cause diagnostics', async () => {
    const fetchImpl = vi.fn(async () =>
      response(
        { error: { message: 'Token quota exceeded' } },
        { ok: false, status: 402 }
      )
    ) as unknown as typeof fetch;
    const provider = new KeepaMarketSignalProvider({
      apiKey: 'keepa-key',
      fetchImpl,
      now: () => NOW,
    });
    const service = new MarketSignalRefreshService({ provider, snapshotService });

    const result = await service.refreshProduct(product);

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.rootCause).toBe('quota_exhausted');

    const attempts = await db.select().from(marketSignalAttempts);
    expect(attempts[0]).toMatchObject({
      productId: product.id,
      status: 'failed',
      failureReason: 'provider_unavailable',
      rootCause: 'quota_exhausted',
    });
  });

  it('returns insufficient history health when no attempts exist', async () => {
    const health = await healthService.getKeepaHealth({ windowHours: 24 });

    expect(health.status).toBe('insufficient_history');
    expect(health.recommendations[0].code).toBe('refresh_market_signals');
  });

  it('aggregates degraded Keepa health and remediation recommendations', async () => {
    await db.insert(marketSignalAttempts).values([
      {
        id: 'attempt-success',
        productId: product.id,
        provider: 'keepa',
        source: 'third_party',
        platform: 'amazon',
        status: 'success',
        durationMs: 30,
        confidence: 0.8,
        timestamp: Date.now() - 1000,
      },
      {
        id: 'attempt-quota',
        productId: product.id,
        provider: 'keepa',
        source: 'third_party',
        platform: 'amazon',
        status: 'failed',
        failureReason: 'provider_unavailable',
        rootCause: 'quota_exhausted',
        durationMs: 50,
        diagnostics: JSON.stringify({ rootCause: 'quota_exhausted' }),
        timestamp: Date.now() - 500,
      },
      {
        id: 'attempt-unsupported',
        productId: product.id,
        provider: 'keepa',
        source: 'third_party',
        platform: 'amazon',
        status: 'failed',
        failureReason: 'unsupported_product',
        rootCause: 'unsupported_product',
        durationMs: 20,
        timestamp: Date.now() - 100,
      },
    ]);

    const health = await healthService.getKeepaHealth({
      productId: product.id,
      windowHours: 24,
    });

    expect(health.status).toBe('degraded');
    expect(health.attemptCount).toBe(3);
    expect(health.successCount).toBe(1);
    expect(health.failureCount).toBe(2);
    expect(health.rootCauses).toMatchObject({
      quota_exhausted: 1,
      unsupported_product: 1,
    });
    expect(health.recommendations.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'check_keepa_quota',
        'check_market_signal_identifier',
      ])
    );
  });
});
