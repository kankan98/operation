import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PriceAnalysisService } from '../src/services/priceAnalysisService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('PriceAnalysisService', () => {
  const analysisService = new PriceAnalysisService();
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

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
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);
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
