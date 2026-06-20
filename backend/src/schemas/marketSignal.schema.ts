import { z } from 'zod';

export {
  marketSignalSnapshotSchema,
  marketSignalRefreshResultSchema,
  marketSignalProviderHealthSchema,
} from '@shared/schemas';

export const marketSignalHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const marketSignalHealthQuerySchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(24 * 30).default(24),
  productId: z.string().optional(),
});

export type MarketSignalHistoryQuery = z.infer<
  typeof marketSignalHistoryQuerySchema
>;
export type MarketSignalHealthQuery = z.infer<
  typeof marketSignalHealthQuerySchema
>;
