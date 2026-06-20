import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('End-to-End Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await clearProductRelatedData();
  });

  afterAll(async () => {
    await clearProductRelatedData();
  });

  it('should complete full product lifecycle', async () => {
    // 1. 创建产品
    const createResponse = await request(app)
      .post('/api/products')
      .send({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/E2E_TEST',
        asin: 'E2E_TEST',
        title: 'E2E Test Product',
        brand: 'Test Brand',
        currentPrice: 99.99,
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      })
      .expect(201);

    const productId = createResponse.body.id;
    expect(productId).toBeDefined();

    // 2. 查询产品列表
    const listResponse = await request(app)
      .get('/api/products')
      .expect(200);

    expect(listResponse.body.data.length).toBeGreaterThan(0);
    expect(listResponse.body.data[0].id).toBe(productId);

    // 3. 获取产品详情
    const detailResponse = await request(app)
      .get(`/api/products/${productId}`)
      .expect(200);

    expect(detailResponse.body.title).toBe('E2E Test Product');
    expect(detailResponse.body.currentPrice).toBe(99.99);

    // 4. 更新产品
    const updateResponse = await request(app)
      .patch(`/api/products/${productId}`)
      .send({
        currentPrice: 79.99,
        title: 'E2E Test Product (Updated)',
      })
      .expect(200);

    expect(updateResponse.body.currentPrice).toBe(79.99);
    expect(updateResponse.body.title).toBe('E2E Test Product (Updated)');

    // 5. 创建价格下降报警
    const alertResponse = await request(app)
      .post('/api/alerts')
      .send({
        productId,
        alertType: 'price_drop',
        severity: 'warning',
        title: 'Price dropped from $99.99 to $79.99',
        message: 'Significant price drop detected',
        dataSnapshot: JSON.stringify({
          oldPrice: 99.99,
          newPrice: 79.99,
          dropPercentage: 20,
        }),
      })
      .expect(201);

    const alertId = alertResponse.body.id;
    expect(alertId).toBeDefined();

    // 6. 查询未读报警
    const unreadAlertsResponse = await request(app)
      .get('/api/alerts?unreadOnly=true')
      .expect(200);

    expect(unreadAlertsResponse.body.data.length).toBe(1);
    expect(unreadAlertsResponse.body.data[0].isRead).toBe(false);

    // 7. 标记报警为已读
    const readResponse = await request(app)
      .patch(`/api/alerts/${alertId}/read`)
      .expect(200);

    expect(readResponse.body.isRead).toBe(true);

    // 8. 再次查询未读报警（应为空）
    const emptyUnreadResponse = await request(app)
      .get('/api/alerts?unreadOnly=true')
      .expect(200);

    expect(emptyUnreadResponse.body.data.length).toBe(0);

    // 9. 归档报警
    const archiveResponse = await request(app)
      .patch(`/api/alerts/${alertId}/archive`)
      .expect(200);

    expect(archiveResponse.body.isArchived).toBe(true);

    // 10. 删除报警
    await request(app)
      .delete(`/api/alerts/${alertId}`)
      .expect(204);

    // 11. 验证报警已删除
    await request(app)
      .get(`/api/alerts/${alertId}`)
      .expect(404);

    // 12. 删除产品
    await request(app)
      .delete(`/api/products/${productId}`)
      .expect(204);

    // 13. 验证产品已删除
    await request(app)
      .get(`/api/products/${productId}`)
      .expect(404);
  });

  it('should handle product filtering and pagination', async () => {
    // 创建多个产品
    await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/FILTER1',
      asin: 'FILTER1',
      title: 'Filter Test 1',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });

    await request(app).post('/api/products').send({
      platform: 'walmart',
      productUrl: 'https://walmart.com/ip/FILTER2',
      asin: 'FILTER2',
      title: 'Filter Test 2',
      currency: 'USD',
      isMonitoring: false,
      checkInterval: 12,
    });

    await request(app).post('/api/products').send({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/FILTER3',
      asin: 'FILTER3',
      title: 'Filter Test 3',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });

    // 测试平台过滤
    const amazonProducts = await request(app)
      .get('/api/products?platform=amazon')
      .expect(200);

    expect(amazonProducts.body.data.length).toBe(2);
    amazonProducts.body.data.forEach((p: any) => {
      expect(p.platform).toBe('amazon');
    });

    // 测试监控状态过滤
    const monitoringProducts = await request(app)
      .get('/api/products?monitoring=true')
      .expect(200);

    expect(monitoringProducts.body.data.length).toBe(2);

    // 测试分页
    const page1 = await request(app)
      .get('/api/products?page=1&limit=2')
      .expect(200);

    expect(page1.body.data.length).toBe(2);
    expect(page1.body.pagination.page).toBe(1);
    expect(page1.body.pagination.totalPages).toBe(2);
  });

  it('should handle error cases gracefully', async () => {
    // 缺少必填字段
    await request(app)
      .post('/api/products')
      .send({ title: 'Incomplete' })
      .expect(400);

    // 获取不存在的资源
    await request(app)
      .get('/api/products/non-existent-id')
      .expect(404);

    // 更新不存在的资源
    await request(app)
      .patch('/api/products/non-existent-id')
      .send({ title: 'Update' })
      .expect(404);

    // 删除不存在的资源
    await request(app)
      .delete('/api/products/non-existent-id')
      .expect(404);
  });

  it('should validate health check endpoint', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});
