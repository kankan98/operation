"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityResearchExportResponseSchema = exports.opportunityResearchExportRowSchema = exports.opportunityResearchExportRequestSchema = exports.opportunityResearchExportFiltersSchema = exports.opportunityResearchComparisonRequestSchema = exports.opportunityResearchListQuerySchema = exports.opportunityResearchUpdateSchema = exports.opportunityResearchUpsertSchema = exports.opportunityResearchMetadataSchema = exports.opportunityResearchEntrySchema = exports.opportunityResearchNotesSchema = exports.opportunityResearchTagsSchema = exports.opportunityResearchExportFormatEnum = exports.opportunityResearchPriorityEnum = exports.opportunityResearchStatusEnum = exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT = exports.OPPORTUNITY_RESEARCH_COMPARISON_LIMIT = exports.OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_TAGS = void 0;
exports.normalizeOpportunityResearchTags = normalizeOpportunityResearchTags;
const zod_1 = require("zod");
const product_schema_1 = require("./product.schema");
const booleanQuerySchema = zod_1.z.preprocess((value) => {
    if (value === 'true')
        return true;
    if (value === 'false')
        return false;
    return value;
}, zod_1.z.boolean());
exports.OPPORTUNITY_RESEARCH_MAX_TAGS = 10;
exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH = 32;
exports.OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH = 2000;
exports.OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH = 240;
exports.OPPORTUNITY_RESEARCH_COMPARISON_LIMIT = 6;
exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT = 100;
exports.opportunityResearchStatusEnum = zod_1.z.enum([
    'researching',
    'watching',
    'ready',
    'rejected',
]);
exports.opportunityResearchPriorityEnum = zod_1.z.enum([
    'low',
    'medium',
    'high',
]);
exports.opportunityResearchExportFormatEnum = zod_1.z.enum(['csv', 'json']);
function normalizeOpportunityResearchTags(tags) {
    const normalized = [];
    const seen = new Set();
    for (const tag of tags) {
        const value = tag.trim().toLowerCase();
        if (!value || seen.has(value))
            continue;
        seen.add(value);
        normalized.push(value);
    }
    return normalized;
}
exports.opportunityResearchTagsSchema = zod_1.z
    .array(zod_1.z.string())
    .transform(normalizeOpportunityResearchTags)
    .pipe(zod_1.z
    .array(zod_1.z.string().min(1).max(exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
    .max(exports.OPPORTUNITY_RESEARCH_MAX_TAGS));
exports.opportunityResearchNotesSchema = zod_1.z
    .string()
    .max(exports.OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH)
    .nullable();
exports.opportunityResearchEntrySchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    status: exports.opportunityResearchStatusEnum,
    priority: exports.opportunityResearchPriorityEnum,
    tags: zod_1.z
        .array(zod_1.z.string().min(1).max(exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
        .max(exports.OPPORTUNITY_RESEARCH_MAX_TAGS),
    notes: exports.opportunityResearchNotesSchema,
    archived: zod_1.z.boolean(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
exports.opportunityResearchMetadataSchema =
    exports.opportunityResearchEntrySchema.extend({
        notesSummary: zod_1.z
            .string()
            .max(exports.OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH)
            .nullable(),
    });
exports.opportunityResearchUpsertSchema = zod_1.z.object({
    status: exports.opportunityResearchStatusEnum.default('researching'),
    priority: exports.opportunityResearchPriorityEnum.default('medium'),
    tags: exports.opportunityResearchTagsSchema.default([]),
    notes: exports.opportunityResearchNotesSchema.default(null),
    archived: zod_1.z.boolean().default(false),
});
exports.opportunityResearchUpdateSchema = zod_1.z.object({
    status: exports.opportunityResearchStatusEnum.optional(),
    priority: exports.opportunityResearchPriorityEnum.optional(),
    tags: exports.opportunityResearchTagsSchema.optional(),
    notes: exports.opportunityResearchNotesSchema.optional(),
    archived: zod_1.z.boolean().optional(),
});
exports.opportunityResearchListQuerySchema = zod_1.z.object({
    status: exports.opportunityResearchStatusEnum.optional(),
    priority: exports.opportunityResearchPriorityEnum.optional(),
    tag: zod_1.z
        .string()
        .transform((value) => value.trim().toLowerCase())
        .pipe(zod_1.z.string().min(1).max(exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
        .optional(),
    archived: booleanQuerySchema.default(false),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.opportunityResearchComparisonRequestSchema = zod_1.z.object({
    productIds: zod_1.z
        .array(zod_1.z.string().min(1))
        .transform((productIds) => Array.from(new Set(productIds)))
        .pipe(zod_1.z
        .array(zod_1.z.string().min(1))
        .min(1)
        .max(exports.OPPORTUNITY_RESEARCH_COMPARISON_LIMIT)),
});
exports.opportunityResearchExportFiltersSchema = zod_1.z.object({
    platform: product_schema_1.platformEnum.optional(),
    category: zod_1.z.string().optional(),
    minScore: zod_1.z.coerce.number().min(0).max(100).optional(),
    minRoi: zod_1.z.coerce.number().optional(),
    businessReadiness: zod_1.z.enum(['any', 'none', 'partial', 'complete']).optional(),
    recommendation: zod_1.z.enum(['watch', 'investigate', 'check_data', 'ignore']).optional(),
    shortlisted: booleanQuerySchema.optional(),
    researchStatus: exports.opportunityResearchStatusEnum.optional(),
    researchTag: zod_1.z
        .string()
        .transform((value) => value.trim().toLowerCase())
        .pipe(zod_1.z.string().min(1).max(exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
        .optional(),
});
exports.opportunityResearchExportRequestSchema = zod_1.z
    .object({
    format: exports.opportunityResearchExportFormatEnum.default('csv'),
    productIds: zod_1.z
        .array(zod_1.z.string().min(1))
        .transform((productIds) => Array.from(new Set(productIds)))
        .pipe(zod_1.z.array(zod_1.z.string().min(1)).min(1).max(exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT))
        .optional(),
    filters: exports.opportunityResearchExportFiltersSchema.optional(),
    limit: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .max(exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT)
        .default(exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT),
})
    .refine((value) => Boolean(value.productIds?.length || value.filters), 'Provide selected product IDs or filters for export');
exports.opportunityResearchExportRowSchema = zod_1.z.object({
    productId: zod_1.z.string(),
    title: zod_1.z.string(),
    platform: product_schema_1.platformEnum,
    category: zod_1.z.string().nullable(),
    currentPrice: zod_1.z.number().nullable(),
    currency: zod_1.z.string(),
    score: zod_1.z.number(),
    confidence: zod_1.z.number(),
    recommendation: zod_1.z.enum(['watch', 'investigate', 'check_data', 'ignore']),
    researchStatus: exports.opportunityResearchStatusEnum.nullable(),
    researchPriority: exports.opportunityResearchPriorityEnum.nullable(),
    researchTags: zod_1.z.array(zod_1.z.string()),
    researchNotesSummary: zod_1.z.string().nullable(),
    topReasons: zod_1.z.array(zod_1.z.string()),
    missingSignals: zod_1.z.array(zod_1.z.string()),
    marketSignalCaveat: zod_1.z.string(),
    businessSignalCaveat: zod_1.z.string(),
    scoreCaveat: zod_1.z.string(),
});
exports.opportunityResearchExportResponseSchema = zod_1.z.object({
    format: exports.opportunityResearchExportFormatEnum,
    filename: zod_1.z.string(),
    rows: zod_1.z.array(exports.opportunityResearchExportRowSchema),
    csv: zod_1.z.string().optional(),
    caveat: zod_1.z.string(),
});
