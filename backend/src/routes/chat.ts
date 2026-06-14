import { Router, Request, Response, NextFunction } from 'express';
import { createSession } from 'better-sse';
import { ChatService } from '../services/chatService';
import { db } from '../db';
import { chatSessions, chatMessages } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const chatService = new ChatService();

// POST /api/chat/sessions - Create new session
router.post('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, userId } = req.body;

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
      title,
      userId,
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

    // Get message counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session) => {
        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.sessionId, session.id));

        return {
          id: session.id,
          title: session.title,
          userId: session.userId,
          messageCount: messages.length,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
        };
      })
    );

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
    const { id } = req.params;

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

// PATCH /api/chat/sessions/:id - Update session
router.patch('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, id));

    if (sessions.length === 0) {
      throw new AppError(404, 'Session not found');
    }

    await db
      .update(chatSessions)
      .set({
        title: title || null,
        updatedAt: Date.now(),
      })
      .where(eq(chatSessions.id, id));

    const updated = await db.select().from(chatSessions).where(eq(chatSessions.id, id));

    res.json(updated[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/chat/sessions/:id - Delete session
router.delete('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

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
    const { id } = req.params;
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
      toolCalls: msg.toolCalls ? JSON.parse(msg.toolCalls) : undefined,
      toolResults: msg.toolResults ? JSON.parse(msg.toolResults) : undefined,
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
    const { id } = req.params;
    const { content, stream = false } = req.body;

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

// GET /api/chat/sessions/:id/stream - SSE streaming endpoint (EventSource compatible)
router.get('/sessions/:id/stream', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { content } = req.query;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError(400, 'Content query parameter is required');
    }

    // Verify session exists
    const sessions = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    if (sessions.length === 0) {
      throw new AppError(404, 'Session not found');
    }

    // Create better-sse session
    const session = await createSession(req, res, {
      keepAlive: 15000, // 15 seconds keepalive
    });

    try {
      // Send start event
      await session.push({ type: 'start' }, 'message');

      // Stream AI response
      const generator = chatService.streamMessage(id, content);
      let result = await generator.next();

      while (!result.done && session.isConnected) {
        await session.push(result.value, 'message');
        result = await generator.next();
      }

      // Send done event
      await session.push({ type: 'done' }, 'message');
    } catch (streamError) {
      console.error('[Stream Error]:', streamError);
      await session.push(
        {
          type: 'error',
          error: streamError instanceof Error ? streamError.message : 'Stream error',
        },
        'error'
      );
    }
    // Note: better-sse session closes automatically when response ends
    // No need to call session.close()
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
    const { id: sessionId, messageId } = req.params;

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
    const { id: sessionId, messageId } = req.params;

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
