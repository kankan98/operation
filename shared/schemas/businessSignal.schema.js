"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityBusinessSummarySchema = exports.productBusinessSignalResponseSchema = exports.businessMetricsSchema = exports.businessMetricInputsSchema = exports.productBusinessSignalSchema = exports.productBusinessSignalUpsertSchema = exports.businessReadinessEnum = exports.businessSignalCompletenessEnum = exports.businessMetricPriceSourceEnum = void 0;
const zod_1 = require("zod");
const nullableMoneySchema = zod_1.z
    .number()
    .nonnegative()
    .nullable()
    .optional();
exports.businessMetricPriceSourceEnum = zod_1.z.enum([
    'target',
    'current_price',
    'missing',
]);
exports.businessSignalCompletenessEnum = zod_1.z.enum([
    'none',
    'partial',
    'complete',
]);
exports.businessReadinessEnum = zod_1.z.enum([
    'any',
    'none',
    'partial',
    'complete',
]);
exports.productBusinessSignalUpsertSchema = zod_1.z.object({
    currency: zod_1.z.string().trim().length(3).transform((value) => value.toUpperCase()),
    costBasis: nullableMoneySchema,
    inboundShipping: nullableMoneySchema,
    outboundShipping: nullableMoneySchema,
    fulfillmentFee: nullableMoneySchema,
    platformFee: nullableMoneySchema,
    referralFeeRate: zod_1.z.number().min(0).max(1).nullable().optional(),
    advertisingCost: nullableMoneySchema,
    taxCustomsBuffer: nullableMoneySchema,
    targetSellPrice: nullableMoneySchema,
    targetUnits: zod_1.z.number().int().nonnegative().nullable().optional(),
    notes: zod_1.z.string().max(1000).nullable().optional(),
});
exports.productBusinessSignalSchema = exports.productBusinessSignalUpsertSchema.extend({
    productId: zod_1.z.string(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
exports.businessMetricInputsSchema = zod_1.z.object({
    sellPrice: zod_1.z.number().nullable(),
    costBasis: zod_1.z.number().nullable(),
    inboundShipping: zod_1.z.number().nullable(),
    outboundShipping: zod_1.z.number().nullable(),
    fulfillmentFee: zod_1.z.number().nullable(),
    platformFee: zod_1.z.number().nullable(),
    referralFeeRate: zod_1.z.number().nullable(),
    referralFee: zod_1.z.number().nullable(),
    advertisingCost: zod_1.z.number().nullable(),
    taxCustomsBuffer: zod_1.z.number().nullable(),
});
exports.businessMetricsSchema = zod_1.z.object({
    currency: zod_1.z.string(),
    priceSource: exports.businessMetricPriceSourceEnum,
    completeness: exports.businessSignalCompletenessEnum,
    missingSignals: zod_1.z.array(zod_1.z.string()),
    totalVariableCost: zod_1.z.number().nullable(),
    grossMargin: zod_1.z.number().nullable(),
    netMargin: zod_1.z.number().nullable(),
    roi: zod_1.z.number().nullable(),
    breakevenSellPrice: zod_1.z.number().nullable(),
    contributionProfitPerUnit: zod_1.z.number().nullable(),
    targetUnits: zod_1.z.number().nullable(),
    projectedContributionProfit: zod_1.z.number().nullable(),
    inputs: exports.businessMetricInputsSchema,
    caveat: zod_1.z.string(),
});
exports.productBusinessSignalResponseSchema = zod_1.z.object({
    data: zod_1.z.object({
        assumptions: exports.productBusinessSignalSchema.nullable(),
        metrics: exports.businessMetricsSchema,
    }),
});
exports.opportunityBusinessSummarySchema = zod_1.z.object({
    completeness: exports.businessSignalCompletenessEnum,
    missingSignals: zod_1.z.array(zod_1.z.string()),
    metrics: exports.businessMetricsSchema.nullable(),
    caveat: zod_1.z.string(),
});
