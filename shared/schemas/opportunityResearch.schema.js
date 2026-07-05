"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opportunityResearchExportResponseSchema = exports.opportunityResearchExportRowSchema = exports.opportunityResearchExportRequestSchema = exports.opportunityResearchExportFiltersSchema = exports.opportunityResearchComparisonRequestSchema = exports.opportunityResearchListQuerySchema = exports.opportunityResearchUpdateSchema = exports.opportunityResearchUpsertSchema = exports.opportunityResearchPracticeSummarySchema = exports.opportunityResearchDailyActionPlanSchema = exports.opportunityResearchDailyActionItemSchema = exports.opportunityResearchDailyActionFilterSchema = exports.opportunityResearchReviewSummarySchema = exports.opportunityResearchMetadataSchema = exports.opportunityResearchEntrySchema = exports.opportunityResearchActionOutcomeRequestSchema = exports.opportunityResearchDecisionRequestSchema = exports.opportunityResearchActionOutcomeSchema = exports.opportunityResearchDecisionReviewSchema = exports.opportunityResearchDecisionSchema = exports.opportunityResearchDecisionSnapshotSchema = exports.opportunityResearchNotesSchema = exports.opportunityResearchTagsSchema = exports.opportunityResearchExportFormatEnum = exports.opportunityResearchActionOutcomeFilterEnum = exports.opportunityResearchDailyActionIdEnum = exports.opportunityResearchDecisionReviewFilterEnum = exports.opportunityResearchDecisionStatusEnum = exports.opportunityResearchPriorityEnum = exports.opportunityResearchStatusEnum = exports.OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT = exports.OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT = exports.OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT = exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT = exports.OPPORTUNITY_RESEARCH_COMPARISON_LIMIT = exports.OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS = exports.OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH = exports.OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH = exports.OPPORTUNITY_RESEARCH_MAX_TAGS = void 0;
exports.normalizeOpportunityResearchTags = normalizeOpportunityResearchTags;
const zod_1 = require("zod");
const businessSignal_schema_1 = require("./businessSignal.schema");
const marketSignal_schema_1 = require("./marketSignal.schema");
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
exports.OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH = 1200;
exports.OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH = 400;
exports.OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH = 600;
exports.OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS = 14;
exports.OPPORTUNITY_RESEARCH_COMPARISON_LIMIT = 6;
exports.OPPORTUNITY_RESEARCH_EXPORT_LIMIT = 100;
exports.OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT = 'Review summary counts are workflow queue metadata and do not change opportunity score, confidence, recommendation, gates, or factor contributions.';
exports.OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT = 'Daily action plan items are workflow practice metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.';
exports.OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT = 'Practice summary counts are workflow practice coverage metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.';
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
exports.opportunityResearchDecisionStatusEnum = zod_1.z.enum([
    'go',
    'hold',
    'no_go',
]);
exports.opportunityResearchDecisionReviewFilterEnum = zod_1.z.enum([
    'all',
    'decided',
    'undecided',
    'needs_action',
    'stale',
]);
exports.opportunityResearchDailyActionIdEnum = zod_1.z.enum([
    'add_next_action',
    'review_stale_decisions',
    'decide_candidates',
    'continue_research',
]);
exports.opportunityResearchActionOutcomeFilterEnum = zod_1.z.enum([
    'with',
    'without',
]);
exports.opportunityResearchExportFormatEnum = zod_1.z.enum(['csv', 'json']);
const opportunityResearchDecisionRecommendationEnum = zod_1.z.enum([
    'watch',
    'investigate',
    'check_data',
    'ignore',
]);
const opportunityResearchDecisionGateStatusEnum = zod_1.z.enum([
    'clear',
    'caution',
    'blocked',
]);
const trimmedDecisionText = (maxLength) => zod_1.z
    .string()
    .trim()
    .min(1)
    .max(maxLength);
const optionalDecisionText = (maxLength) => zod_1.z.preprocess((value) => {
    if (value === undefined || value === null)
        return null;
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}, zod_1.z.string().max(maxLength).nullable());
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
exports.opportunityResearchDecisionSnapshotSchema = zod_1.z.object({
    capturedAt: zod_1.z.number(),
    score: zod_1.z.number(),
    confidence: zod_1.z.number(),
    recommendation: opportunityResearchDecisionRecommendationEnum,
    recommendationGate: zod_1.z.object({
        status: opportunityResearchDecisionGateStatusEnum,
        applied: zod_1.z.boolean(),
        originalRecommendation: opportunityResearchDecisionRecommendationEnum,
        finalRecommendation: opportunityResearchDecisionRecommendationEnum,
        reasons: zod_1.z.array(zod_1.z.string()),
        signals: zod_1.z.array(zod_1.z.string()),
        nextActions: zod_1.z.array(zod_1.z.string()),
    }),
    keyReasons: zod_1.z.array(zod_1.z.string()),
    missingSignals: zod_1.z.array(zod_1.z.string()),
    businessSignals: businessSignal_schema_1.opportunityBusinessSummarySchema,
    marketSignals: marketSignal_schema_1.opportunityMarketSignalSummarySchema.nullable(),
});
exports.opportunityResearchDecisionSchema = zod_1.z.object({
    status: exports.opportunityResearchDecisionStatusEnum,
    reason: trimmedDecisionText(exports.OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH),
    nextAction: zod_1.z
        .string()
        .max(exports.OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH)
        .nullable(),
    decidedAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
    snapshot: exports.opportunityResearchDecisionSnapshotSchema,
});
exports.opportunityResearchDecisionReviewSchema = zod_1.z.object({
    hasDecision: zod_1.z.boolean(),
    status: exports.opportunityResearchDecisionStatusEnum.nullable(),
    decidedAt: zod_1.z.number().nullable(),
    daysSinceDecision: zod_1.z.number().int().min(0).nullable(),
    hasNextAction: zod_1.z.boolean(),
    needsNextAction: zod_1.z.boolean(),
    stale: zod_1.z.boolean(),
});
exports.opportunityResearchActionOutcomeSchema = zod_1.z.object({
    actionId: exports.opportunityResearchDailyActionIdEnum,
    outcome: trimmedDecisionText(exports.OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH),
    completedAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
exports.opportunityResearchDecisionRequestSchema = zod_1.z.object({
    status: exports.opportunityResearchDecisionStatusEnum,
    reason: trimmedDecisionText(exports.OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH),
    nextAction: optionalDecisionText(exports.OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH).default(null),
});
exports.opportunityResearchActionOutcomeRequestSchema = zod_1.z
    .object({
    actionId: exports.opportunityResearchDailyActionIdEnum,
    outcome: trimmedDecisionText(exports.OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH),
    completedAt: zod_1.z.number().int().min(0).optional(),
})
    .refine((value) => value.completedAt === undefined || value.completedAt <= Date.now(), {
    message: 'completedAt cannot be in the future',
    path: ['completedAt'],
});
exports.opportunityResearchEntrySchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    status: exports.opportunityResearchStatusEnum,
    priority: exports.opportunityResearchPriorityEnum,
    tags: zod_1.z
        .array(zod_1.z.string().min(1).max(exports.OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
        .max(exports.OPPORTUNITY_RESEARCH_MAX_TAGS),
    notes: exports.opportunityResearchNotesSchema,
    archived: zod_1.z.boolean(),
    decision: exports.opportunityResearchDecisionSchema.nullable(),
    lastActionOutcome: exports.opportunityResearchActionOutcomeSchema.nullable(),
    createdAt: zod_1.z.number(),
    updatedAt: zod_1.z.number(),
});
exports.opportunityResearchMetadataSchema =
    exports.opportunityResearchEntrySchema.extend({
        notesSummary: zod_1.z
            .string()
            .max(exports.OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH)
            .nullable(),
        decisionReview: exports.opportunityResearchDecisionReviewSchema,
    });
exports.opportunityResearchReviewSummarySchema = zod_1.z.object({
    totalActive: zod_1.z.number().int().min(0),
    decided: zod_1.z.number().int().min(0),
    undecided: zod_1.z.number().int().min(0),
    needsNextAction: zod_1.z.number().int().min(0),
    stale: zod_1.z.number().int().min(0),
    byStatus: zod_1.z.object({
        researching: zod_1.z.number().int().min(0),
        watching: zod_1.z.number().int().min(0),
        ready: zod_1.z.number().int().min(0),
        rejected: zod_1.z.number().int().min(0),
    }),
    byPriority: zod_1.z.object({
        low: zod_1.z.number().int().min(0),
        medium: zod_1.z.number().int().min(0),
        high: zod_1.z.number().int().min(0),
    }),
    generatedAt: zod_1.z.number(),
    caveat: zod_1.z.string(),
});
exports.opportunityResearchDailyActionFilterSchema = zod_1.z.object({
    workspaceMode: zod_1.z.enum(['discover', 'review']),
    shortlisted: zod_1.z.boolean().optional(),
    decisionReview: exports.opportunityResearchDecisionReviewFilterEnum.optional(),
    decisionStatus: exports.opportunityResearchDecisionStatusEnum.optional(),
    researchStatus: exports.opportunityResearchStatusEnum.optional(),
});
exports.opportunityResearchDailyActionItemSchema = zod_1.z.object({
    id: exports.opportunityResearchDailyActionIdEnum,
    label: zod_1.z.string().min(1),
    reason: zod_1.z.string().min(1),
    learningGoal: zod_1.z.string().min(1),
    steps: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(4),
    completionCriteria: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(3),
    priority: zod_1.z.number().int().min(1),
    count: zod_1.z.number().int().min(1),
    filters: exports.opportunityResearchDailyActionFilterSchema,
});
exports.opportunityResearchDailyActionPlanSchema = zod_1.z.object({
    items: zod_1.z.array(exports.opportunityResearchDailyActionItemSchema),
    generatedAt: zod_1.z.number(),
    caveat: zod_1.z.string(),
});
exports.opportunityResearchPracticeSummarySchema = zod_1.z.object({
    totalActive: zod_1.z.number().int().min(0),
    withOutcome: zod_1.z.number().int().min(0),
    withoutOutcome: zod_1.z.number().int().min(0),
    byActionId: zod_1.z.object({
        add_next_action: zod_1.z.number().int().min(0),
        review_stale_decisions: zod_1.z.number().int().min(0),
        decide_candidates: zod_1.z.number().int().min(0),
        continue_research: zod_1.z.number().int().min(0),
    }),
    latestCompletedAt: zod_1.z.number().nullable(),
    generatedAt: zod_1.z.number(),
    caveat: zod_1.z.string(),
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
    decisionStatus: exports.opportunityResearchDecisionStatusEnum.optional(),
    decisionReview: exports.opportunityResearchDecisionReviewFilterEnum.default('all'),
    actionOutcome: exports.opportunityResearchActionOutcomeFilterEnum.optional(),
    actionId: exports.opportunityResearchDailyActionIdEnum.optional(),
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
    decisionStatus: exports.opportunityResearchDecisionStatusEnum.optional(),
    decisionReview: exports.opportunityResearchDecisionReviewFilterEnum.optional(),
    actionOutcome: exports.opportunityResearchActionOutcomeFilterEnum.optional(),
    actionId: exports.opportunityResearchDailyActionIdEnum.optional(),
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
    decisionStatus: exports.opportunityResearchDecisionStatusEnum.nullable(),
    decisionReason: zod_1.z.string().nullable(),
    decisionNextAction: zod_1.z.string().nullable(),
    decidedAt: zod_1.z.number().nullable(),
    decisionSnapshotScore: zod_1.z.number().nullable(),
    decisionSnapshotRecommendation: opportunityResearchDecisionRecommendationEnum.nullable(),
    lastActionId: exports.opportunityResearchDailyActionIdEnum.nullable(),
    lastActionOutcome: zod_1.z.string().nullable(),
    lastActionCompletedAt: zod_1.z.number().nullable(),
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
