import { describe, expect, it } from 'vitest';
import {
  acquisitionRootCauseSchema,
  providerHealthResponseSchema,
  scrapeResultSchema,
} from '@shared/schemas';

describe('shared scraper schemas', () => {
  it('keeps existing Amazon acquisition responses valid', () => {
    const result = scrapeResultSchema.safeParse({
      success: true,
      productId: 'amazon-product',
      jobId: 'job-1',
      attemptId: 'attempt-1',
      snapshotId: 'snapshot-1',
      provider: 'rainforest',
      source: 'third_party',
      confidence: 0.92,
      timestamp: 123456,
    });

    expect(result.success).toBe(true);
  });

  it('accepts eBay provider metadata and bounded diagnostics', () => {
    const result = scrapeResultSchema.safeParse({
      success: false,
      productId: 'ebay-product',
      attemptId: 'attempt-2',
      provider: 'ebay-browse',
      source: 'official_api',
      failureReason: 'unsupported_url',
      diagnostics: {
        rootCause: 'unsupported_url',
        marketplace: 'EBAY_US',
        sanitizedMessage: 'eBay item URL does not contain a supported item ID',
      },
      timestamp: 123456,
    });

    expect(result.success).toBe(true);
    expect(acquisitionRootCauseSchema.parse('missing_credentials')).toBe(
      'missing_credentials'
    );
    expect(acquisitionRootCauseSchema.parse('auth_failed')).toBe('auth_failed');
  });

  it('accepts eBay provider health recommendations without requiring eBay fields for Amazon', () => {
    const result = providerHealthResponseSchema.safeParse({
      platform: 'ebay',
      status: 'degraded',
      window: {
        windowHours: 24,
        since: 100,
        until: 200,
      },
      providerSummaries: [
        {
          provider: 'ebay-browse',
          source: 'official_api',
          attemptCount: 1,
          successCount: 0,
          failureCount: 1,
          successRate: 0,
          averageDurationMs: 50,
          latestSuccessTimestamp: null,
          latestFailureReason: 'provider_unavailable',
          latestConfidence: null,
          fallbackCount: 0,
          cacheCount: 0,
          failureReasons: {
            provider_unavailable: 1,
          },
          rootCauses: {
            missing_credentials: 1,
          },
        },
      ],
      chainSummary: {
        totalAttempts: 1,
        liveSuccessCount: 0,
        liveFailureCount: 1,
        browserFallbackCount: 0,
        cacheFallbackCount: 0,
        primaryFailureCount: 1,
        degradedPathCounts: {
          all_failed: 1,
        },
        rootCauses: {
          missing_credentials: 1,
        },
      },
      latestAttempts: [
        {
          id: 'attempt-2',
          productId: 'ebay-product',
          provider: 'ebay-browse',
          source: 'official_api',
          status: 'failed',
          failureReason: 'provider_unavailable',
          durationMs: 50,
          confidence: null,
          rootCause: 'missing_credentials',
          marketplace: 'EBAY_US',
          httpStatus: null,
          fallbackType: 'all_failed',
          sanitizedMessage: 'Configure eBay credentials',
          timestamp: 200,
        },
      ],
      recommendations: [
        {
          code: 'configure_ebay',
          severity: 'critical',
          message: 'Configure EBAY_CLIENT_ID and EBAY_CLIENT_SECRET.',
        },
      ],
    });

    expect(result.success).toBe(true);
  });
});
