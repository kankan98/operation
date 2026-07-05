import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import {
  marketSignalProviderHealthSchema,
  marketSignalRefreshResultSchema,
  marketSignalSnapshotSchema,
  productOpportunitySchema,
  scrapeResultSchema,
} from '@shared/schemas';

const baseProduct = {
  id: 'product-1',
  platform: 'amazon',
  productUrl: 'https://www.amazon.com/dp/B000TEST01',
  asin: 'B000TEST01',
  title: 'Test Product',
  brand: null,
  category: null,
  imageUrl: null,
  currentPrice: 29.99,
  currency: 'USD',
  isMonitoring: true,
  monitorType: null,
  checkInterval: 24,
  userId: null,
  createdAt: 100,
  updatedAt: null,
  lastCheckedAt: null,
  metadata: null,
};

describe('market signal schemas and migration', () => {
  it('validates Keepa market signal snapshot and refresh results', () => {
    const snapshot = marketSignalSnapshotSchema.parse({
      id: 'signal-1',
      productId: 'product-1',
      platform: 'amazon',
      provider: 'keepa',
      source: 'third_party',
      asin: 'B000TEST01',
      marketplace: 'amazon.com',
      windowDays: 90,
      confidence: 0.86,
      freshnessMs: 3600,
      priceTrend: {
        current: 29.99,
        average: 31.5,
        lowest: 25,
        highest: 39,
        changePercent: -4.2,
        volatility: 0.18,
        direction: 'down',
        dataPoints: 42,
        firstObservedAt: 100,
        lastObservedAt: 200,
      },
      salesRankTrend: {
        current: 1250,
        average: 1500,
        lowest: 900,
        highest: 2200,
        changePercent: -12,
        volatility: 0.22,
        direction: 'down',
        dataPoints: 35,
        firstObservedAt: 100,
        lastObservedAt: 200,
      },
      reviewVelocity: 3.2,
      ratingMovement: 0.1,
      missingSignals: [],
      metadata: {
        domain: 1,
      },
      createdAt: 200,
    });

    expect(snapshot.provider).toBe('keepa');

    const refresh = marketSignalRefreshResultSchema.safeParse({
      success: false,
      productId: 'product-1',
      provider: 'keepa',
      source: 'third_party',
      timestamp: 300,
      durationMs: 50,
      failureReason: 'unsupported_product',
      rootCause: 'unsupported_product',
      diagnostics: {
        sanitizedMessage: 'Product is missing a deterministic ASIN',
      },
    });

    expect(refresh.success).toBe(true);
  });

  it('validates Keepa provider health recommendations', () => {
    const result = marketSignalProviderHealthSchema.safeParse({
      provider: 'keepa',
      source: 'third_party',
      platform: 'amazon',
      status: 'degraded',
      window: {
        windowHours: 24,
        since: 100,
        until: 200,
      },
      attemptCount: 2,
      successCount: 1,
      failureCount: 1,
      successRate: 0.5,
      averageDurationMs: 75,
      latestSuccessTimestamp: 180,
      latestFailureReason: 'provider_unavailable',
      failureReasons: {
        provider_unavailable: 1,
      },
      rootCauses: {
        quota_exhausted: 1,
      },
      recommendations: [
        {
          code: 'check_keepa_quota',
          severity: 'warning',
          message: 'Check Keepa token quota before the next refresh.',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('keeps existing acquisition and opportunity responses valid without market signals', () => {
    expect(scrapeResultSchema.safeParse({
      success: true,
      productId: 'product-1',
      provider: 'rainforest',
      source: 'third_party',
      confidence: 0.9,
      timestamp: 100,
    }).success).toBe(true);

    const opportunity = productOpportunitySchema.safeParse({
      product: baseProduct,
      score: 72,
      confidence: 0.65,
      recommendation: 'investigate',
      keyReasons: ['Healthy current acquisition'],
      missingSignals: ['market_trend'],
      factors: [],
      acquisitionHealth: {
        provider: 'rainforest',
        source: 'third_party',
        status: 'success',
        failureReason: null,
        confidence: 0.9,
        durationMs: 200,
        timestamp: 100,
        freshnessMs: 1000,
      },
      businessSignals: {
        completeness: 'none',
        missingSignals: ['cost_basis'],
        metrics: null,
        caveat: 'Business metrics require merchant-entered assumptions.',
      },
    });

    expect(opportunity.success).toBe(true);
    if (opportunity.success) {
      expect(opportunity.data.recommendationGate).toEqual({
        status: 'clear',
        applied: false,
        originalRecommendation: 'watch',
        finalRecommendation: 'watch',
        reasons: [],
        signals: [],
        nextActions: [],
      });
    }
  });

  it('accepts opportunity responses with recommendation gate context', () => {
    const opportunity = productOpportunitySchema.safeParse({
      product: baseProduct,
      score: 64,
      confidence: 0.58,
      recommendation: 'check_data',
      recommendationGate: {
        status: 'caution',
        applied: true,
        originalRecommendation: 'investigate',
        finalRecommendation: 'check_data',
        reasons: ['Business assumptions are incomplete.'],
        signals: ['business_cost_basis'],
        nextActions: ['Add landed cost before launch decision.'],
      },
      keyReasons: ['Price is below average.'],
      missingSignals: ['business_cost_basis'],
      factors: [],
      acquisitionHealth: {
        provider: 'rainforest',
        source: 'third_party',
        status: 'success',
        failureReason: null,
        confidence: 0.9,
        durationMs: 200,
        timestamp: 100,
        freshnessMs: 1000,
      },
      businessSignals: {
        completeness: 'partial',
        missingSignals: ['cost_basis'],
        metrics: null,
        caveat: 'Business metrics require merchant-entered assumptions.',
      },
    });

    expect(opportunity.success).toBe(true);
  });

  it('creates market signal tables through migration 005', () => {
    const sqlite = new SQLite(':memory:');

    try {
      sqlite.exec(`
        CREATE TABLE products (
          id TEXT PRIMARY KEY,
          platform TEXT NOT NULL,
          product_url TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          is_monitoring INTEGER NOT NULL DEFAULT 0,
          check_interval INTEGER NOT NULL DEFAULT 24,
          created_at INTEGER NOT NULL
        );
      `);

      const migration = fs.readFileSync(
        path.resolve('migrations/005-keepa-market-signals.sql'),
        'utf-8'
      );
      sqlite.exec(migration);

      sqlite.prepare(`
        INSERT INTO products (
          id,
          platform,
          product_url,
          title,
          created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        'product-1',
        'amazon',
        'https://www.amazon.com/dp/B000TEST01',
        'Test Product',
        100
      );

      sqlite.prepare(`
        INSERT INTO market_signal_snapshots (
          id,
          product_id,
          platform,
          provider,
          source,
          asin,
          marketplace,
          window_days,
          confidence,
          freshness_ms,
          missing_signals,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'signal-1',
        'product-1',
        'amazon',
        'keepa',
        'third_party',
        'B000TEST01',
        'amazon.com',
        90,
        0.8,
        1000,
        '[]',
        200
      );

      sqlite.prepare(`
        INSERT INTO market_signal_attempts (
          id,
          product_id,
          provider,
          source,
          platform,
          status,
          duration_ms,
          confidence,
          snapshot_id,
          timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'attempt-1',
        'product-1',
        'keepa',
        'third_party',
        'amazon',
        'success',
        40,
        0.8,
        'signal-1',
        200
      );

      const snapshotCount = sqlite
        .prepare('SELECT COUNT(*) as count FROM market_signal_snapshots')
        .get() as { count: number };
      const attemptCount = sqlite
        .prepare('SELECT COUNT(*) as count FROM market_signal_attempts')
        .get() as { count: number };

      expect(snapshotCount.count).toBe(1);
      expect(attemptCount.count).toBe(1);
    } finally {
      sqlite.close();
    }
  });
});
