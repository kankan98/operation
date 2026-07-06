import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('price snapshot routes', () => {
  let tempDir: string;
  let app: ReturnType<typeof import('../../app').createApp>;
  let db: typeof import('../../db').db;
  let products: typeof import('../../db/schema').products;

  beforeAll(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'ai-ops-snapshots-test-'));
    process.env.DATABASE_PATH = path.join(tempDir, 'test.db');

    const sqlite = new Database(process.env.DATABASE_PATH);
    migrate(drizzle(sqlite), { migrationsFolder: path.resolve(process.cwd(), 'drizzle') });
    sqlite.close();

    ({ db } = await import('../../db'));
    ({ products } = await import('../../db/schema'));
    app = (await import('../../app')).createApp();
  });

  afterAll(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // better-sqlite3 keeps the module-level test connection open on Windows.
    }
  });

  it('should create snapshot when only required fields are provided', async () => {
    await insertProduct('required-only-product');

    const response = await request(app)
      .post('/api/price-snapshots')
      .send({
        productId: 'required-only-product',
        price: 21.75,
        currency: 'USD',
        availability: 'in_stock',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      productId: 'required-only-product',
      price: 21.75,
      currency: 'USD',
      availability: 'in_stock',
      source: 'manual',
      rating: null,
      reviewCount: null,
      salesRank: null,
      shippingCost: null,
      seller: null,
      condition: null,
      metadata: null,
    });
    expect(response.body.id).toEqual(expect.any(String));
    expect(response.body.timestamp).toEqual(expect.any(Number));
  });

  it('should create snapshot when partial optional numeric fields are provided', async () => {
    await insertProduct('partial-optional-product');

    const response = await request(app)
      .post('/api/price-snapshots')
      .send({
        productId: 'partial-optional-product',
        price: 19.99,
        currency: 'USD',
        availability: 'low_stock',
        rating: 4.4,
        reviewCount: 678,
        salesRank: 12345,
      })
      .expect(201);

    expect(response.body).toMatchObject({
      productId: 'partial-optional-product',
      price: 19.99,
      availability: 'low_stock',
      source: 'manual',
      rating: 4.4,
      reviewCount: 678,
      salesRank: 12345,
      shippingCost: null,
      seller: null,
      condition: null,
      metadata: null,
    });
  });

  async function insertProduct(id: string) {
    const now = Date.now();
    await db.insert(products).values({
      id,
      platform: 'amazon',
      productUrl: `https://www.amazon.com/dp/${id}`,
      asin: id,
      title: `Snapshot Test Product ${id}`,
      brand: null,
      category: null,
      imageUrl: null,
      currentPrice: null,
      currency: 'USD',
      isMonitoring: true,
      monitorType: 'automatic',
      checkInterval: 24,
      userId: null,
      createdAt: now,
      updatedAt: now,
      lastCheckedAt: null,
      metadata: null,
    });
  }
});
