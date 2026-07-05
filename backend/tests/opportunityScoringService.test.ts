import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../src/db';
import {
  alerts,
  marketSignalAttempts,
  marketSignalSnapshots,
  opportunityResearchEntries,
  priceSnapshots,
  productBusinessSignals,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { OpportunityScoringService } from '../src/services/opportunityScoringService';
import { ProductService } from '../src/services/productService';
import { ScrapeAttemptService } from '../src/services/scrapeAttemptService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { applyOpportunityResearchTraceRuntimeMigration } from './migrationTestUtils';
import type { OpportunityPriceSignal, Product } from '../src/types';

describe('OpportunityScoringService', () => {
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  const attemptService = new ScrapeAttemptService();
  const service = new OpportunityScoringService();

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    for (const migrationName of [
      '002-product-data-acquisition.sql',
      '003-opportunity-business-signals.sql',
      '005-keepa-market-signals.sql',
      '006-opportunity-research-workspace.sql',
    ]) {
      sqlite.exec(
        fs.readFileSync(path.resolve('migrations', migrationName), 'utf-8')
      );
    }
    applyOpportunityResearchTraceRuntimeMigration(sqlite);
    sqlite.close();
  });

  beforeEach(async () => {
    await clearData();
  });

  it('scores products with complete data and exposes factor breakdowns', async () => {
    const product = await createProduct('COMPLETE', {
      category: 'electronics',
      isMonitoring: true,
    });
    await addSnapshots(product.id, [120, 110, 90], {
      rating: 4.7,
      reviewCount: 450,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.92,
    });

    const result = await service.explainProduct(product.id);

    expect(result.product.id).toBe(product.id);
    expect(result.score).toBeGreaterThan(60);
    expect(result.confidence).toBeLessThan(0.8);
    expect(result.factors.map((factor) => factor.name)).toEqual(
      expect.arrayContaining([
        'price_position',
        'price_trend',
        'price_stability',
        'acquisition_health',
        'review_proxy',
        'availability',
        'monitoring_status',
        'market_signal_freshness',
      ])
    );
    expect(result.acquisitionHealth.provider).toBe('rainforest');
    expect(result.missingSignals).toEqual(
      expect.arrayContaining(['profit_margin', 'sales_volume', 'demand'])
    );
    expect(result.missingSignals).toContain('market_trend');
    expect(result.marketSignals.status).toBe('missing');
    expect(result.businessSignals.completeness).toBe('none');
  });

  it('uses complete business assumptions as scoring factors', async () => {
    const product = await createProduct('BUSINESS_COMPLETE', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [120, 110, 100], {
      rating: 4.6,
      reviewCount: 320,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.9,
    });
    await db.insert(productBusinessSignals).values({
      productId: product.id,
      currency: 'USD',
      costBasis: 40,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 0.15,
      advertisingCost: 8,
      taxCustomsBuffer: 3,
      targetSellPrice: 120,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await service.explainProduct(product.id);

    expect(result.businessSignals.completeness).toBe('complete');
    expect(result.missingSignals).not.toContain('profit_margin');
    expect(result.factors.map((factor) => factor.name)).toEqual(
      expect.arrayContaining([
        'business_net_margin',
        'business_roi',
        'business_breakeven_distance',
        'business_contribution_profit',
      ])
    );
    expect(result.confidence).toBeGreaterThan(0.75);
  });

  it('does not score missing business assumptions as zero-cost advantages', async () => {
    const product = await createProduct('BUSINESS_PARTIAL');
    await addSnapshots(product.id, [100, 90, 85], {
      rating: 4.2,
      reviewCount: 80,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.85,
    });
    await db.insert(productBusinessSignals).values({
      productId: product.id,
      currency: 'USD',
      costBasis: 30,
      referralFeeRate: 0.12,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await service.explainProduct(product.id);

    expect(result.businessSignals.completeness).toBe('partial');
    expect(result.factors.map((factor) => factor.name)).not.toContain(
      'business_roi'
    );
    expect(result.missingSignals).toEqual(
      expect.arrayContaining(['business_inboundShipping', 'profit_margin'])
    );
  });

  it('gates high-scoring products when business assumptions are missing', async () => {
    const product = await createProduct('GATED_BUSINESS', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [180, 130, 70], {
      rating: 4.8,
      reviewCount: 900,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.95,
    });
    await addMarketSignal(product.id);

    const result = await service.explainProduct(product.id);

    expect(result.score).toBeGreaterThanOrEqual(72);
    expect(result.businessSignals.completeness).not.toBe('complete');
    expect(result.recommendation).toBe('check_data');
    expect(result.recommendationGate.status).toBe('blocked');
    expect(result.recommendationGate.applied).toBe(true);
    expect(result.recommendationGate.originalRecommendation).toBe('investigate');
    expect(result.recommendationGate.finalRecommendation).toBe('check_data');
    expect(result.recommendationGate.signals).toEqual(
      expect.arrayContaining(['profit_margin'])
    );
    expect(result.recommendationGate.reasons.join(' ')).toContain(
      'business assumptions'
    );
  });

  it('downgrades high recommendations when market signals are stale', async () => {
    const product = await createProduct('GATED_STALE_MARKET', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [170, 125, 75], {
      rating: 4.7,
      reviewCount: 750,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.95,
    });
    await db.insert(productBusinessSignals).values({
      productId: product.id,
      currency: 'USD',
      costBasis: 35,
      inboundShipping: 4,
      outboundShipping: 4,
      fulfillmentFee: 5,
      platformFee: 2,
      referralFeeRate: 0.12,
      advertisingCost: 5,
      taxCustomsBuffer: 2,
      targetSellPrice: 140,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await addMarketSignal(product.id, {
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      freshnessMs: 45 * 24 * 60 * 60 * 1000,
    });

    const result = await service.explainProduct(product.id);

    expect(result.score).toBeGreaterThanOrEqual(72);
    expect(result.marketSignals.status).toBe('stale');
    expect(result.recommendation).toBe('watch');
    expect(result.recommendationGate.status).toBe('caution');
    expect(result.recommendationGate.applied).toBe(true);
    expect(result.recommendationGate.originalRecommendation).toBe('investigate');
    expect(result.recommendationGate.finalRecommendation).toBe('watch');
    expect(result.recommendationGate.signals).toContain('market_signal_freshness');
    expect(result.recommendationGate.nextActions.join(' ')).toContain('Refresh');
  });

  it('returns check_data and missing signals when price history is absent', async () => {
    const product = await createProduct('NO_PRICE');
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.8,
    });

    const result = await service.explainProduct(product.id);

    expect(result.recommendation).toBe('check_data');
    expect(result.missingSignals).toEqual(
      expect.arrayContaining(['price_history', 'review_proxy'])
    );
    expect(result.score).toBeGreaterThan(0);
  });

  it('keeps one-snapshot products low confidence instead of failing', async () => {
    const product = await createProduct('ONE_PRICE');
    await snapshotService.createSnapshot({
      productId: product.id,
      price: 88,
      currency: 'USD',
      availability: 'in_stock',
      rating: 4.1,
      reviewCount: 12,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.7,
    });

    const result = await service.explainProduct(product.id);

    expect(result.missingSignals).toEqual(
      expect.arrayContaining(['price_trend', 'volatility'])
    );
    expect(result.confidence).toBeLessThan(0.8);
    expect(
      result.factors.find((factor) => factor.name === 'price_trend')?.rawValue
    ).toBeNull();
  });

  it('adds fresh market signal factors without unsupported sales claims', async () => {
    const product = await createProduct('MARKET_FRESH', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [120, 110, 95], {
      rating: 4.5,
      reviewCount: 260,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.9,
    });
    await addMarketSignal(product.id);

    const result = await service.explainProduct(product.id);

    expect(result.marketSignals.status).toBe('fresh');
    expect(result.marketSignals.provider).toBe('keepa');
    expect(result.missingSignals).not.toContain('market_trend');
    expect(result.marketSignals.factors.map((factor) => factor.name)).toEqual(
      expect.arrayContaining([
        'market_price_stability',
        'market_sales_rank_trend',
        'market_review_velocity',
        'market_rating_movement',
        'market_signal_freshness',
      ])
    );
    expect(
      result.factors.map((factor) => factor.name)
    ).toEqual(expect.arrayContaining(['market_sales_rank_trend']));
    expect(JSON.stringify(result.marketSignals)).toContain(
      'not verified sales'
    );
    expect(JSON.stringify(result.marketSignals)).toContain(
      'not verified demand'
    );
  });

  it('marks stale market signals as missing confidence inputs without making the product unattractive', async () => {
    const product = await createProduct('MARKET_STALE', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [100, 90, 84], {
      rating: 4.4,
      reviewCount: 180,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.88,
    });
    await addMarketSignal(product.id, {
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
      freshnessMs: 45 * 24 * 60 * 60 * 1000,
    });

    const result = await service.explainProduct(product.id);

    expect(result.marketSignals.status).toBe('stale');
    expect(result.missingSignals).toContain('market_signal_freshness');
    expect(result.score).toBeGreaterThan(0);
    expect(result.recommendation).not.toBe('ignore');
  });

  it('captures failed and stale acquisition health in scoring', async () => {
    const product = await createProduct('FAILED_ACQ');
    await addSnapshots(product.id, [100, 95, 92], {
      rating: 4.3,
      reviewCount: 160,
    });
    await db.insert(scrapeAttempts).values({
      id: 'attempt-failed-stale',
      productId: product.id,
      provider: 'amazon-browser',
      source: 'browser',
      status: 'failed',
      failureReason: 'captcha',
      errorMessage: 'Robot check detected',
      durationMs: 2400,
      confidence: 0,
      timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    });

    const result = await service.explainProduct(product.id);

    expect(result.acquisitionHealth.status).toBe('failed');
    expect(result.acquisitionHealth.failureReason).toBe('captcha');
    expect(result.acquisitionHealth.freshnessMs).toBeGreaterThan(
      24 * 60 * 60 * 1000
    );
    expect(
      result.factors.find((factor) => factor.name === 'acquisition_health')
        ?.direction
    ).toBe('negative');
  });

  it('is deterministic for repeated scoring over unchanged signals', async () => {
    const product = await createProduct('DETERMINISTIC', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [70, 68, 63], {
      rating: 4.5,
      reviewCount: 220,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.88,
    });

    const first = await service.explainProduct(product.id);
    const second = await service.explainProduct(product.id);

    expect(second.score).toBe(first.score);
    expect(second.confidence).toBe(first.confidence);
    expect(second.recommendation).toBe(first.recommendation);
    expect(second.factors).toEqual(first.factors);
  });

  it('keeps scores unchanged when decision review metadata changes', async () => {
    const product = await createProduct('DECISION_REVIEW_SCORE', {
      isMonitoring: true,
    });
    await addSnapshots(product.id, [110, 95, 82], {
      rating: 4.4,
      reviewCount: 210,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.9,
    });

    const before = await service.explainProduct(product.id);
    const staleTimestamp = Date.now() - 15 * 24 * 60 * 60 * 1000;
    await db.insert(opportunityResearchEntries).values({
      productId: product.id,
      status: 'researching',
      priority: 'medium',
      tagsJson: '[]',
      notes: null,
      archived: false,
      decisionStatus: 'go',
      decisionReason: 'Advance after manual review.',
      decisionNextAction: null,
      decisionSnapshotJson: JSON.stringify(createDecisionSnapshot(before)),
      decidedAt: staleTimestamp,
      decisionUpdatedAt: staleTimestamp,
      createdAt: staleTimestamp,
      updatedAt: staleTimestamp,
    });

    const staleReview = await service.explainProduct(product.id);
    await db
      .update(opportunityResearchEntries)
      .set({
        decisionNextAction: 'Call supplier with updated assumptions.',
        decidedAt: Date.now(),
        decisionUpdatedAt: Date.now(),
        updatedAt: Date.now(),
      })
      .where(eq(opportunityResearchEntries.productId, product.id));
    const freshReview = await service.explainProduct(product.id);

    expect(staleReview.research?.decisionReview).toMatchObject({
      status: 'go',
      needsNextAction: true,
      stale: true,
    });
    expect(freshReview.research?.decisionReview).toMatchObject({
      status: 'go',
      needsNextAction: false,
      stale: false,
    });
    for (const result of [staleReview, freshReview]) {
      expect(result.score).toBe(before.score);
      expect(result.confidence).toBe(before.confidence);
      expect(result.recommendation).toBe(before.recommendation);
      expect(result.recommendationGate).toEqual(before.recommendationGate);
      expect(result.factors).toEqual(before.factors);
    }
  });

  it('filters, sorts, and paginates opportunity lists', async () => {
    const strong = await createProduct('STRONG', {
      category: 'electronics',
      isMonitoring: true,
    });
    const weak = await createProduct('WEAK', {
      category: 'electronics',
      isMonitoring: false,
    });
    const otherCategory = await createProduct('OTHER', {
      category: 'home',
      isMonitoring: true,
    });

    await addSnapshots(strong.id, [100, 85, 60], {
      rating: 4.8,
      reviewCount: 600,
    });
    await addSnapshots(weak.id, [60, 70, 82], {
      rating: 3.2,
      reviewCount: 5,
      availability: 'out_of_stock',
    });
    await addSnapshots(otherCategory.id, [50, 45, 40], {
      rating: 4.6,
      reviewCount: 130,
    });
    await addAttempt(strong.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.95,
    });
    await addAttempt(weak.id, {
      status: 'failed',
      provider: 'amazon-browser',
      confidence: 0,
      failureReason: 'captcha',
    });
    await addAttempt(otherCategory.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.9,
    });

    const result = await service.listOpportunities({
      category: 'electronics',
      sortBy: 'score',
      sortOrder: 'desc',
      page: 1,
      limit: 1,
    });

    expect(result.total).toBe(2);
    expect(result.pagination.totalPages).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].product.id).toBe(strong.id);

    const filtered = await service.listOpportunities({
      minScore: result.data[0].score,
      recommendation: result.data[0].recommendation,
    });

    expect(filtered.data.some((item) => item.product.id === strong.id)).toBe(
      true
    );
  });

  it('evaluates products from later internal batches before pagination', async () => {
    const firstBatch = Array.from({ length: 100 }, (_, index) =>
      createProductFixture(`batch-low-${index}`)
    );
    const lateStrongProduct = createProductFixture('batch-strong');
    const secondBatch = [lateStrongProduct];
    const strongSignal: OpportunityPriceSignal = {
      productId: lateStrongProduct.id,
      currentPrice: 60,
      averagePrice: 100,
      priceChangePercent: -40,
      volatility: 0.02,
      rating: 4.8,
      reviewCount: 900,
      availability: 'in_stock',
      dataPoints: 3,
      confidence: 0.9,
      missingSignals: [],
    };
    const productServiceMock = {
      listProducts: vi.fn().mockResolvedValue({
        data: firstBatch,
        total: firstBatch.length,
        pagination: { page: 1, limit: 1000, totalPages: 1 },
      }),
      iterateProductBatches: vi.fn(() =>
        (async function* () {
          yield firstBatch;
          yield secondBatch;
        })()
      ),
    };
    const priceAnalysisServiceMock = {
      getOpportunityPriceSignals: vi.fn(async (productIds: string[]) => {
        const signals = new Map<string, OpportunityPriceSignal>();
        if (productIds.includes(lateStrongProduct.id)) {
          signals.set(lateStrongProduct.id, strongSignal);
        }
        return signals;
      }),
    };
    const marketSignalSnapshotServiceMock = {
      getLatestSnapshotsForProducts: vi.fn(async () => new Map()),
    };
    const researchServiceMock = {
      getMetadataMap: vi.fn(async () => new Map()),
      attachMetadata: vi.fn((opportunities) => opportunities),
      filterOpportunities: vi.fn((opportunities) => opportunities),
    };
    const batchService = new OpportunityScoringService(
      productServiceMock as unknown as ProductService,
      priceAnalysisServiceMock as any,
      undefined,
      marketSignalSnapshotServiceMock as any,
      researchServiceMock as any
    );

    const result = await batchService.listOpportunities({
      category: 'batch',
      sortBy: 'score',
      sortOrder: 'desc',
      page: 1,
      limit: 5,
    });

    expect(productServiceMock.iterateProductBatches).toHaveBeenCalled();
    expect(productServiceMock.listProducts).not.toHaveBeenCalled();
    expect(result.total).toBe(101);
    expect(result.data[0].product.id).toBe(lateStrongProduct.id);
  });

  async function createProduct(
    suffix: string,
    overrides: {
      category?: string;
      isMonitoring?: boolean;
      platform?: string;
    } = {}
  ) {
    return productService.createProduct({
      platform: overrides.platform ?? 'amazon',
      productUrl: `https://amazon.com/dp/${suffix}-${Date.now()}`,
      asin: suffix,
      title: `${suffix} Product`,
      category: overrides.category,
      currency: 'USD',
      isMonitoring: overrides.isMonitoring ?? true,
      checkInterval: 24,
    });
  }

  function createProductFixture(id: string): Product {
    return {
      id,
      platform: 'amazon',
      productUrl: `https://amazon.com/dp/${id}`,
      asin: id,
      title: `${id} Product`,
      category: 'batch',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  async function addSnapshots(
    productId: string,
    prices: number[],
    options: {
      rating?: number;
      reviewCount?: number;
      availability?: string;
    } = {}
  ) {
    for (const [index, price] of prices.entries()) {
      await db.insert(priceSnapshots).values({
        id: `${productId}-snapshot-${index}`,
        productId,
        price,
        currency: 'USD',
        availability: options.availability ?? 'in_stock',
        rating: options.rating,
        reviewCount: options.reviewCount,
        timestamp: Date.now() - (prices.length - index) * 60 * 60 * 1000,
      });
    }
  }

  async function addAttempt(
    productId: string,
    options: {
      status: 'success' | 'failed';
      provider: string;
      confidence: number;
      failureReason?: string;
    }
  ) {
    await attemptService.recordAttempt({
      productId,
      provider: options.provider,
      source: options.provider === 'rainforest' ? 'third_party' : 'browser',
      status: options.status,
      failureReason: options.failureReason,
      durationMs: 1200,
      confidence: options.confidence,
    });
  }

  async function addMarketSignal(
    productId: string,
    options: {
      createdAt?: number;
      freshnessMs?: number;
    } = {}
  ) {
    await db.insert(marketSignalSnapshots).values({
      id: `${productId}-market-signal`,
      productId,
      platform: 'amazon',
      provider: 'keepa',
      source: 'third_party',
      asin: 'B0MARKET01',
      marketplace: 'amazon.com',
      windowDays: 90,
      confidence: 0.86,
      freshnessMs: options.freshnessMs ?? 60 * 60 * 1000,
      priceTrend: JSON.stringify({
        current: 95,
        average: 102,
        lowest: 90,
        highest: 120,
        changePercent: -8,
        volatility: 0.12,
        direction: 'down',
        dataPoints: 20,
        firstObservedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        lastObservedAt: Date.now() - 60 * 60 * 1000,
      }),
      salesRankTrend: JSON.stringify({
        current: 1200,
        average: 1800,
        lowest: 1100,
        highest: 2600,
        changePercent: -24,
        volatility: 0.18,
        direction: 'down',
        dataPoints: 18,
        firstObservedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        lastObservedAt: Date.now() - 60 * 60 * 1000,
      }),
      reviewVelocity: 1.4,
      ratingMovement: 0.15,
      missingSignals: '[]',
      metadata: JSON.stringify({ fixture: true }),
      createdAt: options.createdAt ?? Date.now(),
    });
  }

  function createDecisionSnapshot(
    opportunity: Awaited<ReturnType<OpportunityScoringService['explainProduct']>>
  ) {
    return {
      capturedAt: Date.now(),
      score: opportunity.score,
      confidence: opportunity.confidence,
      recommendation: opportunity.recommendation,
      recommendationGate: opportunity.recommendationGate,
      keyReasons: opportunity.keyReasons,
      missingSignals: opportunity.missingSignals,
      businessSignals: opportunity.businessSignals,
      marketSignals: opportunity.marketSignals,
    };
  }
});

async function clearData() {
  await db.delete(opportunityResearchEntries);
  await db.delete(productBusinessSignals);
  await db.delete(marketSignalAttempts);
  await db.delete(marketSignalSnapshots);
  await db.delete(scrapeAttempts);
  await db.delete(scrapeJobs);
  await db.delete(priceSnapshots);
  await db.delete(alerts);
  await db.delete(products);
}
