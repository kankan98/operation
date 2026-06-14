import { z } from 'zod';

// Extend Zod with OpenAPI if available (backend only)
try {
  // @ts-ignore - optional dependency
  const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
  extendZodWithOpenApi(z);
} catch (e) {
  // Frontend environment or OpenAPI not installed - that's fine
}

// Create Chat Session Schema
export const createChatSessionSchema = z.object({
  title: z.string().optional(),
  userId: z.string().optional(),
});

// Chat Session Response Schema
export const chatSessionResponseSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  userId: z.string().nullable(),
  messageCount: z.number().optional(),
  contextSummary: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number().nullable(),
});

// Update Chat Session Schema
export const updateChatSessionSchema = z.object({
  title: z.string().optional(),
});

// Chat Message Response Schema
export const chatMessageResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  toolCalls: z.any().optional(),
  toolResults: z.any().optional(),
  tokensUsed: z.number().nullable(),
  timestamp: z.number(),
});

// Send Message Schema
export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Content is required'),
});

// Export types
export type CreateChatSession = z.infer<typeof createChatSessionSchema>;
export type ChatSession = z.infer<typeof chatSessionResponseSchema>;
export type UpdateChatSession = z.infer<typeof updateChatSessionSchema>;
export type ChatMessage = z.infer<typeof chatMessageResponseSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;
