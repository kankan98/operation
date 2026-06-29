import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { AlertRuleService } from '../src/services/alertRuleService';
import { ProductService } from '../src/services/productService';
import { db } from '../src/db';
import {
  alertRules,
  products,
  alerts,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('AlertRuleService', () => {
  const ruleService = new AlertRuleService();
  const productService = new ProductService();
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
    await clearProductRelatedData();

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/RULE_TEST',
      asin: 'RULE_TEST',
      title: 'Rule Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('createRule', () => {
    it('should create price threshold rule', async () => {
      const ruleData = {
        productId: testProductId,
        ruleType: 'price_threshold' as const,
        condition: 'below' as const,
        threshold: 50.0,
        severity: 'warning' as const,
      };

      const rule = await ruleService.createRule(ruleData);

      expect(rule.id).toBeDefined();
      expect(rule.productId).toBe(testProductId);
      expect(rule.ruleType).toBe('price_threshold');
      expect(rule.condition).toBe('below');
      expect(rule.threshold).toBe(50.0);
      expect(rule.enabled).toBe(true);
    });

    it('should create price change percent rule', async () => {
      const ruleData = {
        productId: testProductId,
        ruleType: 'price_change_percent' as const,
        condition: 'decrease' as const,
        threshold: 10.0,
        severity: 'info' as const,
      };

      const rule = await ruleService.createRule(ruleData);

      expect(rule.ruleType).toBe('price_change_percent');
      expect(rule.condition).toBe('decrease');
      expect(rule.threshold).toBe(10.0);
    });

    it('should validate required fields', async () => {
      await expect(
        ruleService.createRule({
          productId: '',
          ruleType: 'price_threshold' as const,
          condition: 'below' as const,
          threshold: 50,
          severity: 'info' as const,
        })
      ).rejects.toThrow();
    });
  });

  describe('listRules', () => {
    beforeEach(async () => {
      await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'warning',
      });

      await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_change_percent',
        condition: 'decrease',
        threshold: 10,
        severity: 'info',
      });
    });

    it('should list rules with filters', async () => {
      const result = await ruleService.listRules({ productId: testProductId });

      expect(result.data.length).toBe(2);
      expect(result.data[0].productId).toBe(testProductId);
    });
  });

  describe('updateRule', () => {
    it('should update rule threshold', async () => {
      const rule = await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'info',
      });

      const updated = await ruleService.updateRule(rule.id, { threshold: 60 });

      expect(updated.threshold).toBe(60);
    });

    it('should enable or disable rule', async () => {
      const rule = await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'info',
      });

      const disabled = await ruleService.updateRule(rule.id, { enabled: false });
      expect(disabled.enabled).toBe(false);

      const enabled = await ruleService.updateRule(rule.id, { enabled: true });
      expect(enabled.enabled).toBe(true);
    });
  });

  describe('deleteRule', () => {
    it('should delete existing rule', async () => {
      const rule = await ruleService.createRule({
        productId: testProductId,
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 50,
        severity: 'info',
      });

      await ruleService.deleteRule(rule.id);

      await expect(ruleService.getRuleById(rule.id)).rejects.toThrow('Alert rule not found');
    });
  });
});
