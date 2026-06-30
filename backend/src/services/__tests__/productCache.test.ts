/**
 * Task 4.9, 4.10: 产品缓存单元测试
 * 测试缓存键生成和模式失效
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  buildCacheKey,
  getCachedProducts,
  setCachedProducts,
  invalidateByPattern,
  getCacheMetrics,
  resetCacheMetrics,
  clearProductCache,
} from '../productCache';

describe('productCache', () => {
  beforeEach(() => {
    clearProductCache();
    resetCacheMetrics();
  });

  describe('buildCacheKey', () => {
    it('should generate correct key for platform filter', () => {
      const key = buildCacheKey({ platform: 'amazon' });
      expect(key).toBe('products:platform=amazon');
    });

    it('should generate correct key for multiple filters', () => {
      const key = buildCacheKey({
        platform: 'amazon',
        monitoring: true,
        page: 2,
        limit: 20,
      });
      expect(key).toBe('products:platform=amazon:monitoring=true:page=2:limit=20');
    });

    it('should hash fields array consistently', () => {
      const key1 = buildCacheKey({
        fields: ['id', 'title', 'platform'],
      });
      const key2 = buildCacheKey({
        fields: ['platform', 'id', 'title'], // 不同顺序
      });
      expect(key1).toBe(key2); // 排序后应该相同
    });

    it('should generate different keys for different field sets', () => {
      const key1 = buildCacheKey({
        fields: ['id', 'title'],
      });
      const key2 = buildCacheKey({
        fields: ['id', 'title', 'platform'],
      });
      expect(key1).not.toBe(key2);
    });
  });

  describe('cache operations', () => {
    it('should store and retrieve cached data', () => {
      const key = 'products:platform=amazon';
      const data = [{ id: '1', title: 'Test Product' }];

      setCachedProducts(key, data);
      const cached = getCachedProducts(key);

      expect(cached).toEqual(data);
    });

    it('should return null for non-existent key', () => {
      const cached = getCachedProducts('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should track cache hits and misses', () => {
      const key = 'test-key';
      const data = { value: 'test' };

      // 初始指标
      let metrics = getCacheMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);

      // Miss
      getCachedProducts(key);
      metrics = getCacheMetrics();
      expect(metrics.misses).toBe(1);

      // Set and hit
      setCachedProducts(key, data);
      getCachedProducts(key);
      metrics = getCacheMetrics();
      expect(metrics.hits).toBe(1);
    });
  });

  describe('invalidateByPattern', () => {
    beforeEach(() => {
      setCachedProducts('products:platform=amazon:page=1', [{ id: '1' }]);
      setCachedProducts('products:platform=amazon:page=2', [{ id: '2' }]);
      setCachedProducts('products:platform=ebay:page=1', [{ id: '3' }]);
      setCachedProducts('products:monitoring=true', [{ id: '4' }]);
    });

    it('should invalidate all matching keys with wildcard', () => {
      const count = invalidateByPattern('products:platform=amazon:*');
      expect(count).toBe(2); // 两个 amazon 页面

      // 验证已失效
      expect(getCachedProducts('products:platform=amazon:page=1')).toBeNull();
      expect(getCachedProducts('products:platform=amazon:page=2')).toBeNull();

      // 验证未受影响
      expect(getCachedProducts('products:platform=ebay:page=1')).not.toBeNull();
    });

    it('should invalidate all products with products:*', () => {
      const count = invalidateByPattern('products:*');
      expect(count).toBe(4); // 所有缓存

      expect(getCachedProducts('products:platform=amazon:page=1')).toBeNull();
      expect(getCachedProducts('products:platform=ebay:page=1')).toBeNull();
      expect(getCachedProducts('products:monitoring=true')).toBeNull();
    });

    it('should invalidate exact match without wildcard', () => {
      const count = invalidateByPattern('products:platform=ebay:page=1');
      expect(count).toBe(1);

      expect(getCachedProducts('products:platform=ebay:page=1')).toBeNull();
      expect(getCachedProducts('products:platform=amazon:page=1')).not.toBeNull();
    });

    it('should return 0 for non-matching pattern', () => {
      const count = invalidateByPattern('products:platform=walmart:*');
      expect(count).toBe(0);
    });

    it('should track invalidation count in metrics', () => {
      invalidateByPattern('products:platform=amazon:*');
      const metrics = getCacheMetrics();
      expect(metrics.invalidations).toBe(2);
    });
  });

  describe('cache metrics', () => {
    it('should track total keys count', () => {
      setCachedProducts('key1', { value: 1 });
      setCachedProducts('key2', { value: 2 });

      const metrics = getCacheMetrics();
      expect(metrics.totalKeys).toBe(2);
    });

    it('should update total keys after invalidation', () => {
      setCachedProducts('products:a', {});
      setCachedProducts('products:b', {});
      setCachedProducts('products:c', {});

      invalidateByPattern('products:a');

      const metrics = getCacheMetrics();
      expect(metrics.totalKeys).toBe(2);
    });

    // Task 4.11: 混合读写负载下命中率与失效指标端到端累计
    it('tracks hit rate under a mixed read/write workload', () => {
      const amazon = 'products:platform=amazon:page=1';
      const ebay = 'products:platform=ebay:page=1';

      // 写：填充缓存
      setCachedProducts(amazon, [{ id: 'a' }]);
      setCachedProducts(ebay, [{ id: 'b' }]);

      // 读：3 次命中 + 2 次未命中
      getCachedProducts(amazon); // hit
      getCachedProducts(amazon); // hit
      getCachedProducts(ebay); // hit
      getCachedProducts('products:platform=walmart:page=1'); // miss
      getCachedProducts('products:platform=walmart:page=2'); // miss

      // 写：更新 amazon 触发该平台缓存失效
      expect(invalidateByPattern('products:platform=amazon:*')).toBe(1);

      // 失效后再读 amazon → 未命中
      getCachedProducts(amazon); // miss

      const m = getCacheMetrics();
      expect(m.hits).toBe(3);
      expect(m.misses).toBe(3);
      expect(m.invalidations).toBe(1);
      expect(m.hits / (m.hits + m.misses)).toBeCloseTo(0.5, 5);
    });
  });
});
