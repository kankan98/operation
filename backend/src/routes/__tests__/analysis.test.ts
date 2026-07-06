import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('analysis routes', () => {
  let tempDir: string;
  let app: ReturnType<typeof import('../../app').createApp>;
  let db: typeof import('../../db').db;
  let products: typeof import('../../db/schema').products;

  beforeAll(async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), 'ai-ops-analysis-test-'));
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

  it('returns empty stats for an existing product without snapshots', async () => {
    const now = Date.now();
    await db.insert(products).values({
      id: 'product-without-snapshots',
      platform: 'amazon',
      productUrl: 'https://www.amazon.com/dp/B0EMPTY0001',
      asin: 'B0EMPTY0001',
      title: 'Empty Snapshot Product',
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

    const response = await request(app)
      .get('/api/analysis/price-stats/product-without-snapshots')
      .expect(200);

    expect(response.body.data).toMatchObject({
      productId: 'product-without-snapshots',
      dataPoints: 0,
      currentPrice: 0,
      highestPrice: 0,
      lowestPrice: 0,
      averagePrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
      provenance: {
        source: 'unknown',
        stale: true,
        trust: 'unknown',
        label: '暂无读数',
      },
    });
  });
});
