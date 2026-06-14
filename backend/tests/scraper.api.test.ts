import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('Scraper API', () => {
  const app = createApp();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const response = await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/B07XJ8C8F5',
      asin: 'B07XJ8C8F5',
      title: 'API Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = response.body.id;
  });

  afterEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);
  });

  describe('POST /api/scraper/product/:productId', () => {
    it.skip('should scrape single product (skipped: requires real Amazon access)', async () => {
      const response = await request(app)
        .post(`/api/scraper/product/${testProductId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.snapshotId).toBeDefined();
    }, 30000);

    it.skip('should return error for non-existent product (skipped: requires real Amazon access)', async () => {
      await request(app)
        .post('/api/scraper/product/non-existent')
        .expect(500);
    });
  });

  describe('POST /api/scraper/all', () => {
    it.skip('should scrape all monitoring products (skipped: requires real Amazon access)', async () => {
      const response = await request(app)
        .post('/api/scraper/all')
        .expect(200);

      expect(response.body.total).toBe(1);
      expect(response.body.success).toBeGreaterThan(0);
    }, 60000);
  });
});
