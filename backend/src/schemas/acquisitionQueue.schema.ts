import { z } from 'zod';
import {
  acquisitionJobCancelRequestSchema,
  acquisitionJobRetryRequestSchema,
  acquisitionProductJobDiagnosticsQuerySchema,
  acquisitionQueueHealthQuerySchema,
  acquisitionWorkerHealthQuerySchema,
} from '@shared/schemas';

export const acquisitionQueueHealthFiltersSchema =
  acquisitionQueueHealthQuerySchema;
export const acquisitionWorkerHealthFiltersSchema =
  acquisitionWorkerHealthQuerySchema;
export const productJobDiagnosticsFiltersSchema =
  acquisitionProductJobDiagnosticsQuerySchema;

export const jobIdParamSchema = z.object({
  jobId: z.string().min(1),
});

export const productIdParamSchema = z.object({
  productId: z.string().min(1),
});

export const retryJobRequestSchema = acquisitionJobRetryRequestSchema.omit({
  jobId: true,
});

export const cancelJobRequestSchema = acquisitionJobCancelRequestSchema.omit({
  jobId: true,
});

export * from '@shared/schemas';
