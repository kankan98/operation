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

// Create PriceSnapshot Schema
export const createPriceSnapshotSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  price: z.number(),
  currency: z.string().min(1, 'Currency is required'),
  availability: availabilityEnum,
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
export type CreatePriceSnapshot = z.infer<typeof createPriceSnapshotSchema>;
export type PriceSnapshot = z.infer<typeof priceSnapshotResponseSchema>;
