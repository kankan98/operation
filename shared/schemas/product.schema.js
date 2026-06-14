"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProductSchema = exports.productResponseSchema = exports.createProductSchema = exports.monitorTypeEnum = exports.platformEnum = void 0;
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
// Platform enum
exports.platformEnum = zod_1.z.enum(['amazon', 'walmart', 'aliexpress', 'ebay', 'other']);
// Monitor type enum
exports.monitorTypeEnum = zod_1.z.enum(['manual', 'scheduled']);
// Create Product Schema (for POST requests)
exports.createProductSchema = zod_1.z.object({
    platform: exports.platformEnum,
    productUrl: zod_1.z.string().url('Invalid product URL'),
    asin: zod_1.z.string().min(1, 'ASIN is required').max(50, 'ASIN must be at most 50 characters'),
    title: zod_1.z.string().min(1, 'Title is required').max(500, 'Title must be at most 500 characters'),
    brand: zod_1.z.string().max(100, 'Brand must be at most 100 characters').optional(),
    category: zod_1.z.string().max(100, 'Category must be at most 100 characters').optional(),
    imageUrl: zod_1.z.string().url('Invalid image URL').optional(),
    currentPrice: zod_1.z.number().positive('Price must be positive').optional(),
    currency: zod_1.z.string().length(3, 'Currency must be 3 characters (e.g., USD)').default('USD'),
    isMonitoring: zod_1.z.boolean().default(false),
    monitorType: exports.monitorTypeEnum.optional(),
    checkInterval: zod_1.z.number().int().min(1, 'Check interval must be at least 1 hour').max(168, 'Check interval must be at most 168 hours (1 week)').default(24),
    userId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Product Response Schema (for GET responses)
exports.productResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    platform: exports.platformEnum,
    productUrl: zod_1.z.string(),
    asin: zod_1.z.string(),
    title: zod_1.z.string(),
    brand: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().optional(),
    currentPrice: zod_1.z.number().nullable(),
    currency: zod_1.z.string(),
    isMonitoring: zod_1.z.boolean(),
    monitorType: zod_1.z.string().nullable(),
    checkInterval: zod_1.z.number(),
    userId: zod_1.z.string().nullable(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number().optional(),
    lastCheckedAt: zod_1.z.number().nullable(),
    metadata: zod_1.z.string().nullable(),
});
// Update Product Schema (for PATCH requests)
exports.updateProductSchema = exports.createProductSchema.partial();
