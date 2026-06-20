import { z } from 'zod';

const nullableMoneySchema = z
  .number()
  .nonnegative()
  .nullable()
  .optional();

export const businessMetricPriceSourceEnum = z.enum([
  'target',
  'current_price',
  'missing',
]);

export const businessSignalCompletenessEnum = z.enum([
  'none',
  'partial',
  'complete',
]);

export const businessReadinessEnum = z.enum([
  'any',
  'none',
  'partial',
  'complete',
]);

export const productBusinessSignalUpsertSchema = z.object({
  currency: z.string().trim().length(3).transform((value) => value.toUpperCase()),
  costBasis: nullableMoneySchema,
  inboundShipping: nullableMoneySchema,
  outboundShipping: nullableMoneySchema,
  fulfillmentFee: nullableMoneySchema,
  platformFee: nullableMoneySchema,
  referralFeeRate: z.number().min(0).max(1).nullable().optional(),
  advertisingCost: nullableMoneySchema,
  taxCustomsBuffer: nullableMoneySchema,
  targetSellPrice: nullableMoneySchema,
  targetUnits: z.number().int().nonnegative().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const productBusinessSignalSchema =
  productBusinessSignalUpsertSchema.extend({
    productId: z.string(),
    createdAt: z.number(),
    updatedAt: z.number(),
  });

export const businessMetricInputsSchema = z.object({
  sellPrice: z.number().nullable(),
  costBasis: z.number().nullable(),
  inboundShipping: z.number().nullable(),
  outboundShipping: z.number().nullable(),
  fulfillmentFee: z.number().nullable(),
  platformFee: z.number().nullable(),
  referralFeeRate: z.number().nullable(),
  referralFee: z.number().nullable(),
  advertisingCost: z.number().nullable(),
  taxCustomsBuffer: z.number().nullable(),
});

export const businessMetricsSchema = z.object({
  currency: z.string(),
  priceSource: businessMetricPriceSourceEnum,
  completeness: businessSignalCompletenessEnum,
  missingSignals: z.array(z.string()),
  totalVariableCost: z.number().nullable(),
  grossMargin: z.number().nullable(),
  netMargin: z.number().nullable(),
  roi: z.number().nullable(),
  breakevenSellPrice: z.number().nullable(),
  contributionProfitPerUnit: z.number().nullable(),
  targetUnits: z.number().nullable(),
  projectedContributionProfit: z.number().nullable(),
  inputs: businessMetricInputsSchema,
  caveat: z.string(),
});

export const productBusinessSignalResponseSchema = z.object({
  data: z.object({
    assumptions: productBusinessSignalSchema.nullable(),
    metrics: businessMetricsSchema,
  }),
});

export const opportunityBusinessSummarySchema = z.object({
  completeness: businessSignalCompletenessEnum,
  missingSignals: z.array(z.string()),
  metrics: businessMetricsSchema.nullable(),
  caveat: z.string(),
});

export type BusinessMetricPriceSource = z.infer<
  typeof businessMetricPriceSourceEnum
>;
export type BusinessSignalCompleteness = z.infer<
  typeof businessSignalCompletenessEnum
>;
export type BusinessReadiness = z.infer<typeof businessReadinessEnum>;
export type ProductBusinessSignalUpsert = z.infer<
  typeof productBusinessSignalUpsertSchema
>;
export type ProductBusinessSignal = z.infer<
  typeof productBusinessSignalSchema
>;
export type BusinessMetricInputs = z.infer<typeof businessMetricInputsSchema>;
export type BusinessMetrics = z.infer<typeof businessMetricsSchema>;
export type ProductBusinessSignalResponse = z.infer<
  typeof productBusinessSignalResponseSchema
>;
export type OpportunityBusinessSummary = z.infer<
  typeof opportunityBusinessSummarySchema
>;
