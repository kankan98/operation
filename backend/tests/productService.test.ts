import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { ProductService } from '../src/services/productService';
import { db } from '../src/db';
import { clearProductRelatedData } from './__utils__/dbCleanup';
import { products, alerts, scrapeAttempts, scrapeJobs } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('ProductService', () => {
  const productService = new ProductService();

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
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('createProduct', () => {
    it('should create a product with valid data', async () => {
      const productData = {
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/TEST123',
        asin: 'TEST123',
        title: 'Test Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      };

      const product = await productService.createProduct(productData);

      expect(product.id).toBeDefined();
      expect(product.title).toBe('Test Product');
      expect(product.platform).toBe('amazon');
    });

    it('should reject duplicate product URL', async () => {
      const productData = {
        platform: 'amazon' as const,
        productUrl: 'https://amazon.com/dp/DUPLICATE',
        asin: 'DUPLICATE',
        title: 'First Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      };

      await productService.createProduct(productData);

      await expect(
        productService.createProduct(productData)
      ).rejects.toThrow();
    });
  });

  describe('getProductById', () => {
    it('should return product by id', async () => {
      const created = await productService.createProduct({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/GET123',
        asin: 'GET123',
        title: 'Get Test',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      const product = await productService.getProductById(created.id);

      expect(product).toBeDefined();
      expect(product!.id).toBe(created.id);
    });

    it('should return null for non-existent id', async () => {
      const product = await productService.getProductById('non-existent');
      expect(product).toBeNull();
    });
  });

  describe('listProducts', () => {
    beforeEach(async () => {
      // 创建测试数据
      await productService.createProduct({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/LIST1',
        asin: 'LIST1',
        title: 'List Product 1',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      await productService.createProduct({
        platform: 'walmart',
        productUrl: 'https://walmart.com/ip/LIST2',
        asin: 'LIST2',
        title: 'List Product 2',
        currency: 'USD',
        isMonitoring: false,
        checkInterval: 12,
      });
    });

    it('should list all products', async () => {
      const result = await productService.listProducts({});

      expect(result.data.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter by monitoring status', async () => {
      const result = await productService.listProducts({ monitoring: true });

      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe('List Product 1');
    });

    it('should filter by platform', async () => {
      const result = await productService.listProducts({ platform: 'walmart' });

      expect(result.data.length).toBe(1);
      expect(result.data[0].platform).toBe('walmart');
    });

    it('should paginate results', async () => {
      const result = await productService.listProducts({ page: 1, limit: 1 });

      expect(result.data.length).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(1);
      expect(result.pagination.totalPages).toBe(2);
    });

    it('should iterate products in stable batches', async () => {
      const batches = [];

      for await (const batch of productService.iterateProductBatches({}, 1)) {
        batches.push(batch);
      }

      expect(batches).toHaveLength(2);
      expect(batches[0][0].title).toBe('List Product 1');
      expect(batches[1][0].title).toBe('List Product 2');
    });
  });

  describe('updateProduct', () => {
    it('should update product fields', async () => {
      const created = await productService.createProduct({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/UPDATE1',
        asin: 'UPDATE1',
        title: 'Original Title',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      const updated = await productService.updateProduct(created.id, {
        title: 'Updated Title',
        currentPrice: 99.99,
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.currentPrice).toBe(99.99);
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        productService.updateProduct('non-existent', { title: 'Test' })
      ).rejects.toThrow();
    });
  });

  describe('deleteProduct', () => {
    it('should delete existing product', async () => {
      const created = await productService.createProduct({
        platform: 'amazon',
        productUrl: 'https://amazon.com/dp/DELETE1',
        asin: 'DELETE1',
        title: 'To Delete',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });

      await productService.deleteProduct(created.id);

      const product = await productService.getProductById(created.id);
      expect(product).toBeNull();
    });

    it('should throw error for non-existent product', async () => {
      await expect(
        productService.deleteProduct('non-existent')
      ).rejects.toThrow();
    });
  });
});
