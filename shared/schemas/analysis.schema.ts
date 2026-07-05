import { z } from 'zod';

// 价格来源溯源：当前价来自哪个来源、是否过时、可信度与展示文案。
// 由后端 deriveProvenance 统一推导，前端只渲染，绝不让过时/未知数据伪装成已验证事实。
export const priceProvenanceSchema = z.object({
  source: z.enum([
    'manual',
    'browser',
    'cache',
    'keepa',
    'rainforest',
    'ebay-browse',
    'unknown',
  ]),
  ageMs: z.number(),
  stale: z.boolean(),
  trust: z.enum(['high', 'medium', 'low', 'unknown']),
  label: z.string(),
});

// PriceStats Response Schema
export const priceStatsResponseSchema = z.object({
  productId: z.string(),
  currentPrice: z.number(),
  highestPrice: z.number(),
  lowestPrice: z.number(),
  averagePrice: z.number(),
  priceChange: z.number(),
  priceChangePercent: z.number(),
  dataPoints: z.number(),
  firstRecordedAt: z.number(),
  lastRecordedAt: z.number(),
  provenance: priceProvenanceSchema,
});

// Export types
export type PriceProvenance = z.infer<typeof priceProvenanceSchema>;
export type PriceStats = z.infer<typeof priceStatsResponseSchema>;
