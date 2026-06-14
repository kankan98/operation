import { z } from 'zod';

export const createAlertRuleSchema = z.object({
  productId: z.string(),
  ruleType: z.enum(['price_threshold', 'price_drop', 'price_surge', 'out_of_stock', 'price_change_percent', 'stock_change']),
  threshold: z.number().optional(),
  percentage: z.number().optional(),
  isEnabled: z.boolean().default(true),
  notificationChannels: z.array(z.enum(['email', 'webhook', 'sms'])).default([]),
  metadata: z.any().optional(),
});

export const updateAlertRuleSchema = z.object({
  ruleType: z.enum(['price_threshold', 'price_drop', 'price_surge', 'out_of_stock', 'price_change_percent', 'stock_change']).optional(),
  threshold: z.number().optional(),
  percentage: z.number().optional(),
  isEnabled: z.boolean().optional(),
  notificationChannels: z.array(z.enum(['email', 'webhook', 'sms'])).optional(),
  metadata: z.any().optional(),
});

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;
