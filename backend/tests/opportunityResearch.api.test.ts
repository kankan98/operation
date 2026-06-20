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

describe('Opportunity Research API', () => {
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

  it('creates and updates a product research entry idempotently', async () => {
    const product = await createScoredProduct('RESEARCH_IDEMPOTENT');

    const created = await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'researching',
        priority: 'high',
        tags: [' Amazon ', 'amazon', 'Launch'],
        notes: 'Check supplier MOQ.',
      })
      .expect(200);

    const updated = await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'ready',
        priority: 'medium',
        tags: [' Launch ', 'Margin'],
        notes: 'Ready for sourcing call.',
      })
      .expect(200);

    const list = await request(app)
      .get('/api/opportunities/research?tag=launch')
      .expect(200);

    expect(created.body.data.tags).toEqual(['amazon', 'launch']);
    expect(updated.body.data).toMatchObject({
      productId: product.id,
      status: 'ready',
      priority: 'medium',
      tags: ['launch', 'margin'],
      notesSummary: 'Ready for sourcing call.',
      archived: false,
    });
    expect(list.body.total).toBe(1);
  });

  it('patches status tags notes, archives, deletes, and handles missing products', async () => {
    const product = await createScoredProduct('RESEARCH_PATCH');

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({ status: 'watching' })
      .expect(200);

    const patched = await request(app)
      .patch(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'rejected',
        priority: 'low',
        tags: ['blocked'],
        notes: 'Margin is too thin.',
      })
      .expect(200);

    const archived = await request(app)
      .post(`/api/opportunities/products/${product.id}/research/archive`)
      .expect(200);

    await request(app)
      .delete(`/api/opportunities/products/${product.id}/research`)
      .expect(204);

    const deleted = await request(app)
      .get(`/api/opportunities/products/${product.id}/research`)
      .expect(200);

    await request(app)
      .put('/api/opportunities/products/missing-product/research')
      .send({ status: 'researching' })
      .expect(404);

    expect(patched.body.data).toMatchObject({
      status: 'rejected',
      priority: 'low',
      tags: ['blocked'],
    });
    expect(archived.body.data.archived).toBe(true);
    expect(deleted.body.data).toBeNull();
  });

  it('extends opportunity list and explanation responses with research filters', async () => {
    const shortlisted = await createScoredProduct('RESEARCH_SHORTLISTED');
    const unlisted = await createScoredProduct('RESEARCH_UNLISTED');

    await request(app)
      .put(`/api/opportunities/products/${shortlisted.id}/research`)
      .send({
        status: 'watching',
        priority: 'high',
        tags: ['launch'],
      })
      .expect(200);

    const list = await request(app)
      .get('/api/opportunities/products?shortlisted=true&researchStatus=watching&researchTag=launch')
      .expect(200);
    const explanation = await request(app)
      .get(`/api/opportunities/products/${shortlisted.id}`)
      .expect(200);
    const inverse = await request(app)
      .get('/api/opportunities/products?shortlisted=false')
      .expect(200);

    expect(list.body.total).toBe(1);
    expect(list.body.data[0].product.id).toBe(shortlisted.id);
    expect(list.body.data[0].research).toMatchObject({
      status: 'watching',
      priority: 'high',
      tags: ['launch'],
    });
    expect(explanation.body.data.research.status).toBe('watching');
    expect(inverse.body.data.map((item: any) => item.product.id)).toContain(
      unlisted.id
    );
  });

  it('compares selected opportunities and enforces comparison limits', async () => {
    const first = await createScoredProduct('RESEARCH_COMPARE_1');
    const second = await createScoredProduct('RESEARCH_COMPARE_2');

    await request(app)
      .put(`/api/opportunities/products/${first.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['compare'],
      })
      .expect(200);

    const comparison = await request(app)
      .post('/api/opportunities/research/compare')
      .send({ productIds: [first.id, second.id] })
      .expect(200);
    const overLimit = await request(app)
      .post('/api/opportunities/research/compare')
      .send({
        productIds: [
          'product-1',
          'product-2',
          'product-3',
          'product-4',
          'product-5',
          'product-6',
          'product-7',
        ],
      })
      .expect(400);

    expect(comparison.body.selectedProductIds).toEqual([first.id, second.id]);
    expect(comparison.body.data).toHaveLength(2);
    expect(comparison.body.data[0].research.status).toBe('ready');
    expect(comparison.body.caveats.score).toContain('do not change');
    expect(overLimit.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exports selected opportunities with deterministic caveat fields', async () => {
    const product = await createScoredProduct('RESEARCH_EXPORT');

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['export'],
      })
      .expect(200);

    const response = await request(app)
      .post('/api/opportunities/research/export')
      .send({
        format: 'csv',
        productIds: [product.id],
      })
      .expect(200);

    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0]).toMatchObject({
      productId: product.id,
      researchStatus: 'ready',
      researchPriority: 'high',
      researchTags: ['export'],
    });
    expect(response.body.rows[0].marketSignalCaveat).toContain('not verified');
    expect(response.body.rows[0].businessSignalCaveat).toContain('assumption');
    expect(response.body.rows[0].scoreCaveat).toContain('do not change');
    expect(response.body.csv).toContain('productId,title,platform');
  });

  it('keeps opportunity score deterministic when research metadata changes', async () => {
    const product = await createScoredProduct('RESEARCH_SCORE');
    const before = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['score'],
        notes: 'User workflow note.',
      })
      .expect(200);
    const after = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    expect(after.body.data.score).toBe(before.body.data.score);
    expect(after.body.data.factors).toEqual(before.body.data.factors);
    expect(after.body.data.research.status).toBe('ready');
  });

  async function createScoredProduct(suffix: string) {
    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: `https://example.com/${suffix}-${Date.now()}`,
      asin: suffix,
      title: `${suffix} Product`,
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });

    await addSnapshots(product.id, [100, 90, 80]);
    await attemptService.recordAttempt({
      productId: product.id,
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      durationMs: 1000,
      confidence: 0.9,
    });

    return product;
  }

  async function addSnapshots(productId: string, prices: number[]) {
    for (const [index, price] of prices.entries()) {
      await db.insert(priceSnapshots).values({
        id: `${productId}-research-snapshot-${index}`,
        productId,
        price,
        currency: 'USD',
        availability: 'in_stock',
        rating: 4.5,
        reviewCount: 200,
        timestamp: Date.now() - (prices.length - index) * 60 * 60 * 1000,
      });
    }
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
