import { z } from 'zod';

// Scrape Result Schema
export const acquisitionFailureReasonSchema = z.enum([
  'network_timeout',
  'blocked',
  'captcha',
  'geo_restricted',
  'not_found',
  'price_missing',
  'selector_drift',
  'provider_unavailable',
  'unsupported_platform',
  'unsupported_product',
  'unsupported_url',
  'unknown',
]);

export const acquisitionRootCauseSchema = z.enum([
  'missing_api_key',
  'missing_credentials',
  'invalid_key',
  'auth_failed',
  'quota_exhausted',
  'rate_limited',
  'marketplace_mismatch',
  'captcha_or_blocked',
  'selector_drift',
  'cache_only',
  'insufficient_history',
  'network_timeout',
  'not_found',
  'price_missing',
  'unsupported_platform',
  'unsupported_product',
  'unsupported_url',
  'unknown',
  'insufficient_diagnostics',
]);

export const acquisitionFallbackTypeSchema = z.enum([
  'primary_live',
  'browser_fallback',
  'cache_fallback',
  'all_failed',
]);

export const scrapeResultSchema = z.object({
  success: z.boolean(),
  productId: z.string().optional(),
  jobId: z.string().optional(),
  attemptId: z.string().optional(),
  snapshotId: z.string().optional(),
  provider: z.string().optional(),
  source: z.string().optional(),
  confidence: z.number().optional(),
  data: z.object({
    price: z.number(),
    currency: z.string(),
    availability: z.string(),
    title: z.string().optional(),
    rating: z.number().optional(),
    reviewCount: z.number().optional(),
    imageUrl: z.string().optional(),
    salesRank: z.number().optional(),
    shippingCost: z.number().optional(),
    seller: z.string().optional(),
    condition: z.string().optional(),
  }).optional(),
  failureReason: acquisitionFailureReasonSchema.optional(),
  diagnostics: z.record(z.unknown()).optional(),
  error: z.string().optional(),
  timestamp: z.number().optional(),
});

// Scrape All Results Schema
export const scrapeJobReferenceSchema = z.object({
  jobId: z.string(),
  productId: z.string(),
  status: z.string(),
  created: z.boolean(),
});

export const scrapeAllResultsSchema = z.object({
  total: z.number(),
  queued: z.number(),
  skipped: z.number(),
  jobs: z.array(scrapeJobReferenceSchema),
});

export const scrapeAttemptSchema = z.object({
  id: z.string(),
  jobId: z.string().nullable().optional(),
  productId: z.string(),
  provider: z.string(),
  source: z.string(),
  status: z.string(),
  failureReason: acquisitionFailureReasonSchema.nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  durationMs: z.number(),
  confidence: z.number().nullable().optional(),
  httpStatus: z.number().nullable().optional(),
  pageTitle: z.string().nullable().optional(),
  finalUrl: z.string().nullable().optional(),
  diagnostics: z.string().nullable().optional(),
  timestamp: z.number(),
});

export const scrapeJobSchema = z.object({
  id: z.string(),
  productId: z.string(),
  status: z.string(),
  priority: z.number(),
  nextRunAt: z.number(),
  attemptCount: z.number(),
  maxAttempts: z.number(),
  lastAttemptId: z.string().nullable().optional(),
  lastFailureReason: acquisitionFailureReasonSchema.nullable().optional(),
  leaseOwner: z.string().nullable().optional(),
  leaseExpiresAt: z.number().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
  completedAt: z.number().nullable().optional(),
  metadata: z.string().nullable().optional(),
});

export const providerHealthQuerySchema = z.object({
  windowHours: z.coerce.number().int().min(1).max(24 * 30).default(24),
  productId: z.string().optional(),
  provider: z.string().optional(),
});

export const providerHealthRecommendationSchema = z.object({
  code: z.enum([
    'configure_rainforest',
    'check_quota',
    'reduce_fallback_reliance',
    'refresh_stale_data',
    'investigate_browser_blocking',
    'configure_ebay',
    'check_ebay_credentials',
    'check_ebay_marketplace',
    'check_ebay_item_id',
    'configure_keepa',
    'check_keepa_credentials',
    'check_keepa_quota',
    'check_market_signal_identifier',
    'refresh_market_signals',
    'investigate_unknown_failures',
  ]),
  severity: z.enum(['info', 'warning', 'critical']),
  message: z.string(),
});

export const providerHealthSummarySchema = z.object({
  provider: z.string(),
  source: z.string(),
  attemptCount: z.number(),
  successCount: z.number(),
  failureCount: z.number(),
  successRate: z.number(),
  averageDurationMs: z.number().nullable(),
  latestSuccessTimestamp: z.number().nullable(),
  latestFailureReason: acquisitionFailureReasonSchema.nullable(),
  latestConfidence: z.number().nullable(),
  fallbackCount: z.number(),
  cacheCount: z.number(),
  failureReasons: z.record(z.number()),
  rootCauses: z.record(z.number()),
});

export const providerHealthAttemptSchema = z.object({
  id: z.string(),
  productId: z.string(),
  provider: z.string(),
  source: z.string(),
  status: z.string(),
  failureReason: acquisitionFailureReasonSchema.nullable(),
  durationMs: z.number(),
  confidence: z.number().nullable(),
  rootCause: acquisitionRootCauseSchema.nullable(),
  marketplace: z.string().nullable(),
  httpStatus: z.number().nullable(),
  fallbackType: acquisitionFallbackTypeSchema.nullable(),
  sanitizedMessage: z.string().nullable(),
  timestamp: z.number(),
  diagnostics: z.record(z.unknown()).optional(),
});

export const providerHealthResponseSchema = z.object({
  platform: z.string(),
  status: z.enum(['healthy', 'degraded', 'insufficient_history']),
  window: z.object({
    windowHours: z.number(),
    since: z.number(),
    until: z.number(),
  }),
  providerSummaries: z.array(providerHealthSummarySchema),
  chainSummary: z.object({
    totalAttempts: z.number(),
    liveSuccessCount: z.number(),
    liveFailureCount: z.number(),
    browserFallbackCount: z.number(),
    cacheFallbackCount: z.number(),
    primaryFailureCount: z.number(),
    degradedPathCounts: z.record(z.number()),
    rootCauses: z.record(z.number()),
  }),
  latestAttempts: z.array(providerHealthAttemptSchema),
  recommendations: z.array(providerHealthRecommendationSchema),
});

// Export types
export type ScrapeResult = z.infer<typeof scrapeResultSchema>;
export type ScrapeAllResults = z.infer<typeof scrapeAllResultsSchema>;
export type ScrapeAttempt = z.infer<typeof scrapeAttemptSchema>;
export type ScrapeJob = z.infer<typeof scrapeJobSchema>;
export type ProviderHealthQuery = z.infer<typeof providerHealthQuerySchema>;
export type ProviderHealthResponse = z.infer<typeof providerHealthResponseSchema>;
