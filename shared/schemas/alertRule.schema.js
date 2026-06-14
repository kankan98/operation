"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAlertRuleSchema = exports.alertRuleResponseSchema = exports.createAlertRuleSchema = exports.conditionEnum = exports.ruleTypeEnum = void 0;
const zod_1 = require("zod");
const alert_schema_1 = require("./alert.schema");
// Rule type enum
exports.ruleTypeEnum = zod_1.z.enum(['price_threshold', 'price_change_percent', 'stock_change']);
// Condition enum
exports.conditionEnum = zod_1.z.enum(['below', 'above', 'increase', 'decrease']);
// Create AlertRule Schema
exports.createAlertRuleSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    ruleType: exports.ruleTypeEnum,
    condition: exports.conditionEnum,
    threshold: zod_1.z.number().positive('Threshold must be positive'),
    enabled: zod_1.z.boolean().default(true),
    severity: alert_schema_1.severityEnum,
});
// AlertRule Response Schema
exports.alertRuleResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    productId: zod_1.z.string(),
    ruleType: exports.ruleTypeEnum,
    condition: exports.conditionEnum,
    threshold: zod_1.z.number(),
    enabled: zod_1.z.boolean(),
    severity: alert_schema_1.severityEnum,
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number().optional(),
});
// Update AlertRule Schema
exports.updateAlertRuleSchema = exports.createAlertRuleSchema.partial();
