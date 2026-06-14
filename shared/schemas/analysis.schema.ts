import { z } from 'zod';

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
});

// Export types
export type PriceStats = z.infer<typeof priceStatsResponseSchema>;
