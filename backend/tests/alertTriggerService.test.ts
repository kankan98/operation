import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { AlertTriggerService } from '../src/services/alertTriggerService';
import { AlertRuleService } from '../src/services/alertRuleService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { AlertService } from '../src/services/alertService';
import { db } from '../src/db';
import {
  alertRules,
  priceSnapshots,
  products,
  alerts,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';

describe('AlertTriggerService', () => {
  const triggerService = new AlertTriggerService();
  const ruleService = new AlertRuleService();
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  const alertService = new AlertService();
  let testProductId: string;

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    const migration = fs.readFileSync(
      path.resolve('migrations/002-product-data-acquisition.sql'),
      'utf-8'
    );
    sqlite.exec(migration);
    sqlite.close();
  });

  beforeEach(async () => {
    await db.delete(scrapeAttempts);
    await db.delete(scrapeJobs);
    await db.delete(alertRules);
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/TRIGGER_TEST',
      asin: 'TRIGGER_TEST',
      title: 'Trigger Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    await db.delete(scrapeAttempts);
    await db.delete(scrapeJobs);
    await db.delete(alertRules);
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);
  });

  describe('price threshold rules', () => {
    it('should trigger alert when price drops below threshold', async () => {
      await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'warning',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 45,
        currency: 'USD',
        availability: 'in_stock',
      });

      await triggerService.evaluateRules(testProductId);

      const alertList = await alertService.listAlerts({ productId: testProductId });
      expect(alertList.data.length).toBe(1);
      expect(alertList.data[0].alertType).toBe('price_drop');
    });

    it('should not trigger alert when threshold not met', async () => {
      await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'warning',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 60,
        currency: 'USD',
        availability: 'in_stock',
      });

      await triggerService.evaluateRules(testProductId);

      const alertList = await alertService.listAlerts({ productId: testProductId });
      expect(alertList.data.length).toBe(0);
    });
  });

  describe('price change percent rules', () => {
    it('should trigger alert on price drop percentage', async () => {
      await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_change_percent',
        condition: 'decrease',
        threshold: 10,
        severity: 'info',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 85,
        currency: 'USD',
        availability: 'in_stock',
      });

      await triggerService.evaluateRules(testProductId);

      const alertList = await alertService.listAlerts({ productId: testProductId });
      expect(alertList.data.length).toBe(1);
      expect(alertList.data[0].alertType).toBe('price_drop');
    });

    it('should skip change rules with single snapshot', async () => {
      await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_change_percent',
        condition: 'decrease',
        threshold: 10,
        severity: 'info',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await triggerService.evaluateRules(testProductId);

      const alertList = await alertService.listAlerts({ productId: testProductId });
      expect(alertList.data.length).toBe(0);
    });
  });

  describe('rule filtering', () => {
    it('should skip disabled rules', async () => {
      const rule = await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'warning',
      });

      await ruleService.updateRule(rule.id, { enabled: false });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 45,
        currency: 'USD',
        availability: 'in_stock',
      });

      await triggerService.evaluateRules(testProductId);

      const alertList = await alertService.listAlerts({ productId: testProductId });
      expect(alertList.data.length).toBe(0);
    });
  });
});
