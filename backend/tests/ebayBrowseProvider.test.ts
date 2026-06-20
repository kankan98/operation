import { describe, expect, it, vi } from 'vitest';
import { EbayBrowseProvider } from '../src/providers/ebayBrowseProvider';
import { Product } from '../src/types';

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    platform: 'ebay',
    productUrl: 'https://www.ebay.com/itm/123456789012',
    asin: '',
    title: 'Existing eBay Product',
    currency: 'USD',
    isMonitoring: true,
    checkInterval: 24,
    createdAt: Date.now(),
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

function tokenResponse(token = 'ACCESS_TOKEN') {
  return response({ access_token: token, expires_in: 7200 });
}

function itemResponse(overrides: Record<string, unknown> = {}) {
  return response({
    itemId: 'v1|123456789012|0',
    legacyItemId: '123456789012',
    title: 'eBay Item',
    price: { value: '29.99', currency: 'USD' },
    image: { imageUrl: 'https://i.ebayimg.com/image.jpg' },
    itemWebUrl: 'https://www.ebay.com/itm/123456789012?hash=abc',
    seller: { username: 'seller-one' },
    condition: 'New',
    estimatedAvailabilities: [
      {
        estimatedAvailabilityStatus: 'IN_STOCK',
        estimatedAvailableQuantity: 3,
      },
    ],
    shippingOptions: [
      {
        shippingCost: { value: '4.50', currency: 'USD' },
      },
    ],
    ...overrides,
  });
}

function createProvider(fetchImpl: typeof fetch) {
  return new EbayBrowseProvider({
    clientId: 'client-id',
    clientSecret: 'client-secret',
    marketplace: 'EBAY_US',
    fetchImpl,
    timeoutMs: 1000,
  });
}

describe('EbayBrowseProvider', () => {
  it('returns provider_unavailable without network calls when credentials are missing', async () => {
    const fetchImpl = createFetchSequence();
    const provider = new EbayBrowseProvider({
      clientId: '',
      clientSecret: '',
      fetchImpl,
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.provider).toBe('ebay-browse');
    expect(result.source).toBe('official_api');
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.diagnostics?.rootCause).toBe('missing_credentials');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('authenticates, caches token, and maps successful item data', async () => {
    const fetchImpl = createFetchSequence(
      tokenResponse('TOKEN_ONE'),
      itemResponse(),
      itemResponse({ price: { value: '31.50', currency: 'USD' } })
    );
    const provider = createProvider(fetchImpl);

    const first = await provider.fetchProduct(createProduct());
    const second = await provider.fetchProduct(createProduct());

    expect(first.success).toBe(true);
    expect(first.confidence).toBe(0.95);
    expect(first.data).toMatchObject({
      price: 29.99,
      currency: 'USD',
      availability: 'IN_STOCK',
      title: 'eBay Item',
      imageUrl: 'https://i.ebayimg.com/image.jpg',
      shippingCost: 4.5,
      seller: 'seller-one',
      condition: 'New',
    });
    expect(first.diagnostics).toMatchObject({
      marketplace: 'EBAY_US',
      ebayItemId: 'v1|123456789012|0',
      legacyItemId: '123456789012',
      listingUrl: 'https://www.ebay.com/itm/123456789012',
    });
    expect(second.success).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(String(vi.mocked(fetchImpl).mock.calls[0][0])).toContain(
      '/identity/v1/oauth2/token'
    );
    expect(String(vi.mocked(fetchImpl).mock.calls[1][0])).toContain(
      'get_item_by_legacy_id?legacy_item_id=123456789012'
    );
  });

  it('uses stored Browse item ID metadata before URL parsing', async () => {
    const fetchImpl = createFetchSequence(tokenResponse(), itemResponse());
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchProduct(
      createProduct({
        metadata: JSON.stringify({ ebayItemId: 'v1|999999999999|0' }),
      })
    );

    expect(result.success).toBe(true);
    expect(String(vi.mocked(fetchImpl).mock.calls[1][0])).toContain(
      '/buy/browse/v1/item/v1%7C999999999999%7C0'
    );
  });

  it('returns unsupported_url when no deterministic item ID can be resolved', async () => {
    const fetchImpl = createFetchSequence();
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchProduct(
      createProduct({ productUrl: 'https://www.ebay.com/sch/i.html?_nkw=test' })
    );

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('unsupported_url');
    expect(result.diagnostics?.rootCause).toBe('unsupported_url');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps OAuth auth failures to auth_failed diagnostics with redaction', async () => {
    const fetchImpl = createFetchSequence(
      response(
        {
          error: 'invalid_client',
          error_description:
            'authorization: Bearer SECRET_TOKEN client_secret=SECRET_CLIENT',
        },
        { ok: false, status: 401 }
      )
    );
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.diagnostics?.rootCause).toBe('auth_failed');
    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain('SECRET_TOKEN');
    expect(serialized).not.toContain('SECRET_CLIENT');
  });

  it.each([
    [429, 'Rate limit exceeded', 'rate_limited', 'provider_unavailable'],
    [500, 'Daily quota exceeded', 'quota_exhausted', 'provider_unavailable'],
    [404, 'Item not found', 'not_found', 'not_found'],
    [
      400,
      'Item is not available for marketplace EBAY_US',
      'marketplace_mismatch',
      'provider_unavailable',
    ],
  ])(
    'maps eBay HTTP %s failures',
    async (status, message, rootCause, failureReason) => {
      const fetchImpl = createFetchSequence(
        tokenResponse(),
        response({ errors: [{ message }] }, { ok: false, status: Number(status) })
      );
      const provider = createProvider(fetchImpl);

      const result = await provider.fetchProduct(createProduct());

      expect(result.success).toBe(false);
      expect(result.failureReason).toBe(failureReason);
      expect(result.diagnostics?.rootCause).toBe(rootCause);
      expect(result.diagnostics?.httpStatus).toBe(status);
    }
  );

  it('returns price_missing for item responses without a usable price', async () => {
    const fetchImpl = createFetchSequence(
      tokenResponse(),
      itemResponse({ price: undefined, currentBidPrice: undefined })
    );
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('price_missing');
    expect(result.diagnostics?.rootCause).toBe('price_missing');
  });

  it('returns not_found for malformed item responses without an item title', async () => {
    const fetchImpl = createFetchSequence(tokenResponse(), response({}));
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('not_found');
    expect(result.diagnostics?.rootCause).toBe('not_found');
  });

  it('maps aborted requests to network_timeout', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    const fetchImpl = createFetchSequence(tokenResponse(), abortError);
    const provider = createProvider(fetchImpl);

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('network_timeout');
    expect(result.diagnostics?.rootCause).toBe('network_timeout');
  });
});
