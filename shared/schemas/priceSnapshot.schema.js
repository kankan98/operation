"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceSnapshotResponseSchema = exports.createPriceSnapshotSchema = exports.priceSnapshotSourceEnum = exports.availabilityEnum = void 0;
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
// Availability enum
exports.availabilityEnum = zod_1.z.enum(['in_stock', 'low_stock', 'out_of_stock']);
// 数据来源（provenance）枚举
exports.priceSnapshotSourceEnum = zod_1.z.enum([
    'manual',
    'browser',
    'cache',
    'keepa',
    'rainforest',
    'ebay-browse',
    'unknown',
]);
// Create PriceSnapshot Schema
exports.createPriceSnapshotSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'Product ID is required'),
    price: zod_1.z.number(),
    currency: zod_1.z.string().min(1, 'Currency is required'),
    availability: exports.availabilityEnum,
    source: exports.priceSnapshotSourceEnum.optional(),
    recordedAt: zod_1.z.number().optional(),
    rating: zod_1.z.number().optional(),
    reviewCount: zod_1.z.number().optional(),
    salesRank: zod_1.z.number().optional(),
    shippingCost: zod_1.z.number().optional(),
    seller: zod_1.z.string().optional(),
    condition: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
// PriceSnapshot Response Schema
exports.priceSnapshotResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    productId: zod_1.z.string(),
    price: zod_1.z.number(),
    currency: zod_1.z.string(),
    availability: exports.availabilityEnum,
    source: exports.priceSnapshotSourceEnum,
    rating: zod_1.z.number().nullable(),
    reviewCount: zod_1.z.number().nullable(),
    salesRank: zod_1.z.number().nullable(),
    shippingCost: zod_1.z.number().nullable(),
    seller: zod_1.z.string().nullable(),
    condition: zod_1.z.string().nullable(),
    timestamp: zod_1.z.number(),
    metadata: zod_1.z.string().nullable(),
});
