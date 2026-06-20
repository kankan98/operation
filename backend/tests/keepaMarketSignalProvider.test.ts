import { describe, expect, it, vi } from 'vitest';
import { KeepaMarketSignalProvider } from '../src/providers/keepaMarketSignalProvider';
import { Product } from '../src/types';

const NOW = 1_800_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    platform: 'amazon',
    productUrl: 'https://www.amazon.com/dp/B000TEST01',
    asin: 'B000TEST01',
    title: 'Existing Amazon Product',
    currency: 'USD',
    isMonitoring: true,
    checkInterval: 24,
    createdAt: NOW - DAY,
    ...overrides,
  };
}

function response(payload: unknown, options: { ok?: boolean; status?: number } = {}) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => payload,
  };
}

function createFetchSequence(...responses: Array<unknown>) {
  return vi.fn(async () => {
    const next = responses.shift();
    if (next instanceof Error) {
      throw next;
    }
    return next;
  }) as unknown as typeof fetch;
}

function keepaPayload(overrides: Record<string, unknown> = {}) {
  return response({
    tokensLeft: 48,
    refillIn: 250,
    products: [
      {
        asin: 'B000TEST01',
        title: 'Keepa Product',
        priceHistory: [
          { timestamp: NOW - 30 * DAY, value: 39.99 },
          { timestamp: NOW - 10 * DAY, value: 34.99 },
          { timestamp: NOW - DAY, value: 29.99 },
        ],
        salesRankHistory: [
          { timestamp: NOW - 30 * DAY, value: 2200 },
          { timestamp: NOW - 10 * DAY, value: 1600 },
          { timestamp: NOW - DAY, value: 1200 },
        ],
        reviewCountHistory: [
          { timestamp: NOW - 30 * DAY, value: 100 },
          { timestamp: NOW - DAY, value: 129 },
        ],
        ratingHistory: [
          { timestamp: NOW - 30 * DAY, value: 4.2 },
          { timestamp: NOW - DAY, value: 4.4 },
        ],
        ...overrides,
      },
    ],
  });
}

function createProvider(fetchImpl: typeof fetch, overrides = {}) {
  return new KeepaMarketSignalProvider({
    apiKey: 'keepa-key',
    fetchImpl,
    timeoutMs: 1000,
    now: () => NOW,
    ...overrides,
  });
}

describe('KeepaMarketSignalProvider', () => {
  it('returns provider_unavailable without network calls when credentials are missing', async () => {
    const fetchImpl = createFetchSequence();
    const provider = new KeepaMarketSignalProvider({
      apiKey: '',
      fetchImpl,
      now: () => NOW,
    });

    const result = await provider.fetchMarketSignals(createProduct());

    expect(result.success).toBe(false);
    expect(result.provider).toBe('keepa');
    expect(result.source).toBe('third_party');
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.rootCause).toBe('missing_credentials');
    expect(result.diagnostics?.rootCause).toBe('missing_credentials');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns provider_unavailable when Keepa is disabled', async () => {
    const fetchImpl = createFetchSequence();
    const provider = new KeepaMarketSignalProvider({
      enabled: false,
      apiKey: 'keepa-key',
      fetchImpl,
      now: () => NOW,
    });

    const result = await provider.fetchMarketSignals(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.diagnostics?.providerErrorCode).toBe('provider_disabled');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps successful Keepa history into bounded market signal snapshot data', async () => {
    const fetchImpl = createFetchSequence(keepaPayload());
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchMarketSignals(createProduct());

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected success');

    expect(result.snapshot).toMatchObject({
      productId: 'product-1',
      platform: 'amazon',
      provider: 'keepa',
      source: 'third_party',
      asin: 'B000TEST01',
      marketplace: 'amazon.com',
      windowDays: 90,
      missingSignals: [],
    });
    expect(result.snapshot.priceTrend?.current).toBe(29.99);
    expect(result.snapshot.salesRankTrend?.direction).toBe('down');
    expect(result.snapshot.reviewVelocity).toBeGreaterThan(0);
    expect(result.snapshot.ratingMovement).toBeCloseTo(0.2);
    expect(result.diagnostics).toMatchObject({
      keepaAsin: 'B000TEST01',
      windowDays: 90,
      tokensLeft: 48,
    });
    expect(String(vi.mocked(fetchImpl).mock.calls[0][0])).toContain(
      '/product?key=keepa-key'
    );
  });

  it('uses safe metadata ASIN when product ASIN is unavailable', async () => {
    const fetchImpl = createFetchSequence(keepaPayload());
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchMarketSignals(
      createProduct({
        asin: '',
        metadata: JSON.stringify({ keepaAsin: 'B000META01' }),
      })
    );

    expect(result.success).toBe(true);
    expect(String(vi.mocked(fetchImpl).mock.calls[0][0])).toContain(
      'asin=B000META01'
    );
  });

  it('returns unsupported_product without title search when ASIN is unavailable', async () => {
    const fetchImpl = createFetchSequence();
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchMarketSignals(
      createProduct({
        asin: '',
        productUrl: 'https://www.amazon.com/s?k=wireless+mouse',
      })
    );

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('unsupported_product');
    expect(result.rootCause).toBe('unsupported_product');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps auth failures and redacts Keepa secrets', async () => {
    const fetchImpl = createFetchSequence(
      response(
        {
          error: {
            message:
              'Invalid key api_key=SECRET123 authorization: Bearer TOKEN123',
          },
        },
        { ok: false, status: 401 }
      )
    );
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchMarketSignals(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.rootCause).toBe('auth_failed');
    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain('SECRET123');
    expect(serialized).not.toContain('TOKEN123');
  });

  it.each([
    [429, 'Rate limit reached', 'rate_limited', 'provider_unavailable'],
    [402, 'Token quota exceeded', 'quota_exhausted', 'provider_unavailable'],
    [404, 'Product not found', 'not_found', 'not_found'],
    [400, 'Unsupported ASIN', 'unsupported_product', 'unsupported_product'],
  ])(
    'maps Keepa HTTP %s failures',
    async (status, message, rootCause, failureReason) => {
      const fetchImpl = createFetchSequence(
        response({ error: { message } }, { ok: false, status: Number(status) })
      );
      const provider = createProvider(fetchImpl);

      const result = await provider.fetchMarketSignals(createProduct());

      expect(result.success).toBe(false);
      expect(result.failureReason).toBe(failureReason);
      expect(result.rootCause).toBe(rootCause);
      expect(result.diagnostics?.httpStatus).toBe(status);
    }
  );

  it('returns insufficient_history when no usable trend signals are available', async () => {
    const fetchImpl = createFetchSequence(
      keepaPayload({
        priceHistory: [],
        salesRankHistory: [],
        reviewCountHistory: [],
        ratingHistory: [],
      })
    );
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchMarketSignals(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('unknown');
    expect(result.rootCause).toBe('insufficient_history');
    expect(result.diagnostics?.rootCause).toBe('insufficient_history');
  });

  it('maps aborted requests to network_timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    const fetchImpl = createFetchSequence(abortError);
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchMarketSignals(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('network_timeout');
    expect(result.rootCause).toBe('network_timeout');
  });
});
