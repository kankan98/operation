import { z } from 'zod';
import { platformEnum } from './product.schema';
import {
  acquisitionFailureReasonSchema,
  acquisitionRootCauseSchema,
} from './scraper.schema';

export const marketSignalProviderEnum = z.enum(['keepa']);
export const marketSignalSourceEnum = z.enum(['third_party']);

export const marketSignalTrendDirectionEnum = z.enum([
  'up',
  'down',
  'stable',
  'unknown',
]);

export const marketSignalTrendSummarySchema = z.object({
  current: z.number().nullable().optional(),
  average: z.number().nullable().optional(),
  lowest: z.number().nullable().optional(),
  highest: z.number().nullable().optional(),
  changePercent: z.number().nullable().optional(),
  volatility: z.number().nullable().optional(),
  direction: marketSignalTrendDirectionEnum.default('unknown'),
  dataPoints: z.number().int().nonnegative(),
  firstObservedAt: z.number().nullable().optional(),
  lastObservedAt: z.number().nullable().optional(),
});

export const marketSignalSnapshotSchema = z.object({
  id: z.string(),
  productId: z.string(),
  platform: platformEnum,
  provider: marketSignalProviderEnum,
  source: marketSignalSourceEnum,
  asin: z.string(),
  marketplace: z.string(),
  windowDays: z.number().int().positive(),
  confidence: z.number().min(0).max(1),
  freshnessMs: z.number().nonnegative().nullable(),
  priceTrend: marketSignalTrendSummarySchema.nullable(),
  salesRankTrend: marketSignalTrendSummarySchema.nullable(),
  reviewVelocity: z.number().nullable(),
  ratingMovement: z.number().nullable(),
  missingSignals: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.number(),
});

export const marketSignalRefreshResultSchema = z.object({
  success: z.boolean(),
  productId: z.string(),
  provider: marketSignalProviderEnum,
  source: marketSignalSourceEnum,
  timestamp: z.number(),
  durationMs: z.number().nonnegative(),
  confidence: z.number().min(0).max(1).optional(),
  snapshotId: z.string().optional(),
  failureReason: acquisitionFailureReasonSchema.optional(),
  rootCause: acquisitionRootCauseSchema.optional(),
  diagnostics: z.record(z.unknown()).optional(),
  error: z.string().optional(),
});

export const marketSignalHealthStatusEnum = z.enum([
  'healthy',
  'degraded',
  'insufficient_history',
]);

export const marketSignalProviderHealthSchema = z.object({
  provider: marketSignalProviderEnum,
  source: marketSignalSourceEnum,
  platform: platformEnum,
  status: marketSignalHealthStatusEnum,
  window: z.object({
    windowHours: z.number(),
    since: z.number(),
    until: z.number(),
  }),
  attemptCount: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  successRate: z.number().min(0).max(1),
  averageDurationMs: z.number().nullable(),
  latestSuccessTimestamp: z.number().nullable(),
  latestFailureReason: acquisitionFailureReasonSchema.nullable(),
  failureReasons: z.record(z.number()),
  rootCauses: z.record(z.number()),
  recommendations: z.array(z.object({
    code: z.string(),
    severity: z.enum(['info', 'warning', 'critical']),
    message: z.string(),
  })),
});

export const marketSignalOpportunityFactorSchema = z.object({
  name: z.string(),
  label: z.string(),
  rawValue: z.union([z.number(), z.string(), z.boolean()]).nullable(),
  normalizedScore: z.number(),
  weight: z.number(),
  contribution: z.number(),
  direction: z.enum(['positive', 'negative', 'neutral']),
  source: marketSignalSourceEnum,
  freshnessMs: z.number().nonnegative().nullable(),
  confidenceImpact: z.number(),
  explanation: z.string(),
});

export const opportunityMarketSignalSummarySchema = z.object({
  status: z.enum(['fresh', 'stale', 'missing', 'failed']),
  provider: marketSignalProviderEnum.nullable(),
  source: marketSignalSourceEnum.nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  freshnessMs: z.number().nonnegative().nullable(),
  missingSignals: z.array(z.string()),
  caveat: z.string(),
  factors: z.array(marketSignalOpportunityFactorSchema),
});

export type MarketSignalProvider = z.infer<typeof marketSignalProviderEnum>;
export type MarketSignalSource = z.infer<typeof marketSignalSourceEnum>;
export type MarketSignalTrendDirection = z.infer<
  typeof marketSignalTrendDirectionEnum
>;
export type MarketSignalTrendSummary = z.infer<
  typeof marketSignalTrendSummarySchema
>;
export type MarketSignalSnapshot = z.infer<typeof marketSignalSnapshotSchema>;
export type MarketSignalRefreshResult = z.infer<
  typeof marketSignalRefreshResultSchema
>;
export type MarketSignalProviderHealth = z.infer<
  typeof marketSignalProviderHealthSchema
>;
export type MarketSignalOpportunityFactor = z.infer<
  typeof marketSignalOpportunityFactorSchema
>;
export type OpportunityMarketSignalSummary = z.infer<
  typeof opportunityMarketSignalSummarySchema
>;
