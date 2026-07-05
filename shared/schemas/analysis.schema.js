"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceStatsResponseSchema = exports.priceProvenanceSchema = void 0;
const zod_1 = require("zod");
// 价格来源溯源：当前价来自哪个来源、是否过时、可信度与展示文案。
exports.priceProvenanceSchema = zod_1.z.object({
    source: zod_1.z.enum([
        'manual',
        'browser',
        'cache',
        'keepa',
        'rainforest',
        'ebay-browse',
        'unknown',
    ]),
    ageMs: zod_1.z.number(),
    stale: zod_1.z.boolean(),
    trust: zod_1.z.enum(['high', 'medium', 'low', 'unknown']),
    label: zod_1.z.string(),
});
// PriceStats Response Schema
exports.priceStatsResponseSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    currentPrice: zod_1.z.number(),
    highestPrice: zod_1.z.number(),
    lowestPrice: zod_1.z.number(),
    averagePrice: zod_1.z.number(),
    priceChange: zod_1.z.number(),
    priceChangePercent: zod_1.z.number(),
    dataPoints: zod_1.z.number(),
    firstRecordedAt: zod_1.z.number(),
    lastRecordedAt: zod_1.z.number(),
    provenance: exports.priceProvenanceSchema,
});
