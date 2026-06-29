import { Router, Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { db } from '../db';
import { chatSessions, chatMessages } from '../db/schema';
import { eq, desc, count } from 'drizzle-orm';
import { randomUUID, createHash } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { StreamErrorCode } from '../../../shared/types/sse-protocol';
import { logger } from '../utils/logger';

const router = Router();
const chatService = new ChatService();

// Task 2.2: 内容哈希工具 (SHA-256)
function hashContent(content: string): string {
  return createHash('sha256').update(content.trim()).digest('hex');
}

// Task 2.3: 内存中的请求注册表
interface InFlightRequest {
  hash: string;
  timestamp: number;
}
const inflightStreams = new Map<string, InFlightRequest>();

// Task 2.7: 清理过期的注册表条目（30 秒超时）
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, request] of inflightStreams.entries()) {
    if (now - request.timestamp > 30000) {
      inflightStreams.delete(sessionId);
      logger.debug({ sessionId }, 'Cleaned up stale in-flight registry entry');
    }
  }
}, 30000);

// POST /api/chat/sessions - Create new session
router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, userId } = req.body as { title?: string; userId?: string };

    const id = randomUUID();
    const now = Date.now();

    await db.insert(chatSessions).values({
      id,
      title: title || null,
      userId: userId || null,
      contextSummary: null,
      createdAt: now,
      updatedAt: null,
    });

    const session = {
      id,
      title: title || null,
      userId: userId || null,
      createdAt: now,
    };

    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions - Get all sessions
router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const sessions = await db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt))
      .limit(limitNum)
      .offset(offset);

    // Get message counts for each session using a single query
    const messageCounts = await db
      .select({
        sessionId: chatMessages.sessionId,
        count: count(chatMessages.id).as('count'),
      })
      .from(chatMessages)
      .groupBy(chatMessages.sessionId);

    // Create a map for quick lookup
    const countMap = new Map(
      messageCounts.map((mc) => [mc.sessionId, mc.count])
    );

    const sessionsWithCounts = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      userId: session.userId,
      messageCount: countMap.get(session.id) || 0,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    }));

    res.json({
      sessions: sessionsWithCounts,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions/:id - Get session details
router.get('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, id));

    if (sessions.length === 0) {
      throw new AppError(404, 'Session not found');
    }

    const session = sessions[0];

    // Get message count
    const messages = await db.select().from(chatMessages).where(eq(chatMessages.sessionId, id));

    res.json({
      id: session.id,
      title: session.title,
      userId: session.userId,
      contextSummary: session.contextSummary,
      messageCount: messages.length,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/chat/sessions/:id - Update session (Chat UI Redesign enhanced)
router.patch('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { title, isPinned, tags, lastMessagePreview } = req.body as {
      title?: string;
      isPinned?: boolean;
      tags?: string[];
      lastMessagePreview?: string;
    };

    const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, id));

    if (sessions.length === 0) {
      throw new AppError(404, 'Session not found');
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) {
      updateData.title = title || null;
    }

    if (isPinned !== undefined) {
      updateData.isPinned = isPinned ? 1 : 0;
    }

    if (tags !== undefined) {
      updateData.tags = JSON.stringify(tags);
    }

    if (lastMessagePreview !== undefined) {
      updateData.lastMessagePreview = lastMessagePreview;
    }

    const [updated] = await db
      .update(chatSessions)
      .set(updateData)
      .where(eq(chatSessions.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chat/sessions/:id - Delete session
router.delete('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;

    const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, id));

    if (sessions.length === 0) {
      throw new AppError(404, 'Session not found');
    }

    // Delete messages first (cascade should handle this, but being explicit)
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));

    // Delete session
    await db.delete(chatSessions).where(eq(chatSessions.id, id));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /api/chat/sessions/:id/messages - Get messages for a session
router.get('/sessions/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { limit = 100 } = req.query;

    const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, id));

    if (sessions.length === 0) {
      throw new AppError(404, 'Session not found');
    }

    const limitNum = parseInt(limit as string);

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, id))
      .orderBy(chatMessages.timestamp)
      .limit(limitNum);

    const parsed = messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content,
      toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) as Array<{ id: string; name: string; input: Record<string, unknown> }> : undefined,
      toolResults: msg.toolResults ? JSON.parse(msg.toolResults) as Array<{ toolCallId: string; output: unknown; isError: boolean }> : undefined,
      parts: msg.parts ? JSON.parse(msg.parts) as import('../../../shared/types/sse-protocol').MessagePart[] : undefined,
      tokensUsed: msg.tokensUsed,
      timestamp: msg.timestamp,
    }));

    res.json({ messages: parsed });
  } catch (error) {
    next(error);
  }
});

// POST /api/chat/sessions/:id/messages - Create user message and return messageId
router.post('/sessions/:id/messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { content, stream = false } = req.body as { content?: string; stream?: boolean };

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError(400, 'Content is required');
    }

    // Create user message in DB
    const messageId = randomUUID();
    await db.insert(chatMessages).values({
      id: messageId,
      sessionId: id,
      role: 'user',
      content,
      toolCalls: null,
      toolResults: null,
      tokensUsed: null,
      timestamp: Date.now(),
    });

    // Update session timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: Date.now() })
      .where(eq(chatSessions.id, id));

    // If non-streaming, generate response immediately
    if (!stream) {
      const message = await chatService.sendMessage(id, content);
      res.json(message);
    } else {
      // Return messageId for streaming via GET endpoint
      res.json({ messageId, sessionId: id });
    }
  } catch (error) {
    next(error);
  }
});

// ============================================================
//                   SSE Protocol v2.0
// ============================================================

/**
 * GET /api/chat/sessions/:id/stream - 单步 SSE 直连（新架构）
 *
 * 接受查询参数中的消息内容，立即建立 SSE 连接并开始流式传输
 * 无需预先通过 POST 获取 streamId
 */
router.get('/sessions/:id/stream', async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.params.id as string;
  const content = req.query.content as string;

  try {
    // 验证 content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError(400, 'Content query parameter is required');
    }

    // 处理新会话创建
    let activeSessionId = sessionId;
    if (sessionId === 'new') {
      const newSessionId = randomUUID();
      const now = Date.now();
      await db.insert(chatSessions).values({
        id: newSessionId,
        title: null,
        userId: null,
        contextSummary: null,
        createdAt: now,
        updatedAt: null,
      });
      activeSessionId = newSessionId;
    } else {
      // 验证 session 是否存在
      const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, activeSessionId));
      if (sessions.length === 0) {
        throw new AppError(404, 'Session not found');
      }
    }

    // Task 2.4 & 2.5: 检测重复请求（5 秒窗口）
    const contentHash = hashContent(content);
    const existing = inflightStreams.get(activeSessionId);
    const now = Date.now();

    if (existing && existing.hash === contentHash && now - existing.timestamp < 5000) {
      logger.warn({ sessionId: activeSessionId, contentHash }, 'Duplicate request rejected');
      throw new AppError(429, 'duplicate_request');
    }

    // 注册当前请求
    inflightStreams.set(activeSessionId, { hash: contentHash, timestamp: now });

    // 设置 SSE 响应头（立即返回）
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    // 发送初始心跳（确保连接建立）
    res.write(':ok\n\n');

    // 生成 messageId 和 streamId
    const messageId = randomUUID();
    const streamId = randomUUID();

    // Task 1.1: 创建 AbortController 用于取消 generator
    const abortController = new AbortController();

    // Task 1.3: 设置 15 秒心跳间隔防止代理超时
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        // 写入失败说明连接已关闭，清理定时器
        clearInterval(heartbeatInterval);
      }
    }, 15000);

    // Task 1.4: 设置 10 分钟最大流超时
    const maxStreamTimeout = setTimeout(() => {
      logger.warn({ sessionId: activeSessionId, streamId }, 'Stream timeout after 10 minutes');
      abortController.abort();
    }, 10 * 60 * 1000);

    // Task 1.2: 检测客户端断开连接
    req.on('close', () => {
      logger.info({ sessionId: activeSessionId, streamId }, 'Client disconnected, aborting stream');
      abortController.abort();
    });

    // 异步处理流式消息生成
    try {
      // Task 1.6: 将 AbortSignal 传递给 chatService
      const generator = chatService.streamMessage(activeSessionId, messageId, streamId, content, abortController.signal);

      // 迭代 generator 并发送事件
      for await (const event of generator) {
        // 格式化为 SSE 事件
        const data = JSON.stringify(event);
        res.write(`data: ${data}\n\n`);

        // 如果是终止事件，跳出循环
        if (event.type === 'message_complete' || event.type === 'error_occurred') {
          break;
        }
      }
    } catch (streamError) {
      logger.error({ err: streamError, sessionId: activeSessionId }, 'SSE stream error');

      // 发送错误事件
      const errorMessage = streamError instanceof Error ? streamError.message : 'Stream error';
      const errorEvent = JSON.stringify({
        type: 'error_occurred',
        error: {
          code: StreamErrorCode.INTERNAL_ERROR,
          message: errorMessage,
          retryable: false,
        },
        timestamp: Date.now(),
      });
      res.write(`data: ${errorEvent}\n\n`);
    } finally {
      // Task 1.5: 清理资源
      clearInterval(heartbeatInterval);
      clearTimeout(maxStreamTimeout);
      // Task 2.6: 清理注册表条目
      inflightStreams.delete(activeSessionId);
      // 确保连接关闭
      res.end();
    }
  } catch (error) {
    // 对于早期错误（参数验证、session 不存在等），如果还没发送响应头，使用 next(error)
    if (!res.headersSent) {
      next(error);
    } else {
      // 如果已经发送了 SSE 响应头，发送错误事件并关闭
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorEvent = JSON.stringify({
        type: 'error_occurred',
        error: {
          code: StreamErrorCode.INTERNAL_ERROR,
          message: errorMessage,
          retryable: false,
        },
        timestamp: Date.now(),
      });
      res.write(`data: ${errorEvent}\n\n`);
      res.end();
    }
  }
});

/**
 * DELETE /api/chat/sessions/:id/messages/:messageId
 * Delete a specific message
 */
router.delete('/sessions/:id/messages/:messageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id as string;
    const messageId = req.params.messageId as string;

    // Check if message exists
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId));

    if (messages.length === 0) {
      throw new AppError(404, 'Message not found');
    }

    // Verify message belongs to this session
    if (messages[0].sessionId !== sessionId) {
      throw new AppError(403, 'Message does not belong to this session');
    }

    // Delete the message
    await db.delete(chatMessages)
      .where(eq(chatMessages.id, messageId));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/chat/sessions/:id/messages/:messageId/regenerate
 * Regenerate an assistant message
 */
router.post('/sessions/:id/messages/:messageId/regenerate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.params.id as string;
    const messageId = req.params.messageId as string;

    // Get the message to regenerate
    const messages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.id, messageId));

    if (messages.length === 0) {
      throw new AppError(404, 'Message not found');
    }

    const message = messages[0];

    // Verify it's an assistant message
    if (message.role !== 'assistant') {
      throw new AppError(400, 'Can only regenerate assistant messages');
    }

    // Verify message belongs to this session
    if (message.sessionId !== sessionId) {
      throw new AppError(403, 'Message does not belong to this session');
    }

    // Find the preceding user message
    const userMessages = await db.select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);

    // Find the user message before this assistant message
    let precedingUserMessage = null;
    for (let i = 0; i < userMessages.length; i++) {
      if (userMessages[i].timestamp < message.timestamp && userMessages[i].role === 'user') {
        precedingUserMessage = userMessages[i];
      }
      if (userMessages[i].id === messageId) {
        break;
      }
    }

    if (!precedingUserMessage) {
      throw new AppError(400, 'No user message found before this assistant message');
    }

    // Delete the assistant message
    await db.delete(chatMessages)
      .where(eq(chatMessages.id, messageId));

    // Return stream URL for the client to initiate streaming
    res.json({
      stream_url: `/api/chat/sessions/${sessionId}/stream?content=${encodeURIComponent(precedingUserMessage.content)}`,
      user_message_content: precedingUserMessage.content,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
