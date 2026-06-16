/**
 * Task Management Service
 * Chat UI Redesign v2
 */

import { nanoid } from 'nanoid';
import { db } from '../db/index.js';
import { taskOverviews } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import type {
  TaskOverview,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskListResponse,
  TaskListQuery,
} from '../types/chat.js';

/**
 * 获取会话的任务列表
 */
export async function getTasksBySession(query: TaskListQuery): Promise<TaskListResponse> {
  const { sessionId, limit = 50, offset = 0, status } = query;

  // 构建查询条件
  const conditions = [eq(taskOverviews.sessionId, sessionId)];
  if (status) {
    conditions.push(eq(taskOverviews.status, status));
  }

  // 查询任务列表
  const tasks = await db
    .select()
    .from(taskOverviews)
    .where(and(...conditions))
    .orderBy(desc(taskOverviews.createdAt))
    .limit(limit)
    .offset(offset);

  // 查询总数
  const [{ count }] = await db
    .select({ count: taskOverviews.id })
    .from(taskOverviews)
    .where(and(...conditions));

  // 转换数据格式
  const formattedTasks: TaskOverview[] = tasks.map((task) => ({
    id: task.id,
    sessionId: task.sessionId,
    taskName: task.taskName,
    status: task.status as TaskOverview['status'],
    startTime: task.startTime,
    endTime: task.endTime ?? undefined,
    relatedProducts: task.relatedProducts ? JSON.parse(task.relatedProducts) : undefined,
    platform: task.platform as TaskOverview['platform'] | undefined,
    metadata: task.metadata ? JSON.parse(task.metadata) : undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  }));

  return {
    tasks: formattedTasks,
    total: typeof count === 'number' ? count : 0,
    limit,
    offset,
  };
}

/**
 * 根据ID获取单个任务
 */
export async function getTaskById(taskId: string): Promise<TaskOverview | null> {
  const [task] = await db.select().from(taskOverviews).where(eq(taskOverviews.id, taskId));

  if (!task) {
    return null;
  }

  return {
    id: task.id,
    sessionId: task.sessionId,
    taskName: task.taskName,
    status: task.status as TaskOverview['status'],
    startTime: task.startTime,
    endTime: task.endTime ?? undefined,
    relatedProducts: task.relatedProducts ? JSON.parse(task.relatedProducts) : undefined,
    platform: task.platform as TaskOverview['platform'] | undefined,
    metadata: task.metadata ? JSON.parse(task.metadata) : undefined,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

/**
 * 创建新任务
 */
export async function createTask(request: CreateTaskRequest): Promise<TaskOverview> {
  const now = Date.now();
  const taskId = nanoid();

  const newTask = {
    id: taskId,
    sessionId: request.sessionId,
    taskName: request.taskName,
    status: request.status || 'pending',
    startTime: request.startTime || now,
    endTime: null,
    relatedProducts: request.relatedProducts ? JSON.stringify(request.relatedProducts) : null,
    platform: request.platform || null,
    metadata: request.metadata ? JSON.stringify(request.metadata) : null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(taskOverviews).values(newTask);

  return {
    id: newTask.id,
    sessionId: newTask.sessionId,
    taskName: newTask.taskName,
    status: newTask.status as TaskOverview['status'],
    startTime: newTask.startTime,
    endTime: undefined,
    relatedProducts: request.relatedProducts,
    platform: request.platform,
    metadata: request.metadata,
    createdAt: newTask.createdAt,
    updatedAt: newTask.updatedAt,
  };
}

/**
 * 更新任务
 */
export async function updateTask(
  taskId: string,
  request: UpdateTaskRequest
): Promise<TaskOverview | null> {
  const now = Date.now();

  // 构建更新数据
  const updateData: Record<string, unknown> = {
    updatedAt: now,
  };

  if (request.status !== undefined) {
    updateData.status = request.status;
    // 如果状态变为完成或失败，自动设置结束时间
    if ((request.status === 'completed' || request.status === 'failed') && !request.endTime) {
      updateData.endTime = now;
    }
  }

  if (request.endTime !== undefined) {
    updateData.endTime = request.endTime;
  }

  if (request.taskName !== undefined) {
    updateData.taskName = request.taskName;
  }

  if (request.relatedProducts !== undefined) {
    updateData.relatedProducts = JSON.stringify(request.relatedProducts);
  }

  if (request.platform !== undefined) {
    updateData.platform = request.platform;
  }

  if (request.metadata !== undefined) {
    // 合并元数据
    const existingTask = await getTaskById(taskId);
    if (existingTask && existingTask.metadata) {
      updateData.metadata = JSON.stringify({
        ...existingTask.metadata,
        ...request.metadata,
      });
    } else {
      updateData.metadata = JSON.stringify(request.metadata);
    }
  }

  // 执行更新
  await db.update(taskOverviews).set(updateData).where(eq(taskOverviews.id, taskId));

  // 返回更新后的任务
  return getTaskById(taskId);
}

/**
 * 删除任务
 */
export async function deleteTask(taskId: string): Promise<boolean> {
  const result = await db.delete(taskOverviews).where(eq(taskOverviews.id, taskId));
  return result.changes > 0;
}

/**
 * 删除会话的所有任务（级联删除会自动处理，此函数作为备用）
 */
export async function deleteTasksBySession(sessionId: string): Promise<number> {
  const result = await db.delete(taskOverviews).where(eq(taskOverviews.sessionId, sessionId));
  return result.changes;
}
