import { z } from 'zod';

// Extend Zod with OpenAPI if available (backend only)
try {
  // @ts-ignore - optional dependency
  const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
  extendZodWithOpenApi(z);
} catch (e) {
  // Frontend environment or OpenAPI not installed - that's fine
}

// Platform enum
export const platformEnum = z.enum(['amazon', 'walmart', 'aliexpress', 'ebay', 'other']);

// Monitor type enum
export const monitorTypeEnum = z.enum(['manual', 'scheduled']);

// Create Product Schema (for POST requests)
export const createProductSchema = z.object({
  platform: platformEnum,
  productUrl: z.string().url('Invalid product URL'),
  asin: z.string().min(1, 'ASIN is required').max(50, 'ASIN must be at most 50 characters'),
  title: z.string().min(1, 'Title is required').max(500, 'Title must be at most 500 characters'),
  brand: z.string().max(100, 'Brand must be at most 100 characters').optional(),
  category: z.string().max(100, 'Category must be at most 100 characters').optional(),
  imageUrl: z.string().url('Invalid image URL').optional(),
  currentPrice: z.number().positive('Price must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., USD)').default('USD'),
  isMonitoring: z.boolean().default(false),
  monitorType: monitorTypeEnum.optional(),
  checkInterval: z.number().int().min(1, 'Check interval must be at least 1 hour').max(168, 'Check interval must be at most 168 hours (1 week)').default(24),
  userId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Product Response Schema (for GET responses)
export const productResponseSchema = z.object({
  id: z.string(),
  platform: platformEnum,
  productUrl: z.string(),
  asin: z.string(),
  title: z.string(),
  brand: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  currentPrice: z.number().nullable(),
  currency: z.string(),
  isMonitoring: z.boolean(),
  monitorType: z.string().nullable(),
  checkInterval: z.number(),
  userId: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number().nullable().optional(),
  lastCheckedAt: z.number().nullable(),
  metadata: z.string().nullable(),
});

// Update Product Schema (for PATCH requests)
export const updateProductSchema = createProductSchema.partial();

// Export TypeScript types
export type Platform = z.infer<typeof platformEnum>;
export type MonitorType = z.infer<typeof monitorTypeEnum>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type Product = z.infer<typeof productResponseSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
