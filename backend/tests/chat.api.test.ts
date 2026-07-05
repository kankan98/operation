import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the AI provider so the non-streaming message endpoint does not make
// real API calls. Streaming is exercised separately (and verified manually).
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

import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { chatSessions, chatMessages, taskOverviews } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const app = createApp();

async function clean() {
  await db.delete(taskOverviews);
  await db.delete(chatMessages);
  await db.delete(chatSessions);
}

/** Create a session through the API and return its id. */
async function createSession(title?: string): Promise<string> {
  const res = await request(app).post('/api/chat/sessions').send(title ? { title } : {});
  return res.body.id;
}

describe('Chat API', () => {
  beforeEach(async () => {
    await clean();
    mockSendMessage.mockReset();
    mockStreamMessage.mockReset();
  });

  afterEach(async () => {
    await clean();
  });

  describe('Session CRUD', () => {
    it('POST /api/chat/sessions creates a session', async () => {
      const res = await request(app).post('/api/chat/sessions').send({}).expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.createdAt).toBeTypeOf('number');
    });

    it('POST /api/chat/sessions accepts a custom title', async () => {
      const res = await request(app)
        .post('/api/chat/sessions')
        .send({ title: 'Price research' })
        .expect(201);
      expect(res.body.title).toBe('Price research');
    });

    it('GET /api/chat/sessions lists sessions with message counts', async () => {
      await createSession('Session A');
      await createSession('Session B');

      const res = await request(app).get('/api/chat/sessions').expect(200);
      expect(Array.isArray(res.body.sessions)).toBe(true);
      expect(res.body.sessions.length).toBe(2);
      expect(res.body.sessions[0]).toHaveProperty('messageCount');
    });

    it('GET /api/chat/sessions/:id returns session details', async () => {
      const id = await createSession('Detail session');
      const res = await request(app).get(`/api/chat/sessions/${id}`).expect(200);
      expect(res.body.id).toBe(id);
      expect(res.body.title).toBe('Detail session');
      expect(res.body).toHaveProperty('messageCount');
    });

    it('GET /api/chat/sessions/:id returns 404 for unknown session', async () => {
      const res = await request(app).get('/api/chat/sessions/missing-id').expect(404);
      expect(res.body.error).toBeDefined();
    });

    it('PATCH /api/chat/sessions/:id updates the title', async () => {
      const id = await createSession('Old title');
      const res = await request(app)
        .patch(`/api/chat/sessions/${id}`)
        .send({ title: 'New title' })
        .expect(200);
      expect(res.body.title).toBe('New title');
      expect(res.body.updatedAt).toBeTypeOf('number');
    });

    it('PATCH /api/chat/sessions/:id updates pinned state, tags, and preview text', async () => {
      const id = await createSession('Session metadata');

      const res = await request(app)
        .patch(`/api/chat/sessions/${id}`)
        .send({
          isPinned: true,
          tags: ['pricing', 'watchlist'],
          lastMessagePreview: 'Competitor price dropped',
        })
        .expect(200);

      expect(res.body.isPinned).toBe(true);
      expect(JSON.parse(res.body.tags)).toEqual(['pricing', 'watchlist']);
      expect(res.body.lastMessagePreview).toBe('Competitor price dropped');
    });

    it('PATCH /api/chat/sessions/:id returns 404 for unknown session', async () => {
      await request(app).patch('/api/chat/sessions/missing').send({ title: 'x' }).expect(404);
    });

    it('DELETE /api/chat/sessions/:id removes the session and cascades messages', async () => {
      const id = await createSession('To delete');
      // Seed a message belonging to the session
      await db.insert(chatMessages).values({
        id: 'msg-cascade-1',
        sessionId: id,
        role: 'user',
        content: 'hello',
        toolCalls: null,
        toolResults: null,
        tokensUsed: null,
        timestamp: Date.now(),
      });
      await db.insert(taskOverviews).values({
        id: 'task-cascade-1',
        sessionId: id,
        taskName: 'Task cascade check',
        status: 'pending',
        startTime: Date.now(),
        endTime: null,
        relatedProducts: null,
        platform: null,
        metadata: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await request(app).delete(`/api/chat/sessions/${id}`).expect(204);

      const remainingSessions = await db
        .select()
        .from(chatSessions)
        .where(eq(chatSessions.id, id));
      const remainingMessages = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.sessionId, id));
      const remainingTasks = await db
        .select()
        .from(taskOverviews)
        .where(eq(taskOverviews.sessionId, id));
      expect(remainingSessions).toHaveLength(0);
      expect(remainingMessages).toHaveLength(0);
      expect(remainingTasks).toHaveLength(0);
    });

    it('DELETE /api/chat/sessions/:id returns 404 for unknown session', async () => {
      await request(app).delete('/api/chat/sessions/missing').expect(404);
    });
  });

  describe('Messages', () => {
    it('POST /api/chat/sessions/:id/messages (non-streaming) returns an assistant reply', async () => {
      const id = await createSession();
      mockSendMessage.mockResolvedValue({
        content: 'Here is your answer.',
        usage: { inputTokens: 10, outputTokens: 5 },
        stopReason: 'end_turn',
      });

      const res = await request(app)
        .post(`/api/chat/sessions/${id}/messages`)
        .send({ content: 'How many products do I track?' })
        .expect(200);

      expect(res.body.role).toBe('assistant');
      expect(res.body.content).toBe('Here is your answer.');
      // The provider is invoked to produce the reply (and may also be invoked
      // again for async title generation), so assert "called" rather than exact count.
      expect(mockSendMessage).toHaveBeenCalled();
    });

    it('POST /api/chat/sessions/:id/messages rejects empty content', async () => {
      const id = await createSession();
      const res = await request(app)
        .post(`/api/chat/sessions/${id}/messages`)
        .send({ content: '   ' })
        .expect(400);
      expect(res.body.error).toBeDefined();
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('GET /api/chat/sessions/:id/messages returns messages in chronological order', async () => {
      const id = await createSession();
      const now = Date.now();
      await db.insert(chatMessages).values([
        {
          id: 'm1',
          sessionId: id,
          role: 'user',
          content: 'first',
          toolCalls: null,
          toolResults: null,
          tokensUsed: null,
          timestamp: now,
        },
        {
          id: 'm2',
          sessionId: id,
          role: 'assistant',
          content: 'second',
          toolCalls: null,
          toolResults: null,
          tokensUsed: 12,
          timestamp: now + 1,
        },
      ]);

      const res = await request(app).get(`/api/chat/sessions/${id}/messages`).expect(200);
      expect(res.body.messages).toHaveLength(2);
      expect(res.body.messages[0].content).toBe('first');
      expect(res.body.messages[1].content).toBe('second');
    });

    it('GET /api/chat/sessions/:id/messages returns 404 for unknown session', async () => {
      await request(app).get('/api/chat/sessions/missing/messages').expect(404);
    });

    it('GET /api/chat/sessions/:id/messages 透传消息 parts', async () => {
      const id = await createSession();
      await db.insert(chatMessages).values({
        id: 'm-parts',
        sessionId: id,
        role: 'assistant',
        content: 'ab',
        toolCalls: null,
        toolResults: null,
        parts: JSON.stringify([
          { type: 'text', id: 'b1', content: 'a' },
          { type: 'tool', id: 't1', name: 'searchProducts', input: {}, result: { ok: 1 }, isError: false },
          { type: 'text', id: 'b2', content: 'b' },
        ]),
        tokensUsed: null,
        timestamp: Date.now(),
      });

      const res = await request(app).get(`/api/chat/sessions/${id}/messages`).expect(200);
      expect(res.body.messages[0].parts.map((p: { type: string }) => p.type)).toEqual(['text', 'tool', 'text']);
    });
  });

  describe('Streaming endpoint (validation)', () => {
    // Full SSE streaming is verified manually (see tasks 15.x). Here we cover
    // the synchronous validation paths that return before the stream opens.
    it('GET /sessions/:id/stream requires content', async () => {
      const id = await createSession();
      await request(app).get(`/api/chat/sessions/${id}/stream`).expect(400);
    });

    it('GET /sessions/:id/stream returns 404 for unknown session', async () => {
      await request(app)
        .get('/api/chat/sessions/missing/stream?content=hello')
        .expect(404);
    });

    it('GET /sessions/new/stream creates a session titled from the first user message', async () => {
      async function* streamReply() {
        yield {
          type: 'text',
          text: 'Brief answer.',
        };
        yield {
          type: 'usage',
          usage: { inputTokens: 1, outputTokens: 1 },
        };
      }

      mockStreamMessage.mockReturnValue(streamReply());

      const content = '你可以干什么？请简短回答。';
      const res = await request(app)
        .get(`/api/chat/sessions/new/stream?content=${encodeURIComponent(content)}`)
        .expect(200);

      const startLine = res.text
        .split('\n')
        .find((line) => line.startsWith('data: ') && line.includes('"type":"message_start"'));
      expect(startLine).toBeDefined();

      const startEvent = JSON.parse(startLine!.slice('data: '.length));
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, startEvent.sessionId),
      });
      expect(session?.title).toBe('你可以干什么？请简短回答。');
    });
  });
});
