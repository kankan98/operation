/**
 * Task Management Zod Schemas
 * Chat UI Redesign v2
 */

import { z } from 'zod';

/**
 * 任务状态枚举
 */
export const TaskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'completed',
  'failed',
  'cancelled',
]);

/**
 * 平台标识枚举
 */
export const PlatformSchema = z.enum(['amazon', 'shopify', 'ebay', 'walmart']);

/**
 * 任务概览 Schema
 */
export const TaskOverviewSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  taskName: z.string().min(1).max(200),
  status: TaskStatusSchema,
  startTime: z.number().int().positive(),
  endTime: z.number().int().positive().optional(),
  relatedProducts: z.array(z.string()).optional(),
  platform: PlatformSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

/**
 * 创建任务请求 Schema
 */
export const CreateTaskRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  taskName: z.string().min(1, 'Task name cannot be empty').max(200, 'Task name too long'),
  status: TaskStatusSchema.optional().default('pending'),
  startTime: z.number().int().positive().optional(),
  relatedProducts: z.array(z.string()).optional(),
  platform: PlatformSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * 更新任务请求 Schema
 */
export const UpdateTaskRequestSchema = z.object({
  status: TaskStatusSchema.optional(),
  endTime: z.number().int().positive().optional(),
  taskName: z.string().min(1).max(200).optional(),
  relatedProducts: z.array(z.string()).optional(),
  platform: PlatformSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * 任务列表响应 Schema
 */
export const TaskListResponseSchema = z.object({
  tasks: z.array(TaskOverviewSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});

/**
 * 任务列表查询参数 Schema
 */
export const TaskListQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .pipe(z.number().int().min(0)),
  status: TaskStatusSchema.optional(),
});

/**
 * 类型导出
 */
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Platform = z.infer<typeof PlatformSchema>;
export type TaskOverview = z.infer<typeof TaskOverviewSchema>;
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
export type TaskListResponse = z.infer<typeof TaskListResponseSchema>;
export type TaskListQuery = z.infer<typeof TaskListQuerySchema>;
