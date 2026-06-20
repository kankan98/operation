import { describe, it, expect, vi } from 'vitest';
import { RainforestProvider } from '../src/providers/rainforestProvider';
import { Product } from '../src/types';

function createProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'product-1',
    platform: 'amazon',
    productUrl: 'https://www.amazon.com/dp/B000000001',
    asin: 'B000000001',
    title: 'Existing Product',
    currency: 'USD',
    isMonitoring: true,
    checkInterval: 24,
    createdAt: Date.now(),
    ...overrides,
  };
}

function createFetch(payload: unknown, options: { ok?: boolean; status?: number } = {}) {
  return vi.fn(async () => ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    json: async () => payload,
  })) as unknown as typeof fetch;
}

describe('RainforestProvider', () => {
  it('should return provider_unavailable without making request when API key is missing', async () => {
    const fetchImpl = createFetch({});
    const provider = new RainforestProvider({
      apiKey: '',
      fetchImpl,
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.provider).toBe('rainforest');
    expect(result.source).toBe('third_party');
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.diagnostics?.providerErrorCode).toBe('missing_api_key');
    expect(result.diagnostics?.rootCause).toBe('missing_api_key');
    expect(result.diagnostics?.marketplace).toBe('amazon.com');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('should map successful Rainforest product response', async () => {
    const fetchImpl = createFetch({
      request_info: { success: true, credits_used: 1, credits_remaining: 99 },
      product: {
        title: 'Rainforest Product',
        rating: 4.7,
        ratings_total: 1234,
        main_image: { link: 'https://example.com/image.jpg' },
        buybox_winner: {
          price: { value: 49.99, currency: 'USD', raw: '$49.99' },
          availability: { raw: 'In Stock' },
          seller: { name: 'Amazon.com' },
          shipping: { value: 0, raw: 'FREE' },
          condition: 'new',
        },
      },
    });
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl,
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(true);
    expect(result.provider).toBe('rainforest');
    expect(result.source).toBe('third_party');
    expect(result.confidence).toBe(0.9);
    expect(result.data).toMatchObject({
      price: 49.99,
      currency: 'USD',
      availability: 'In Stock',
      title: 'Rainforest Product',
      rating: 4.7,
      reviewCount: 1234,
      imageUrl: 'https://example.com/image.jpg',
      seller: 'Amazon.com',
      condition: 'new',
    });
  });

  it('should return price_missing when product has no usable price', async () => {
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl: createFetch({
        request_info: { success: true },
        product: {
          title: 'No Price Product',
        },
      }),
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('price_missing');
    expect(result.diagnostics?.providerErrorCode).toBe('price_missing');
    expect(result.diagnostics?.rootCause).toBe('price_missing');
  });

  it('should return not_found when Rainforest reports missing product', async () => {
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl: createFetch({
        request_info: {
          success: false,
          message: 'Product not found',
        },
      }),
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('not_found');
    expect(result.diagnostics?.rootCause).toBe('not_found');
  });

  it('should classify authorization and quota errors as provider_unavailable', async () => {
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl: createFetch(
        {
          request_info: {
            success: false,
            message: 'Invalid API key or quota limit reached',
          },
        },
        { ok: false, status: 401 }
      ),
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.diagnostics?.httpStatus).toBe(401);
    expect(result.diagnostics?.providerErrorCode).toBe('auth_or_key_invalid');
    expect(result.diagnostics?.rootCause).toBe('invalid_key');
  });

  it('should classify quota errors and redact sensitive diagnostics', async () => {
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl: createFetch(
        {
          request_info: {
            success: false,
            message:
              'Quota limit reached for api_key=SECRET123 at https://api.rainforestapi.com/request?api_key=SECRET123&type=product',
            credits_used: 1,
            credits_remaining: 0,
          },
          errors: {
            detail: '<html>api_key=SECRET123 token=TOKEN123</html>',
          },
        },
        { ok: false, status: 429 }
      ),
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('provider_unavailable');
    expect(result.diagnostics?.providerErrorCode).toBe('quota_or_rate_limit');
    expect(result.diagnostics?.rootCause).toBe('rate_limited');
    const serialized = JSON.stringify(result.diagnostics);
    expect(serialized).not.toContain('SECRET123');
    expect(serialized).not.toContain('<html>');
    expect(serialized).not.toContain('?api_key=');
  });

  it('should classify aborted request as network_timeout', async () => {
    const fetchImpl = vi.fn(async () => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    }) as unknown as typeof fetch;
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl,
    });

    const result = await provider.fetchProduct(createProduct());

    expect(result.success).toBe(false);
    expect(result.failureReason).toBe('network_timeout');
    expect(result.diagnostics?.rootCause).toBe('network_timeout');
  });

  it('should derive ASIN from product URL when product asin is unavailable', async () => {
    const fetchImpl = createFetch({
      request_info: { success: true },
      product: {
        title: 'URL ASIN Product',
        price: { raw: '$19.95', currency: 'USD' },
      },
    });
    const provider = new RainforestProvider({
      apiKey: 'test-key',
      fetchImpl,
    });

    const result = await provider.fetchProduct(
      createProduct({
        asin: '',
        productUrl: 'https://www.amazon.com/gp/product/B000000002/ref=test',
      })
    );

    expect(result.success).toBe(true);
    const requestedUrl = String(fetchImpl.mock.calls[0][0]);
    expect(requestedUrl).toContain('asin=B000000002');
  });
});
