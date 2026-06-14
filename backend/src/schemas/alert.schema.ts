import { z } from 'zod';

export const createAlertSchema = z.object({
  ruleId: z.string(),
  productId: z.string(),
  alertType: z.enum(['price_threshold', 'price_drop', 'price_surge', 'out_of_stock', 'price_change_percent', 'stock_change']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string(),
  message: z.string(),
  dataSnapshot: z.string().optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
