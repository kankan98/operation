import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { randomUUID } from 'crypto';
import { db } from '../src/db';
import { chatMessages, chatSessions, taskOverviews } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import * as taskService from '../src/services/taskService';

async function clean() {
  await db.delete(taskOverviews);
  await db.delete(chatMessages);
  await db.delete(chatSessions);
}

async function seedSession(title = 'Task test session'): Promise<string> {
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

function wait(ms = 2) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('TaskService', () => {
  beforeEach(async () => {
    await clean();
  });

  afterEach(async () => {
    await clean();
  });

  it('creates a task with defaults and rehydrates JSON fields', async () => {
    const sessionId = await seedSession();

    const task = await taskService.createTask({
      sessionId,
      taskName: 'Analyze B0TESTASIN price trend',
      relatedProducts: ['B0TESTASIN'],
      platform: 'amazon',
      metadata: { priority: 'high', progress: 25 },
    });

    expect(task.id).toBeDefined();
    expect(task.status).toBe('pending');
    expect(task.endTime).toBeUndefined();
    expect(task.relatedProducts).toEqual(['B0TESTASIN']);
    expect(task.metadata).toEqual({ priority: 'high', progress: 25 });

    const stored = await taskService.getTaskById(task.id);
    expect(stored?.relatedProducts).toEqual(['B0TESTASIN']);
    expect(stored?.platform).toBe('amazon');
    expect(stored?.metadata).toEqual({ priority: 'high', progress: 25 });
  });

  it('queries tasks by session with filtering, pagination, and totals', async () => {
    const sessionId = await seedSession();
    const otherSessionId = await seedSession('Other session');

    await taskService.createTask({
      sessionId,
      taskName: 'Older pending task',
      status: 'pending',
    });
    await wait();
    const inProgress = await taskService.createTask({
      sessionId,
      taskName: 'Newest running task',
      status: 'in_progress',
    });
    await taskService.createTask({
      sessionId: otherSessionId,
      taskName: 'Other session task',
    });

    const all = await taskService.getTasksBySession({ sessionId, limit: 10, offset: 0 });
    expect(all.total).toBe(2);
    expect(all.tasks.map((task) => task.taskName)).toEqual([
      'Newest running task',
      'Older pending task',
    ]);

    const filtered = await taskService.getTasksBySession({
      sessionId,
      status: 'in_progress',
      limit: 1,
      offset: 0,
    });
    expect(filtered.total).toBe(1);
    expect(filtered.tasks[0].id).toBe(inProgress.id);

    const paged = await taskService.getTasksBySession({ sessionId, limit: 1, offset: 1 });
    expect(paged.tasks).toHaveLength(1);
    expect(paged.tasks[0].taskName).toBe('Older pending task');
  });

  it('updates status, sets endTime for terminal states, and merges metadata', async () => {
    const sessionId = await seedSession();
    const task = await taskService.createTask({
      sessionId,
      taskName: 'Monitor competitor alerts',
      metadata: { retryCount: 0 },
    });

    const completed = await taskService.updateTask(task.id, {
      status: 'completed',
      metadata: { result: 'ok' },
    });

    expect(completed?.status).toBe('completed');
    expect(completed?.endTime).toBeTypeOf('number');
    expect(completed?.metadata).toEqual({ retryCount: 0, result: 'ok' });
    expect(completed?.updatedAt).toBeGreaterThanOrEqual(task.updatedAt);
  });

  it('returns null or false for missing tasks', async () => {
    await expect(taskService.getTaskById('missing')).resolves.toBeNull();
    await expect(taskService.updateTask('missing', { status: 'failed' })).resolves.toBeNull();
    await expect(taskService.deleteTask('missing')).resolves.toBe(false);
  });

  it('handles duplicate terminal updates without creating conflicting rows', async () => {
    const sessionId = await seedSession();
    const task = await taskService.createTask({
      sessionId,
      taskName: 'Concurrent completion task',
      status: 'in_progress',
    });

    const [first, second] = await Promise.all([
      taskService.updateTask(task.id, { status: 'completed' }),
      taskService.updateTask(task.id, { status: 'completed' }),
    ]);

    expect(first?.status).toBe('completed');
    expect(second?.status).toBe('completed');

    const tasks = await taskService.getTasksBySession({ sessionId });
    expect(tasks.total).toBe(1);
    expect(tasks.tasks[0].endTime).toBeTypeOf('number');
  });

  it('deletes tasks when their parent session is deleted', async () => {
    const sessionId = await seedSession();
    await taskService.createTask({
      sessionId,
      taskName: 'Cascade task',
    });

    await db.delete(chatSessions).where(eq(chatSessions.id, sessionId));

    const tasks = await db
      .select()
      .from(taskOverviews)
      .where(eq(taskOverviews.sessionId, sessionId));
    expect(tasks).toHaveLength(0);
  });
});
