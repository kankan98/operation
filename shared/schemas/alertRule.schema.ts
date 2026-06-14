import { z } from 'zod';
import { severityEnum } from './alert.schema';

// Rule type enum
export const ruleTypeEnum = z.enum(['price_threshold', 'price_change_percent', 'stock_change']);

// Condition enum
export const conditionEnum = z.enum(['below', 'above', 'increase', 'decrease']);

// Create AlertRule Schema
export const createAlertRuleSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  ruleType: ruleTypeEnum,
  condition: conditionEnum,
  threshold: z.number().positive('Threshold must be positive'),
  enabled: z.boolean().default(true),
  severity: severityEnum,
});

// AlertRule Response Schema
export const alertRuleResponseSchema = z.object({
  id: z.string(),
  productId: z.string(),
  ruleType: ruleTypeEnum,
  condition: conditionEnum,
  threshold: z.number(),
  enabled: z.boolean(),
  severity: severityEnum,
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});

// Update AlertRule Schema
export const updateAlertRuleSchema = createAlertRuleSchema.partial();

// Export types
export type RuleType = z.infer<typeof ruleTypeEnum>;
export type Condition = z.infer<typeof conditionEnum>;
export type CreateAlertRule = z.infer<typeof createAlertRuleSchema>;
export type AlertRule = z.infer<typeof alertRuleResponseSchema>;
export type UpdateAlertRule = z.infer<typeof updateAlertRuleSchema>;
