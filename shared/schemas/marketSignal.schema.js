"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityMarketSignalSummarySchema = exports.marketSignalOpportunityFactorSchema = exports.marketSignalProviderHealthSchema = exports.marketSignalHealthStatusEnum = exports.marketSignalRefreshResultSchema = exports.marketSignalSnapshotSchema = exports.marketSignalTrendSummarySchema = exports.marketSignalTrendDirectionEnum = exports.marketSignalSourceEnum = exports.marketSignalProviderEnum = void 0;
const zod_1 = require("zod");
const product_schema_1 = require("./product.schema");
const scraper_schema_1 = require("./scraper.schema");
exports.marketSignalProviderEnum = zod_1.z.enum(['keepa']);
exports.marketSignalSourceEnum = zod_1.z.enum(['third_party']);
exports.marketSignalTrendDirectionEnum = zod_1.z.enum([
    'up',
    'down',
    'stable',
    'unknown',
]);
exports.marketSignalTrendSummarySchema = zod_1.z.object({
    current: zod_1.z.number().nullable().optional(),
    average: zod_1.z.number().nullable().optional(),
    lowest: zod_1.z.number().nullable().optional(),
    highest: zod_1.z.number().nullable().optional(),
    changePercent: zod_1.z.number().nullable().optional(),
    volatility: zod_1.z.number().nullable().optional(),
    direction: exports.marketSignalTrendDirectionEnum.default('unknown'),
    dataPoints: zod_1.z.number().int().nonnegative(),
    firstObservedAt: zod_1.z.number().nullable().optional(),
    lastObservedAt: zod_1.z.number().nullable().optional(),
});
exports.marketSignalSnapshotSchema = zod_1.z.object({
    id: zod_1.z.string(),
    productId: zod_1.z.string(),
    platform: product_schema_1.platformEnum,
    provider: exports.marketSignalProviderEnum,
    source: exports.marketSignalSourceEnum,
    asin: zod_1.z.string(),
    marketplace: zod_1.z.string(),
    windowDays: zod_1.z.number().int().positive(),
    confidence: zod_1.z.number().min(0).max(1),
    freshnessMs: zod_1.z.number().nonnegative().nullable(),
    priceTrend: exports.marketSignalTrendSummarySchema.nullable(),
    salesRankTrend: exports.marketSignalTrendSummarySchema.nullable(),
    reviewVelocity: zod_1.z.number().nullable(),
    ratingMovement: zod_1.z.number().nullable(),
    missingSignals: zod_1.z.array(zod_1.z.string()),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    createdAt: zod_1.z.number(),
});
exports.marketSignalRefreshResultSchema = zod_1.z.object({
    success: zod_1.z.boolean(),
    productId: zod_1.z.string(),
    provider: exports.marketSignalProviderEnum,
    source: exports.marketSignalSourceEnum,
    timestamp: zod_1.z.number(),
    durationMs: zod_1.z.number().nonnegative(),
    confidence: zod_1.z.number().min(0).max(1).optional(),
    snapshotId: zod_1.z.string().optional(),
    failureReason: scraper_schema_1.acquisitionFailureReasonSchema.optional(),
    rootCause: scraper_schema_1.acquisitionRootCauseSchema.optional(),
    diagnostics: zod_1.z.record(zod_1.z.unknown()).optional(),
    error: zod_1.z.string().optional(),
});
exports.marketSignalHealthStatusEnum = zod_1.z.enum([
    'healthy',
    'degraded',
    'insufficient_history',
]);
exports.marketSignalProviderHealthSchema = zod_1.z.object({
    provider: exports.marketSignalProviderEnum,
    source: exports.marketSignalSourceEnum,
    platform: product_schema_1.platformEnum,
    status: exports.marketSignalHealthStatusEnum,
    window: zod_1.z.object({
        windowHours: zod_1.z.number(),
        since: zod_1.z.number(),
        until: zod_1.z.number(),
    }),
    attemptCount: zod_1.z.number().int().nonnegative(),
    successCount: zod_1.z.number().int().nonnegative(),
    failureCount: zod_1.z.number().int().nonnegative(),
    successRate: zod_1.z.number().min(0).max(1),
    averageDurationMs: zod_1.z.number().nullable(),
    latestSuccessTimestamp: zod_1.z.number().nullable(),
    latestFailureReason: scraper_schema_1.acquisitionFailureReasonSchema.nullable(),
    failureReasons: zod_1.z.record(zod_1.z.number()),
    rootCauses: zod_1.z.record(zod_1.z.number()),
    recommendations: zod_1.z.array(zod_1.z.object({
        code: zod_1.z.string(),
        severity: zod_1.z.enum(['info', 'warning', 'critical']),
        message: zod_1.z.string(),
    })),
});
exports.marketSignalOpportunityFactorSchema = zod_1.z.object({
    name: zod_1.z.string(),
    label: zod_1.z.string(),
    rawValue: zod_1.z.union([zod_1.z.number(), zod_1.z.string(), zod_1.z.boolean()]).nullable(),
    normalizedScore: zod_1.z.number(),
    weight: zod_1.z.number(),
    contribution: zod_1.z.number(),
    direction: zod_1.z.enum(['positive', 'negative', 'neutral']),
    source: exports.marketSignalSourceEnum,
    freshnessMs: zod_1.z.number().nonnegative().nullable(),
    confidenceImpact: zod_1.z.number(),
    explanation: zod_1.z.string(),
});
exports.opportunityMarketSignalSummarySchema = zod_1.z.object({
    status: zod_1.z.enum(['fresh', 'stale', 'missing', 'failed']),
    provider: exports.marketSignalProviderEnum.nullable(),
    source: exports.marketSignalSourceEnum.nullable(),
    confidence: zod_1.z.number().min(0).max(1).nullable(),
    freshnessMs: zod_1.z.number().nonnegative().nullable(),
    missingSignals: zod_1.z.array(zod_1.z.string()),
    caveat: zod_1.z.string(),
    factors: zod_1.z.array(exports.marketSignalOpportunityFactorSchema),
});
