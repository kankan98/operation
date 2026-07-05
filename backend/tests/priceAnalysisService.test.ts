import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { PriceAnalysisService } from '../src/services/priceAnalysisService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import {
  priceSnapshots,
  products,
  alerts,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('PriceAnalysisService', () => {
  const analysisService = new PriceAnalysisService();
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
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
      productUrl: 'https://amazon.com/dp/ANALYSIS_TEST',
      asin: 'ANALYSIS_TEST',
      title: 'Analysis Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('getPriceStats provenance', () => {
    it('marks a fresh manual reading as trustworthy', async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 59.99,
        currency: 'USD',
        availability: 'in_stock',
        source: 'manual',
      });

      const stats = await analysisService.getPriceStats(testProductId);

      expect(stats.provenance).toBeDefined();
      expect(stats.provenance.source).toBe('manual');
      expect(stats.provenance.stale).toBe(false);
      expect(stats.provenance.trust).toBe('high');
    });

    it('flags a stale manual reading and advises re-check', async () => {
      const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 59.99,
        currency: 'USD',
        availability: 'in_stock',
        source: 'manual',
        recordedAt: eightDaysAgo,
      });

      const stats = await analysisService.getPriceStats(testProductId);

      expect(stats.provenance).toBeDefined();
      expect(stats.provenance.stale).toBe(true);
      expect(stats.provenance.trust).toBe('low');
      expect(stats.provenance.label).toContain('建议复核');
    });
  });

  describe('getPriceStats', () => {
    it('should calculate statistics with multiple snapshots', async () => {
      // Create multiple snapshots with varying prices
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 120,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 80,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 110,
        currency: 'USD',
        availability: 'in_stock',
      });

      const stats = await analysisService.getPriceStats(testProductId);

      expect(stats.productId).toBe(testProductId);
      expect(stats.currentPrice).toBe(110);
      expect(stats.highestPrice).toBe(120);
      expect(stats.lowestPrice).toBe(80);
      expect(stats.averagePrice).toBe(102.5);
      expect(stats.priceChange).toBe(10);
      expect(stats.priceChangePercent).toBe(10.0);
      expect(stats.dataPoints).toBe(4);
    });

    it('should calculate statistics with single snapshot', async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      const stats = await analysisService.getPriceStats(testProductId);

      expect(stats.currentPrice).toBe(100);
      expect(stats.highestPrice).toBe(100);
      expect(stats.lowestPrice).toBe(100);
      expect(stats.averagePrice).toBe(100);
      expect(stats.priceChange).toBe(0);
      expect(stats.priceChangePercent).toBe(0);
      expect(stats.dataPoints).toBe(1);
    });

    it('should throw error for product with no snapshots', async () => {
      await expect(analysisService.getPriceStats(testProductId)).rejects.toThrow(
        'No price data available'
      );
    });
  });

  describe('detectTrend', () => {
    it('should detect rising price trend', async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 110,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 120,
        currency: 'USD',
        availability: 'in_stock',
      });

      const stats = await analysisService.getPriceStats(testProductId);
      expect(stats.priceChangePercent).toBeGreaterThan(0);
    });

    it('should detect falling price trend', async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 120,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 110,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      const stats = await analysisService.getPriceStats(testProductId);
      expect(stats.priceChangePercent).toBeLessThan(0);
    });

    it('should detect stable price trend', async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 101,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      const stats = await analysisService.getPriceStats(testProductId);
      expect(Math.abs(stats.priceChangePercent)).toBeLessThanOrEqual(2);
    });
  });
});
