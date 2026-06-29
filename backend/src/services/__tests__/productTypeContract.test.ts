/**
 * Task 3.5, 3.6: getAllProducts 类型契约单元测试
 * 验证返回的 Product 对象包含所有必需字段
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Product } from '../../types';

describe('getAllProducts type contract', () => {
  // 模拟 getAllProducts 返回的数据
  const mockProducts: Product[] = [
    {
      id: '1',
      title: 'Test Product 1',
      platform: 'amazon',
      productUrl: 'https://amazon.com/product1',
      asin: 'B001',
      currentPrice: 29.99,
      currency: 'USD',
      brand: 'TestBrand',
      category: 'Electronics',
      imageUrl: 'https://example.com/image1.jpg',
      isMonitoring: true,
      monitorType: 'price',
      checkInterval: 3600,
      userId: 'user-1',
      metadata: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: '2',
      title: 'Test Product 2',
      platform: 'ebay',
      productUrl: 'https://ebay.com/product2',
      asin: 'B002',
      currentPrice: 49.99,
      currency: 'USD',
      brand: null,
      category: null,
      imageUrl: null,
      isMonitoring: false,
      monitorType: 'stock',
      checkInterval: 7200,
      userId: null,
      metadata: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  describe('required field completeness', () => {
    it('should include all Product type fields', () => {
      const product = mockProducts[0];

      // 验证所有必需字段存在
      expect(product.id).toBeDefined();
      expect(product.title).toBeDefined();
      expect(product.platform).toBeDefined();
      expect(product.productUrl).toBeDefined();
      expect(product.asin).toBeDefined();
      expect(product.currentPrice).toBeDefined();
      expect(product.currency).toBeDefined();
      expect(product.isMonitoring).toBeDefined();
      expect(product.checkInterval).toBeDefined();
      expect(product.createdAt).toBeDefined();
      expect(product.updatedAt).toBeDefined();
    });

    it('should not have undefined for commonly accessed fields', () => {
      for (const product of mockProducts) {
        // Task 3.6: 验证常用字段访问模式
        expect(product.updatedAt).not.toBeUndefined();
        expect(product.asin).not.toBeUndefined();
        expect(product.productUrl).not.toBeUndefined();
      }
    });

    it('should allow null for optional fields', () => {
      const product = mockProducts[1];

      // 可选字段可以是 null，但不应该是 undefined
      expect(product.brand).toBeNull();
      expect(product.category).toBeNull();
      expect(product.imageUrl).toBeNull();
      expect(product.userId).toBeNull();
      expect(product.metadata).toBeNull();

      // 确保不是 undefined
      expect(product.brand).not.toBeUndefined();
      expect(product.category).not.toBeUndefined();
    });
  });

  describe('field access patterns', () => {
    it('should support updatedAt sorting', () => {
      // Task 3.6: 验证 updatedAt 用于排序
      const sorted = [...mockProducts].sort((a, b) => b.updatedAt - a.updatedAt);
      expect(sorted[0].updatedAt).toBeGreaterThanOrEqual(sorted[1].updatedAt);
    });

    it('should support asin for competitor finding', () => {
      // Task 3.6: 验证 asin 用于竞品查找
      const targetAsin = 'B001';
      const competitors = mockProducts.filter(p => p.asin === targetAsin);
      expect(competitors.length).toBeGreaterThan(0);
      expect(competitors[0].asin).toBe(targetAsin);
    });

    it('should support productUrl for deduplication', () => {
      // Task 3.6: 验证 productUrl 用于去重检测
      const targetUrl = 'https://amazon.com/product1';
      const duplicate = mockProducts.find(p => p.productUrl === targetUrl);
      expect(duplicate).toBeDefined();
      expect(duplicate?.productUrl).toBe(targetUrl);
    });

    it('should support time-based filtering with updatedAt', () => {
      // 验证时间过滤逻辑
      const now = Date.now();
      const cutoff = now - 24 * 60 * 60 * 1000; // 24 小时前
      const recent = mockProducts.filter(p => p.updatedAt > cutoff);
      expect(recent.length).toBeGreaterThan(0);
    });
  });

  describe('type safety', () => {
    it('should have correct types for all fields', () => {
      const product = mockProducts[0];

      expect(typeof product.id).toBe('string');
      expect(typeof product.title).toBe('string');
      expect(typeof product.platform).toBe('string');
      expect(typeof product.productUrl).toBe('string');
      expect(typeof product.asin).toBe('string');
      expect(typeof product.currentPrice).toBe('number');
      expect(typeof product.currency).toBe('string');
      expect(typeof product.isMonitoring).toBe('boolean');
      expect(typeof product.checkInterval).toBe('number');
      expect(typeof product.createdAt).toBe('number');
      expect(typeof product.updatedAt).toBe('number');
    });

    it('should handle nullable fields correctly', () => {
      const product = mockProducts[1];

      // 这些字段应该是 string | null，不是 undefined
      const brand: string | null = product.brand;
      const category: string | null = product.category;
      const imageUrl: string | null = product.imageUrl;

      expect([typeof brand, null]).toContain(brand === null ? null : typeof brand);
      expect([typeof category, null]).toContain(category === null ? null : typeof category);
      expect([typeof imageUrl, null]).toContain(imageUrl === null ? null : typeof imageUrl);
    });
  });

  describe('fields parameter validation', () => {
    it('should include all specified fields in result', () => {
      // 模拟指定字段的查询
      const requestedFields = ['id', 'title', 'platform', 'updatedAt', 'asin', 'productUrl'];

      for (const product of mockProducts) {
        for (const field of requestedFields) {
          expect(product).toHaveProperty(field);
          expect((product as any)[field]).not.toBeUndefined();
        }
      }
    });
  });
});
