import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('Price Snapshots API', () => {
  const app = createApp();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const response = await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/SNAP_API_TEST',
      asin: 'SNAP_API_TEST',
      title: 'Snapshot API Test Product',
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

  describe('POST /api/price-snapshots', () => {
    it('should create a price snapshot', async () => {
      const snapshotData = {
        productId: testProductId,
        price: 99.99,
        currency: 'USD',
        availability: 'in_stock',
        rating: 4.5,
        reviewCount: 1234,
      };

      const response = await request(app)
        .post('/api/price-snapshots')
        .send(snapshotData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.price).toBe(99.99);
      expect(response.body.productId).toBe(testProductId);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/price-snapshots')
        .send({ price: 99.99 })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/price-snapshots/product/:productId', () => {
    beforeEach(async () => {
      await request(app).post('/api/price-snapshots').send({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await request(app).post('/api/price-snapshots').send({
        productId: testProductId,
        price: 90,
        currency: 'USD',
        availability: 'in_stock',
      });

      await request(app).post('/api/price-snapshots').send({
        productId: testProductId,
        price: 85,
        currency: 'USD',
        availability: 'in_stock',
      });
    });

    it('should return all snapshots for a product', async () => {
      const response = await request(app)
        .get(`/api/price-snapshots/product/${testProductId}`)
        .expect(200);

      expect(response.body.length).toBe(3);
      expect(response.body[0].productId).toBe(testProductId);
    });

    it('should return snapshots in descending order', async () => {
      const response = await request(app)
        .get(`/api/price-snapshots/product/${testProductId}`)
        .expect(200);

      expect(response.body[0].timestamp).toBeGreaterThanOrEqual(
        response.body[1].timestamp
      );
    });

    it('should support limit query parameter', async () => {
      const response = await request(app)
        .get(`/api/price-snapshots/product/${testProductId}?limit=2`)
        .expect(200);

      expect(response.body.length).toBe(2);
    });
  });

  describe('GET /api/price-snapshots/product/:productId/latest', () => {
    it('should return the latest snapshot', async () => {
      await request(app).post('/api/price-snapshots').send({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await request(app).post('/api/price-snapshots').send({
        productId: testProductId,
        price: 90,
        currency: 'USD',
        availability: 'in_stock',
      });

      const response = await request(app)
        .get(`/api/price-snapshots/product/${testProductId}/latest`)
        .expect(200);

      expect(response.body.price).toBe(90);
    });

    it('should return 404 if no snapshots exist', async () => {
      await request(app)
        .get('/api/price-snapshots/product/non-existent/latest')
        .expect(404);
    });
  });
});
