/**
 * 产品数据缓存服务
 *
 * 提供简单的内存缓存，减少数据库查询次数
 * TTL: 5 分钟
 * Task 4.1-4.3: 支持模式匹配和细粒度失效
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Task 4.8: 缓存指标追踪
interface CacheMetrics {
  hits: number;
  misses: number;
  invalidations: number;
  totalKeys: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 分钟
const metrics: CacheMetrics = {
  hits: 0,
  misses: 0,
  invalidations: 0,
  totalKeys: 0,
};

/**
 * Task 4.2: 根据查询参数构建缓存键
 * @param filters - 查询过滤条件
 * @returns 标准化的缓存键
 */
export function buildCacheKey(filters: {
  platform?: string;
  monitoring?: boolean;
  page?: number;
  limit?: number;
  fields?: string[];
}): string {
  const parts = ['products'];

  if (filters.platform) {
    parts.push(`platform=${filters.platform}`);
  }

  if (filters.monitoring !== undefined) {
    parts.push(`monitoring=${filters.monitoring}`);
  }

  if (filters.page !== undefined) {
    parts.push(`page=${filters.page}`);
  }

  if (filters.limit !== undefined) {
    parts.push(`limit=${filters.limit}`);
  }

  if (filters.fields && filters.fields.length > 0) {
    // 对字段列表排序后哈希，确保相同字段集合生成相同键
    const sortedFields = [...filters.fields].sort();
    const fieldsHash = createHash('sha256')
      .update(sortedFields.join(','))
      .digest('hex')
      .substring(0, 8);
    parts.push(`fields=${fieldsHash}`);
  }

  return parts.join(':');
}

/**
 * 获取缓存的产品数据
 */
export function getCachedProducts<T = unknown>(key: string): T | null {
  const entry = cache.get(key);

  if (!entry) {
    metrics.misses++;
    return null;
  }

  // 检查是否过期
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    metrics.misses++;
    return null;
  }

  metrics.hits++;
  return entry.data as T;
}

/**
 * 设置产品数据缓存
 */
export function setCachedProducts<T = unknown>(key: string, data: T): void {
  const isNew = !cache.has(key);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });

  if (isNew) {
    metrics.totalKeys = cache.size;
  }
}

/**
 * Task 4.3: 按模式失效缓存（支持通配符）
 * @param pattern - 缓存键模式，支持 * 通配符
 * @example
 * invalidateByPattern('products:platform=amazon:*') // 失效所有 amazon 平台的缓存
 * invalidateByPattern('products:*') // 失效所有产品缓存
 */
export function invalidateByPattern(pattern: string): number {
  let count = 0;

  // 将通配符模式转换为正则表达式
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexPattern}$`);

  for (const key of cache.keys()) {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  }

  if (count > 0) {
    metrics.invalidations += count;
    metrics.totalKeys = cache.size;
  }

  return count;
}

/**
 * 清除所有产品缓存
 */
export function clearProductCache(): void {
  const count = cache.size;
  cache.clear();
  metrics.invalidations += count;
  metrics.totalKeys = 0;
}

/**
 * 清除特定键的缓存
 */
export function clearCacheKey(key: string): void {
  if (cache.delete(key)) {
    metrics.invalidations++;
    metrics.totalKeys = cache.size;
  }
}

/**
 * Task 4.8: 获取缓存指标
 */
export function getCacheMetrics(): CacheMetrics {
  return {
    ...metrics,
    totalKeys: cache.size,
  };
}

/**
 * 重置缓存指标（用于测试）
 */
export function resetCacheMetrics(): void {
  metrics.hits = 0;
  metrics.misses = 0;
  metrics.invalidations = 0;
  metrics.totalKeys = cache.size;
}
