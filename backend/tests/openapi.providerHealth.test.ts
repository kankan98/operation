import { describe, expect, it } from 'vitest';
import { generateOpenApiSpec } from '../src/openapi/registry';

describe('OpenAPI provider health', () => {
  it('should include Amazon provider health endpoint', () => {
    const spec = generateOpenApiSpec();
    const path = spec.paths['/api/scraper/providers/amazon/health'];

    expect(path?.get).toBeDefined();
    expect(path?.get?.tags).toContain('Scraper');
    expect(path?.get?.responses?.['200']).toBeDefined();
    const examples =
      path?.get?.responses?.['200']?.content?.['application/json']?.examples;
    expect(examples?.degraded?.value.chainSummary.rootCauses).toEqual({
      quota_exhausted: 1,
      rate_limited: 1,
    });
    expect(examples?.degraded?.value.latestAttempts[0]).toMatchObject({
      fallbackType: 'browser_fallback',
    });
    expect(examples?.cacheFallback?.value.latestAttempts[0]).toMatchObject({
      provider: 'cache',
      rootCause: 'cache_only',
      fallbackType: 'cache_fallback',
    });
  });

  it('should include eBay acquisition and provider health examples', () => {
    const spec = generateOpenApiSpec();
    const scrapeExamples =
      spec.paths['/api/scraper/product/{productId}']?.post?.responses?.['200']
        ?.content?.['application/json']?.examples;
    const healthExamples =
      spec.paths['/api/scraper/providers/{platform}/health']?.get?.responses?.['200']
        ?.content?.['application/json']?.examples;

    expect(scrapeExamples?.ebaySuccess?.value).toMatchObject({
      success: true,
      provider: 'ebay-browse',
      source: 'official_api',
      confidence: 0.95,
      data: {
        price: 29.99,
        currency: 'USD',
      },
    });
    expect(scrapeExamples?.ebayProviderUnavailable?.value).toMatchObject({
      success: false,
      provider: 'ebay-browse',
      source: 'official_api',
      failureReason: 'provider_unavailable',
      diagnostics: {
        rootCause: 'missing_credentials',
      },
    });
    expect(healthExamples?.ebayDegraded?.value).toMatchObject({
      platform: 'ebay',
      status: 'degraded',
      providerSummaries: [
        {
          provider: 'ebay-browse',
          source: 'official_api',
        },
      ],
    });
    expect(healthExamples?.ebayInsufficientHistory?.value.status).toBe(
      'insufficient_history'
    );
    expect(JSON.stringify(healthExamples)).not.toContain('access_token');
    expect(JSON.stringify(healthExamples)).not.toContain('client_secret');
    expect(JSON.stringify(healthExamples)).not.toContain('Authorization');
  });
});
