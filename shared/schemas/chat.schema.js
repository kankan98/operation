"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.chatMessageResponseSchema = exports.updateChatSessionSchema = exports.chatSessionResponseSchema = exports.createChatSessionSchema = void 0;
const zod_1 = require("zod");
// Extend Zod with OpenAPI if available (backend only)
try {
    // @ts-ignore - optional dependency
    const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
    extendZodWithOpenApi(zod_1.z);
}
catch (e) {
    // Frontend environment or OpenAPI not installed - that's fine
}
// Create Chat Session Schema
exports.createChatSessionSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
});
// Chat Session Response Schema
exports.chatSessionResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string().nullable(),
    userId: zod_1.z.string().nullable(),
    messageCount: zod_1.z.number().optional(),
    contextSummary: zod_1.z.string().nullable().optional(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number().nullable(),
});
// Update Chat Session Schema
exports.updateChatSessionSchema = zod_1.z.object({
    title: zod_1.z.string().optional(),
});
// Chat Message Response Schema
exports.chatMessageResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    sessionId: zod_1.z.string(),
    role: zod_1.z.enum(['user', 'assistant']),
    content: zod_1.z.string(),
    toolCalls: zod_1.z.any().optional(),
    toolResults: zod_1.z.any().optional(),
    tokensUsed: zod_1.z.number().nullable(),
    timestamp: zod_1.z.number(),
});
// Send Message Schema
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, 'Content is required'),
});
