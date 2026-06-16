/**
 * Chat Management Zod Schemas
 * Chat UI Redesign v2
 */

import { z } from 'zod';

/**
 * 更新会话请求 Schema
 */
export const UpdateSessionRequestSchema = z.object({
  isPinned: z.boolean().optional(),
  title: z.string().max(200, 'Title must be less than 200 characters').optional(),
  tags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  lastMessagePreview: z
    .string()
    .max(100, 'Preview must be less than 100 characters')
    .optional(),
});

/**
 * 发送消息请求 Schema
 */
export const SendMessageRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  content: z.string().min(1, 'Message content cannot be empty'),
});

/**
 * 创建会话请求 Schema
 */
export const CreateSessionRequestSchema = z.object({
  title: z.string().max(200).optional(),
  userId: z.string().optional(),
});

/**
 * 类型导出
 */
export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>;
export type SendMessageRequest = z.infer<typeof SendMessageRequestSchema>;
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;
