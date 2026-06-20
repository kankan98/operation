import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
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

describe('Alerts API', () => {
  const app = createApp();
  let testProductId: string;

  beforeEach(async () => {
    await clearData();

    // 创建测试产品
    const response = await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/ALERT_API_TEST',
      asin: 'ALERT_API_TEST',
      title: 'Alert API Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = response.body.id;
  });

  afterEach(async () => {
    await clearData();
  });

  describe('POST /api/alerts', () => {
    it('should create an alert', async () => {
      const alertData = {
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Price dropped',
        message: 'Price dropped by 10%',
      };

      const response = await request(app)
        .post('/api/alerts')
        .send(alertData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Price dropped');
      expect(response.body.isRead).toBe(false);
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/alerts')
        .send({ title: 'Incomplete' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/alerts', () => {
    beforeEach(async () => {
      await request(app).post('/api/alerts').send({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Alert 1',
      });

      await request(app).post('/api/alerts').send({
        productId: testProductId,
        alertType: 'out_of_stock',
        severity: 'critical',
        title: 'Alert 2',
      });
    });

    it('should list all alerts', async () => {
      const response = await request(app).get('/api/alerts').expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by severity', async () => {
      const response = await request(app)
        .get('/api/alerts?severity=critical')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].severity).toBe('critical');
    });

    it('should filter by product', async () => {
      const response = await request(app)
        .get(`/api/alerts?productId=${testProductId}`)
        .expect(200);

      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/alerts/:id', () => {
    it('should get alert by id', async () => {
      const created = await request(app).post('/api/alerts').send({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Get Alert',
      });

      const response = await request(app)
        .get(`/api/alerts/${created.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);
    });

    it('should return 404 for non-existent alert', async () => {
      const response = await request(app)
        .get('/api/alerts/non-existent')
        .expect(404);

      expect(response.body.error.code).toBe('ALERT_NOT_FOUND');
    });
  });

  describe('PATCH /api/alerts/:id/read', () => {
    it('should mark alert as read', async () => {
      const created = await request(app).post('/api/alerts').send({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Mark Read Test',
      });

      const response = await request(app)
        .patch(`/api/alerts/${created.body.id}/read`)
        .expect(200);

      expect(response.body.isRead).toBe(true);
    });

    it('should return 404 for non-existent alert', async () => {
      await request(app)
        .patch('/api/alerts/non-existent/read')
        .expect(404);
    });
  });

  describe('PATCH /api/alerts/:id/archive', () => {
    it('should mark alert as archived', async () => {
      const created = await request(app).post('/api/alerts').send({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Archive Test',
      });

      const response = await request(app)
        .patch(`/api/alerts/${created.body.id}/archive`)
        .expect(200);

      expect(response.body.isArchived).toBe(true);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('should delete alert', async () => {
      const created = await request(app).post('/api/alerts').send({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'To Delete',
      });

      await request(app)
        .delete(`/api/alerts/${created.body.id}`)
        .expect(204);

      await request(app).get(`/api/alerts/${created.body.id}`).expect(404);
    });

    it('should return 404 for non-existent alert', async () => {
      await request(app).delete('/api/alerts/non-existent').expect(404);
    });
  });
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
