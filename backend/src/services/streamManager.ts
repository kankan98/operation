import { randomUUID } from 'crypto';
import { SSEEvent } from '../../../shared/types/sse-protocol';

/**
 * Stream 管理器
 *
 * 在内存中管理活跃的 SSE 流式会话，负责：
 * - Stream 的创建、存储、检索和清理
 * - 自动过期机制（5 分钟）
 * - AsyncGenerator 的生命周期管理
 */
export class StreamManager {
  // 内存存储：streamId -> AsyncGenerator 映射
  private streams = new Map<string, AsyncGenerator<SSEEvent, void, unknown>>();

  // 过期定时器：streamId -> NodeJS.Timeout 映射
  private expirationTimers = new Map<string, NodeJS.Timeout>();

  // Stream 过期时间（毫秒）
  private readonly STREAM_EXPIRATION_MS = 5 * 60 * 1000; // 5 分钟

  /**
   * 创建新的 stream
   *
   * @param sessionId - 会话 ID
   * @param content - 用户消息内容
   * @param generatorFactory - 创建 AsyncGenerator 的工厂函数
   * @returns Stream 元数据（streamId, messageId, generator）
   */
  create(
    sessionId: string,
    content: string,
    generatorFactory: (sessionId: string, messageId: string, streamId: string, content: string) => AsyncGenerator<SSEEvent, void, unknown>
  ): {
    streamId: string;
    messageId: string;
    generator: AsyncGenerator<SSEEvent, void, unknown>;
  } {
    const streamId = randomUUID();
    const messageId = randomUUID();

    // 创建 generator
    const generator = generatorFactory(sessionId, messageId, streamId, content);

    // 存储到内存
    this.streams.set(streamId, generator);

    // 设置自动过期
    const timer = setTimeout(() => {
      this.delete(streamId);
    }, this.STREAM_EXPIRATION_MS);

    this.expirationTimers.set(streamId, timer);

    return { streamId, messageId, generator };
  }

  /**
   * 根据 streamId 获取 generator
   *
   * @param streamId - Stream ID
   * @returns AsyncGenerator 或 undefined（如果不存在）
   */
  get(streamId: string): AsyncGenerator<SSEEvent, void, unknown> | undefined {
    return this.streams.get(streamId);
  }

  /**
   * 删除 stream 并清理资源
   *
   * @param streamId - Stream ID
   */
  delete(streamId: string): void {
    // 删除 generator
    this.streams.delete(streamId);

    // 清除过期定时器
    const timer = this.expirationTimers.get(streamId);
    if (timer) {
      clearTimeout(timer);
      this.expirationTimers.delete(streamId);
    }
  }

  /**
   * 获取当前活跃 stream 数量（用于监控）
   */
  getActiveCount(): number {
    return this.streams.size;
  }

  /**
   * 清理所有 streams（用于测试或关闭）
   */
  clear(): void {
    // 清除所有定时器
    for (const timer of this.expirationTimers.values()) {
      clearTimeout(timer);
    }

    this.streams.clear();
    this.expirationTimers.clear();
  }
}

// 导出单例实例
export const streamManager = new StreamManager();
