import { describe, it, expect } from 'vitest';
import { ProductDataProviderRouter } from '../src/providers/productDataProviderRouter';
import {
  ProductDataProvider,
  createAcquisitionFailure,
  createAcquisitionSuccess,
} from '../src/providers/productDataProvider';
import { EbayBrowseProvider } from '../src/providers/ebayBrowseProvider';
import { Product } from '../src/types';

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    platform: 'amazon',
    productUrl: 'https://amazon.com/dp/B000000001',
    asin: 'B000000001',
    title: 'Test Product',
    currentPrice: undefined,
    currency: 'USD',
    isMonitoring: true,
    checkInterval: 24,
    createdAt: Date.now(),
    ...overrides,
  };
}

function createProvider(
  overrides: Partial<ProductDataProvider> & {
    result: 'success' | 'failure';
    calls: string[];
  }
): ProductDataProvider {
  return {
    name: overrides.name ?? 'amazon-browser',
    source: overrides.source ?? 'browser',
    supports: overrides.supports ?? ((product) => product.platform === 'amazon'),
    fetchProduct: async (product) => {
      overrides.calls.push(overrides.name ?? 'amazon-browser');
      const startedAt = Date.now();
      if (overrides.result === 'success') {
        return createAcquisitionSuccess({
          provider: overrides.name ?? 'amazon-browser',
          source: overrides.source ?? 'browser',
          startedAt,
          confidence: 0.9,
          data: {
            price: 99.99,
            currency: product.currency,
            availability: 'In Stock',
            title: product.title,
          },
        });
      }

      return createAcquisitionFailure({
        provider: overrides.name ?? 'amazon-browser',
        source: overrides.source ?? 'browser',
        startedAt,
        failureReason: 'provider_unavailable',
        error: 'Provider unavailable',
      });
    },
  };
}

describe('ProductDataProviderRouter', () => {
  it('should select provider according to configured provider order', async () => {
    const calls: string[] = [];
    const browserProvider = createProvider({
      name: 'amazon-browser',
      source: 'browser',
      result: 'success',
      calls,
    });
    const apiProvider = createProvider({
      name: 'rainforest',
      source: 'third_party',
      result: 'success',
      calls,
    });

    const router = new ProductDataProviderRouter(
      [browserProvider, apiProvider],
      { providerOrder: ['rainforest', 'amazon-browser'] }
    );

    const result = await router.acquireProduct(createProduct());

    expect(result.success).toBe(true);
    expect(result.provider).toBe('rainforest');
    expect(calls).toEqual(['rainforest']);
  });

  it('should fall back to next provider when primary provider fails', async () => {
    const calls: string[] = [];
    const apiProvider = createProvider({
      name: 'rainforest',
      source: 'third_party',
      result: 'failure',
      calls,
    });
    const browserProvider = createProvider({
      name: 'amazon-browser',
      source: 'browser',
      result: 'success',
      calls,
    });

    const router = new ProductDataProviderRouter(
      [apiProvider, browserProvider],
      { providerOrder: ['rainforest', 'amazon-browser'] }
    );

    const result = await router.acquireProduct(createProduct());

    expect(result.success).toBe(true);
    expect(result.provider).toBe('amazon-browser');
    expect(result.diagnostics?.degraded).toBe(true);
    expect(result.diagnostics?.primaryProviderFailed).toBe(true);
    expect(result.diagnostics?.fallbackType).toBe('browser_fallback');
    expect(result.diagnostics?.providerFailures).toMatchObject([
      {
        provider: 'rainforest',
        source: 'third_party',
        failureReason: 'provider_unavailable',
        rootCause: 'insufficient_diagnostics',
        error: 'Provider unavailable',
      },
    ]);
    expect(calls).toEqual(['rainforest', 'amazon-browser']);
  });

  it('should return unsupported platform when no provider supports the product', async () => {
    const calls: string[] = [];
    const router = new ProductDataProviderRouter(
      [
        createProvider({
          name: 'amazon-browser',
          source: 'browser',
          result: 'success',
          calls,
        }),
      ],
      { providerOrder: ['amazon-browser'] }
    );

    const result = await router.acquireProduct(
      createProduct({ platform: 'ebay' })
    );

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('unsupported_platform');
  });

  it('should route eBay products to the eBay Browse provider', async () => {
    const calls: string[] = [];
    const ebayProvider = createProvider({
      name: 'ebay-browse',
      source: 'official_api',
      supports: (product) => product.platform === 'ebay',
      result: 'success',
      calls,
    });
    const amazonProvider = createProvider({
      name: 'amazon-browser',
      source: 'browser',
      supports: (product) => product.platform === 'amazon',
      result: 'success',
      calls,
    });
    const router = new ProductDataProviderRouter(
      [amazonProvider, ebayProvider],
      { providerOrder: ['rainforest', 'amazon-browser', 'ebay-browse'] }
    );

    const result = await router.acquireProduct(
      createProduct({
        platform: 'ebay',
        productUrl: 'https://www.ebay.com/itm/123456789012',
        asin: '',
      })
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe('ebay-browse');
    expect(result.source).toBe('official_api');
    expect(calls).toEqual(['ebay-browse']);
  });

  it('should return unsupported platform for eBay when eBay provider is unavailable', async () => {
    const calls: string[] = [];
    const router = new ProductDataProviderRouter(
      [
        createProvider({
          name: 'amazon-browser',
          source: 'browser',
          supports: (product) => product.platform === 'amazon',
          result: 'success',
          calls,
        }),
      ],
      { providerOrder: ['amazon-browser', 'ebay-browse'] }
    );

    const result = await router.acquireProduct(
      createProduct({
        platform: 'ebay',
        productUrl: 'https://www.ebay.com/itm/123456789012',
        asin: '',
      })
    );

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('unsupported_platform');
    expect(calls).toEqual([]);
  });

  it('should skip browser providers when browser fallback is disabled', async () => {
    const calls: string[] = [];
    const router = new ProductDataProviderRouter(
      [
        createProvider({
          name: 'amazon-browser',
          source: 'browser',
          result: 'success',
          calls,
        }),
      ],
      {
        providerOrder: ['amazon-browser'],
        browserFallbackEnabled: false,
      }
    );

    const result = await router.acquireProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('unsupported_platform');
    expect(calls).toEqual([]);
  });

  it('should return cached fallback when live providers fail and data is fresh', async () => {
    const calls: string[] = [];
    const router = new ProductDataProviderRouter(
      [
        createProvider({
          name: 'amazon-browser',
          source: 'browser',
          result: 'failure',
          calls,
        }),
      ],
      {
        providerOrder: ['amazon-browser'],
        cacheFreshnessMs: 60_000,
      }
    );

    const result = await router.acquireProduct(
      createProduct({
        currentPrice: 88.5,
        lastCheckedAt: Date.now() - 1000,
      })
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe('cache');
    expect(result.source).toBe('cache');
    expect(result.data?.price).toBe(88.5);
    expect(result.diagnostics?.cacheFallback).toBe(true);
    expect(result.diagnostics?.fallbackType).toBe('cache_fallback');
    expect(result.diagnostics?.rootCause).toBe('cache_only');
    expect(result.diagnostics?.providerFailures).toMatchObject([
      {
        provider: 'amazon-browser',
        source: 'browser',
        failureReason: 'provider_unavailable',
        rootCause: 'insufficient_diagnostics',
        error: 'Provider unavailable',
      },
    ]);
  });

  it('should return cached fallback for eBay after live provider failure', async () => {
    const calls: string[] = [];
    const router = new ProductDataProviderRouter(
      [
        createProvider({
          name: 'ebay-browse',
          source: 'official_api',
          supports: (product) => product.platform === 'ebay',
          result: 'failure',
          calls,
        }),
      ],
      {
        providerOrder: ['ebay-browse'],
        cacheFreshnessMs: 60_000,
      }
    );

    const result = await router.acquireProduct(
      createProduct({
        platform: 'ebay',
        asin: '',
        productUrl: 'https://www.ebay.com/itm/123456789012',
        currentPrice: 45,
        lastCheckedAt: Date.now() - 1000,
      })
    );

    expect(result.success).toBe(true);
    expect(result.provider).toBe('cache');
    expect(result.source).toBe('cache');
    expect(result.diagnostics?.fallbackType).toBe('cache_fallback');
    expect(result.diagnostics?.providerFailures).toMatchObject([
      {
        provider: 'ebay-browse',
        source: 'official_api',
        failureReason: 'provider_unavailable',
      },
    ]);
    expect(calls).toEqual(['ebay-browse']);
  });

  it('should return unsupported_url from eBay provider without browser fallback', async () => {
    const fetchImpl = async () => {
      throw new Error('fetch should not be called');
    };
    const router = new ProductDataProviderRouter(
      [
        new EbayBrowseProvider({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          fetchImpl: fetchImpl as unknown as typeof fetch,
        }),
      ],
      { providerOrder: ['ebay-browse', 'amazon-browser'] }
    );

    const result = await router.acquireProduct(
      createProduct({
        platform: 'ebay',
        asin: '',
        productUrl: 'https://www.ebay.com/sch/i.html?_nkw=test',
      })
    );

    expect(result.success).toBe(false);
    expect(result.provider).toBe('ebay-browse');
    expect(result.failureReason).toBe('unsupported_url');
    expect(result.diagnostics?.rootCause).toBe('unsupported_url');
  });

  it('should not use stale cached fallback', async () => {
    const calls: string[] = [];
    const router = new ProductDataProviderRouter(
      [
        createProvider({
          name: 'amazon-browser',
          source: 'browser',
          result: 'failure',
          calls,
        }),
      ],
      {
        providerOrder: ['amazon-browser'],
        cacheFreshnessMs: 1000,
      }
    );

    const result = await router.acquireProduct(
      createProduct({
        currentPrice: 88.5,
        lastCheckedAt: Date.now() - 10_000,
      })
    );

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
  });
});
