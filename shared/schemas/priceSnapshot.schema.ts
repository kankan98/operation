import { z } from 'zod';

// Extend Zod with OpenAPI if available (backend only)
try {
  // @ts-ignore - optional dependency
  const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
  extendZodWithOpenApi(z);
} catch (e) {
  // Frontend environment or OpenAPI not installed - that's fine
}

// Availability enum
export const availabilityEnum = z.enum(['in_stock', 'low_stock', 'out_of_stock']);

// 数据来源（provenance）枚举：每条快照都必须标清它从哪来，
// 以便下游区分"用户手填""按需抓取""缓存""官方/第三方数据源"，绝不把假设当事实
export const priceSnapshotSourceEnum = z.enum([
  'manual',
  'browser',
  'cache',
  'keepa',
  'rainforest',
  'ebay-browse',
  'unknown',
]);

// Create PriceSnapshot Schema
export const createPriceSnapshotSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  price: z.number(),
  currency: z.string().min(1, 'Currency is required'),
  availability: availabilityEnum,
  source: priceSnapshotSourceEnum.optional(),
  // 用户补录历史读数时可指定采集时间（epoch ms）；缺省为录入当下
  recordedAt: z.number().optional(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  salesRank: z.number().optional(),
  shippingCost: z.number().optional(),
  seller: z.string().optional(),
  condition: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// PriceSnapshot Response Schema
export const priceSnapshotResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  price: z.number(),
  currency: z.string(),
  availability: availabilityEnum,
  source: priceSnapshotSourceEnum,
  rating: z.number().nullable(),
  reviewCount: z.number().nullable(),
  salesRank: z.number().nullable(),
  shippingCost: z.number().nullable(),
  seller: z.string().nullable(),
  condition: z.string().nullable(),
  timestamp: z.number(),
  metadata: z.string().nullable(),
});

// Export types
export type Availability = z.infer<typeof availabilityEnum>;
export type PriceSnapshotSource = z.infer<typeof priceSnapshotSourceEnum>;
export type CreatePriceSnapshot = z.infer<typeof createPriceSnapshotSchema>;
export type PriceSnapshot = z.infer<typeof priceSnapshotResponseSchema>;
