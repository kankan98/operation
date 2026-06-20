import { config } from '../config';
import {
  AcquisitionDiagnostics,
  AcquisitionFailureReason,
  AcquisitionRootCause,
  Product,
  ProductDataAcquisitionResult,
  ScrapedProductData,
} from '../types';
import {
  createAcquisitionFailure,
  createAcquisitionSuccess,
  ProductDataProvider,
  ProductDataProviderContext,
} from './productDataProvider';
import { sanitizeProviderDiagnostics } from '../utils/providerDiagnostics';

type FetchLike = typeof fetch;

interface RainforestProviderOptions {
  apiKey?: string;
  marketplace?: string;
  timeoutMs?: number;
  captureDiagnostics?: boolean;
  fetchImpl?: FetchLike;
}

interface RainforestPrice {
  value?: number;
  raw?: string;
  currency?: string;
}

interface RainforestProduct {
  title?: string;
  asin?: string;
  rating?: number;
  ratings_total?: number;
  reviews_total?: number;
  main_image?: string | { link?: string };
  images?: Array<string | { link?: string }>;
  availability?: string | { raw?: string; type?: string };
  buybox_winner?: {
    price?: RainforestPrice;
    availability?: string | { raw?: string; type?: string };
    seller?: { name?: string } | string;
    shipping?: { value?: number; raw?: string };
    condition?: string;
  };
  price?: RainforestPrice;
}

interface RainforestResponse {
  request_info?: {
    success?: boolean;
    message?: string;
    credits_used?: number;
    credits_remaining?: number;
  };
  product?: RainforestProduct;
  error?: string;
  errors?: unknown;
}

export class RainforestProvider implements ProductDataProvider {
  name = 'rainforest' as const;
  source = 'third_party' as const;

  private readonly apiKey: string;
  private readonly marketplace: string;
  private readonly timeoutMs: number;
  private readonly captureDiagnostics: boolean;
  private readonly fetchImpl: FetchLike;

  constructor(options: RainforestProviderOptions = {}) {
    this.apiKey = options.apiKey ?? config.acquisition.rainforest.apiKey;
    this.marketplace =
      options.marketplace ?? config.acquisition.rainforest.marketplace;
    this.timeoutMs =
      options.timeoutMs ?? config.acquisition.rainforest.timeoutMs;
    this.captureDiagnostics =
      options.captureDiagnostics ??
      config.acquisition.rainforest.captureDiagnostics;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  supports(product: Product): boolean {
    return product.platform === 'amazon';
  }

  async fetchProduct(
    product: Product,
    context: ProductDataProviderContext = {}
  ): Promise<ProductDataAcquisitionResult> {
    const startedAt = Date.now();

    if (!this.apiKey) {
      return createAcquisitionFailure({
        provider: this.name,
        source: this.source,
        failureReason: 'provider_unavailable',
        error: 'Rainforest API key is not configured',
        diagnostics: this.createDiagnostics({
          providerErrorCode: 'missing_api_key',
          rootCause: 'missing_api_key',
          marketplace: this.resolveMarketplace(product),
        }),
        startedAt,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    }

    const asin = this.resolveAsin(product);
    if (!asin) {
      return createAcquisitionFailure({
        provider: this.name,
        source: this.source,
        failureReason: 'unknown',
        error: 'Amazon ASIN could not be resolved for Rainforest request',
        diagnostics: this.createDiagnostics({
          providerErrorCode: 'asin_missing',
          rootCause: 'insufficient_diagnostics',
          marketplace: this.resolveMarketplace(product),
        }),
        startedAt,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(this.buildRequestUrl(product, asin), {
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => ({}))) as RainforestResponse;

      if (!response.ok) {
        return this.createFailureFromHttp(
          response.status,
          payload,
          startedAt,
          context,
          this.resolveMarketplace(product)
        );
      }

      if (payload.request_info?.success === false) {
        return this.createFailureFromMessage(
          payload.request_info.message || payload.error || 'Rainforest request failed',
          payload,
          startedAt,
          context,
          this.resolveMarketplace(product)
        );
      }

      const data = this.mapProductData(payload.product, product);
      if (!data) {
        return createAcquisitionFailure({
          provider: this.name,
          source: this.source,
          failureReason: payload.product ? 'price_missing' : 'not_found',
          error: payload.product
            ? 'Rainforest product response did not include a usable price'
            : 'Rainforest product response did not include a product',
          diagnostics: this.createDiagnosticsFromPayload(
            payload,
            undefined,
            payload.product ? 'price_missing' : 'not_found',
            payload.product ? 'price_missing' : 'not_found',
            this.resolveMarketplace(product)
          ),
          startedAt,
          jobId: context.jobId,
          attemptId: context.attemptId,
        });
      }

      return createAcquisitionSuccess({
        provider: this.name,
        source: this.source,
        data,
        startedAt,
        confidence: 0.9,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const failureReason: AcquisitionFailureReason =
        error instanceof Error && error.name === 'AbortError'
          ? 'network_timeout'
          : 'unknown';

      return createAcquisitionFailure({
        provider: this.name,
        source: this.source,
        failureReason,
        error: message,
        diagnostics: this.createDiagnostics({
          providerErrorCode: failureReason,
          rootCause:
            failureReason === 'network_timeout' ? 'network_timeout' : 'unknown',
          marketplace: this.resolveMarketplace(product),
        }),
        startedAt,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildRequestUrl(product: Product, asin: string): string {
    const url = new URL('https://api.rainforestapi.com/request');
    url.searchParams.set('api_key', this.apiKey);
    url.searchParams.set('type', 'product');
    url.searchParams.set('amazon_domain', this.resolveMarketplace(product));
    url.searchParams.set('asin', asin);
    return url.toString();
  }

  private resolveAsin(product: Product): string | null {
    if (this.isAsin(product.asin)) {
      return product.asin;
    }

    const match = product.productUrl.match(
      /(?:\/dp\/|\/gp\/product\/|\/product\/)([A-Z0-9]{10})(?:[/?]|$)/i
    );
    return match?.[1]?.toUpperCase() ?? null;
  }

  private isAsin(value?: string): value is string {
    return typeof value === 'string' && /^[A-Z0-9]{10}$/i.test(value);
  }

  private resolveMarketplace(product: Product): string {
    try {
      const hostname = new URL(product.productUrl).hostname.replace(/^www\./, '');
      if (hostname.includes('amazon.')) {
        return hostname;
      }
    } catch {
      // Fall back to configured marketplace.
    }
    return this.marketplace;
  }

  private mapProductData(
    product: RainforestProduct | undefined,
    existingProduct: Product
  ): ScrapedProductData | null {
    if (!product) return null;

    const price = this.extractPrice(product);
    if (price == null) return null;

    const buybox = product.buybox_winner;
    return {
      price,
      currency:
        buybox?.price?.currency || product.price?.currency || existingProduct.currency,
      availability: this.extractAvailability(product),
      title: product.title || existingProduct.title,
      rating: product.rating,
      reviewCount: product.ratings_total ?? product.reviews_total,
      imageUrl: this.extractImageUrl(product),
      shippingCost: buybox?.shipping?.value,
      seller:
        typeof buybox?.seller === 'string'
          ? buybox.seller
          : buybox?.seller?.name,
      condition: buybox?.condition,
    };
  }

  private extractPrice(product: RainforestProduct): number | null {
    const price = product.buybox_winner?.price ?? product.price;
    if (typeof price?.value === 'number') {
      return price.value;
    }
    if (price?.raw) {
      const match = price.raw.match(/[\d,]+\.?\d*/);
      return match ? Number(match[0].replace(/,/g, '')) : null;
    }
    return null;
  }

  private extractAvailability(product: RainforestProduct): string {
    const availability =
      product.buybox_winner?.availability ?? product.availability;
    if (typeof availability === 'string') return availability;
    return availability?.raw || availability?.type || 'unknown';
  }

  private extractImageUrl(product: RainforestProduct): string | undefined {
    const mainImage = product.main_image;
    if (typeof mainImage === 'string') return mainImage;
    if (mainImage?.link) return mainImage.link;

    const firstImage = product.images?.[0];
    if (typeof firstImage === 'string') return firstImage;
    return firstImage?.link;
  }

  private createFailureFromHttp(
    httpStatus: number,
    payload: RainforestResponse,
    startedAt: number,
    context: ProductDataProviderContext,
    marketplace?: string
  ): ProductDataAcquisitionResult {
    const message =
      payload.request_info?.message || payload.error || `Rainforest HTTP ${httpStatus}`;
    const providerErrorCode =
      httpStatus === 404
        ? 'not_found'
        : this.classifyProviderErrorCode(message, httpStatus);
    const rootCause = this.classifyProviderRootCause(message, httpStatus);
    const failureReason = this.mapProviderErrorCodeToFailureReason(providerErrorCode);

    return createAcquisitionFailure({
      provider: this.name,
      source: this.source,
      failureReason,
      error: message,
      diagnostics: this.createDiagnosticsFromPayload(
        payload,
        httpStatus,
        providerErrorCode,
        rootCause,
        marketplace
      ),
      startedAt,
      jobId: context.jobId,
      attemptId: context.attemptId,
    });
  }

  private createFailureFromMessage(
    message: string,
    payload: RainforestResponse,
    startedAt: number,
    context: ProductDataProviderContext,
    marketplace?: string
  ): ProductDataAcquisitionResult {
    const providerErrorCode = this.classifyProviderErrorCode(message);
    const rootCause = this.classifyProviderRootCause(message);
    return createAcquisitionFailure({
      provider: this.name,
      source: this.source,
      failureReason: this.mapProviderErrorCodeToFailureReason(providerErrorCode),
      error: message,
      diagnostics: this.createDiagnosticsFromPayload(
        payload,
        undefined,
        providerErrorCode,
        rootCause,
        marketplace
      ),
      startedAt,
      jobId: context.jobId,
      attemptId: context.attemptId,
    });
  }

  private classifyProviderErrorCode(message: string, httpStatus?: number): string {
    const lower = message.toLowerCase();
    if (lower.includes('timeout')) return 'network_timeout';
    if (lower.includes('not found') || lower.includes('not_found')) {
      return 'not_found';
    }
    if (httpStatus === 429) return 'quota_or_rate_limit';
    if (httpStatus === 401 || httpStatus === 403) {
      return 'auth_or_key_invalid';
    }
    if (
      lower.includes('quota') ||
      lower.includes('credit') ||
      lower.includes('plan') ||
      lower.includes('rate') ||
      lower.includes('limit')
    ) {
      return 'quota_or_rate_limit';
    }
    if (lower.includes('key') || lower.includes('auth')) {
      return 'auth_or_key_invalid';
    }
    return 'unknown';
  }

  private classifyProviderRootCause(
    message: string,
    httpStatus?: number
  ): AcquisitionRootCause {
    const lower = message.toLowerCase();
    if (lower.includes('timeout')) return 'network_timeout';
    if (lower.includes('not found') || lower.includes('not_found')) {
      return 'not_found';
    }
    if (
      lower.includes('marketplace') ||
      lower.includes('amazon_domain') ||
      lower.includes('domain')
    ) {
      return 'marketplace_mismatch';
    }
    if (httpStatus === 401 || httpStatus === 403) {
      return 'invalid_key';
    }
    if (httpStatus === 429 || lower.includes('rate')) {
      return 'rate_limited';
    }
    if (
      lower.includes('quota') ||
      lower.includes('credit') ||
      lower.includes('plan') ||
      lower.includes('limit')
    ) {
      return 'quota_exhausted';
    }
    if (lower.includes('key') || lower.includes('auth')) {
      return 'invalid_key';
    }
    return 'unknown';
  }

  private mapProviderErrorCodeToFailureReason(
    providerErrorCode: string
  ): AcquisitionFailureReason {
    switch (providerErrorCode) {
      case 'network_timeout':
        return 'network_timeout';
      case 'not_found':
        return 'not_found';
      case 'auth_or_key_invalid':
      case 'quota_or_rate_limit':
        return 'provider_unavailable';
      default:
        return 'unknown';
    }
  }

  private createDiagnosticsFromPayload(
    payload: RainforestResponse,
    httpStatus?: number,
    providerErrorCode?: string,
    rootCause?: AcquisitionRootCause,
    marketplace?: string
  ): AcquisitionDiagnostics | undefined {
    return this.createDiagnostics({
      httpStatus,
      marketplace,
      providerErrorCode:
        providerErrorCode ??
        (payload.product ? undefined : this.classifyProviderErrorCode(
          payload.request_info?.message || payload.error || 'unknown'
        )),
      rootCause:
        rootCause ??
        (providerErrorCode === 'price_missing'
          ? 'price_missing'
          : providerErrorCode === 'not_found'
            ? 'not_found'
            : undefined),
      providerMessage: payload.request_info?.message || payload.error,
      sanitizedMessage: payload.request_info?.message || payload.error,
      creditsUsed: payload.request_info?.credits_used,
      creditsRemaining: payload.request_info?.credits_remaining,
      providerErrors: payload.errors,
    });
  }

  private createDiagnostics(
    diagnostics: AcquisitionDiagnostics
  ): AcquisitionDiagnostics | undefined {
    if (!this.captureDiagnostics) {
      return undefined;
    }

    return sanitizeProviderDiagnostics(
      Object.fromEntries(
        Object.entries(diagnostics).filter(([, value]) => value !== undefined)
      )
    );
  }
}
