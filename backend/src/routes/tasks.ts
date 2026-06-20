/**
 * Task Management Routes
 * Chat UI Redesign
 */

import { Router } from 'express';
import * as taskService from '../services/taskService.js';
import { db } from '../db/index.js';
import { chatSessions } from '../db/schema.js';
import {
  CreateTaskRequestSchema,
  UpdateTaskRequestSchema,
  TaskListQuerySchema,
} from '../schemas/task.schema.js';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/tasks/:sessionId
 * 获取会话的任务列表
 */
router.get('/:sessionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.params.sessionId as string;
    const query = req.query as Record<string, string>;

    // TaskListQuerySchema 会自动转换 limit 和 offset
    const validatedQuery = TaskListQuerySchema.parse(query);

    const [session] = await db
      .select({ id: chatSessions.id })
      .from(chatSessions)
      .where(eq(chatSessions.id, sessionId));

    if (!session) {
      res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
      });
      return;
    }

    const result = await taskService.getTasksBySession({
      sessionId,
      ...validatedQuery,
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch tasks');

    if (error && typeof error === 'object' && 'issues' in error) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        message: 'Failed to fetch tasks',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

/**
 * POST /api/tasks
 * 创建新任务
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // 验证请求体
    const taskData = CreateTaskRequestSchema.parse(req.body);

    const newTask = await taskService.createTask(taskData);

    res.status(201).json(newTask);
  } catch (error) {
    logger.error({ err: error }, 'Failed to create task');

    // 检查是否是Zod验证错误
    if (error && typeof error === 'object' && 'issues' in error) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error,
        },
      });
      return;
    }

    // 检查是否是外键约束错误（会话不存在）
    if (error instanceof Error && error.message.includes('FOREIGN KEY')) {
      res.status(404).json({
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        message: 'Failed to create task',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

/**
 * PATCH /api/tasks/:id
 * 更新任务状态
 */
router.patch('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // 验证请求体
    const updateData = UpdateTaskRequestSchema.parse(req.body);

    const updatedTask = await taskService.updateTask(id, updateData);

    if (!updatedTask) {
      res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND',
        },
      });
      return;
    }

    res.json(updatedTask);
  } catch (error) {
    logger.error({ err: error }, 'Failed to update task');

    // 检查是否是Zod验证错误
    if (error && typeof error === 'object' && 'issues' in error) {
      res.status(400).json({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        message: 'Failed to update task',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * 删除任务（可选功能）
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const deleted = await taskService.deleteTask(id);

    if (!deleted) {
      res.status(404).json({
        error: {
          message: 'Task not found',
          code: 'TASK_NOT_FOUND',
        },
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logger.error({ err: error }, 'Failed to delete task');
    res.status(500).json({
      error: {
        message: 'Failed to delete task',
        code: 'INTERNAL_ERROR',
      },
    });
  }
});

export default router;
