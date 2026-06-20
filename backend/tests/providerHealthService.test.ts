import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { db } from '../src/db';
import {
  alertRules,
  alerts,
  priceSnapshots,
  productBusinessSignals,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { ProviderHealthService } from '../src/services/providerHealthService';

describe('ProviderHealthService', () => {
  const service = new ProviderHealthService();
  const now = Date.now();

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    const migration = fs.readFileSync(
      path.resolve('migrations/002-product-data-acquisition.sql'),
      'utf-8'
    );
    sqlite.exec(migration);
    const ebayMigration = fs.readFileSync(
      path.resolve('migrations/004-ebay-browse-provider.sql'),
      'utf-8'
    );
    sqlite.exec(ebayMigration);
    sqlite.close();
  });

  beforeEach(async () => {
    await db.delete(productBusinessSignals);
    await db.delete(priceSnapshots);
    await db.delete(scrapeAttempts);
    await db.delete(scrapeJobs);
    await db.delete(alerts);
    await db.delete(alertRules);
    await db.delete(products);
  });

  it('should return insufficient history when no Amazon attempts exist', async () => {
    const health = await service.getAmazonHealth({ windowHours: 24 });

    expect(health.status).toBe('insufficient_history');
    expect(health.providerSummaries).toHaveLength(0);
    expect(health.recommendations[0].code).toBe('refresh_stale_data');
  });

  it('should aggregate Rainforest success, primary failure, browser fallback, and cache fallback', async () => {
    await insertProduct('product-1');
    await insertAttempt({
      id: 'attempt-rainforest-success',
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      durationMs: 400,
      confidence: 0.9,
      timestamp: now - 1000,
    });
    await insertAttempt({
      id: 'attempt-browser-fallback',
      provider: 'amazon-browser',
      source: 'browser',
      status: 'success',
      durationMs: 1200,
      confidence: 0.6,
      timestamp: now - 2000,
      diagnostics: JSON.stringify({
        degraded: true,
        providerFailures: [
          {
            provider: 'rainforest',
            source: 'third_party',
            failureReason: 'provider_unavailable',
            providerErrorCode: 'quota_or_rate_limit',
            rootCause: 'quota_exhausted',
            error: 'Quota limit reached',
          },
        ],
      }),
    });
    await insertAttempt({
      id: 'attempt-cache-fallback',
      provider: 'cache',
      source: 'cache',
      status: 'success',
      durationMs: 3,
      confidence: 0.45,
      timestamp: now - 3000,
      diagnostics: JSON.stringify({
        cacheFallback: true,
        providerFailures: [
          {
            provider: 'rainforest',
            source: 'third_party',
            failureReason: 'network_timeout',
            providerErrorCode: 'network_timeout',
            rootCause: 'network_timeout',
          },
        ],
      }),
    });

    const health = await service.getAmazonHealth({
      productId: 'product-1',
      windowHours: 24,
    });

    const rainforest = health.providerSummaries.find(
      (summary) => summary.provider === 'rainforest'
    );

    expect(health.status).toBe('degraded');
    expect(health.chainSummary.totalAttempts).toBe(3);
    expect(health.chainSummary.browserFallbackCount).toBe(1);
    expect(health.chainSummary.cacheFallbackCount).toBe(1);
    expect(health.chainSummary.primaryFailureCount).toBe(2);
    expect(health.chainSummary.degradedPathCounts.browser_fallback).toBe(1);
    expect(health.chainSummary.degradedPathCounts.cache_fallback).toBe(1);
    expect(health.chainSummary.rootCauses.quota_exhausted).toBe(1);
    expect(health.chainSummary.rootCauses.network_timeout).toBe(1);
    expect(rainforest?.successCount).toBe(1);
    expect(rainforest?.failureCount).toBe(2);
    expect(rainforest?.failureReasons.provider_unavailable).toBe(1);
    expect(rainforest?.rootCauses.quota_exhausted).toBe(1);
    expect(health.latestAttempts[0]).toMatchObject({
      id: 'attempt-rainforest-success',
      fallbackType: 'primary_live',
    });
    expect(health.recommendations.map((item) => item.code)).toContain(
      'check_quota'
    );
    expect(health.recommendations.map((item) => item.code)).toContain(
      'reduce_fallback_reliance'
    );
  });

  it('should apply bounded windows and provider filters', async () => {
    await insertProduct('product-1');
    await insertAttempt({
      id: 'recent-rainforest',
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      durationMs: 300,
      confidence: 0.9,
      timestamp: now - 60 * 60 * 1000,
    });
    await insertAttempt({
      id: 'old-browser',
      provider: 'amazon-browser',
      source: 'browser',
      status: 'failed',
      failureReason: 'captcha',
      durationMs: 3000,
      timestamp: now - 48 * 60 * 60 * 1000,
    });

    const health = await service.getAmazonHealth({
      windowHours: 2,
      provider: 'rainforest',
    });

    expect(health.status).toBe('healthy');
    expect(health.chainSummary.totalAttempts).toBe(1);
    expect(health.providerSummaries[0].provider).toBe('rainforest');
  });

  it('should expose browser blocking recommendations and safe attempt fields', async () => {
    await insertProduct('product-1');
    await insertAttempt({
      id: 'blocked-browser',
      provider: 'amazon-browser',
      source: 'browser',
      status: 'failed',
      failureReason: 'captcha',
      durationMs: 2500,
      timestamp: now - 1000,
      diagnostics: JSON.stringify({
        rootCause: 'captcha_or_blocked',
        fallbackType: 'browser_fallback',
        httpStatus: 503,
        sanitizedMessage: 'Captcha challenge detected',
        finalUrl: 'https://www.amazon.com/dp/B000000001?session=SECRET123',
      }),
    });

    const health = await service.getAmazonHealth({ windowHours: 24 });

    expect(health.status).toBe('degraded');
    expect(health.chainSummary.rootCauses.captcha_or_blocked).toBe(1);
    expect(health.latestAttempts[0]).toMatchObject({
      rootCause: 'captcha_or_blocked',
      fallbackType: 'browser_fallback',
      httpStatus: 503,
      sanitizedMessage: 'Captcha challenge detected',
    });
    expect(health.recommendations.map((item) => item.code)).toContain(
      'investigate_browser_blocking'
    );
    expect(JSON.stringify(health.latestAttempts[0])).not.toContain('?session=');
  });

  it('should keep legacy attempts without root-cause diagnostics compatible', async () => {
    await insertProduct('product-1');
    await insertAttempt({
      id: 'legacy-rainforest',
      provider: 'rainforest',
      source: 'third_party',
      status: 'failed',
      failureReason: 'provider_unavailable',
      durationMs: 500,
      timestamp: now - 1000,
      diagnostics: JSON.stringify({
        providerErrorCode: 'legacy_provider_error',
      }),
    });

    const health = await service.getAmazonHealth({ windowHours: 24 });

    expect(health.status).toBe('degraded');
    expect(health.latestAttempts[0].rootCause).toBe('insufficient_diagnostics');
    expect(health.chainSummary.rootCauses.insufficient_diagnostics).toBe(1);
    expect(health.recommendations.map((item) => item.code)).toContain(
      'investigate_unknown_failures'
    );
  });

  it('should return insufficient history for eBay with platform-specific message', async () => {
    const health = await service.getProviderHealth('ebay', { windowHours: 24 });

    expect(health.platform).toBe('ebay');
    expect(health.status).toBe('insufficient_history');
    expect(health.recommendations[0]).toMatchObject({
      code: 'refresh_stale_data',
      severity: 'info',
    });
    expect(health.recommendations[0].message).toContain('ebay');
  });

  it('should aggregate eBay Browse failures and emit remediation recommendations', async () => {
    await insertProduct('ebay-product', 'ebay');
    await insertAttempt({
      id: 'ebay-missing-credentials',
      productId: 'ebay-product',
      provider: 'ebay-browse',
      source: 'official_api',
      status: 'failed',
      failureReason: 'provider_unavailable',
      durationMs: 80,
      timestamp: now - 1000,
      diagnostics: JSON.stringify({
        rootCause: 'missing_credentials',
        marketplace: 'EBAY_US',
        sanitizedMessage: 'Configure eBay credentials',
      }),
    });
    await insertAttempt({
      id: 'ebay-marketplace',
      productId: 'ebay-product',
      provider: 'ebay-browse',
      source: 'official_api',
      status: 'failed',
      failureReason: 'provider_unavailable',
      durationMs: 120,
      timestamp: now - 500,
      diagnostics: JSON.stringify({
        rootCause: 'marketplace_mismatch',
        marketplace: 'EBAY_US',
        sanitizedMessage: 'Marketplace mismatch',
      }),
    });
    await insertAttempt({
      id: 'ebay-unsupported-url',
      productId: 'ebay-product',
      provider: 'ebay-browse',
      source: 'official_api',
      status: 'failed',
      failureReason: 'unsupported_url',
      durationMs: 30,
      timestamp: now - 200,
      diagnostics: JSON.stringify({
        rootCause: 'unsupported_url',
        marketplace: 'EBAY_US',
      }),
    });

    const health = await service.getProviderHealth('ebay', {
      productId: 'ebay-product',
      windowHours: 24,
    });

    expect(health.status).toBe('degraded');
    expect(health.providerSummaries[0]).toMatchObject({
      provider: 'ebay-browse',
      source: 'official_api',
      attemptCount: 3,
      failureCount: 3,
    });
    expect(health.chainSummary.rootCauses).toMatchObject({
      missing_credentials: 1,
      marketplace_mismatch: 1,
      unsupported_url: 1,
    });
    expect(health.recommendations.map((item) => item.code)).toEqual(
      expect.arrayContaining([
        'configure_ebay',
        'check_ebay_marketplace',
        'check_ebay_item_id',
      ])
    );
    expect(health.latestAttempts[0]).toMatchObject({
      provider: 'ebay-browse',
      source: 'official_api',
      rootCause: 'unsupported_url',
      marketplace: 'EBAY_US',
    });
  });
});

async function insertProduct(id: string, platform: 'amazon' | 'ebay' = 'amazon') {
  await db.insert(products).values({
    id,
    platform,
    productUrl:
      platform === 'ebay'
        ? `https://www.ebay.com/itm/${id.replace(/\D/g, '').padEnd(12, '1')}`
        : `https://amazon.com/dp/${id}`,
    asin: platform === 'amazon' ? id.slice(0, 10).padEnd(10, '0') : '',
    title: `Product ${id}`,
    currency: 'USD',
    isMonitoring: true,
    checkInterval: 24,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

async function insertAttempt(values: {
  id: string;
  productId?: string;
  provider: string;
  source: string;
  status: string;
  failureReason?: string;
  durationMs: number;
  confidence?: number;
  diagnostics?: string;
  timestamp: number;
}) {
  await db.insert(scrapeAttempts).values({
    productId: values.productId ?? 'product-1',
    ...values,
  });
}
