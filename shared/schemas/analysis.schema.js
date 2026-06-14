"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceStatsResponseSchema = void 0;
const zod_1 = require("zod");
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
});
