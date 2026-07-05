import { z } from 'zod';
import { opportunityBusinessSummarySchema } from './businessSignal.schema';
import { opportunityMarketSignalSummarySchema } from './marketSignal.schema';
import { platformEnum } from './product.schema';

const booleanQuerySchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const OPPORTUNITY_RESEARCH_MAX_TAGS = 10;
export const OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH = 32;
export const OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH = 2000;
export const OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH = 240;
export const OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH = 1200;
export const OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH = 400;
export const OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH = 600;
export const OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS = 14;
export const OPPORTUNITY_RESEARCH_COMPARISON_LIMIT = 6;
export const OPPORTUNITY_RESEARCH_EXPORT_LIMIT = 100;
export const OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT =
  'Review summary counts are workflow queue metadata and do not change opportunity score, confidence, recommendation, gates, or factor contributions.';
export const OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT =
  'Daily action plan items are workflow practice metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.';
export const OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT =
  'Practice summary counts are workflow practice coverage metadata and do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.';

export const opportunityResearchStatusEnum = z.enum([
  'researching',
  'watching',
  'ready',
  'rejected',
]);

export const opportunityResearchPriorityEnum = z.enum([
  'low',
  'medium',
  'high',
]);

export const opportunityResearchDecisionStatusEnum = z.enum([
  'go',
  'hold',
  'no_go',
]);

export const opportunityResearchDecisionReviewFilterEnum = z.enum([
  'all',
  'decided',
  'undecided',
  'needs_action',
  'stale',
]);

export const opportunityResearchDailyActionIdEnum = z.enum([
  'add_next_action',
  'review_stale_decisions',
  'decide_candidates',
  'continue_research',
]);

export const opportunityResearchActionOutcomeFilterEnum = z.enum([
  'with',
  'without',
]);

export const opportunityResearchExportFormatEnum = z.enum(['csv', 'json']);

const opportunityResearchDecisionRecommendationEnum = z.enum([
  'watch',
  'investigate',
  'check_data',
  'ignore',
]);

const opportunityResearchDecisionGateStatusEnum = z.enum([
  'clear',
  'caution',
  'blocked',
]);

const trimmedDecisionText = (maxLength: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(maxLength);

const optionalDecisionText = (maxLength: number) =>
  z.preprocess((value) => {
    if (value === undefined || value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }, z.string().max(maxLength).nullable());

export function normalizeOpportunityResearchTags(tags: string[]): string[] {
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const tag of tags) {
    const value = tag.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }

  return normalized;
}

export const opportunityResearchTagsSchema = z
  .array(z.string())
  .transform(normalizeOpportunityResearchTags)
  .pipe(
    z
      .array(z.string().min(1).max(OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
      .max(OPPORTUNITY_RESEARCH_MAX_TAGS)
  );

export const opportunityResearchNotesSchema = z
  .string()
  .max(OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH)
  .nullable();

export const opportunityResearchDecisionSnapshotSchema = z.object({
  capturedAt: z.number(),
  score: z.number(),
  confidence: z.number(),
  recommendation: opportunityResearchDecisionRecommendationEnum,
  recommendationGate: z.object({
    status: opportunityResearchDecisionGateStatusEnum,
    applied: z.boolean(),
    originalRecommendation: opportunityResearchDecisionRecommendationEnum,
    finalRecommendation: opportunityResearchDecisionRecommendationEnum,
    reasons: z.array(z.string()),
    signals: z.array(z.string()),
    nextActions: z.array(z.string()),
  }),
  keyReasons: z.array(z.string()),
  missingSignals: z.array(z.string()),
  businessSignals: opportunityBusinessSummarySchema,
  marketSignals: opportunityMarketSignalSummarySchema.nullable(),
});

export const opportunityResearchDecisionSchema = z.object({
  status: opportunityResearchDecisionStatusEnum,
  reason: trimmedDecisionText(OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH),
  nextAction: z
    .string()
    .max(OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH)
    .nullable(),
  decidedAt: z.number(),
  updatedAt: z.number(),
  snapshot: opportunityResearchDecisionSnapshotSchema,
});

export const opportunityResearchDecisionReviewSchema = z.object({
  hasDecision: z.boolean(),
  status: opportunityResearchDecisionStatusEnum.nullable(),
  decidedAt: z.number().nullable(),
  daysSinceDecision: z.number().int().min(0).nullable(),
  hasNextAction: z.boolean(),
  needsNextAction: z.boolean(),
  stale: z.boolean(),
});

export const opportunityResearchActionOutcomeSchema = z.object({
  actionId: opportunityResearchDailyActionIdEnum,
  outcome: trimmedDecisionText(
    OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH
  ),
  completedAt: z.number(),
  updatedAt: z.number(),
});

export const opportunityResearchDecisionRequestSchema = z.object({
  status: opportunityResearchDecisionStatusEnum,
  reason: trimmedDecisionText(OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH),
  nextAction: optionalDecisionText(
    OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH
  ).default(null),
});

export const opportunityResearchActionOutcomeRequestSchema = z
  .object({
    actionId: opportunityResearchDailyActionIdEnum,
    outcome: trimmedDecisionText(
      OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH
    ),
    completedAt: z.number().int().min(0).optional(),
  })
  .refine(
    (value) =>
      value.completedAt === undefined || value.completedAt <= Date.now(),
    {
      message: 'completedAt cannot be in the future',
      path: ['completedAt'],
    }
  );

export const opportunityResearchEntrySchema = z.object({
  productId: z.string().min(1),
  status: opportunityResearchStatusEnum,
  priority: opportunityResearchPriorityEnum,
  tags: z
    .array(z.string().min(1).max(OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
    .max(OPPORTUNITY_RESEARCH_MAX_TAGS),
  notes: opportunityResearchNotesSchema,
  archived: z.boolean(),
  decision: opportunityResearchDecisionSchema.nullable(),
  lastActionOutcome: opportunityResearchActionOutcomeSchema.nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const opportunityResearchMetadataSchema =
  opportunityResearchEntrySchema.extend({
    notesSummary: z
      .string()
      .max(OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH)
      .nullable(),
    decisionReview: opportunityResearchDecisionReviewSchema,
  });

export const opportunityResearchReviewSummarySchema = z.object({
  totalActive: z.number().int().min(0),
  decided: z.number().int().min(0),
  undecided: z.number().int().min(0),
  needsNextAction: z.number().int().min(0),
  stale: z.number().int().min(0),
  byStatus: z.object({
    researching: z.number().int().min(0),
    watching: z.number().int().min(0),
    ready: z.number().int().min(0),
    rejected: z.number().int().min(0),
  }),
  byPriority: z.object({
    low: z.number().int().min(0),
    medium: z.number().int().min(0),
    high: z.number().int().min(0),
  }),
  generatedAt: z.number(),
  caveat: z.string(),
});

export const opportunityResearchDailyActionFilterSchema = z.object({
  workspaceMode: z.enum(['discover', 'review']),
  shortlisted: z.boolean().optional(),
  decisionReview: opportunityResearchDecisionReviewFilterEnum.optional(),
  decisionStatus: opportunityResearchDecisionStatusEnum.optional(),
  researchStatus: opportunityResearchStatusEnum.optional(),
});

export const opportunityResearchDailyActionItemSchema = z.object({
  id: opportunityResearchDailyActionIdEnum,
  label: z.string().min(1),
  reason: z.string().min(1),
  learningGoal: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1).max(4),
  completionCriteria: z.array(z.string().min(1)).min(1).max(3),
  priority: z.number().int().min(1),
  count: z.number().int().min(1),
  filters: opportunityResearchDailyActionFilterSchema,
});

export const opportunityResearchDailyActionPlanSchema = z.object({
  items: z.array(opportunityResearchDailyActionItemSchema),
  generatedAt: z.number(),
  caveat: z.string(),
});

export const opportunityResearchPracticeSummarySchema = z.object({
  totalActive: z.number().int().min(0),
  withOutcome: z.number().int().min(0),
  withoutOutcome: z.number().int().min(0),
  byActionId: z.object({
    add_next_action: z.number().int().min(0),
    review_stale_decisions: z.number().int().min(0),
    decide_candidates: z.number().int().min(0),
    continue_research: z.number().int().min(0),
  }),
  latestCompletedAt: z.number().nullable(),
  generatedAt: z.number(),
  caveat: z.string(),
});

export const opportunityResearchUpsertSchema = z.object({
  status: opportunityResearchStatusEnum.default('researching'),
  priority: opportunityResearchPriorityEnum.default('medium'),
  tags: opportunityResearchTagsSchema.default([]),
  notes: opportunityResearchNotesSchema.default(null),
  archived: z.boolean().default(false),
});

export const opportunityResearchUpdateSchema = z.object({
  status: opportunityResearchStatusEnum.optional(),
  priority: opportunityResearchPriorityEnum.optional(),
  tags: opportunityResearchTagsSchema.optional(),
  notes: opportunityResearchNotesSchema.optional(),
  archived: z.boolean().optional(),
});

export const opportunityResearchListQuerySchema = z.object({
  status: opportunityResearchStatusEnum.optional(),
  priority: opportunityResearchPriorityEnum.optional(),
  tag: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().min(1).max(OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
    .optional(),
  archived: booleanQuerySchema.default(false),
  decisionStatus: opportunityResearchDecisionStatusEnum.optional(),
  decisionReview: opportunityResearchDecisionReviewFilterEnum.default('all'),
  actionOutcome: opportunityResearchActionOutcomeFilterEnum.optional(),
  actionId: opportunityResearchDailyActionIdEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const opportunityResearchComparisonRequestSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .transform((productIds) => Array.from(new Set(productIds)))
    .pipe(
      z
        .array(z.string().min(1))
        .min(1)
        .max(OPPORTUNITY_RESEARCH_COMPARISON_LIMIT)
    ),
});

export const opportunityResearchExportFiltersSchema = z.object({
  platform: platformEnum.optional(),
  category: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  minRoi: z.coerce.number().optional(),
  businessReadiness: z.enum(['any', 'none', 'partial', 'complete']).optional(),
  recommendation: z.enum(['watch', 'investigate', 'check_data', 'ignore']).optional(),
  shortlisted: booleanQuerySchema.optional(),
  researchStatus: opportunityResearchStatusEnum.optional(),
  researchTag: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().min(1).max(OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
    .optional(),
  decisionStatus: opportunityResearchDecisionStatusEnum.optional(),
  decisionReview: opportunityResearchDecisionReviewFilterEnum.optional(),
  actionOutcome: opportunityResearchActionOutcomeFilterEnum.optional(),
  actionId: opportunityResearchDailyActionIdEnum.optional(),
});

export const opportunityResearchExportRequestSchema = z
  .object({
    format: opportunityResearchExportFormatEnum.default('csv'),
    productIds: z
      .array(z.string().min(1))
      .transform((productIds) => Array.from(new Set(productIds)))
      .pipe(z.array(z.string().min(1)).min(1).max(OPPORTUNITY_RESEARCH_EXPORT_LIMIT))
      .optional(),
    filters: opportunityResearchExportFiltersSchema.optional(),
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(OPPORTUNITY_RESEARCH_EXPORT_LIMIT)
      .default(OPPORTUNITY_RESEARCH_EXPORT_LIMIT),
  })
  .refine(
    (value) => Boolean(value.productIds?.length || value.filters),
    'Provide selected product IDs or filters for export'
  );

export const opportunityResearchExportRowSchema = z.object({
  productId: z.string(),
  title: z.string(),
  platform: platformEnum,
  category: z.string().nullable(),
  currentPrice: z.number().nullable(),
  currency: z.string(),
  score: z.number(),
  confidence: z.number(),
  recommendation: z.enum(['watch', 'investigate', 'check_data', 'ignore']),
  researchStatus: opportunityResearchStatusEnum.nullable(),
  researchPriority: opportunityResearchPriorityEnum.nullable(),
  researchTags: z.array(z.string()),
  researchNotesSummary: z.string().nullable(),
  decisionStatus: opportunityResearchDecisionStatusEnum.nullable(),
  decisionReason: z.string().nullable(),
  decisionNextAction: z.string().nullable(),
  decidedAt: z.number().nullable(),
  decisionSnapshotScore: z.number().nullable(),
  decisionSnapshotRecommendation: opportunityResearchDecisionRecommendationEnum.nullable(),
  lastActionId: opportunityResearchDailyActionIdEnum.nullable(),
  lastActionOutcome: z.string().nullable(),
  lastActionCompletedAt: z.number().nullable(),
  topReasons: z.array(z.string()),
  missingSignals: z.array(z.string()),
  marketSignalCaveat: z.string(),
  businessSignalCaveat: z.string(),
  scoreCaveat: z.string(),
});

export const opportunityResearchExportResponseSchema = z.object({
  format: opportunityResearchExportFormatEnum,
  filename: z.string(),
  rows: z.array(opportunityResearchExportRowSchema),
  csv: z.string().optional(),
  caveat: z.string(),
});

export type OpportunityResearchStatus = z.infer<
  typeof opportunityResearchStatusEnum
>;
export type OpportunityResearchPriority = z.infer<
  typeof opportunityResearchPriorityEnum
>;
export type OpportunityResearchDecisionStatus = z.infer<
  typeof opportunityResearchDecisionStatusEnum
>;
export type OpportunityResearchDecisionReviewFilter = z.infer<
  typeof opportunityResearchDecisionReviewFilterEnum
>;
export type OpportunityResearchDailyActionId = z.infer<
  typeof opportunityResearchDailyActionIdEnum
>;
export type OpportunityResearchActionOutcomeFilter = z.infer<
  typeof opportunityResearchActionOutcomeFilterEnum
>;
export type OpportunityResearchExportFormat = z.infer<
  typeof opportunityResearchExportFormatEnum
>;
export type OpportunityResearchDecisionReview = z.infer<
  typeof opportunityResearchDecisionReviewSchema
>;
export type OpportunityResearchDecisionSnapshot = z.infer<
  typeof opportunityResearchDecisionSnapshotSchema
>;
export type OpportunityResearchDecision = z.infer<
  typeof opportunityResearchDecisionSchema
>;
export type OpportunityResearchActionOutcome = z.infer<
  typeof opportunityResearchActionOutcomeSchema
>;
export type OpportunityResearchDecisionRequest = z.infer<
  typeof opportunityResearchDecisionRequestSchema
>;
export type OpportunityResearchActionOutcomeRequest = z.infer<
  typeof opportunityResearchActionOutcomeRequestSchema
>;
export type OpportunityResearchEntry = z.infer<
  typeof opportunityResearchEntrySchema
>;
export type OpportunityResearchMetadata = z.infer<
  typeof opportunityResearchMetadataSchema
>;
export type OpportunityResearchReviewSummary = z.infer<
  typeof opportunityResearchReviewSummarySchema
>;
export type OpportunityResearchDailyActionFilter = z.infer<
  typeof opportunityResearchDailyActionFilterSchema
>;
export type OpportunityResearchDailyActionItem = z.infer<
  typeof opportunityResearchDailyActionItemSchema
>;
export type OpportunityResearchDailyActionPlan = z.infer<
  typeof opportunityResearchDailyActionPlanSchema
>;
export type OpportunityResearchPracticeSummary = z.infer<
  typeof opportunityResearchPracticeSummarySchema
>;
export type OpportunityResearchUpsert = z.infer<
  typeof opportunityResearchUpsertSchema
>;
export type OpportunityResearchUpdate = z.infer<
  typeof opportunityResearchUpdateSchema
>;
export type OpportunityResearchListQuery = z.infer<
  typeof opportunityResearchListQuerySchema
>;
export type OpportunityResearchComparisonRequest = z.infer<
  typeof opportunityResearchComparisonRequestSchema
>;
export type OpportunityResearchExportFilters = z.infer<
  typeof opportunityResearchExportFiltersSchema
>;
export type OpportunityResearchExportRequest = z.infer<
  typeof opportunityResearchExportRequestSchema
>;
export type OpportunityResearchExportRow = z.infer<
  typeof opportunityResearchExportRowSchema
>;
export type OpportunityResearchExportResponse = z.infer<
  typeof opportunityResearchExportResponseSchema
>;
