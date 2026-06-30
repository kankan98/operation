import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { ProductService } from '../src/services/productService';
import { db } from '../src/db';
import {
  priceSnapshots,
  products,
  alerts,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('PriceSnapshotService', () => {
  const snapshotService = new PriceSnapshotService();
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
      productUrl: 'https://amazon.com/dp/SNAP_TEST',
      asin: 'SNAP_TEST',
      title: 'Snapshot Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('createSnapshot', () => {
    it('should create a price snapshot with required fields', async () => {
      const snapshotData = {
        productId: testProductId,
        price: 99.99,
        currency: 'USD',
        availability: 'in_stock',
      };

      const snapshot = await snapshotService.createSnapshot(snapshotData);

      expect(snapshot.id).toBeDefined();
      expect(snapshot.price).toBe(99.99);
      expect(snapshot.productId).toBe(testProductId);
      expect(snapshot.timestamp).toBeDefined();
    });

    it('should create snapshot with all optional fields', async () => {
      const snapshotData = {
        productId: testProductId,
        price: 149.99,
        currency: 'USD',
        availability: 'in_stock',
        rating: 4.8,
        reviewCount: 5678,
        salesRank: 100,
        shippingCost: 5.99,
        seller: 'Amazon',
        condition: 'new',
        metadata: JSON.stringify({ source: 'test' }),
      };

      const snapshot = await snapshotService.createSnapshot(snapshotData);

      expect(snapshot.salesRank).toBe(100);
      expect(snapshot.shippingCost).toBe(5.99);
      expect(snapshot.seller).toBe('Amazon');
      expect(snapshot.condition).toBe('new');
      expect(snapshot.metadata).toBeDefined();
    });
  });

  describe('getSnapshotsByProduct', () => {
    beforeEach(async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 90,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 85,
        currency: 'USD',
        availability: 'in_stock',
      });
    });

    it('should return all snapshots for a product', async () => {
      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId
      );

      expect(snapshots.length).toBe(3);
      expect(snapshots[0].productId).toBe(testProductId);
    });

    it('should return snapshots in descending order by timestamp', async () => {
      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId
      );

      expect(snapshots[0].timestamp).toBeGreaterThanOrEqual(
        snapshots[1].timestamp
      );
      expect(snapshots[1].timestamp).toBeGreaterThanOrEqual(
        snapshots[2].timestamp
      );
    });

    it('should support limit parameter', async () => {
      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId,
        { limit: 2 }
      );

      expect(snapshots.length).toBe(2);
    });
  });

  describe('getLatestSnapshot', () => {
    it('should return the latest snapshot for a product', async () => {
      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 100,
        currency: 'USD',
        availability: 'in_stock',
      });

      await snapshotService.createSnapshot({
        productId: testProductId,
        price: 90,
        currency: 'USD',
        availability: 'in_stock',
      });

      const latest = await snapshotService.getLatestSnapshot(testProductId);

      expect(latest).toBeDefined();
      expect(latest!.price).toBe(90);
    });

    it('should return null if no snapshots exist', async () => {
      const latest = await snapshotService.getLatestSnapshot('non-existent');

      expect(latest).toBeNull();
    });
  });
});
