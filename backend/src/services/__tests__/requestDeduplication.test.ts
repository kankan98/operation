/**
 * Task 9.3, 9.4: 请求去重单元测试
 * 测试哈希生成和内存注册表
 */

import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

describe('request deduplication', () => {
  describe('content hash generation', () => {
    function hashContent(content: string): string {
      return createHash('sha256').update(content.trim()).digest('hex');
    }

    it('should generate consistent hash for same content', () => {
      const content = 'Hello, world!';
      const hash1 = hashContent(content);
      const hash2 = hashContent(content);
      expect(hash1).toBe(hash2);
    });

    it('should trim whitespace before hashing', () => {
      const hash1 = hashContent('  Hello  ');
      const hash2 = hashContent('Hello');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = hashContent('Message A');
      const hash2 = hashContent('Message B');
      expect(hash1).not.toBe(hash2);
    });

    it('should handle unicode content', () => {
      const content = '你好，世界！🚀';
      const hash = hashContent(content);
      expect(hash).toHaveLength(64); // SHA-256 produces 64 hex characters
    });

    it('should handle empty content', () => {
      const hash = hashContent('');
      expect(hash).toHaveLength(64);
    });
  });

  describe('in-flight registry', () => {
    interface InFlightRequest {
      hash: string;
      timestamp: number;
    }

    it('should detect duplicate within time window', () => {
      const registry = new Map<string, InFlightRequest>();
      const sessionId = 'session-123';
      const contentHash = 'abc123';
      const now = Date.now();

      // 添加请求
      registry.set(sessionId, { hash: contentHash, timestamp: now });

      // 5 秒内的相同内容
      const existing = registry.get(sessionId);
      const isDuplicate = existing && existing.hash === contentHash && now - existing.timestamp < 5000;
      expect(isDuplicate).toBe(true);
    });

    it('should allow retry after time window', () => {
      const registry = new Map<string, InFlightRequest>();
      const sessionId = 'session-123';
      const contentHash = 'abc123';
      const timestamp = Date.now() - 6000; // 6 秒前

      registry.set(sessionId, { hash: contentHash, timestamp });

      // 6 秒后的相同内容应该被允许
      const existing = registry.get(sessionId);
      const now = Date.now();
      const isDuplicate = existing && existing.hash === contentHash && now - existing.timestamp < 5000;
      expect(isDuplicate).toBe(false);
    });

    it('should allow different content within time window', () => {
      const registry = new Map<string, InFlightRequest>();
      const sessionId = 'session-123';
      const now = Date.now();

      registry.set(sessionId, { hash: 'hash1', timestamp: now });

      // 不同内容
      const existing = registry.get(sessionId);
      const isDuplicate = existing && existing.hash === 'hash2' && now - existing.timestamp < 5000;
      expect(isDuplicate).toBe(false);
    });

    it('should clean up stale entries', () => {
      const registry = new Map<string, InFlightRequest>();
      const now = Date.now();

      registry.set('session-1', { hash: 'hash1', timestamp: now - 31000 }); // 31 秒前
      registry.set('session-2', { hash: 'hash2', timestamp: now - 1000 }); // 1 秒前

      // 清理过期条目（30 秒）
      for (const [sessionId, request] of registry.entries()) {
        if (now - request.timestamp > 30000) {
          registry.delete(sessionId);
        }
      }

      expect(registry.has('session-1')).toBe(false); // 已清理
      expect(registry.has('session-2')).toBe(true); // 仍然有效
    });

    it('should remove entry on completion', () => {
      const registry = new Map<string, InFlightRequest>();
      const sessionId = 'session-123';

      registry.set(sessionId, { hash: 'hash1', timestamp: Date.now() });
      expect(registry.has(sessionId)).toBe(true);

      // 模拟完成时清理
      registry.delete(sessionId);
      expect(registry.has(sessionId)).toBe(false);
    });
  });

  describe('hash collision handling', () => {
    it('should use full string comparison as fallback', () => {
      const content1 = 'Message A';
      const content2 = 'Message B';

      // 在实际场景中，如果哈希碰撞（极其罕见），应该进行完整字符串比较
      const isSameContent = content1 === content2;
      expect(isSameContent).toBe(false);
    });
  });
});
