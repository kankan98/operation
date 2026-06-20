import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AlertService } from '../src/services/alertService';
import { ProductService } from '../src/services/productService';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('AlertService', () => {
  const alertService = new AlertService();
  const productService = new ProductService();
  let testProductId: string;

  beforeEach(async () => {
    // 清空测试数据
    await clearProductRelatedData();

    // 创建测试产品
    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/ALERT_TEST',
      asin: 'ALERT_TEST',
      title: 'Alert Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('createAlert', () => {
    it('should create an alert', async () => {
      const alertData = {
        productId: testProductId,
        alertType: 'price_drop' as const,
        severity: 'info' as const,
        title: 'Price dropped',
        message: 'Price dropped by 10%',
      };

      const alert = await alertService.createAlert(alertData);

      expect(alert.id).toBeDefined();
      expect(alert.title).toBe('Price dropped');
      expect(alert.isRead).toBe(false);
      expect(alert.isArchived).toBe(false);
    });

    it('should create alert with data snapshot', async () => {
      const alertData = {
        productId: testProductId,
        alertType: 'price_drop' as const,
        severity: 'warning' as const,
        title: 'Price change',
        dataSnapshot: JSON.stringify({ oldPrice: 100, newPrice: 80 }),
      };

      const alert = await alertService.createAlert(alertData);

      expect(alert.dataSnapshot).toBeDefined();
      expect(JSON.parse(alert.dataSnapshot!)).toEqual({ oldPrice: 100, newPrice: 80 });
    });
  });

  describe('getAlertById', () => {
    it('should return alert by id', async () => {
      const created = await alertService.createAlert({
        productId: testProductId,
        alertType: 'out_of_stock',
        severity: 'critical',
        title: 'Out of stock',
      });

      const alert = await alertService.getAlertById(created.id);

      expect(alert).toBeDefined();
      expect(alert!.id).toBe(created.id);
    });

    it('should return null for non-existent id', async () => {
      const alert = await alertService.getAlertById('non-existent');
      expect(alert).toBeNull();
    });
  });

  describe('listAlerts', () => {
    beforeEach(async () => {
      await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Alert 1',
      });

      await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_surge',
        severity: 'warning',
        title: 'Alert 2',
      });

      const alert3 = await alertService.createAlert({
        productId: testProductId,
        alertType: 'out_of_stock',
        severity: 'critical',
        title: 'Alert 3',
      });

      // 标记一个为已读
      await alertService.markAsRead(alert3.id);
    });

    it('should list all alerts', async () => {
      const result = await alertService.listAlerts({});

      expect(result.data.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by product', async () => {
      const result = await alertService.listAlerts({ productId: testProductId });

      expect(result.data.length).toBe(3);
    });

    it('should filter by unread status', async () => {
      const result = await alertService.listAlerts({ unreadOnly: true });

      expect(result.data.length).toBe(2);
    });

    it('should filter by severity', async () => {
      const result = await alertService.listAlerts({ severity: 'critical' });

      expect(result.data.length).toBe(1);
      expect(result.data[0].severity).toBe('critical');
    });

    it('should paginate results', async () => {
      const result = await alertService.listAlerts({ page: 1, limit: 2 });

      expect(result.data.length).toBe(2);
      expect(result.pagination.totalPages).toBe(2);
    });
  });

  describe('markAsRead', () => {
    it('should mark alert as read', async () => {
      const created = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Test Alert',
      });

      expect(created.isRead).toBe(false);

      const updated = await alertService.markAsRead(created.id);

      expect(updated.isRead).toBe(true);
    });

    it('should throw error for non-existent alert', async () => {
      await expect(
        alertService.markAsRead('non-existent')
      ).rejects.toThrow();
    });
  });

  describe('markAsArchived', () => {
    it('should mark alert as archived', async () => {
      const created = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'Test Alert',
      });

      expect(created.isArchived).toBe(false);

      const updated = await alertService.markAsArchived(created.id);

      expect(updated.isArchived).toBe(true);
    });
  });

  describe('deleteAlert', () => {
    it('should delete existing alert', async () => {
      const created = await alertService.createAlert({
        productId: testProductId,
        alertType: 'price_drop',
        severity: 'info',
        title: 'To Delete',
      });

      await alertService.deleteAlert(created.id);

      const alert = await alertService.getAlertById(created.id);
      expect(alert).toBeNull();
    });

    it('should throw error for non-existent alert', async () => {
      await expect(
        alertService.deleteAlert('non-existent')
      ).rejects.toThrow();
    });
  });
});
