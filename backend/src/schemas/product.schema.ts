import { z } from 'zod';
export {
  productBusinessSignalUpsertSchema,
  productBusinessSignalResponseSchema,
} from '@shared/schemas';

export const createProductSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'aliexpress', 'ebay', 'other']),
  productUrl: z.string().url(),
  asin: z.string().min(1),
  title: z.string().min(1),
  brand: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  currency: z.string().default('USD'),
  currentPrice: z.number().optional(),
  isMonitoring: z.boolean().default(false),
  monitorType: z.enum(['manual', 'automatic']).default('automatic'),
  checkInterval: z.number().int().min(1).max(168).default(24),
  userId: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

export const updateProductSchema = z.object({
  platform: z.enum(['amazon', 'walmart', 'aliexpress', 'ebay', 'other']).optional(),
  productUrl: z.string().url().optional(),
  asin: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  imageUrl: z.string().url().optional(),
  currency: z.string().optional(),
  currentPrice: z.number().optional(),
  isMonitoring: z.boolean().optional(),
  monitorType: z.enum(['manual', 'automatic']).optional(),
  checkInterval: z.number().int().min(1).max(168).optional(),
  userId: z.string().nullable().optional(),
  metadata: z.any().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
