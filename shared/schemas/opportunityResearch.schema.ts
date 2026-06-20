import { z } from 'zod';
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
export const OPPORTUNITY_RESEARCH_COMPARISON_LIMIT = 6;
export const OPPORTUNITY_RESEARCH_EXPORT_LIMIT = 100;

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

export const opportunityResearchExportFormatEnum = z.enum(['csv', 'json']);

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

export const opportunityResearchEntrySchema = z.object({
  productId: z.string().min(1),
  status: opportunityResearchStatusEnum,
  priority: opportunityResearchPriorityEnum,
  tags: z
    .array(z.string().min(1).max(OPPORTUNITY_RESEARCH_MAX_TAG_LENGTH))
    .max(OPPORTUNITY_RESEARCH_MAX_TAGS),
  notes: opportunityResearchNotesSchema,
  archived: z.boolean(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const opportunityResearchMetadataSchema =
  opportunityResearchEntrySchema.extend({
    notesSummary: z
      .string()
      .max(OPPORTUNITY_RESEARCH_NOTES_SUMMARY_LENGTH)
      .nullable(),
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
export type OpportunityResearchExportFormat = z.infer<
  typeof opportunityResearchExportFormatEnum
>;
export type OpportunityResearchEntry = z.infer<
  typeof opportunityResearchEntrySchema
>;
export type OpportunityResearchMetadata = z.infer<
  typeof opportunityResearchMetadataSchema
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
