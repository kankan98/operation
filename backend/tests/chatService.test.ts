import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the AI provider factory BEFORE importing chatService so the singleton
// `aiProvider` is replaced with controllable mocks (no real API calls).
const { mockSendMessage, mockStreamMessage } = vi.hoisted(() => ({
  mockSendMessage: vi.fn(),
  mockStreamMessage: vi.fn(),
}));

vi.mock('../src/services/aiProviderFactory', () => ({
  aiProvider: {
    sendMessage: mockSendMessage,
    streamMessage: mockStreamMessage,
  },
}));

import { ChatService } from '../src/services/chatService';
import { executeToolWithParams } from '../src/services/agentTools';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import {
  chatSessions,
  chatMessages,
  taskOverviews,
  products,
  alerts,
  alertRules,
  priceSnapshots,
} from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { MessageResponse, StreamChunk } from '../src/services/aiProvider';

const chatService = new ChatService();
const productService = new ProductService();
const priceSnapshotService = new PriceSnapshotService();

/** Build a complete MessageResponse with sensible defaults. */
function aiResponse(overrides: Partial<MessageResponse> = {}): MessageResponse {
  return {
    content: 'Default assistant reply',
    usage: { inputTokens: 10, outputTokens: 5 },
    stopReason: 'end_turn',
    ...overrides,
  };
}

/** Turn an array of chunks into an async generator (matches streamMessage). */
function streamOf(chunks: StreamChunk[]) {
  return (async function* () {
    for (const chunk of chunks) {
      yield chunk;
    }
  })();
}

/** Insert a chat session directly and return its id. */
async function seedSession(): Promise<string> {
  const id = randomUUID();
  await db.insert(chatSessions).values({
    id,
    title: null,
    userId: null,
    contextSummary: null,
    createdAt: Date.now(),
    updatedAt: null,
  });
  return id;
}

async function getStoredMessages(sessionId: string) {
  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.timestamp);
}

async function cleanTables() {
  await db.delete(taskOverviews);
  await db.delete(chatMessages);
  await db.delete(chatSessions);
  await db.delete(priceSnapshots);
  await db.delete(alerts);
  await db.delete(alertRules);
  await db.delete(products);
}

describe('ChatService', () => {
  beforeEach(async () => {
    await cleanTables();
    mockSendMessage.mockReset();
    mockStreamMessage.mockReset();
  });

  afterEach(async () => {
    await cleanTables();
  });

  describe('sendMessage', () => {
    it('should store user and assistant messages and return the assistant reply', async () => {
      const sessionId = await seedSession();
      mockSendMessage.mockResolvedValue(
        aiResponse({ content: 'Hello, how can I help?', usage: { inputTokens: 12, outputTokens: 8 } })
      );

      const result = await chatService.sendMessage(sessionId, 'Hi there');

      expect(result.role).toBe('assistant');
      expect(result.content).toBe('Hello, how can I help?');
      // tokensUsed sums input + output of the single call
      expect(result.tokensUsed).toBe(20);

      const stored = await getStoredMessages(sessionId);
      expect(stored).toHaveLength(2);
      expect(stored[0].role).toBe('user');
      expect(stored[0].content).toBe('Hi there');
      expect(stored[1].role).toBe('assistant');
      expect(stored[1].content).toBe('Hello, how can I help?');
    });

    it('should pass the system prompt and tool definitions to the provider', async () => {
      const sessionId = await seedSession();
      mockSendMessage.mockResolvedValue(aiResponse());

      await chatService.sendMessage(sessionId, 'What can you do?');

      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs.systemPrompt).toBeTruthy();
      expect(Array.isArray(callArgs.tools)).toBe(true);
      expect(callArgs.tools.length).toBe(10);
    });

    it('should reject when the session does not exist', async () => {
      await expect(chatService.sendMessage('does-not-exist', 'Hi')).rejects.toThrow(
        /Session not found/
      );
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should execute tools and persist tool calls/results on the assistant message', async () => {
      const sessionId = await seedSession();
      const toolCallId = randomUUID();

      // First provider call asks to use a tool; second returns the final answer.
      mockSendMessage
        .mockResolvedValueOnce(
          aiResponse({
            content: '',
            stopReason: 'tool_use',
            toolCalls: [{ id: toolCallId, name: 'searchProducts', input: { query: 'widget' } }],
            usage: { inputTokens: 20, outputTokens: 10 },
          })
        )
        .mockResolvedValueOnce(
          aiResponse({ content: 'I found no matching products.', usage: { inputTokens: 30, outputTokens: 15 } })
        );

      const result = await chatService.sendMessage(sessionId, 'Find widgets');

      expect(mockSendMessage).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('I found no matching products.');
      // Token total spans both provider calls (20+10 + 30+15)
      expect(result.tokensUsed).toBe(75);

      const stored = await getStoredMessages(sessionId);
      const assistant = stored.find((m) => m.role === 'assistant');
      expect(assistant).toBeDefined();
      const toolCalls = JSON.parse(assistant!.toolCalls as string);
      const toolResults = JSON.parse(assistant!.toolResults as string);
      expect(toolCalls[0].name).toBe('searchProducts');
      expect(toolResults[0].toolCallId).toBe(toolCallId);
      expect(toolResults[0].isError).toBe(false);
    });

    it('should capture a tool error as an error result instead of throwing', async () => {
      const sessionId = await seedSession();
      const toolCallId = randomUUID();

      mockSendMessage
        .mockResolvedValueOnce(
          aiResponse({
            content: '',
            stopReason: 'tool_use',
            // Unknown tool name forces executeToolWithParams to throw
            toolCalls: [{ id: toolCallId, name: 'nonExistentTool', input: {} }],
          })
        )
        .mockResolvedValueOnce(aiResponse({ content: 'Handled the tool failure gracefully.' }));

      const result = await chatService.sendMessage(sessionId, 'Do something impossible');

      expect(result.content).toBe('Handled the tool failure gracefully.');
      const stored = await getStoredMessages(sessionId);
      const assistant = stored.find((m) => m.role === 'assistant')!;
      const toolResults = JSON.parse(assistant.toolResults as string);
      expect(toolResults[0].isError).toBe(true);
      expect(toolResults[0].output.error).toMatch(/Unknown tool/);
    });
  });

  describe('error handling', () => {
    it('should propagate provider failures but still persist the user message', async () => {
      const sessionId = await seedSession();
      mockSendMessage.mockRejectedValue(new Error('Claude API error'));

      await expect(chatService.sendMessage(sessionId, 'Hi')).rejects.toThrow('Claude API error');

      const stored = await getStoredMessages(sessionId);
      expect(stored).toHaveLength(1);
      expect(stored[0].role).toBe('user');
    });
  });

  describe('conversation context', () => {
    it('should include at most the 20 most recent messages as context', async () => {
      const sessionId = await seedSession();

      // Pre-seed 25 historical messages
      for (let i = 0; i < 25; i++) {
        await db.insert(chatMessages).values({
          id: randomUUID(),
          sessionId,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `history ${i}`,
          toolCalls: null,
          toolResults: null,
          tokensUsed: null,
          timestamp: Date.now() + i, // ensure ordering
        });
      }

      mockSendMessage.mockResolvedValue(aiResponse());
      await chatService.sendMessage(sessionId, 'newest message');

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs.messages.length).toBeLessThanOrEqual(20);
      // Every context entry must have a role + content shape for the API
      for (const msg of callArgs.messages) {
        expect(['user', 'assistant']).toContain(msg.role);
        expect(typeof msg.content).toBe('string');
      }
    });
  });

  describe('updateSessionAttributes', () => {
    it('should update pinned state, tags, title, and preview text', async () => {
      const sessionId = await seedSession();

      const updated = await chatService.updateSessionAttributes(sessionId, {
        isPinned: true,
        title: 'Pinned research',
        tags: ['pricing', 'amazon'],
        lastMessagePreview: 'Latest insight preview',
      });

      expect(updated).toMatchObject({
        id: sessionId,
        isPinned: true,
        title: 'Pinned research',
        tags: ['pricing', 'amazon'],
        lastMessagePreview: 'Latest insight preview',
        unreadCount: 0,
      });
      expect(updated?.updatedAt).toBeTypeOf('number');
    });

    it('should return null when updating a missing session', async () => {
      await expect(
        chatService.updateSessionAttributes('missing-session', { isPinned: true })
      ).resolves.toBeNull();
    });
  });

  describe('streamMessage', () => {
    it('should stream text chunks and persist the assembled assistant message', async () => {
      const sessionId = await seedSession();
      mockStreamMessage.mockReturnValue(
        streamOf([
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'world' },
          { type: 'usage', usage: { inputTokens: 5, outputTokens: 7 } },
        ])
      );

      const chunks: StreamChunk[] = [];
      for await (const chunk of chatService.streamMessage(sessionId, randomUUID(), randomUUID(), 'Hi')) {
        chunks.push(chunk);
      }

      // Should include our text chunks (plus an initial "processing" event)
      const textChunks = chunks.filter((c) => c.type === 'content_delta');
      expect(textChunks.map((c) => c.delta).join('')).toBe('Hello world');

      const stored = await getStoredMessages(sessionId);
      const assistant = stored.find((m) => m.role === 'assistant');
      expect(assistant?.content).toBe('Hello world');
      expect(assistant?.tokensUsed).toBe(12);
    });

    it('should yield an error chunk if the provider stream throws', async () => {
      const sessionId = await seedSession();
      mockStreamMessage.mockImplementation(() =>
        (async function* () {
          yield { type: 'text', text: 'partial' } as StreamChunk;
          throw new Error('stream blew up');
        })()
      );

      const chunks: StreamChunk[] = [];
      for await (const chunk of chatService.streamMessage(sessionId, randomUUID(), randomUUID(), 'Hi')) {
        chunks.push(chunk);
      }

      const errorChunk = chunks.find((c) => c.type === 'error_occurred');
      expect(errorChunk).toBeDefined();
      expect(errorChunk?.error.message).toMatch(/stream blew up/);
    });
  });
});

describe('agentTools.executeToolWithParams', () => {
  beforeEach(async () => {
    await cleanTables();
  });

  afterEach(async () => {
    await cleanTables();
  });

  /** Seed one product with two price snapshots, return its id. */
  async function seedProductWithHistory(overrides: Record<string, any> = {}) {
    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0TESTASIN',
      title: 'Test Wireless Earbuds',
      brand: 'Acme',
      currency: 'USD',
      currentPrice: 99.99,
      isMonitoring: true,
      checkInterval: 24,
      ...overrides,
    } as any);

    await priceSnapshotService.createSnapshot({
      productId: product.id,
      price: 120,
      currency: 'USD',
      availability: 'in_stock',
    } as any);
    await priceSnapshotService.createSnapshot({
      productId: product.id,
      price: 99.99,
      currency: 'USD',
      availability: 'in_stock',
    } as any);

    return product;
  }

  it('1. searchProducts returns matching products', async () => {
    await seedProductWithHistory();
    const result = await executeToolWithParams('searchProducts', { query: 'earbuds' });
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.products[0].title).toMatch(/Earbuds/i);
  });

  it('2. getProductDetails returns product (and history when requested)', async () => {
    const product = await seedProductWithHistory();
    const result = await executeToolWithParams('getProductDetails', {
      productId: product.id,
      includeHistory: true,
    });
    expect(result.product.id).toBe(product.id);
    expect(Array.isArray(result.priceHistory)).toBe(true);
    expect(result.priceHistory.length).toBe(2);
  });

  it('2b. getProductDetails throws for unknown product', async () => {
    await expect(
      executeToolWithParams('getProductDetails', { productId: 'nope' })
    ).rejects.toThrow(/Product not found/);
  });

  it('3. analyzePriceTrend returns stats with a trend direction', async () => {
    const product = await seedProductWithHistory();
    const result = await executeToolWithParams('analyzePriceTrend', { productId: product.id });
    expect(result).toHaveProperty('currentPrice');
    expect(['rising', 'falling', 'stable']).toContain(result.trend);
  });

  it('4. createAlert creates a rule for an existing product', async () => {
    const product = await seedProductWithHistory();
    const result = await executeToolWithParams('createAlert', {
      productId: product.id,
      ruleType: 'price_threshold',
      condition: 'below',
      threshold: 80,
      severity: 'warning',
    });
    expect(result.success).toBe(true);
    expect(result.ruleId).toBeDefined();
  });

  it('4b. createAlert rejects unknown product', async () => {
    await expect(
      executeToolWithParams('createAlert', {
        productId: 'missing',
        ruleType: 'price_threshold',
        condition: 'below',
        threshold: 10,
      })
    ).rejects.toThrow(/Product not found/);
  });

  it('5. getAlertsList returns a count and array', async () => {
    const result = await executeToolWithParams('getAlertsList', {});
    expect(result).toHaveProperty('count');
    expect(Array.isArray(result.alerts)).toBe(true);
  });

  it('6. addProductMonitoring adds a product and validates the URL', async () => {
    const result = await executeToolWithParams('addProductMonitoring', {
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/B0NEWITEM1',
      title: 'New Monitored Item',
    });
    expect(result.success).toBe(true);

    await expect(
      executeToolWithParams('addProductMonitoring', {
        platform: 'amazon',
        productUrl: 'not-a-url',
        title: 'Bad URL',
      })
    ).rejects.toThrow(/Invalid product URL/);
  });

  it('7. getCompetitorAnalysis reports no competitors when none match', async () => {
    const result = await executeToolWithParams('getCompetitorAnalysis', { asin: 'UNKNOWNASIN' });
    expect(result.competitors).toEqual([]);
    expect(result.message).toMatch(/No competitors/i);
  });

  it('8. getMarketInsights returns aggregate market data', async () => {
    await seedProductWithHistory();
    const result = await executeToolWithParams('getMarketInsights', {});
    expect(result).toHaveProperty('totalProducts');
    expect(result).toHaveProperty('platformDistribution');
    expect(result).toHaveProperty('averagePriceByPlatform');
  });

  it('9. queryDatabase counts products by status', async () => {
    await seedProductWithHistory();
    const result = await executeToolWithParams('queryDatabase', { queryType: 'count_by_status' });
    expect(result.total).toBeGreaterThanOrEqual(1);
    expect(result).toHaveProperty('monitoring');
    expect(result).toHaveProperty('inactive');
  });

  it('10. generateReport produces a daily summary', async () => {
    await seedProductWithHistory();
    const result = await executeToolWithParams('generateReport', { reportType: 'daily' });
    expect(result.reportType).toBe('daily');
    expect(result.summary).toHaveProperty('totalProducts');
  });

  it('10b. generateReport produces a product report with chart data', async () => {
    const product = await seedProductWithHistory();
    const result = await executeToolWithParams('generateReport', {
      reportType: 'product',
      productId: product.id,
    });
    expect(result.reportType).toBe('product');
    expect(Array.isArray(result.chartData)).toBe(true);
    expect(result.chartData.length).toBe(2);
  });

  it('throws a clear error for an unknown tool', async () => {
    await expect(executeToolWithParams('bogusTool', {})).rejects.toThrow(/Unknown tool/);
  });

  describe('parts 持久化', () => {
    it('storeMessage 写入 parts，getMessages 读回相同结构', async () => {
      const sessionId = await seedSession();
      const svc = chatService as unknown as {
        storeMessage(d: {
          sessionId: string; role: 'user' | 'assistant'; content: string;
          parts?: import('../../shared/types/sse-protocol').MessagePart[];
        }): Promise<{ id: string }>;
        getMessages(sessionId: string): Promise<Array<{ parts?: unknown }>>;
      };

      await svc.storeMessage({
        sessionId,
        role: 'assistant',
        content: 'hello world',
        parts: [
          { type: 'text', id: 'b1', content: 'hello ' },
          { type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' }, result: { ok: true }, isError: false, durationMs: 12 },
          { type: 'text', id: 'b2', content: 'world' },
        ],
      });

      const msgs = await svc.getMessages(sessionId);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].parts).toEqual([
        { type: 'text', id: 'b1', content: 'hello ' },
        { type: 'tool', id: 't1', name: 'searchProducts', input: { q: 'x' }, result: { ok: true }, isError: false, durationMs: 12 },
        { type: 'text', id: 'b2', content: 'world' },
      ]);
    });
  });

  describe('streamMessage 时序分段', () => {
    it('文本→工具→文本：发出文本块边界且 parts 按序', async () => {
      const sessionId = await seedSession();

      // 第一轮：先文本，再一个工具调用
      mockStreamMessage.mockReturnValueOnce(streamOf([
        { type: 'text', text: '先说一段。' },
        { type: 'tool_call', toolCall: { id: 't1', name: 'searchProducts', input: { q: 'a' } } },
        { type: 'usage', usage: { inputTokens: 3, outputTokens: 4 } },
      ]));
      // 第二轮：工具结果回灌后继续输出文本（无新工具 → 结束）
      mockStreamMessage.mockReturnValueOnce(streamOf([
        { type: 'text', text: '再说一段。' },
        { type: 'usage', usage: { inputTokens: 2, outputTokens: 2 } },
      ]));

      const events: Array<{ type: string; blockId?: string }> = [];
      for await (const e of chatService.streamMessage(sessionId, 'm1', 's1', '你好')) {
        events.push(e as { type: string; blockId?: string });
      }
      const types = events.map(e => e.type);

      // 文本块成对出现，且有两段
      expect(types.filter(t => t === 'text_start')).toHaveLength(2);
      expect(types.filter(t => t === 'text_end')).toHaveLength(2);

      // 关键时序：第一段文本在工具前收尾，第二段文本在工具后开始
      expect(types.indexOf('text_end')).toBeLessThan(types.indexOf('tool_start'));
      expect(types.indexOf('tool_complete')).toBeLessThan(types.lastIndexOf('text_start'));

      // content_delta 均带 blockId，两段文本 blockId 不同
      const deltas = events.filter(e => e.type === 'content_delta');
      expect(deltas.length).toBeGreaterThan(0);
      expect(deltas.every(d => typeof d.blockId === 'string')).toBe(true);
      const starts = events.filter(e => e.type === 'text_start');
      expect(starts[0].blockId).not.toEqual(starts[1].blockId);

      // 落库 parts 按 text/tool/text 顺序
      const stored = await getStoredMessages(sessionId);
      const assistant = stored.find(m => m.role === 'assistant')!;
      const parts = JSON.parse(assistant.parts as string) as Array<{ type: string; content?: string; name?: string }>;
      expect(parts.map(p => p.type)).toEqual(['text', 'tool', 'text']);
      expect(parts[0].content).toBe('先说一段。');
      expect(parts[1]).toMatchObject({ type: 'tool', name: 'searchProducts' });
      expect(parts[2].content).toBe('再说一段。');
    });

    it('多轮工具调用全部保留（修复 finalToolCalls 覆盖 bug）', async () => {
      const sessionId = await seedSession();
      mockStreamMessage.mockReturnValueOnce(streamOf([
        { type: 'tool_call', toolCall: { id: 't1', name: 'searchProducts', input: {} } },
      ]));
      mockStreamMessage.mockReturnValueOnce(streamOf([
        { type: 'tool_call', toolCall: { id: 't2', name: 'analyzeData', input: {} } },
      ]));
      mockStreamMessage.mockReturnValueOnce(streamOf([
        { type: 'text', text: '完成。' },
      ]));

      for await (const _e of chatService.streamMessage(sessionId, 'm1', 's1', 'go')) { void _e; }

      const stored = await getStoredMessages(sessionId);
      const assistant = stored.find(m => m.role === 'assistant')!;
      const parts = JSON.parse(assistant.parts as string) as Array<{ type: string; name?: string }>;
      const toolNames = parts.filter(p => p.type === 'tool').map(p => p.name);
      expect(toolNames).toEqual(['searchProducts', 'analyzeData']);
    });
  });
});
