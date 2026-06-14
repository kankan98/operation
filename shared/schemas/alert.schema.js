"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertResponseSchema = exports.createAlertSchema = exports.severityEnum = exports.alertTypeEnum = void 0;
const zod_1 = require("zod");
// Extend Zod with OpenAPI if available (backend only)
try {
    // @ts-ignore - optional dependency
    const { extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
    extendZodWithOpenApi(zod_1.z);
}
catch (e) {
    // Frontend environment or OpenAPI not installed - that's fine
}
// Alert type enum
exports.alertTypeEnum = zod_1.z.enum([
    'price_drop',
    'price_surge',
    'out_of_stock',
    'price_threshold',
    'price_change_percent',
    'stock_change'
]);
// Severity enum
exports.severityEnum = zod_1.z.enum(['info', 'warning', 'critical']);
// Create Alert Schema
exports.createAlertSchema = zod_1.z.object({
    ruleId: zod_1.z.string().optional(),
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    alertType: exports.alertTypeEnum,
    severity: exports.severityEnum,
    title: zod_1.z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    message: zod_1.z.string().max(1000, 'Message must be at most 1000 characters').optional(),
    dataSnapshot: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// Alert Response Schema
exports.alertResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    ruleId: zod_1.z.string().nullable(),
    productId: zod_1.z.string(),
    alertType: exports.alertTypeEnum,
    severity: exports.severityEnum,
    title: zod_1.z.string(),
    message: zod_1.z.string().nullable(),
    dataSnapshot: zod_1.z.string().nullable(),
    isRead: zod_1.z.boolean(),
    isArchived: zod_1.z.boolean(),
    notifiedAt: zod_1.z.number().nullable(),
    createdAt: zod_1.z.number(),
});
