import { z } from 'zod';

// Extend Zod with OpenAPI if available (backend only)
try {
  // @ts-ignore - optional dependency
  const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
  extendZodWithOpenApi(z);
} catch (e) {
  // Frontend environment or OpenAPI not installed - that's fine
}

// Alert type enum
export const alertTypeEnum = z.enum([
  'price_drop',
  'price_surge',
  'out_of_stock',
  'price_threshold',
  'price_change_percent',
  'stock_change'
]);

// Severity enum
export const severityEnum = z.enum(['info', 'warning', 'critical']);

// Create Alert Schema
export const createAlertSchema = z.object({
  ruleId: z.string().optional(),
  productId: z.string().min(1, 'Product ID is required'),
  alertType: alertTypeEnum,
  severity: severityEnum,
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  message: z.string().max(1000, 'Message must be at most 1000 characters').optional(),
  dataSnapshot: z.union([z.record(z.unknown()), z.string()]).optional(),
});

// Alert Response Schema
export const alertResponseSchema = z.object({
  id: z.string(),
  ruleId: z.string().nullable(),
  productId: z.string(),
  alertType: alertTypeEnum,
  severity: severityEnum,
  title: z.string(),
  message: z.string().nullable(),
  dataSnapshot: z.string().nullable(),
  isRead: z.boolean(),
  isArchived: z.boolean(),
  notifiedAt: z.number().nullable(),
  createdAt: z.number(),
});

// Export types
export type AlertType = z.infer<typeof alertTypeEnum>;
export type Severity = z.infer<typeof severityEnum>;
export type CreateAlert = z.infer<typeof createAlertSchema>;
export type Alert = z.infer<typeof alertResponseSchema>;
