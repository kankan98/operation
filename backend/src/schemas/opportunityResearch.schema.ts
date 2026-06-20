import { z } from 'zod';
import {
  opportunityResearchComparisonRequestSchema,
  opportunityResearchComparisonResponseSchema,
  opportunityResearchEntrySchema,
  opportunityResearchExportRequestSchema,
  opportunityResearchExportResponseSchema,
  opportunityResearchListQuerySchema,
  opportunityResearchMetadataSchema,
  opportunityResearchUpdateSchema,
  opportunityResearchUpsertSchema,
} from '@shared/schemas';

export const opportunityResearchProductParamsSchema = z.object({
  productId: z.string().min(1),
});

export const opportunityResearchEntryResponseSchema = z.object({
  data: opportunityResearchEntrySchema,
});

export const opportunityResearchNullableEntryResponseSchema = z.object({
  data: opportunityResearchMetadataSchema.nullable(),
});

export const opportunityResearchListResponseSchema = z.object({
  data: z.array(opportunityResearchMetadataSchema),
  total: z.number(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export {
  opportunityResearchComparisonRequestSchema,
  opportunityResearchComparisonResponseSchema,
  opportunityResearchEntrySchema,
  opportunityResearchExportRequestSchema,
  opportunityResearchExportResponseSchema,
  opportunityResearchListQuerySchema,
  opportunityResearchMetadataSchema,
  opportunityResearchUpdateSchema,
  opportunityResearchUpsertSchema,
};
