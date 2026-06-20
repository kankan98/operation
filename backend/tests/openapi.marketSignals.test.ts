import { describe, expect, it } from 'vitest';
import { generateOpenApiSpec } from '../src/openapi/registry';

describe('OpenAPI market signals', () => {
  it('documents product market signal endpoints and examples', () => {
    const spec = generateOpenApiSpec();
    const refresh =
      spec.paths['/api/products/{id}/market-signals/refresh']?.post;
    const latest = spec.paths['/api/products/{id}/market-signals/latest']?.get;
    const history =
      spec.paths['/api/products/{id}/market-signals/history']?.get;

    expect(refresh?.tags).toContain('Market Signals');
    expect(latest?.tags).toContain('Market Signals');
    expect(history?.tags).toContain('Market Signals');

    const refreshExamples =
      refresh?.responses?.['200']?.content?.['application/json']?.examples;
    expect(refreshExamples?.success?.value).toMatchObject({
      success: true,
      provider: 'keepa',
      source: 'third_party',
      snapshotId: 'market-signal-snapshot-1',
    });
    expect(refreshExamples?.providerUnavailable?.value).toMatchObject({
      success: false,
      failureReason: 'provider_unavailable',
      rootCause: 'missing_credentials',
    });
    expect(refreshExamples?.quotaExhausted?.value).toMatchObject({
      success: false,
      failureReason: 'provider_unavailable',
      rootCause: 'quota_exhausted',
      diagnostics: {
        tokensLeft: 0,
      },
    });
    expect(refreshExamples?.unsupportedProduct?.value).toMatchObject({
      success: false,
      failureReason: 'unsupported_product',
      rootCause: 'unsupported_product',
    });
    expect(refreshExamples?.insufficientHistory?.value).toMatchObject({
      success: false,
      rootCause: 'insufficient_history',
    });

    const latestExamples =
      latest?.responses?.['200']?.content?.['application/json']?.examples;
    expect(latestExamples?.fresh?.value.data).toMatchObject({
      provider: 'keepa',
      source: 'third_party',
      confidence: 0.82,
      metadata: {
        tokensLeft: 42,
      },
    });
    expect(latestExamples?.fresh?.value.caveat).toContain(
      'not verified sales'
    );
    expect(latestExamples?.fresh?.value.caveat).toContain(
      'profitability facts'
    );

    expect(history?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'limit',
          in: 'query',
        }),
      ])
    );
  });

  it('documents Keepa provider health without unsafe diagnostics', () => {
    const spec = generateOpenApiSpec();
    const health =
      spec.paths['/api/market-signals/providers/keepa/health']?.get;
    const examples =
      health?.responses?.['200']?.content?.['application/json']?.examples;

    expect(health?.tags).toContain('Market Signals');
    expect(examples?.healthy?.value).toMatchObject({
      provider: 'keepa',
      source: 'third_party',
      status: 'healthy',
    });
    expect(examples?.degraded?.value.rootCauses).toMatchObject({
      quota_exhausted: 1,
      auth_failed: 1,
      unsupported_product: 1,
    });
    expect(examples?.insufficientHistory?.value.status).toBe(
      'insufficient_history'
    );

    const refreshExamples =
      spec.paths['/api/products/{id}/market-signals/refresh']?.post
        ?.responses?.['200']?.content?.['application/json']?.examples;
    const serialized = JSON.stringify({
      healthExamples: examples,
      refreshExamples,
    });
    expect(serialized).not.toContain('key=');
    expect(serialized).not.toContain('keepa-key');
    expect(serialized).not.toContain('KEEPA_API_KEY');
    expect(serialized).not.toContain('Authorization');
    expect(serialized).not.toContain('rawPayload');
  });
});
