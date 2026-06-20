import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('Products API', () => {
  const app = createApp();

  beforeEach(async () => {
    await clearProductRelatedData();
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('POST /api/products', () => {
    it('should create a product', async () => {
      const productData = {
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/TEST123',
        asin: 'TEST123',
        title: 'Test Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.title).toBe('Test Product');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({ title: 'Incomplete' })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject duplicate product URL', async () => {
      const productData = {
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/DUP123',
        asin: 'DUP123',
        title: 'Duplicate Test',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      };

      await request(app).post('/api/products').send(productData).expect(201);

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(409);

      expect(response.body.error.code).toBe('DUPLICATE_URL');
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await request(app).post('/api/products').send({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/LIST1',
        asin: 'LIST1',
        title: 'Product 1',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      await request(app).post('/api/products').send({
        platform: 'walmart',
        productUrl: 'https://walmart.com/ip/LIST2',
        asin: 'LIST2',
        title: 'Product 2',
        currency: 'USD',
        isMonitoring: false,
        checkInterval: 12,
      });
    });

    it('should list all products', async () => {
      const response = await request(app).get('/api/products').expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.total).toBe(2);
    });

    it('should filter by monitoring status', async () => {
      const response = await request(app)
        .get('/api/products?monitoring=true')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].title).toBe('Product 1');
    });

    it('should filter by platform', async () => {
      const response = await request(app)
        .get('/api/products?platform=walmart')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].platform).toBe('walmart');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      const created = await request(app).post('/api/products').send({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/GET1',
        asin: 'GET1',
        title: 'Get Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      const response = await request(app)
        .get(`/api/products/${created.body.id}`)
        .expect(200);

      expect(response.body.id).toBe(created.body.id);
      expect(response.body.title).toBe('Get Product');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/non-existent')
        .expect(404);

      expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update product', async () => {
      const created = await request(app).post('/api/products').send({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/UPDATE1',
        asin: 'UPDATE1',
        title: 'Original',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      const response = await request(app)
        .patch(`/api/products/${created.body.id}`)
        .send({ title: 'Updated', currentPrice: 99.99 })
        .expect(200);

      expect(response.body.title).toBe('Updated');
      expect(response.body.currentPrice).toBe(99.99);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app)
        .patch('/api/products/non-existent')
        .send({ title: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const created = await request(app).post('/api/products').send({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/DEL1',
        asin: 'DEL1',
        title: 'To Delete',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      await request(app)
        .delete(`/api/products/${created.body.id}`)
        .expect(204);

      await request(app).get(`/api/products/${created.body.id}`).expect(404);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app).delete('/api/products/non-existent').expect(404);
    });
  });
});
