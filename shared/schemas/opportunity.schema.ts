import { z } from 'zod';
import {
  businessReadinessEnum,
  opportunityBusinessSummarySchema,
} from './businessSignal.schema';
import { opportunityMarketSignalSummarySchema } from './marketSignal.schema';
import { opportunityResearchMetadataSchema } from './opportunityResearch.schema';
import { platformEnum, productResponseSchema } from './product.schema';

const booleanQuerySchema = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

export const opportunityRecommendationEnum = z.enum([
  'watch',
  'investigate',
  'check_data',
  'ignore',
]);

export const opportunityFactorDirectionEnum = z.enum([
  'positive',
  'negative',
  'neutral',
]);

export const opportunitySortByEnum = z.enum(['score', 'confidence']);
export const sortOrderEnum = z.enum(['asc', 'desc']);

export const opportunityFactorSchema = z.object({
  name: z.string(),
  label: z.string(),
  rawValue: z.union([z.number(), z.string(), z.boolean()]).nullable(),
  normalizedScore: z.number(),
  weight: z.number(),
  contribution: z.number(),
  direction: opportunityFactorDirectionEnum,
  explanation: z.string(),
});

export const opportunityAcquisitionHealthSchema = z.object({
  provider: z.string().nullable(),
  source: z.string().nullable(),
  status: z.string().nullable(),
  failureReason: z.string().nullable(),
  confidence: z.number().nullable(),
  durationMs: z.number().nullable(),
  timestamp: z.number().nullable(),
  freshnessMs: z.number().nullable(),
});

export const productOpportunitySchema = z.object({
  product: productResponseSchema,
  score: z.number(),
  confidence: z.number(),
  recommendation: opportunityRecommendationEnum,
  keyReasons: z.array(z.string()),
  missingSignals: z.array(z.string()),
  factors: z.array(opportunityFactorSchema),
  acquisitionHealth: opportunityAcquisitionHealthSchema,
  businessSignals: opportunityBusinessSummarySchema,
  marketSignals: opportunityMarketSignalSummarySchema.optional(),
  research: opportunityResearchMetadataSchema.optional(),
});

export const opportunityListQuerySchema = z.object({
  platform: platformEnum.optional(),
  category: z.string().optional(),
  monitoring: booleanQuerySchema.optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  minRoi: z.coerce.number().optional(),
  businessReadiness: businessReadinessEnum.default('any'),
  recommendation: opportunityRecommendationEnum.optional(),
  shortlisted: booleanQuerySchema.optional(),
  researchStatus: z
    .enum(['researching', 'watching', 'ready', 'rejected'])
    .optional(),
  researchTag: z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(z.string().min(1).max(32))
    .optional(),
  sortBy: opportunitySortByEnum.default('score'),
  sortOrder: sortOrderEnum.default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const opportunityListResponseSchema = z.object({
  data: z.array(productOpportunitySchema),
  total: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export const productOpportunityResponseSchema = z.object({
  data: productOpportunitySchema,
});

export const opportunityResearchComparisonResponseSchema = z.object({
  data: z.array(productOpportunitySchema),
  selectedProductIds: z.array(z.string()),
  comparedAt: z.number(),
  caveats: z.object({
    marketSignals: z.string(),
    businessSignals: z.string(),
    score: z.string(),
  }),
});

export type OpportunityRecommendation = z.infer<
  typeof opportunityRecommendationEnum
>;
export type OpportunityFactor = z.infer<typeof opportunityFactorSchema>;
export type OpportunityAcquisitionHealth = z.infer<
  typeof opportunityAcquisitionHealthSchema
>;
export type ProductOpportunity = z.infer<typeof productOpportunitySchema>;
export type OpportunityListQuery = z.infer<typeof opportunityListQuerySchema>;
export type OpportunityListResponse = z.infer<
  typeof opportunityListResponseSchema
>;
export type ProductOpportunityResponse = z.infer<
  typeof productOpportunityResponseSchema
>;
export type OpportunityResearchComparisonResponse = z.infer<
  typeof opportunityResearchComparisonResponseSchema
>;
