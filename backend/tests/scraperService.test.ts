import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ScraperService } from '../src/services/scraperService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import { priceSnapshots, products, alerts } from '../src/db/schema';

describe('ScraperService', () => {
  const scraperService = new ScraperService();
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  let testProductId: string;

  beforeEach(async () => {
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/B07XJ8C8F5',
      asin: 'B07XJ8C8F5',
      title: 'Test Product',
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

  describe('scrapeProduct', () => {
    it.skip('should scrape product and create snapshot (skipped: requires real Amazon access)', async () => {
      const result = await scraperService.scrapeProduct(testProductId);

      expect(result.success).toBe(true);
      if (result.snapshotId) {
        const snapshots = await snapshotService.getSnapshotsByProduct(
          testProductId
        );
        expect(snapshots.length).toBe(1);
        expect(snapshots[0].price).toBeGreaterThan(0);
      }
    }, 30000);

    it('should handle product not found', async () => {
      const result = await scraperService.scrapeProduct('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('scrapeAllMonitoringProducts', () => {
    it('should scrape all monitoring products', async () => {
      const results = await scraperService.scrapeAllMonitoringProducts();

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].productId).toBe(testProductId);
    }, 60000);
  });
});
