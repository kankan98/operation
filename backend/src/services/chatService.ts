import { aiProvider } from './aiProviderFactory';
import { AGENT_TOOLS, executeToolWithParams } from './agentTools';
import { ChatMessage, ChatSession, ToolCall, ToolResult } from '../types/chat';
import { db } from '../db';
import { chatSessions, chatMessages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

function parseJsonValue<T>(value: string | null): T | undefined {
  if (!value) return undefined;
  return JSON.parse(value) as T;
}
import { Message as AIMessage } from './aiProvider';
import {
  SSEEvent,
  MessageStartEvent,
  StatusChangeEvent,
  ContentDeltaEvent,
  TextStartEvent,
  TextEndEvent,
  ToolStartEvent,
  ToolCompleteEvent,
  UsageCompleteEvent,
  MessageCompleteEvent,
  ErrorOccurredEvent,
  StreamErrorCode,
  MessagePart,
} from '../../../shared/types/sse-protocol';

const SYSTEM_PROMPT = `你是一个专业的跨境电商运营 AI Agent,帮助卖家进行产品监控、竞品分析和市场调研。

核心能力:
1. 竞品监控 - 持续追踪竞品变化,识别异常,主动推送报警
2. 数据分析 - 价格趋势预测、竞争格局分析、市场机会识别
3. 选品建议 - 基于数据评估新品潜力、分析竞争强度和利润空间

工作原则:
- 数据驱动: 所有建议基于真实数据和历史趋势
- 主动洞察: 不只被动回答,要主动发现值得关注的变化
- 务实可行: 提供具体、可执行的建议
- 风险提示: 标注不确定因素和潜在风险
- 当前 UI 契约: 引导用户时只能引用真实页面和动作名称: 商品、添加商品、商品详情、立即检查、记录手动读数、选品机会、预警
- 冷启动路径: 如果当前没有商品,引导用户进入「商品」页面使用「添加商品」; 不要发明英文工具名式入口或当前 UI 不存在的创建预警入口
- 支持平台: amazon, walmart, aliexpress, ebay, other; 不要建议或调用任何未支持平台
- 预警说明: 当前没有可见的预警规则创建入口时,不要声称用户可以在界面里点击该入口；可以说明预警会在商品监控检测到价格或库存变化后出现
- 选品研究区只读: 可以读取 shortlist/research 状态并总结候选,但不要通过对话静默保存、打标签、改状态或归档；如用户要求这些写入操作,说明当前需要在机会研究工作台 UI 中完成,直到设计显式确认的写入流程

输出格式:
**现状**: 描述当前情况
**洞察**: 数据背后的含义
**建议**: 具体行动建议
**风险**: 需要注意的不确定因素`;

const CONTEXT_MESSAGE_LIMIT = 20;

export class ChatService {
  /**
   * Send a message and get complete response (non-streaming)
   */
  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Store user message
    await this.storeMessage({
      sessionId,
      role: 'user',
      content,
    });

    try {
      // Build conversation context
      const context = await this.buildContext(sessionId);

      // Send to AI provider
      const response = await aiProvider.sendMessage({
        messages: context,
        tools: AGENT_TOOLS,
        systemPrompt: SYSTEM_PROMPT,
      });

      // Handle tool calls if present
      if (response.toolCalls && response.toolCalls.length > 0) {
        const toolResults = await this.executeTools(response.toolCalls);

        // Send tool results back to AI
        // The assistant message with tool_calls followed by tool result messages
        const followUpContext = [
          ...context,
          {
            role: 'assistant' as const,
            content: response.content,
            toolCalls: response.toolCalls,
          },
          {
            role: 'user' as const,
            content: '', // Placeholder, will be ignored when toolResults exist
            toolResults,
          },
        ];

        const finalResponse = await aiProvider.sendMessage({
          messages: followUpContext,
          tools: AGENT_TOOLS,
          systemPrompt: SYSTEM_PROMPT,
        });

        // Store assistant message with tool calls
        const assistantMessage = await this.storeMessage({
          sessionId,
          role: 'assistant',
          content: finalResponse.content,
          toolCalls: response.toolCalls,
          toolResults,
          tokensUsed: response.usage.inputTokens + response.usage.outputTokens +
                     finalResponse.usage.inputTokens + finalResponse.usage.outputTokens,
        });

        // Update session
        await this.updateSession(sessionId);

        // Generate title if needed (fire and forget)
        void this.maybeGenerateTitle(sessionId);

        return assistantMessage;
      }

      // No tool calls - store assistant message directly
      const assistantMessage = await this.storeMessage({
        sessionId,
        role: 'assistant',
        content: response.content,
        tokensUsed: response.usage.inputTokens + response.usage.outputTokens,
      });

      // Update session
      await this.updateSession(sessionId);

      // Generate title if needed (fire and forget)
      void this.maybeGenerateTitle(sessionId);

      return assistantMessage;
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to send message');
      throw error;
    }
  }

  /**
   * Stream a message response with real-time updates and agent loop support.
   * Implements multi-turn tool execution (up to 5 iterations) for complex queries.
   *
   * @param sessionId - ID of the chat session
   * @param messageId - Pre-generated message ID
   * @param streamId - Stream ID for tracking
   * @param content - User message content
   * @yields SSEEvent events following the unified protocol
   *
   * @remarks
   * SSE Protocol v2.0:
   * - Emits message_start with messageId, sessionId, timestamp, model, streamId
   * - Emits status_change for explicit state transitions
   * - Emits content_delta for text chunks
   * - Emits tool_start with complete params and timing
   * - Emits tool_complete with result and complete timing metadata
   * - Emits usage_complete with token statistics
   * - Emits message_complete as final event
   */
  async *streamMessage(
    sessionId: string,
    messageId: string,
    streamId: string,
    content: string,
    abortSignal?: AbortSignal
  ): AsyncGenerator<SSEEvent, void, unknown> {
    // 检查是否已中止
    if (abortSignal?.aborted) {
      const errorEvent: ErrorOccurredEvent = {
        type: 'error_occurred',
        error: {
          code: StreamErrorCode.INTERNAL_ERROR,
          message: 'Stream aborted',
          retryable: false,
        },
        timestamp: Date.now(),
      };
      yield errorEvent;
      return;
    }
    const session = await this.getSession(sessionId);
    if (!session) {
      const errorEvent: ErrorOccurredEvent = {
        type: 'error_occurred',
        error: {
          code: StreamErrorCode.SESSION_NOT_FOUND,
          message: `Session not found: ${sessionId}`,
          retryable: false,
        },
        timestamp: Date.now(),
      };
      yield errorEvent;
      return;
    }

    // Store user message
    await this.storeMessage({
      sessionId,
      role: 'user',
      content,
    });

    // Emit message_start event
    const messageStartEvent: MessageStartEvent = {
      type: 'message_start',
      messageId,
      sessionId,
      timestamp: Date.now(),
      model: 'claude-3-5-sonnet-20241022',
      streamId,
    };
    yield messageStartEvent;

    // Emit initial status: thinking
    const thinkingEvent: StatusChangeEvent = {
      type: 'status_change',
      status: 'thinking',
      timestamp: Date.now(),
    };
    yield thinkingEvent;

    try {
      // Build conversation context
      let context = await this.buildContext(sessionId);

      // Agent Loop: support up to 5 iterations of tool execution
      const MAX_ITERATIONS = 5;
      let totalTokens = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let finalContent = '';
      const finalToolCalls: ToolCall[] = [];
      const finalToolResults: ToolResult[] = [];
      const finalParts: MessagePart[] = [];
      const startTime = Date.now();

      for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        // 检查是否已中止
        if (abortSignal?.aborted) {
          logger.info({ sessionId, streamId }, 'Stream aborted by signal');
          const errorEvent: ErrorOccurredEvent = {
            type: 'error_occurred',
            error: {
              code: StreamErrorCode.INTERNAL_ERROR,
              message: 'Stream aborted',
              retryable: false,
            },
            timestamp: Date.now(),
          };
          yield errorEvent;
          return;
        }

        // Stream from AI provider
        let iterationContent = '';
        const iterationToolCalls: ToolCall[] = [];
        let iterationTokens = 0;
        let hasStartedWriting = false;
        let currentTextBlockId: string | null = null;
        let currentTextContent = '';

        const generator = aiProvider.streamMessage({
          messages: context,
          tools: AGENT_TOOLS,
          systemPrompt: SYSTEM_PROMPT,
        });

        let result = await generator.next();
        while (!result.done) {
          // 在每次迭代中检查中止信号
          if (abortSignal?.aborted) {
            logger.info({ sessionId, streamId }, 'Stream aborted during iteration');
            const errorEvent: ErrorOccurredEvent = {
              type: 'error_occurred',
              error: {
                code: StreamErrorCode.INTERNAL_ERROR,
                message: 'Stream aborted',
                retryable: false,
              },
              timestamp: Date.now(),
            };
            yield errorEvent;
            return;
          }

          const chunk = result.value;

          // Handle tool calls
          if (chunk.type === 'tool_call' && chunk.toolCall) {
            if (currentTextBlockId) {
              const textEndEvent: TextEndEvent = {
                type: 'text_end',
                blockId: currentTextBlockId,
                timestamp: Date.now(),
              };
              yield textEndEvent;
              finalParts.push({
                type: 'text',
                id: currentTextBlockId,
                content: currentTextContent,
              });
              currentTextBlockId = null;
              currentTextContent = '';
            }

            const toolStartTime = Date.now();
            const toolCallWithId = {
              ...chunk.toolCall,
              startTime: toolStartTime,
            };
            iterationToolCalls.push(toolCallWithId);

            // Emit status_change to tool_calling
            const toolCallingStatus: StatusChangeEvent = {
              type: 'status_change',
              status: 'tool_calling',
              context: chunk.toolCall.name,
              timestamp: toolStartTime,
            };
            yield toolCallingStatus;

            // Emit tool_start with complete params
            const toolStartEvent: ToolStartEvent = {
              type: 'tool_start',
              tool: {
                id: chunk.toolCall.id,
                name: chunk.toolCall.name,
                params: chunk.toolCall.input,
              },
              timestamp: toolStartTime,
            };
            yield toolStartEvent;
          } else if (chunk.type === 'text' && chunk.text) {
            // First text chunk: emit status_change to writing
            if (!hasStartedWriting) {
              hasStartedWriting = true;
              const writingStatus: StatusChangeEvent = {
                type: 'status_change',
                status: 'writing',
                timestamp: Date.now(),
              };
              yield writingStatus;
            }

            // Emit content_delta
            if (!currentTextBlockId) {
              currentTextBlockId = randomUUID();
              currentTextContent = '';
              const textStartEvent: TextStartEvent = {
                type: 'text_start',
                blockId: currentTextBlockId,
                timestamp: Date.now(),
              };
              yield textStartEvent;
            }

            const contentEvent: ContentDeltaEvent = {
              type: 'content_delta',
              blockId: currentTextBlockId,
              delta: chunk.text,
              timestamp: Date.now(),
            };
            yield contentEvent;
            currentTextContent += chunk.text;
          }

          // Accumulate content and tokens
          if (chunk.type === 'text' && chunk.text) {
            iterationContent += chunk.text;
          } else if (chunk.type === 'usage' && chunk.usage) {
            iterationTokens += chunk.usage.inputTokens + chunk.usage.outputTokens;
            totalInputTokens += chunk.usage.inputTokens;
            totalOutputTokens += chunk.usage.outputTokens;
          }

          result = await generator.next();
        }

        if (currentTextBlockId) {
          const textEndEvent: TextEndEvent = {
            type: 'text_end',
            blockId: currentTextBlockId,
            timestamp: Date.now(),
          };
          yield textEndEvent;
          finalParts.push({
            type: 'text',
            id: currentTextBlockId,
            content: currentTextContent,
          });
        }

        totalTokens += iterationTokens;
        finalContent += iterationContent;

        // If no tool calls, we're done
        if (iterationToolCalls.length === 0) {
          break;
        }

        // Execute tools and emit tool_complete events
        const toolResults = await this.executeTools(iterationToolCalls);

        for (const toolResult of toolResults) {
          const toolCall = iterationToolCalls.find(
            (call) => call.id === toolResult.toolCallId
          );
          if (toolCall) {
            finalParts.push({
              type: 'tool',
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.input,
              result: toolResult.output,
              isError: toolResult.isError,
              startTime: toolResult.startTime,
              endTime: toolResult.endTime,
              durationMs: toolResult.durationMs,
            });
          }

          const toolCompleteEvent: ToolCompleteEvent = {
            type: 'tool_complete',
            toolId: toolResult.toolCallId,
            result: {
              output: toolResult.output,
              isError: toolResult.isError || false,
            },
            timing: {
              startTime: toolResult.startTime || Date.now(),
              endTime: toolResult.endTime || Date.now(),
              durationMs: toolResult.durationMs || 0,
            },
            timestamp: Date.now(),
          };
          yield toolCompleteEvent;
        }

        // Emit status back to writing
        const backToWriting: StatusChangeEvent = {
          type: 'status_change',
          status: 'writing',
          timestamp: Date.now(),
        };
        yield backToWriting;

        // Store tool calls and results for final message
        finalToolCalls.push(...iterationToolCalls);
        finalToolResults.push(...toolResults);

        // Update context for next iteration
        // Add assistant message with tool calls
        context = [
          ...context,
          {
            role: 'assistant' as const,
            content: iterationContent,
            toolCalls: iterationToolCalls,
          },
          // Add tool results (will be converted to role: 'tool' messages by provider)
          {
            role: 'user' as const,
            content: '', // Placeholder, will be ignored when toolResults exist
            toolResults,
          },
        ];
      }

      // Store final message
      if (finalToolCalls.length > 0) {
        await this.storeMessage({
          sessionId,
          role: 'assistant',
          content: finalContent,
          toolCalls: finalToolCalls,
          toolResults: finalToolResults,
          parts: finalParts,
          tokensUsed: totalTokens,
        });
      } else {
        await this.storeMessage({
          sessionId,
          role: 'assistant',
          content: finalContent,
          parts: finalParts,
          tokensUsed: totalTokens,
        });
      }

      // Update session
      await this.updateSession(sessionId);

      // Generate title if needed (fire and forget)
      void this.maybeGenerateTitle(sessionId);

      // Emit usage_complete
      const usageEvent: UsageCompleteEvent = {
        type: 'usage_complete',
        usage: {
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          totalTokens: totalTokens,
        },
        timestamp: Date.now(),
      };
      yield usageEvent;

      // Emit message_complete
      const endTime = Date.now();
      const completeEvent: MessageCompleteEvent = {
        type: 'message_complete',
        messageId,
        timestamp: endTime,
        metadata: {
          totalTokens,
          toolCallsCount: finalToolCalls.length,
          durationMs: endTime - startTime,
        },
      };
      yield completeEvent;
    } catch (error) {
      logger.error({ sessionId, streamId, error }, 'Failed to stream message');
      const errorEvent: ErrorOccurredEvent = {
        type: 'error_occurred',
        error: {
          code: StreamErrorCode.INTERNAL_ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
        timestamp: Date.now(),
      };
      yield errorEvent;
    }
  }

  /**
   * Execute multiple tool calls in parallel with timeout protection.
   *
   * @param toolCalls - Array of tool calls to execute
   * @returns Array of tool results (successful or error)
   *
   * @remarks
   * Each tool has a 10-second timeout. Timed-out tools return an error result
   * rather than throwing, so the agent loop can continue with partial results.
   * Now captures timing metadata (startTime, endTime, durationMs) for each tool.
   */
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const TOOL_TIMEOUT = 10000; // 10 seconds

    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      const startTime = call.startTime || Date.now(); // Use existing startTime from ToolCall
      try {
        const resultPromise = executeToolWithParams(call.name, call.input);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), TOOL_TIMEOUT)
        );

        const output = await Promise.race([resultPromise, timeoutPromise]);
        const endTime = Date.now();
        const durationMs = endTime - startTime;

        results.push({
          toolCallId: call.id,
          output,
          isError: false,
          startTime,
          endTime,
          durationMs,
        });
      } catch (error) {
        const endTime = Date.now();
        const durationMs = endTime - startTime;
        logger.error({ toolCall: call, error }, 'Tool execution failed');
        results.push({
          toolCallId: call.id,
          output: { error: error instanceof Error ? error.message : 'Unknown error' },
          isError: true,
          startTime,
          endTime,
          durationMs,
        });
      }
    }

    return results;
  }

  /**
   * Build conversation context from the most recent messages in the session.
   * Retrieves the last N messages (default 20) in chronological order.
   *
   * @param sessionId - ID of the chat session
   * @returns Array of messages formatted for AI provider
   *
   * @remarks
   * Messages are fetched using DESC order + reverse to get most recent N efficiently.
   * Context window slides as conversation grows, keeping total token count manageable.
   */
  private async buildContext(sessionId: string): Promise<AIMessage[]> {
    const messages = await this.getMessages(sessionId, CONTEXT_MESSAGE_LIMIT);

    return messages.flatMap((msg) => {
      const hasToolCalls = Boolean(msg.toolCalls?.length);
      const hasToolResults = Boolean(msg.toolResults?.length);

      if (msg.role === 'assistant' && hasToolCalls && hasToolResults) {
        const expanded: AIMessage[] = [
          {
            role: 'assistant',
            content: '',
            toolCalls: msg.toolCalls,
          },
          {
            role: 'user',
            content: '',
            toolResults: msg.toolResults,
          },
        ];

        if (msg.content) {
          expanded.push({
            role: 'assistant',
            content: msg.content,
          });
        }

        return expanded;
      }

      return [
        {
          role: msg.role,
          content: msg.content,
          toolCalls: msg.toolCalls,
          toolResults: msg.toolResults,
        },
      ];
    });
  }

  /**
   * Store a message in the database
   */
  private async storeMessage(data: {
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    parts?: MessagePart[];
    tokensUsed?: number;
  }): Promise<ChatMessage> {
    const id = randomUUID();
    const timestamp = Date.now();

    await db.insert(chatMessages).values({
      id,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      toolCalls: data.toolCalls ? JSON.stringify(data.toolCalls) : null,
      toolResults: data.toolResults ? JSON.stringify(data.toolResults) : null,
      parts: data.parts ? JSON.stringify(data.parts) : null,
      tokensUsed: data.tokensUsed || null,
      timestamp,
    });

    return {
      id,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      toolCalls: data.toolCalls,
      toolResults: data.toolResults,
      parts: data.parts,
      tokensUsed: data.tokensUsed,
      timestamp,
    };
  }

  /**
   * Get messages for a session
   */
  private async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
    let query = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(desc(chatMessages.timestamp))
      .$dynamic();

    if (limit) {
      query = query.limit(limit);
    }

    const rows = await query;

    // Reverse to chronological order (oldest → newest) for LLM context
    return rows.reverse().map(row => ({
      id: row.id,
      sessionId: row.sessionId,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      toolCalls: row.toolCalls ? JSON.parse(row.toolCalls) as ToolCall[] : undefined,
      toolResults: row.toolResults ? JSON.parse(row.toolResults) as ToolResult[] : undefined,
      parts: row.parts ? JSON.parse(row.parts) as MessagePart[] : undefined,
      tokensUsed: row.tokensUsed || undefined,
      timestamp: row.timestamp,
    }));
  }

  /**
   * Get a session by ID
   */
  private async getSession(sessionId: string): Promise<ChatSession | null> {
    const rows = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      title: row.title || undefined,
      userId: row.userId || undefined,
      contextSummary: row.contextSummary || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
    };
  }

  /**
   * Update session timestamp
   */
  private async updateSession(sessionId: string): Promise<void> {
    await db
      .update(chatSessions)
      .set({ updatedAt: Date.now() })
      .where(eq(chatSessions.id, sessionId));
  }

  /**
   * Generate session title after 3 messages
   */
  private async maybeGenerateTitle(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session || session.title) return; // Already has title

    const messages = await this.getMessages(sessionId);
    if (messages.length < 3) return; // Need at least 3 messages

    // Generate title asynchronously (fire-and-forget)
    this.generateSessionTitle(sessionId, messages).catch(err =>
      logger.error({ sessionId, error: err }, 'Failed to generate session title')
    );
  }

  /**
   * Generate a concise session title using AI
   */
  private async generateSessionTitle(sessionId: string, messages: ChatMessage[]): Promise<void> {
    try {
      const conversation = messages
        .slice(0, 6) // First 6 messages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const titleResponse = await aiProvider.sendMessage({
        messages: [
          {
            role: 'user',
            content: `Based on this conversation, generate a concise title (20-50 characters) that describes the topic:\n\n${conversation}`,
          },
        ],
        systemPrompt: 'You are a helpful assistant that generates concise conversation titles.',
      });

      const title = titleResponse.content.trim().replace(/^["']|["']$/g, '').slice(0, 50);

      await db.update(chatSessions).set({ title }).where(eq(chatSessions.id, sessionId));

      logger.info({ sessionId, title }, 'Generated session title');
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to generate title');
    }
  }

  /**
   * Update session attributes (Chat UI Redesign)
   */
  async updateSessionAttributes(
    sessionId: string,
    updates: {
      isPinned?: boolean;
      title?: string;
      tags?: string[];
      lastMessagePreview?: string;
    }
  ): Promise<ChatSession | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (updates.isPinned !== undefined) {
      updateData.isPinned = updates.isPinned;
    }

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }

    if (updates.tags !== undefined) {
      updateData.tags = JSON.stringify(updates.tags);
    }

    if (updates.lastMessagePreview !== undefined) {
      updateData.lastMessagePreview = updates.lastMessagePreview;
    }

    await db.update(chatSessions).set(updateData).where(eq(chatSessions.id, sessionId));

    // Return updated session
    return this.getSessionById(sessionId);
  }

  /**
   * Get session by ID (public method for API routes)
   */
  async getSessionById(sessionId: string): Promise<ChatSession | null> {
    const rows = await db.select().from(chatSessions).where(eq(chatSessions.id, sessionId));

    if (rows.length === 0) return null;

    const row = rows[0];
    return {
      id: row.id,
      title: row.title || undefined,
      userId: row.userId || undefined,
      contextSummary: row.contextSummary || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || undefined,
      isPinned: Boolean(row.isPinned),
      tags: parseJsonValue<string[]>(row.tags),
      lastMessagePreview: row.lastMessagePreview || undefined,
      unreadCount: row.unreadCount || 0,
    };
  }
}
