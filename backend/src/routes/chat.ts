import { Router, Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chatService';
import { db } from '../db';
import { chatSessions, chatMessages } from '../db/schema';
import { eq, desc, sql, count } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';
import { streamManager } from '../services/streamManager';
import { StartStreamRequest, StreamErrorCode } from '../../../shared/types/sse-protocol';
import { logger } from '../utils/logger';

const router = Router();
const chatService = new ChatService();

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
 * POST /api/chat/stream - 创建流式会话（两步流式模式 - 步骤 1）
 *
 * 接受用户消息，创建或使用现有 session，生成 streamId 和 messageId
 * 返回 202 Accepted 和流式会话元数据
 */
router.post('/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, content } = req.body as StartStreamRequest;

    // 验证 content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError(400, 'Content is required');
    }

    // 如果没有 sessionId，自动创建新 session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
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

    // 创建 stream
    const { streamId, messageId } = streamManager.create(
      activeSessionId,
      content,
      (sessionId, msgId, strmId, cnt) => chatService.streamMessage(sessionId, msgId, strmId, cnt)
    );

    // 返回 202 Accepted
    res.status(202).json({
      streamId,
      messageId,
      sessionId: activeSessionId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/chat/streams/:streamId - 建立 SSE 连接（两步流式模式 - 步骤 2）
 *
 * 使用 streamId 建立 Server-Sent Events 连接，接收流式事件
 */
router.get('/streams/:streamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streamId = req.params.streamId as string;

    // 获取 generator
    const generator = streamManager.get(streamId);
    if (!generator) {
      throw new AppError(404, 'Stream not found or expired');
    }

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    // 发送初始心跳
    res.write(': heartbeat\n\n');

    // 设置心跳定时器（每 15 秒）
    const heartbeatInterval = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    try {
      // 迭代 generator 并发送事件
      for await (const event of generator) {
        // 格式化为 SSE 事件
        const data = JSON.stringify(event);
        res.write(`event: message\n`);
        res.write(`data: ${data}\n\n`);

        // 如果是终止事件，跳出循环
        if (event.type === 'message_complete' || event.type === 'error_occurred') {
          break;
        }
      }
    } catch (streamError) {
      logger.error({ err: streamError }, 'SSE stream error');

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
      res.write(`event: message\n`);
      res.write(`data: ${errorEvent}\n\n`);
    } finally {
      // 清理
      clearInterval(heartbeatInterval);
      streamManager.delete(streamId);
      res.end();
    }
  } catch (error) {
    next(error);
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
