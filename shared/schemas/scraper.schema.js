"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapeAllResultsSchema = exports.scrapeResultSchema = void 0;
const zod_1 = require("zod");
// Scrape Result Schema
exports.scrapeResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    productId: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
    error: zod_1.z.string().optional(),
    timestamp: zod_1.z.number().optional(),
});
// Scrape All Results Schema
exports.scrapeAllResultsSchema = zod_1.z.object({
    total: zod_1.z.number(),
    success: zod_1.z.number(),
    failed: zod_1.z.number(),
    results: zod_1.z.array(exports.scrapeResultSchema),
});
