import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
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
import { ProductService } from '../src/services/productService';
import { ScrapeAttemptService } from '../src/services/scrapeAttemptService';

describe('Opportunities API', () => {
  const app = createApp();
  const productService = new ProductService();
  const attemptService = new ScrapeAttemptService();

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
    sqlite.close();
  });

  beforeEach(async () => {
    await clearData();
  });

  it('returns ranked opportunity products with missing-signal caveats', async () => {
    const high = await createProduct('API_HIGH', {
      category: 'electronics',
      isMonitoring: true,
    });
    const low = await createProduct('API_LOW', {
      category: 'electronics',
      isMonitoring: false,
    });

    await addSnapshots(high.id, [120, 100, 80], {
      rating: 4.8,
      reviewCount: 500,
    });
    await addSnapshots(low.id, [70, 82, 95], {
      rating: 3.1,
      reviewCount: 3,
      availability: 'out_of_stock',
    });
    await addAttempt(high.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.95,
    });
    await addAttempt(low.id, {
      status: 'failed',
      provider: 'amazon-browser',
      confidence: 0,
      failureReason: 'captcha',
    });

    const response = await request(app)
      .get('/api/opportunities/products?sortBy=score&sortOrder=desc')
      .expect(200);

    expect(response.body.total).toBe(2);
    expect(response.body.data[0].product.id).toBe(high.id);
    expect(response.body.data[0].score).toBeGreaterThan(
      response.body.data[1].score
    );
    expect(response.body.data[0].missingSignals).toEqual(
      expect.arrayContaining(['profit_margin', 'sales_volume', 'demand'])
    );
  });

  it('filters by platform, category, recommendation, and minimum score', async () => {
    const amazon = await createProduct('API_AMAZON', {
      platform: 'amazon',
      category: 'electronics',
    });
    const walmart = await createProduct('API_WALMART', {
      platform: 'walmart',
      category: 'electronics',
    });
    await addSnapshots(amazon.id, [100, 80, 55], {
      rating: 4.9,
      reviewCount: 900,
    });
    await addSnapshots(walmart.id, [100, 110, 130], {
      rating: 2.8,
      reviewCount: 2,
    });
    await addAttempt(amazon.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.95,
    });
    await addAttempt(walmart.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.8,
    });

    const baseline = await request(app)
      .get('/api/opportunities/products?platform=amazon&category=electronics')
      .expect(200);
    const minScore = baseline.body.data[0].score;
    const recommendation = baseline.body.data[0].recommendation;

    const response = await request(app)
      .get(
        `/api/opportunities/products?platform=amazon&category=electronics&minScore=${minScore}&recommendation=${recommendation}`
      )
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.data[0].product.id).toBe(amazon.id);
    expect(response.body.data[0].product.platform).toBe('amazon');
  });

  it('paginates ranked results', async () => {
    const first = await createProduct('API_PAGE_1');
    const second = await createProduct('API_PAGE_2');
    const third = await createProduct('API_PAGE_3');
    for (const [index, product] of [first, second, third].entries()) {
      await addSnapshots(product.id, [100, 90 - index, 80 - index], {
        rating: 4.2,
        reviewCount: 100,
      });
      await addAttempt(product.id, {
        status: 'success',
        provider: 'rainforest',
        confidence: 0.85,
      });
    }

    const response = await request(app)
      .get('/api/opportunities/products?page=2&limit=1')
      .expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.total).toBe(3);
    expect(response.body.pagination).toMatchObject({
      page: 2,
      limit: 1,
      totalPages: 3,
    });
  });

  it('returns one-product opportunity explanation', async () => {
    const product = await createProduct('API_EXPLAIN');
    await addSnapshots(product.id, [90, 80, 70], {
      rating: 4.4,
      reviewCount: 180,
    });
    await addAttempt(product.id, {
      status: 'success',
      provider: 'rainforest',
      confidence: 0.9,
    });

    const response = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    expect(response.body.data.product.id).toBe(product.id);
    expect(response.body.data.factors.length).toBeGreaterThan(0);
    expect(response.body.data.acquisitionHealth.provider).toBe('rainforest');
  });

  it('filters opportunities by business readiness and minimum ROI', async () => {
    const complete = await createProduct('API_BUSINESS_COMPLETE');
    const partial = await createProduct('API_BUSINESS_PARTIAL');
    for (const product of [complete, partial]) {
      await addSnapshots(product.id, [100, 90, 80], {
        rating: 4.5,
        reviewCount: 200,
      });
      await addAttempt(product.id, {
        status: 'success',
        provider: 'rainforest',
        confidence: 0.9,
      });
    }
    await db.insert(productBusinessSignals).values({
      productId: complete.id,
      currency: 'USD',
      costBasis: 35,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 0.12,
      advertisingCost: 5,
      taxCustomsBuffer: 2,
      targetSellPrice: 110,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await db.insert(productBusinessSignals).values({
      productId: partial.id,
      currency: 'USD',
      costBasis: 35,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const response = await request(app)
      .get('/api/opportunities/products?businessReadiness=complete&minRoi=0.5')
      .expect(200);

    expect(response.body.total).toBe(1);
    expect(response.body.data[0].product.id).toBe(complete.id);
    expect(response.body.data[0].businessSignals.completeness).toBe('complete');
  });

  it('returns 404 for a missing product explanation', async () => {
    const response = await request(app)
      .get('/api/opportunities/products/missing-product')
      .expect(404);

    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });

  async function createProduct(
    suffix: string,
    overrides: {
      platform?: string;
      category?: string;
      isMonitoring?: boolean;
    } = {}
  ) {
    return productService.createProduct({
      platform: overrides.platform ?? 'amazon',
      productUrl: `https://example.com/${suffix}-${Date.now()}`,
      asin: suffix,
      title: `${suffix} Product`,
      category: overrides.category,
      currency: 'USD',
      isMonitoring: overrides.isMonitoring ?? true,
      checkInterval: 24,
    });
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
        id: `${productId}-api-snapshot-${index}`,
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
      durationMs: 1000,
      confidence: options.confidence,
    });
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
