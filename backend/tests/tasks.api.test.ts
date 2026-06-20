import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { db } from '../src/db';
import { chatMessages, chatSessions, taskOverviews } from '../src/db/schema';
import { randomUUID } from 'crypto';

const app = createApp();

async function clean() {
  await db.delete(taskOverviews);
  await db.delete(chatMessages);
  await db.delete(chatSessions);
}

async function createSession(title = 'API task session'): Promise<string> {
  const id = randomUUID();
  await db.insert(chatSessions).values({
    id,
    title,
    userId: null,
    contextSummary: null,
    createdAt: Date.now(),
    updatedAt: null,
  });
  return id;
}

async function createTask(sessionId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/tasks')
    .send({
      sessionId,
      taskName: 'Check listing health',
      ...overrides,
    })
    .expect(201);
  return res.body;
}

describe('Tasks API', () => {
  beforeEach(async () => {
    await clean();
  });

  afterEach(async () => {
    await clean();
  });

  it('POST /api/tasks creates a task for an existing session', async () => {
    const sessionId = await createSession();

    const res = await request(app)
      .post('/api/tasks')
      .send({
        sessionId,
        taskName: 'Research competitor prices',
        status: 'in_progress',
        relatedProducts: ['B0API12345'],
        platform: 'amazon',
        metadata: { progress: 10 },
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.status).toBe('in_progress');
    expect(res.body.relatedProducts).toEqual(['B0API12345']);
    expect(res.body.metadata).toEqual({ progress: 10 });
  });

  it('GET /api/tasks/:sessionId returns filtered and paginated tasks', async () => {
    const sessionId = await createSession();
    await createTask(sessionId, { taskName: 'Pending task', status: 'pending' });
    const running = await createTask(sessionId, {
      taskName: 'Running task',
      status: 'in_progress',
    });

    const res = await request(app)
      .get(`/api/tasks/${sessionId}`)
      .query({ status: 'in_progress', limit: '1', offset: '0' })
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.limit).toBe(1);
    expect(res.body.offset).toBe(0);
    expect(res.body.tasks).toHaveLength(1);
    expect(res.body.tasks[0].id).toBe(running.id);
  });

  it('GET /api/tasks/:sessionId returns an empty list for a session with no tasks', async () => {
    const sessionId = await createSession();

    const res = await request(app).get(`/api/tasks/${sessionId}`).expect(200);

    expect(res.body.tasks).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('PATCH /api/tasks/:id updates status and sets endTime for completed tasks', async () => {
    const sessionId = await createSession();
    const task = await createTask(sessionId, { status: 'in_progress' });

    const res = await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'completed', metadata: { result: 'done' } })
      .expect(200);

    expect(res.body.status).toBe('completed');
    expect(res.body.endTime).toBeTypeOf('number');
    expect(res.body.metadata).toEqual({ result: 'done' });
  });

  it('returns validation errors for malformed task requests', async () => {
    const sessionId = await createSession();

    await request(app)
      .post('/api/tasks')
      .send({ sessionId, taskName: '' })
      .expect(400);

    await request(app)
      .post('/api/tasks')
      .send({ sessionId, taskName: 'Bad platform', platform: 'etsy' })
      .expect(400);

    const task = await createTask(sessionId);
    await request(app)
      .patch(`/api/tasks/${task.id}`)
      .send({ status: 'done' })
      .expect(400);
  });

  it('returns 404 for missing sessions and tasks', async () => {
    await request(app)
      .post('/api/tasks')
      .send({ sessionId: 'missing-session', taskName: 'Cannot attach' })
      .expect(404);

    await request(app).get('/api/tasks/missing-session').expect(404);

    await request(app)
      .patch('/api/tasks/missing-task')
      .send({ status: 'failed' })
      .expect(404);
  });

  it('returns 400 for invalid list query parameters', async () => {
    const sessionId = await createSession();

    await request(app)
      .get(`/api/tasks/${sessionId}`)
      .query({ status: 'done' })
      .expect(400);

    await request(app)
      .get(`/api/tasks/${sessionId}`)
      .query({ limit: '500' })
      .expect(400);
  });
});
