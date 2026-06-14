import { aiProvider } from './aiProviderFactory';
import { AGENT_TOOLS, executeToolWithParams } from './agentTools';
import { ChatMessage, ChatSession, ToolCall, ToolResult } from '../types/chat';
import { db } from '../db';
import { chatSessions, chatMessages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { Message as AIMessage, StreamChunk } from './aiProvider';

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
    const userMessage = await this.storeMessage({
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
        const followUpContext = [
          ...context,
          {
            role: 'assistant' as const,
            content: response.content,
            toolCalls: response.toolCalls,
          },
          {
            role: 'user' as const,
            content: '', // Tool results will be added
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

        // Generate title if needed
        this.maybeGenerateTitle(sessionId);

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

      // Generate title if needed
      this.maybeGenerateTitle(sessionId);

      return assistantMessage;
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to send message');
      throw error;
    }
  }

  /**
   * Stream a message response
   */
  async *streamMessage(sessionId: string, content: string): AsyncGenerator<StreamChunk, void, unknown> {
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

    // Yield a processing event immediately to keep connection alive
    yield { type: 'processing' as any };

    try {
      // Build conversation context
      const context = await this.buildContext(sessionId);

      // Stream from AI provider using manual iteration
      let accumulatedContent = '';
      const toolCalls: ToolCall[] = [];
      let totalTokens = 0;

      const generator = aiProvider.streamMessage({
        messages: context,
        tools: AGENT_TOOLS,
        systemPrompt: SYSTEM_PROMPT,
      });

      let result = await generator.next();
      while (!result.done) {
        const chunk = result.value;
        yield chunk;

        // Accumulate content and tool calls
        if (chunk.type === 'text' && chunk.text) {
          accumulatedContent += chunk.text;
        } else if (chunk.type === 'tool_call' && chunk.toolCall) {
          toolCalls.push(chunk.toolCall);
        } else if (chunk.type === 'usage' && chunk.usage) {
          totalTokens += chunk.usage.inputTokens + chunk.usage.outputTokens;
        }

        result = await generator.next();
      }

      // Execute tools if present
      if (toolCalls.length > 0) {
        const toolResults = await this.executeTools(toolCalls);

        // Yield tool results
        for (const result of toolResults) {
          yield {
            type: 'tool_result',
            toolResult: result,
          };
        }

        // Send tool results back to AI and stream final response
        const followUpContext: AIMessage[] = [
          ...context,
          {
            role: 'assistant' as const,
            content: accumulatedContent,
            toolCalls,
          },
          {
            role: 'user' as const,
            content: '',
            toolResults,
          },
        ];

        let finalContent = '';
        let finalTokens = 0;

        const followUpGenerator = aiProvider.streamMessage({
          messages: followUpContext,
          tools: AGENT_TOOLS,
          systemPrompt: SYSTEM_PROMPT,
        });

        let followUpResult = await followUpGenerator.next();
        while (!followUpResult.done) {
          const chunk = followUpResult.value;
          yield chunk;

          if (chunk.type === 'text' && chunk.text) {
            finalContent += chunk.text;
          } else if (chunk.type === 'usage' && chunk.usage) {
            finalTokens += chunk.usage.inputTokens + chunk.usage.outputTokens;
          }

          followUpResult = await followUpGenerator.next();
        }

        // Store assistant message with tool calls
        await this.storeMessage({
          sessionId,
          role: 'assistant',
          content: finalContent,
          toolCalls,
          toolResults,
          tokensUsed: totalTokens + finalTokens,
        });
      } else {
        // No tool calls - store message directly
        await this.storeMessage({
          sessionId,
          role: 'assistant',
          content: accumulatedContent,
          tokensUsed: totalTokens,
        });
      }

      // Update session
      await this.updateSession(sessionId);

      // Generate title if needed
      this.maybeGenerateTitle(sessionId);
    } catch (error) {
      logger.error({ sessionId, error }, 'Failed to stream message');
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute tools with timeout
   */
  private async executeTools(toolCalls: ToolCall[]): Promise<ToolResult[]> {
    const TOOL_TIMEOUT = 10000; // 10 seconds

    const results: ToolResult[] = [];

    for (const call of toolCalls) {
      try {
        const resultPromise = executeToolWithParams(call.name, call.input);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tool execution timeout')), TOOL_TIMEOUT)
        );

        const output = await Promise.race([resultPromise, timeoutPromise]);

        results.push({
          toolCallId: call.id,
          output,
          isError: false,
        });
      } catch (error) {
        logger.error({ toolCall: call, error }, 'Tool execution failed');
        results.push({
          toolCallId: call.id,
          output: { error: error instanceof Error ? error.message : 'Unknown error' },
          isError: true,
        });
      }
    }

    return results;
  }

  /**
   * Build conversation context (last 20 messages)
   */
  private async buildContext(sessionId: string): Promise<AIMessage[]> {
    const messages = await this.getMessages(sessionId, CONTEXT_MESSAGE_LIMIT);

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
    }));
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
      .orderBy(chatMessages.timestamp)
      .$dynamic();

    if (limit) {
      query = query.limit(limit);
    }

    const rows = await query;

    return rows.map(row => ({
      id: row.id,
      sessionId: row.sessionId,
      role: row.role as 'user' | 'assistant',
      content: row.content,
      toolCalls: row.toolCalls ? JSON.parse(row.toolCalls) : undefined,
      toolResults: row.toolResults ? JSON.parse(row.toolResults) : undefined,
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
}
