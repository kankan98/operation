import { describe, expect, it } from 'vitest';
import {
  rootCauseFromFailureReason,
  sanitizeProviderDiagnostics,
} from '../src/utils/providerDiagnostics';

describe('provider diagnostics utilities', () => {
  it('should preserve allowlisted observability fields and redact unsafe values', () => {
    const diagnostics = sanitizeProviderDiagnostics({
      rootCause: 'rate_limited',
      fallbackType: 'browser_fallback',
      marketplace: 'amazon.com',
      httpStatus: 429,
      providerMessage:
        'Quota reached for api_key=SECRET123 at https://api.rainforestapi.com/request?api_key=SECRET123&type=product',
      sanitizedMessage: '<html>token=TOKEN123 blocked</html>',
      providerErrors: {
        rawHtml: '<html>api_key=SECRET123</html>',
        url: 'https://api.rainforestapi.com/request?api_key=SECRET123',
      },
      providerFailures: [
        {
          provider: 'rainforest',
          source: 'third_party',
          failureReason: 'provider_unavailable',
          rootCause: 'quota_exhausted',
          error: 'api_key=SECRET123 quota reached',
          providerErrorCode: 'quota_or_rate_limit',
          marketplace: 'amazon.com',
          durationMs: 123,
        },
      ],
      rawPayload: { secret: 'SECRET123' },
      cookies: 'session=SECRET123',
    });

    expect(diagnostics).toMatchObject({
      rootCause: 'rate_limited',
      fallbackType: 'browser_fallback',
      marketplace: 'amazon.com',
      httpStatus: 429,
      providerFailures: [
        {
          provider: 'rainforest',
          source: 'third_party',
          failureReason: 'provider_unavailable',
          rootCause: 'quota_exhausted',
          providerErrorCode: 'quota_or_rate_limit',
          marketplace: 'amazon.com',
          durationMs: 123,
        },
      ],
    });
    const serialized = JSON.stringify(diagnostics);
    expect(serialized).not.toContain('SECRET123');
    expect(serialized).not.toContain('TOKEN123');
    expect(serialized).not.toContain('<html>');
    expect(serialized).not.toContain('?api_key=');
    expect(serialized).not.toContain('rawPayload');
    expect(serialized).not.toContain('cookies');
  });

  it('should map browser failure reasons into root causes', () => {
    expect(rootCauseFromFailureReason('captcha')).toBe('captcha_or_blocked');
    expect(rootCauseFromFailureReason('blocked')).toBe('captcha_or_blocked');
    expect(rootCauseFromFailureReason('selector_drift')).toBe('selector_drift');
    expect(rootCauseFromFailureReason('network_timeout')).toBe('network_timeout');
  });

  it('should redact eBay credential and token diagnostics', () => {
    const diagnostics = sanitizeProviderDiagnostics({
      rootCause: 'auth_failed',
      providerMessage:
        'client_id=EBAY_CLIENT client_secret=EBAY_SECRET access_token=TOKEN authorization: Bearer LIVE_TOKEN',
      finalUrl:
        'https://api.ebay.com/buy/browse/v1/item/v1%7C123%7C0?access_token=TOKEN&client_id=EBAY_CLIENT',
      providerFailures: [
        {
          provider: 'ebay-browse',
          source: 'official_api',
          failureReason: 'provider_unavailable',
          rootCause: 'auth_failed',
          error: 'Bearer LIVE_TOKEN rejected for client_secret=EBAY_SECRET',
          providerErrorCode: 'auth_failed',
          marketplace: 'EBAY_US',
          durationMs: 25,
        },
      ],
    });

    expect(diagnostics).toMatchObject({
      rootCause: 'auth_failed',
      finalUrl: 'https://api.ebay.com/buy/browse/v1/item/v1%7C123%7C0',
      providerFailures: [
        {
          provider: 'ebay-browse',
          source: 'official_api',
          failureReason: 'provider_unavailable',
          rootCause: 'auth_failed',
          providerErrorCode: 'auth_failed',
          marketplace: 'EBAY_US',
        },
      ],
    });
    const serialized = JSON.stringify(diagnostics);
    expect(serialized).not.toContain('EBAY_CLIENT');
    expect(serialized).not.toContain('EBAY_SECRET');
    expect(serialized).not.toContain('LIVE_TOKEN');
    expect(serialized).not.toContain('access_token=TOKEN');
  });

  it('should preserve safe Keepa diagnostics and redact credentials', () => {
    const diagnostics = sanitizeProviderDiagnostics({
      rootCause: 'quota_exhausted',
      providerMessage:
        'Keepa quota exceeded for api_key=KEEPA_SECRET authorization: Bearer KEEPA_TOKEN',
      finalUrl:
        'https://api.keepa.com/product?key=KEEPA_SECRET&domain=1&asin=B000TEST01',
      keepaAsin: 'B000TEST01',
      windowDays: 90,
      tokensLeft: 0,
      refillIn: 600,
      providerFailures: [
        {
          provider: 'keepa',
          source: 'third_party',
          failureReason: 'provider_unavailable',
          rootCause: 'quota_exhausted',
          error: 'key=KEEPA_SECRET token=KEEPA_TOKEN quota exceeded',
          providerErrorCode: 'quota_exhausted',
          marketplace: 'amazon.com',
          durationMs: 42,
        },
      ],
    });

    expect(diagnostics).toMatchObject({
      rootCause: 'quota_exhausted',
      finalUrl: 'https://api.keepa.com/product',
      keepaAsin: 'B000TEST01',
      windowDays: 90,
      tokensLeft: 0,
      refillIn: 600,
    });
    const serialized = JSON.stringify(diagnostics);
    expect(serialized).not.toContain('KEEPA_SECRET');
    expect(serialized).not.toContain('KEEPA_TOKEN');
    expect(serialized).not.toContain('key=KEEPA_SECRET');
  });
});
