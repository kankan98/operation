import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';

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
import { AGENT_TOOLS, executeToolWithParams } from '../src/services/agentTools';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import { applyOpportunityResearchTraceRuntimeMigration } from './migrationTestUtils';
import {
  acquisitionProviderLimits,
  acquisitionQueueEvents,
  acquisitionQueueWorkers,
  chatSessions,
  chatMessages,
  taskOverviews,
  opportunityResearchEntries,
  productBusinessSignals,
  marketSignalAttempts,
  marketSignalSnapshots,
  products,
  scrapeAttempts,
  scrapeJobs,
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
  await db.delete(opportunityResearchEntries);
  await db.delete(acquisitionQueueEvents);
  await db.delete(acquisitionProviderLimits);
  await db.delete(acquisitionQueueWorkers);
  await db.delete(productBusinessSignals);
  await db.delete(marketSignalAttempts);
  await db.delete(marketSignalSnapshots);
  await db.delete(priceSnapshots);
  await db.delete(scrapeAttempts);
  await db.delete(scrapeJobs);
  await db.delete(alerts);
  await db.delete(alertRules);
  await db.delete(products);
}

describe('ChatService', () => {
  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    for (const migrationName of [
      '002-product-data-acquisition.sql',
      '003-opportunity-business-signals.sql',
      '004-ebay-browse-provider.sql',
      '005-keepa-market-signals.sql',
      '006-opportunity-research-workspace.sql',
      '007-acquisition-queue-operations.sql',
    ]) {
      sqlite.exec(
        fs.readFileSync(path.resolve('migrations', migrationName), 'utf-8')
      );
    }
    applyOpportunityResearchTraceRuntimeMigration(sqlite);
    sqlite.close();
  });

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
      expect(callArgs.tools.length).toBe(18);
      expect(callArgs.tools.map((tool) => tool.name)).toEqual(
        expect.arrayContaining([
          'getProductAcquisitionStatus',
          'getAcquisitionQueueHealth',
          'getProductJobDiagnostics',
          'checkProductNow',
          'getProductOpportunities',
          'explainProductOpportunity',
          'getOpportunityResearchStatus',
          'listShortlistedOpportunities',
        ])
      );
      expect(callArgs.systemPrompt).toContain('选品研究区只读');
    });

    it('should constrain guidance to real UI names and supported product platforms', async () => {
      const sessionId = await seedSession();
      mockSendMessage.mockResolvedValue(aiResponse());

      await chatService.sendMessage(sessionId, '没有商品时我下一步该做什么？');

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs.systemPrompt).toContain('商品');
      expect(callArgs.systemPrompt).toContain('添加商品');
      expect(callArgs.systemPrompt).toContain('商品详情');
      expect(callArgs.systemPrompt).toContain('立即检查');
      expect(callArgs.systemPrompt).toContain('记录手动读数');
      expect(callArgs.systemPrompt).toContain('选品机会');
      expect(callArgs.systemPrompt).toContain('预警');
      expect(callArgs.systemPrompt).toContain(
        '商品链接、ASIN/商品编号、商品标题是必填项'
      );
      expect(callArgs.systemPrompt).toContain('不要描述为可选');
      expect(callArgs.systemPrompt).toContain('amazon, walmart, aliexpress, ebay, other');
      expect(callArgs.systemPrompt).not.toContain('Lazada');
      expect(callArgs.systemPrompt).not.toContain('Create Alert');
      expect(callArgs.systemPrompt).not.toContain('Add Product Monitoring');
    });

    it('should keep zero-data onboarding guidance on real UI actions', async () => {
      const sessionId = await seedSession();
      mockSendMessage.mockResolvedValue(
        aiResponse({
          content:
            '**现状**: 当前还没有商品数据。\n**建议**: 先进入「商品」页面使用「添加商品」，之后到「商品详情」执行「立即检查」或「记录手动读数」。预警会在监控检测到价格或库存变化后出现。',
        })
      );

      const result = await chatService.sendMessage(
        sessionId,
        '系统里没有商品、预警和机会时我应该怎么开始？'
      );

      const callArgs = mockSendMessage.mock.calls[0][0];
      expect(callArgs.systemPrompt).toContain('冷启动路径');
      expect(callArgs.systemPrompt).toContain('商品');
      expect(callArgs.systemPrompt).toContain('添加商品');
      expect(callArgs.systemPrompt).toContain('商品详情');
      expect(callArgs.systemPrompt).toContain('立即检查');
      expect(callArgs.systemPrompt).toContain('记录手动读数');
      expect(callArgs.systemPrompt).toContain('预警');
      expect(callArgs.systemPrompt).toContain(
        '商品链接、ASIN/商品编号、商品标题是必填项'
      );
      expect(callArgs.systemPrompt).toContain('不要描述为可选');
      expect(callArgs.systemPrompt).not.toMatch(
        /Lazada|Create Alert|Add Product Monitoring|Alert Rules/i
      );
      expect(result.content).toContain('商品');
      expect(result.content).toContain('添加商品');
      expect(result.content).toContain('商品详情');
      expect(result.content).toContain('立即检查');
      expect(result.content).toContain('记录手动读数');
      expect(result.content).toContain('预警');
      expect(result.content).not.toMatch(
        /Lazada|Create Alert|Add Product Monitoring|Alert Rules/i
      );
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

    it('should expand stored tool calls and results into valid follow-up context', async () => {
      const sessionId = await seedSession();
      const toolCallId = randomUUID();

      mockSendMessage
        .mockResolvedValueOnce(
          aiResponse({
            content: '',
            stopReason: 'tool_use',
            toolCalls: [{ id: toolCallId, name: 'searchProducts', input: { query: 'widget' } }],
          })
        )
        .mockResolvedValueOnce(aiResponse({ content: 'I found no matching products.' }));

      await chatService.sendMessage(sessionId, 'Find widgets');
      mockSendMessage.mockClear();
      mockSendMessage.mockResolvedValueOnce(aiResponse({ content: 'Next answer.' }));

      await chatService.sendMessage(sessionId, 'What should I do next?');

      const context = mockSendMessage.mock.calls[0][0].messages;
      const toolUseIndex = context.findIndex(
        (message) => message.role === 'assistant' && message.toolCalls?.[0]?.id === toolCallId
      );

      expect(toolUseIndex).toBeGreaterThanOrEqual(0);
      expect(context[toolUseIndex].toolResults).toBeUndefined();
      expect(context[toolUseIndex + 1]).toEqual(
        expect.objectContaining({
          role: 'user',
          content: '',
          toolResults: expect.arrayContaining([
            expect.objectContaining({ toolCallId, isError: false }),
          ]),
        })
      );
      expect(context[toolUseIndex + 2]).toEqual(
        expect.objectContaining({
          role: 'assistant',
          content: 'I found no matching products.',
        })
      );
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

  async function seedAcquisitionAttempt(
    productId: string,
    overrides: Record<string, any> = {}
  ) {
    const attempt = {
      id: randomUUID(),
      productId,
      provider: 'amazon-browser',
      source: 'browser',
      status: 'failed',
      failureReason: 'blocked',
      errorMessage: null,
      durationMs: 250,
      confidence: null,
      httpStatus: 503,
      pageTitle: 'Robot Check',
      finalUrl: 'https://www.amazon.com/errors/validateCaptcha',
      diagnostics: JSON.stringify({ detectedState: 'blocked' }),
      timestamp: Date.now(),
      ...overrides,
    };
    await db.insert(scrapeAttempts).values(attempt);
    return attempt;
  }

  async function seedScrapeJob(
    productId: string,
    overrides: Record<string, any> = {}
  ) {
    const now = Date.now();
    const job = {
      id: randomUUID(),
      productId,
      status: 'retry_scheduled',
      priority: 0,
      nextRunAt: now + 60_000,
      attemptCount: 1,
      maxAttempts: 3,
      lastAttemptId: null,
      lastFailureReason: 'captcha',
      leaseOwner: null,
      leaseExpiresAt: null,
      createdAt: now - 60_000,
      updatedAt: now,
      completedAt: null,
      metadata: JSON.stringify({ trigger: 'manual' }),
      ...overrides,
    };
    await db.insert(scrapeJobs).values(job);
    return job;
  }

  async function seedMarketSignal(
    productId: string,
    overrides: Record<string, any> = {}
  ) {
    const record = {
      id: randomUUID(),
      productId,
      platform: 'amazon',
      provider: 'keepa',
      source: 'third_party',
      asin: 'B0TESTASIN',
      marketplace: 'amazon.com',
      windowDays: 90,
      confidence: 0.86,
      freshnessMs: 60 * 60 * 1000,
      priceTrend: JSON.stringify({
        current: 99.99,
        average: 110,
        lowest: 90,
        highest: 130,
        changePercent: -9,
        volatility: 0.12,
        direction: 'down',
        dataPoints: 12,
        firstObservedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        lastObservedAt: Date.now() - 60 * 60 * 1000,
      }),
      salesRankTrend: JSON.stringify({
        current: 1400,
        average: 1900,
        lowest: 1200,
        highest: 2600,
        changePercent: -20,
        volatility: 0.18,
        direction: 'down',
        dataPoints: 10,
        firstObservedAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
        lastObservedAt: Date.now() - 60 * 60 * 1000,
      }),
      reviewVelocity: 1.1,
      ratingMovement: 0.1,
      missingSignals: '[]',
      metadata: JSON.stringify({ fixture: true }),
      createdAt: Date.now(),
      ...overrides,
    };
    await db.insert(marketSignalSnapshots).values(record);
    return record;
  }

  async function seedResearchEntry(
    productId: string,
    overrides: Record<string, any> = {}
  ) {
    const now = Date.now();
    const record = {
      productId,
      status: 'researching',
      priority: 'medium',
      tagsJson: '[]',
      notes: null,
      archived: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
    await db.insert(opportunityResearchEntries).values(record);
    return record;
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
      asin: 'B0NEWITEM1',
      title: 'New Monitored Item',
    });
    expect(result.success).toBe(true);

    await expect(
      executeToolWithParams('addProductMonitoring', {
        platform: 'amazon',
        productUrl: 'not-a-url',
        asin: 'B0BADURL01',
        title: 'Bad URL',
      })
    ).rejects.toThrow(/Invalid product URL/);
  });

  it('6b. product tool schemas expose only supported product platforms', () => {
    const schemaText = JSON.stringify(AGENT_TOOLS);
    expect(schemaText).not.toContain('lazada');

    const searchProducts = AGENT_TOOLS.find((tool) => tool.name === 'searchProducts')!;
    const addProductMonitoring = AGENT_TOOLS.find(
      (tool) => tool.name === 'addProductMonitoring'
    )!;

    expect(searchProducts.input_schema.properties.platform.enum).toEqual([
      'amazon',
      'walmart',
      'aliexpress',
      'ebay',
      'other',
    ]);
    expect(addProductMonitoring.input_schema.properties.platform.enum).toEqual([
      'amazon',
      'walmart',
      'aliexpress',
      'ebay',
      'other',
    ]);
    expect(addProductMonitoring.input_schema.required).toEqual([
      'platform',
      'productUrl',
      'asin',
      'title',
    ]);
    expect(addProductMonitoring.input_schema.properties.asin.description).toMatch(
      /required/i
    );
  });

  it('6c. addProductMonitoring rejects unsupported platforms without creating products', async () => {
    await expect(
      executeToolWithParams('addProductMonitoring', {
        platform: 'lazada',
        productUrl: 'https://www.lazada.com/products/test-item',
        title: 'Unsupported Marketplace Item',
        productIdentifier: 'LAZADA-1',
      })
    ).rejects.toThrow(/platform/i);

    const stored = await db.select().from(products);
    expect(stored).toHaveLength(0);
  });

  it('6d. addProductMonitoring rejects non-Amazon products without identifiers', async () => {
    await expect(
      executeToolWithParams('addProductMonitoring', {
        platform: 'ebay',
        productUrl: 'https://www.ebay.com/itm/1234567890',
        title: 'eBay Listing Without ID',
      })
    ).rejects.toThrow(/ASIN|Product ID|identifier/i);

    const stored = await db.select().from(products);
    expect(stored).toHaveLength(0);
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

  it('11. getProductAcquisitionStatus explains no-attempt state without triggering acquisition', async () => {
    const product = await seedProductWithHistory();

    const result = await executeToolWithParams('getProductAcquisitionStatus', {
      productId: product.id,
    }) as any;

    expect(result.triggeredAcquisition).toBe(false);
    expect(result.latestAttempt).toBeNull();
    expect(result.attempts).toEqual([]);
    expect(result.explanation).toMatch(/No acquisition has run/i);
  });

  it('11b. getProductAcquisitionStatus explains provider unavailable failures', async () => {
    const product = await seedProductWithHistory();
    await seedAcquisitionAttempt(product.id, {
      provider: 'rainforest',
      source: 'third_party',
      failureReason: 'provider_unavailable',
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: JSON.stringify({
        providerErrorCode: 'missing_api_key',
        providerMessage: 'Rainforest API key is not configured',
      }),
    });

    const result = await executeToolWithParams('getProductAcquisitionStatus', {
      productId: product.id,
    }) as any;

    expect(result.triggeredAcquisition).toBe(false);
    expect(result.latestAttempt.failureReason).toBe('provider_unavailable');
    expect(result.latestAttempt.diagnostics.providerErrorCode).toBe('missing_api_key');
    expect(result.explanation).toMatch(/rainforest.*unavailable|missing credentials/i);
  });

  it('11d. getProductAcquisitionStatus includes eBay health and safe diagnostics', async () => {
    const product = await seedProductWithHistory({
      platform: 'ebay',
      productUrl: `https://www.ebay.com/itm/${Date.now()}`,
      asin: '',
      title: 'eBay Listing Tool Item',
    });
    await seedAcquisitionAttempt(product.id, {
      provider: 'ebay-browse',
      source: 'official_api',
      status: 'failed',
      failureReason: 'unsupported_url',
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: JSON.stringify({
        rootCause: 'unsupported_url',
        marketplace: 'EBAY_US',
        ebayItemId: '123456789012',
        sanitizedMessage: 'Unsupported eBay URL',
        access_token: 'SECRET_TOKEN',
      }),
    });

    const result = await executeToolWithParams('getProductAcquisitionStatus', {
      productId: product.id,
    }) as any;

    expect(result.triggeredAcquisition).toBe(false);
    expect(result.latestAttempt.provider).toBe('ebay-browse');
    expect(result.latestAttempt.source).toBe('official_api');
    expect(result.latestAttempt.diagnostics.rootCause).toBe('unsupported_url');
    expect(result.latestAttempt.diagnostics.marketplace).toBe('EBAY_US');
    expect(result.providerHealth.platform).toBe('ebay');
    expect(result.providerHealth.recommendations.map((item: any) => item.code)).toContain(
      'check_ebay_item_id'
    );
    expect(result.providerHealthCaveat).toMatch(/ebay data-source reliability/i);
    expect(result.platformDataCaveat).toMatch(/current listing facts only/i);
    expect(JSON.stringify(result)).not.toContain('SECRET_TOKEN');
  });

  it('11e. getProductAcquisitionStatus includes Keepa market signal status and caveat', async () => {
    const product = await seedProductWithHistory();
    await seedMarketSignal(product.id);

    const result = await executeToolWithParams('getProductAcquisitionStatus', {
      productId: product.id,
    }) as any;

    expect(result.marketSignalStatus.status).toBe('fresh');
    expect(result.marketSignalStatus.provider).toBe('keepa');
    expect(result.marketSignalStatus.latestSnapshot.salesRankTrend).toBeDefined();
    expect(result.marketSignalStatus.caveat).toContain('not verified sales');
    expect(result.marketSignalStatus.caveat).toContain('profitability facts');
  });

  it.each([
    ['captcha', /platform protection/i],
    ['blocked', /platform protection/i],
    ['selector_drift', /structure no longer matches known selectors/i],
  ])('11c. getProductAcquisitionStatus explains %s failures', async (failureReason, expected) => {
    const product = await seedProductWithHistory();
    await seedAcquisitionAttempt(product.id, {
      failureReason,
      diagnostics: JSON.stringify({ detectedState: failureReason }),
    });

    const result = await executeToolWithParams('getProductAcquisitionStatus', {
      productId: product.id,
    }) as any;

    expect(result.triggeredAcquisition).toBe(false);
    expect(result.latestAttempt.failureReason).toBe(failureReason);
    expect(result.explanation).toMatch(expected);
  });

  it('12. getAcquisitionQueueHealth explains provider gates as read-only operations state', async () => {
    await db.insert(acquisitionProviderLimits).values({
      id: 'amazon:rainforest',
      platform: 'amazon',
      provider: 'rainforest',
      status: 'rate_limited',
      resetAt: Date.now() + 60_000,
      currentConcurrency: 0,
      maxConcurrency: 2,
      activeCount: 0,
      recentRootCausesJson: JSON.stringify(['rate_limited']),
      recommendationsJson: JSON.stringify([
        {
          code: 'provider_rate_limited',
          severity: 'warning',
          message: 'Check quota and retry after reset.',
        },
      ]),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await executeToolWithParams('getAcquisitionQueueHealth', {
      platform: 'amazon',
      provider: 'rainforest',
    }) as any;

    expect(result.readOnly).toBe(true);
    expect(result.mutationPolicy).toMatch(/cannot retry, cancel/i);
    expect(result.scoreSeparation).toMatch(/does not change opportunity score/i);
    expect(result.providerStatus.providerGates[0]).toMatchObject({
      provider: 'rainforest',
      status: 'rate_limited',
    });
  });

  it('13. getProductJobDiagnostics explains delayed jobs without hidden refresh', async () => {
    const product = await seedProductWithHistory();
    const job = await seedScrapeJob(product.id);
    await seedAcquisitionAttempt(product.id, {
      jobId: job.id,
      failureReason: 'captcha',
      diagnostics: JSON.stringify({ detectedState: 'captcha' }),
    });

    const result = await executeToolWithParams('getProductJobDiagnostics', {
      productId: product.id,
    }) as any;

    expect(result.readOnly).toBe(true);
    expect(result.mutationPolicy).toMatch(/does not start a hidden refresh/i);
    expect(result.scoreSeparation).toMatch(/operational context/i);
    expect(result.diagnostics.job.delayReason).toBe('retry_backoff');
    expect(result.diagnostics.caveat).toMatch(/Queue health describes/);
  });

  it('14. checkProductNow explicitly triggers the manual acquisition path', async () => {
    const product = await seedProductWithHistory({
      platform: 'walmart',
      productUrl: `https://example.com/products/${randomUUID()}`,
      asin: '',
      title: 'Unsupported Marketplace Item',
    });

    const result = await executeToolWithParams('checkProductNow', {
      productId: product.id,
    }) as any;

    expect(result.triggeredAcquisition).toBe(true);
    expect(result.result.productId).toBe(product.id);
    expect(result.result.failureReason).toBe('unsupported_platform');
    expect(result.explanation).toMatch(/unsupported_platform|diagnostics/i);
  });

  it('13. getProductOpportunities returns ranked products and unsupported signal caveats', async () => {
    const strong = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0STRONG',
      title: 'Strong Opportunity Item',
      category: 'electronics',
      isMonitoring: true,
    });
    await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0WEAK',
      title: 'Weak Opportunity Item',
      category: 'electronics',
      isMonitoring: false,
    });
    await seedAcquisitionAttempt(strong.id, {
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      failureReason: null,
      confidence: 0.9,
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: null,
    });

    const result = await executeToolWithParams('getProductOpportunities', {
      category: 'electronics',
      limit: 2,
    }) as any;

    expect(result.data).toHaveLength(2);
    expect(result.data[0]).toHaveProperty('score');
    expect(result.data[0]).toHaveProperty('confidence');
    expect(result.data[0]).toHaveProperty('recommendation');
    expect(result.data[0].missingSignals).toEqual(
      expect.arrayContaining(['profit_margin', 'sales_volume', 'demand'])
    );
    expect(result.unsupportedSignalCaveat).toMatch(
      /profit margin.*sales volume.*demand/i
    );
  });

  it('13b. getProductOpportunities supports filters and recommended-action selection', async () => {
    const product = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0FILTER',
      title: 'Filtered Opportunity Item',
      category: 'toys',
      isMonitoring: true,
    });

    const baseline = await executeToolWithParams('getProductOpportunities', {
      platform: 'amazon',
      category: 'toys',
      limit: 1,
    }) as any;

    const result = await executeToolWithParams('getProductOpportunities', {
      platform: 'amazon',
      category: 'toys',
      recommendation: baseline.data[0].recommendation,
      minScore: baseline.data[0].score,
      limit: 5,
    }) as any;

    expect(result.data.some((item: any) => item.product.id === product.id)).toBe(
      true
    );
  });

  it('13c. getProductOpportunities supports business readiness and ROI filters', async () => {
    const product = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0BUSINESS',
      title: 'Business Ready Opportunity Item',
      category: 'kitchen',
      isMonitoring: true,
    });
    await db.insert(productBusinessSignals).values({
      productId: product.id,
      currency: 'USD',
      costBasis: 35,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 0.12,
      advertisingCost: 5,
      taxCustomsBuffer: 2,
      targetSellPrice: 110,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await executeToolWithParams('getProductOpportunities', {
      category: 'kitchen',
      businessReadiness: 'complete',
      minRoi: 0.5,
      limit: 5,
    }) as any;

    expect(result.data).toHaveLength(1);
    expect(result.data[0].product.id).toBe(product.id);
    expect(result.data[0].businessSignals.completeness).toBe('complete');
    expect(result.data[0].businessSignalCaveat).toMatch(/merchant-provided assumptions/i);
  });

  it('14. explainProductOpportunity returns factor and acquisition details', async () => {
    const product = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0EXPLAIN',
      title: 'Explainable Opportunity Item',
    });
    await seedAcquisitionAttempt(product.id, {
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      failureReason: null,
      confidence: 0.85,
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: null,
    });

    const result = await executeToolWithParams('explainProductOpportunity', {
      productId: product.id,
    }) as any;

    expect(result.data.product.id).toBe(product.id);
    expect(result.data.factors.length).toBeGreaterThan(0);
    expect(result.data.acquisitionHealth.provider).toBe('rainforest');
    expect(result.data.businessSignals).toBeDefined();
    expect(result.data.businessSignalCaveat).toMatch(/merchant-provided assumptions/i);
    expect(result.unsupportedSignalCaveat).toMatch(/Do not claim verified/i);
  });

  it('14d. explainProductOpportunity includes market signal factors without unsupported demand claims', async () => {
    const product = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0MARKETCH',
      title: 'Market Signal Opportunity Item',
    });
    await seedAcquisitionAttempt(product.id, {
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      failureReason: null,
      confidence: 0.85,
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: null,
    });
    await seedMarketSignal(product.id, { asin: 'B0MARKETCH' });

    const result = await executeToolWithParams('explainProductOpportunity', {
      productId: product.id,
    }) as any;

    expect(result.data.marketSignals.status).toBe('fresh');
    expect(result.data.marketSignals.factors.map((factor: any) => factor.name)).toEqual(
      expect.arrayContaining([
        'market_sales_rank_trend',
        'market_review_velocity',
      ])
    );
    expect(result.data.marketSignalCaveat).toContain('not verified sales');
    expect(JSON.stringify(result.data.marketSignals)).toContain(
      'not verified demand'
    );
    expect(JSON.stringify(result.data.marketSignals)).not.toMatch(
      /verified demand is|verified sales volume is/i
    );
  });

  it('14c. explainProductOpportunity keeps eBay listing caveats visible', async () => {
    const product = await seedProductWithHistory({
      platform: 'ebay',
      productUrl: `https://www.ebay.com/itm/${Date.now()}`,
      asin: '',
      title: 'Explainable eBay Listing',
    });
    await seedAcquisitionAttempt(product.id, {
      provider: 'ebay-browse',
      source: 'official_api',
      status: 'success',
      failureReason: null,
      confidence: 0.95,
      httpStatus: null,
      pageTitle: null,
      finalUrl: null,
      diagnostics: JSON.stringify({
        marketplace: 'EBAY_US',
        ebayItemId: 'v1|123456789012|0',
      }),
    });

    const result = await executeToolWithParams('explainProductOpportunity', {
      productId: product.id,
    }) as any;

    expect(result.data.product.platform).toBe('ebay');
    expect(result.data.acquisitionHealth.provider).toBe('ebay-browse');
    expect(result.data.platformDataCaveat).toMatch(/current listing facts only/i);
    expect(result.unsupportedSignalCaveat).toMatch(/Do not claim verified/i);
  });

  it('14b. explainProductOpportunity rejects a missing product', async () => {
    await expect(
      executeToolWithParams('explainProductOpportunity', {
        productId: 'missing-product',
      })
    ).rejects.toThrow(/Product not found/);
  });

  it('15. getOpportunityResearchStatus reads status without mutating workspace state', async () => {
    const product = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0RESEARCH',
      title: 'Research Status Item',
    });
    await seedResearchEntry(product.id, {
      status: 'ready',
      priority: 'high',
      tagsJson: JSON.stringify(['launch', 'margin']),
      notes: 'Ready for sourcing review.',
    });

    const result = await executeToolWithParams('getOpportunityResearchStatus', {
      productId: product.id,
    }) as any;

    expect(result.readOnly).toBe(true);
    expect(result.research).toMatchObject({
      status: 'ready',
      priority: 'high',
      tags: ['launch', 'margin'],
      notesSummary: 'Ready for sourcing review.',
    });
    expect(result.mutationPolicy).toMatch(/cannot save.*retag.*archive/i);
  });

  it('15b. getOpportunityResearchStatus explains missing research entries', async () => {
    const product = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0NORESEARCH',
      title: 'No Research Item',
    });

    const result = await executeToolWithParams('getOpportunityResearchStatus', {
      productId: product.id,
    }) as any;

    expect(result.research).toBeNull();
    expect(result.researchStateExplanation).toMatch(/No shortlist/i);
  });

  it('16. listShortlistedOpportunities returns filtered read-only shortlist summaries', async () => {
    const ready = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0READY',
      title: 'Ready Research Item',
    });
    const watching = await seedProductWithHistory({
      productUrl: `https://amazon.com/dp/${randomUUID().slice(0, 10)}`,
      asin: 'B0WATCH',
      title: 'Watching Research Item',
    });
    await seedResearchEntry(ready.id, {
      status: 'ready',
      priority: 'high',
      tagsJson: JSON.stringify(['launch']),
    });
    await seedResearchEntry(watching.id, {
      status: 'watching',
      priority: 'medium',
      tagsJson: JSON.stringify(['watch']),
    });

    const result = await executeToolWithParams('listShortlistedOpportunities', {
      status: 'ready',
      tag: ' launch ',
      limit: 5,
    }) as any;

    expect(result.readOnly).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].product.id).toBe(ready.id);
    expect(result.data[0].research.status).toBe('ready');
    expect(result.data.map((item: any) => item.product.id)).not.toContain(
      watching.id
    );
    expect(result.mutationPolicy).toMatch(/read-only/i);
  });

  it('18b. Chat tools do not expose hidden research or queue mutation tools', () => {
    const toolNames = AGENT_TOOLS.map((tool) => tool.name);

    expect(toolNames).not.toEqual(
      expect.arrayContaining([
        'saveOpportunityResearch',
        'tagOpportunityResearch',
        'archiveOpportunityResearch',
        'retryAcquisitionJob',
        'cancelAcquisitionJob',
        'enqueueAcquisitionJob',
      ])
    );
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
