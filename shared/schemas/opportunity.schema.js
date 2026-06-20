"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityResearchComparisonResponseSchema = exports.productOpportunityResponseSchema = exports.opportunityListResponseSchema = exports.opportunityListQuerySchema = exports.productOpportunitySchema = exports.opportunityAcquisitionHealthSchema = exports.opportunityFactorSchema = exports.sortOrderEnum = exports.opportunitySortByEnum = exports.opportunityFactorDirectionEnum = exports.opportunityRecommendationEnum = void 0;
const zod_1 = require("zod");
const businessSignal_schema_1 = require("./businessSignal.schema");
const marketSignal_schema_1 = require("./marketSignal.schema");
const opportunityResearch_schema_1 = require("./opportunityResearch.schema");
const product_schema_1 = require("./product.schema");
const booleanQuerySchema = zod_1.z.preprocess((value) => {
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    return value;
}, zod_1.z.boolean());
exports.opportunityRecommendationEnum = zod_1.z.enum([
    'watch',
    'investigate',
    'check_data',
    'ignore',
]);
exports.opportunityFactorDirectionEnum = zod_1.z.enum([
    'positive',
    'negative',
    'neutral',
]);
exports.opportunitySortByEnum = zod_1.z.enum(['score', 'confidence']);
exports.sortOrderEnum = zod_1.z.enum(['asc', 'desc']);
exports.opportunityFactorSchema = zod_1.z.object({
    name: zod_1.z.string(),
    label: zod_1.z.string(),
    rawValue: zod_1.z.union([zod_1.z.number(), zod_1.z.string(), zod_1.z.boolean()]).nullable(),
    normalizedScore: zod_1.z.number(),
    weight: zod_1.z.number(),
    contribution: zod_1.z.number(),
    direction: exports.opportunityFactorDirectionEnum,
    explanation: zod_1.z.string(),
});
exports.opportunityAcquisitionHealthSchema = zod_1.z.object({
    provider: zod_1.z.string().nullable(),
    source: zod_1.z.string().nullable(),
    status: zod_1.z.string().nullable(),
    failureReason: zod_1.z.string().nullable(),
    confidence: zod_1.z.number().nullable(),
    durationMs: zod_1.z.number().nullable(),
    timestamp: zod_1.z.number().nullable(),
    freshnessMs: zod_1.z.number().nullable(),
});
exports.productOpportunitySchema = zod_1.z.object({
    product: product_schema_1.productResponseSchema,
    score: zod_1.z.number(),
    confidence: zod_1.z.number(),
    recommendation: exports.opportunityRecommendationEnum,
    keyReasons: zod_1.z.array(zod_1.z.string()),
    missingSignals: zod_1.z.array(zod_1.z.string()),
    factors: zod_1.z.array(exports.opportunityFactorSchema),
    acquisitionHealth: exports.opportunityAcquisitionHealthSchema,
    businessSignals: businessSignal_schema_1.opportunityBusinessSummarySchema,
    marketSignals: marketSignal_schema_1.opportunityMarketSignalSummarySchema.optional(),
    research: opportunityResearch_schema_1.opportunityResearchMetadataSchema.optional(),
});
exports.opportunityListQuerySchema = zod_1.z.object({
    platform: product_schema_1.platformEnum.optional(),
    category: zod_1.z.string().optional(),
    monitoring: booleanQuerySchema.optional(),
    minScore: zod_1.z.coerce.number().min(0).max(100).optional(),
    minRoi: zod_1.z.coerce.number().optional(),
    businessReadiness: businessSignal_schema_1.businessReadinessEnum.default('any'),
    recommendation: exports.opportunityRecommendationEnum.optional(),
    shortlisted: booleanQuerySchema.optional(),
    researchStatus: zod_1.z
        .enum(['researching', 'watching', 'ready', 'rejected'])
        .optional(),
    researchTag: zod_1.z
        .string()
        .transform((value) => value.trim().toLowerCase())
        .pipe(zod_1.z.string().min(1).max(32))
        .optional(),
    sortBy: exports.opportunitySortByEnum.default('score'),
    sortOrder: exports.sortOrderEnum.default('desc'),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.opportunityListResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.productOpportunitySchema),
    total: zod_1.z.number(),
    pagination: zod_1.z.object({
        page: zod_1.z.number(),
        limit: zod_1.z.number(),
        totalPages: zod_1.z.number(),
    }),
});
exports.productOpportunityResponseSchema = zod_1.z.object({
    data: exports.productOpportunitySchema,
});
exports.opportunityResearchComparisonResponseSchema = zod_1.z.object({
    data: zod_1.z.array(exports.productOpportunitySchema),
    selectedProductIds: zod_1.z.array(zod_1.z.string()),
    comparedAt: zod_1.z.number(),
    caveats: zod_1.z.object({
        marketSignals: zod_1.z.string(),
        businessSignals: zod_1.z.string(),
        score: zod_1.z.string(),
    }),
});
