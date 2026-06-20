import { config } from '../config';
import {
  AcquisitionDiagnostics,
  AcquisitionFailureReason,
  AcquisitionRootCause,
  Product,
  ProductDataAcquisitionResult,
  ScrapedProductData,
} from '../types';
import { sanitizeProviderDiagnostics } from '../utils/providerDiagnostics';
import {
  createAcquisitionFailure,
  createAcquisitionSuccess,
  ProductDataProvider,
  ProductDataProviderContext,
} from './productDataProvider';

type FetchLike = typeof fetch;

interface EbayBrowseProviderOptions {
  clientId?: string;
  clientSecret?: string;
  marketplace?: string;
  apiBaseUrl?: string;
  oauthBaseUrl?: string;
  timeoutMs?: number;
  captureDiagnostics?: boolean;
  fetchImpl?: FetchLike;
  now?: () => number;
}

interface EbayTokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface EbayMoney {
  value?: string | number;
  currency?: string;
}

interface EbayItemResponse {
  itemId?: string;
  legacyItemId?: string;
  title?: string;
  price?: EbayMoney;
  currentBidPrice?: EbayMoney;
  image?: { imageUrl?: string };
  itemWebUrl?: string;
  seller?: { username?: string };
  condition?: string;
  itemLocation?: {
    country?: string;
    postalCode?: string;
  };
  estimatedAvailabilities?: Array<{
    estimatedAvailabilityStatus?: string;
    estimatedAvailableQuantity?: number;
    availabilityThresholdType?: string;
    availabilityThreshold?: number;
  }>;
  shippingOptions?: Array<{
    shippingCost?: EbayMoney;
    type?: string;
  }>;
  errors?: Array<{ errorId?: number; message?: string; category?: string }>;
}

type ResolvedItemId = {
  value: string;
  kind: 'browse_item_id' | 'legacy_item_id';
};

const TOKEN_EXPIRY_SKEW_MS = 60_000;
const DEFAULT_SCOPE = 'https://api.ebay.com/oauth/api_scope';

export class EbayBrowseProvider implements ProductDataProvider {
  name = 'ebay-browse' as const;
  source = 'official_api' as const;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly marketplace: string;
  private readonly apiBaseUrl: string;
  private readonly oauthBaseUrl: string;
  private readonly timeoutMs: number;
  private readonly captureDiagnostics: boolean;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;
  private cachedToken: { token: string; expiresAt: number } | null = null;

  constructor(options: EbayBrowseProviderOptions = {}) {
    this.clientId = options.clientId ?? config.acquisition.ebay.clientId;
    this.clientSecret =
      options.clientSecret ?? config.acquisition.ebay.clientSecret;
    this.marketplace = options.marketplace ?? config.acquisition.ebay.marketplace;
    this.apiBaseUrl = options.apiBaseUrl ?? config.acquisition.ebay.apiBaseUrl;
    this.oauthBaseUrl =
      options.oauthBaseUrl ?? config.acquisition.ebay.oauthBaseUrl;
    this.timeoutMs = options.timeoutMs ?? config.acquisition.ebay.timeoutMs;
    this.captureDiagnostics =
      options.captureDiagnostics ?? config.acquisition.ebay.captureDiagnostics;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
  }

  supports(product: Product): boolean {
    return product.platform === 'ebay';
  }

  async fetchProduct(
    product: Product,
    context: ProductDataProviderContext = {}
  ): Promise<ProductDataAcquisitionResult> {
    const startedAt = this.now();

    if (!this.clientId || !this.clientSecret) {
      return this.failure({
        failureReason: 'provider_unavailable',
        error: 'eBay Browse API credentials are not configured',
        diagnostics: {
          providerErrorCode: 'missing_credentials',
          rootCause: 'missing_credentials',
          marketplace: this.marketplace,
        },
        startedAt,
        context,
      });
    }

    const itemId = this.resolveItemId(product);
    if (!itemId) {
      return this.failure({
        failureReason: 'unsupported_url',
        error: 'eBay item ID could not be resolved from product metadata or URL',
        diagnostics: {
          providerErrorCode: 'unsupported_url',
          rootCause: 'unsupported_url',
          marketplace: this.marketplace,
          finalUrl: product.productUrl,
        },
        startedAt,
        context,
      });
    }

    try {
      const token = await this.getAccessToken();
      const response = await this.fetchWithTimeout(this.buildItemUrl(itemId), {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-EBAY-C-MARKETPLACE-ID': this.marketplace,
          Accept: 'application/json',
        },
      });
      const payload = (await response.json().catch(() => ({}))) as EbayItemResponse;

      if (!response.ok) {
        return this.createFailureFromHttp(
          response.status,
          payload,
          startedAt,
          context,
          itemId
        );
      }

      const data = this.mapItemData(payload, product);
      if (!data) {
        return this.failure({
          failureReason: payload?.title ? 'price_missing' : 'not_found',
          error: payload?.title
            ? 'eBay item response did not include a usable price'
            : 'eBay item response did not include an item',
          diagnostics: {
            providerErrorCode: payload?.title ? 'price_missing' : 'not_found',
            rootCause: payload?.title ? 'price_missing' : 'not_found',
            marketplace: this.marketplace,
            ebayItemId: payload.itemId ?? itemId.value,
            legacyItemId: payload.legacyItemId,
          },
          startedAt,
          context,
        });
      }

      return createAcquisitionSuccess({
        provider: this.name,
        source: this.source,
        data,
        startedAt,
        confidence: 0.95,
        diagnostics: this.createDiagnostics({
          marketplace: this.marketplace,
          ebayItemId: payload.itemId ?? itemId.value,
          legacyItemId: payload.legacyItemId,
          listingUrl: payload.itemWebUrl,
          itemIdKind: itemId.kind,
        }),
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const failureReason: AcquisitionFailureReason =
        error instanceof Error && error.name === 'AbortError'
          ? 'network_timeout'
          : error instanceof Error &&
              (error.name === 'AuthError' || error.name === 'RateLimitError')
            ? 'provider_unavailable'
          : 'unknown';
      const rootCause: AcquisitionRootCause =
        error instanceof Error && error.name === 'AbortError'
          ? 'network_timeout'
          : error instanceof Error && error.name === 'AuthError'
            ? 'auth_failed'
            : error instanceof Error && error.name === 'RateLimitError'
              ? 'rate_limited'
              : 'unknown';

      return this.failure({
        failureReason,
        error: message,
        diagnostics: {
          providerErrorCode: rootCause,
          rootCause,
          marketplace: this.marketplace,
          providerMessage: message,
          sanitizedMessage: message,
        },
        startedAt,
        context,
      });
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > this.now()) {
      return this.cachedToken.token;
    }

    const response = await this.fetchWithTimeout(this.buildOAuthUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${this.clientId}:${this.clientSecret}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: DEFAULT_SCOPE,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as EbayTokenResponse;

    if (!response.ok || !payload.access_token) {
      const message =
        payload.error_description ||
        payload.error ||
        `eBay OAuth HTTP ${response.status}`;
      const error = new Error(message);
      error.name = response.status === 429 ? 'RateLimitError' : 'AuthError';
      throw error;
    }

    const expiresInMs = Math.max(0, (payload.expires_in ?? 7200) * 1000);
    this.cachedToken = {
      token: payload.access_token,
      expiresAt: this.now() + expiresInMs - TOKEN_EXPIRY_SKEW_MS,
    };
    return payload.access_token;
  }

  private async fetchWithTimeout(
    input: string | URL,
    init: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildOAuthUrl(): string {
    return `${this.oauthBaseUrl.replace(/\/$/, '')}/identity/v1/oauth2/token`;
  }

  private buildItemUrl(itemId: ResolvedItemId): string {
    const base = this.apiBaseUrl.replace(/\/$/, '');
    if (itemId.kind === 'browse_item_id') {
      return `${base}/buy/browse/v1/item/${encodeURIComponent(itemId.value)}`;
    }

    const url = new URL(`${base}/buy/browse/v1/item/get_item_by_legacy_id`);
    url.searchParams.set('legacy_item_id', itemId.value);
    return url.toString();
  }

  private resolveItemId(product: Product): ResolvedItemId | null {
    const metadata = this.parseMetadata(product.metadata);
    const metadataItemId = this.firstString(
      metadata.ebayItemId,
      metadata.itemId,
      metadata.legacyItemId,
      metadata.ebayLegacyItemId
    );
    if (metadataItemId) {
      return {
        value: metadataItemId,
        kind: metadataItemId.includes('|') ? 'browse_item_id' : 'legacy_item_id',
      };
    }

    const parsed = this.extractLegacyItemIdFromUrl(product.productUrl);
    return parsed ? { value: parsed, kind: 'legacy_item_id' } : null;
  }

  private parseMetadata(metadata?: string): Record<string, unknown> {
    if (!metadata) return {};
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  private firstString(...values: unknown[]): string | null {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }
    return null;
  }

  private extractLegacyItemIdFromUrl(value: string): string | null {
    try {
      const url = new URL(value);
      const pathMatch = url.pathname.match(/\/itm\/(?:[^/]+\/)?(\d{6,})/i);
      if (pathMatch) return pathMatch[1];

      const queryId =
        url.searchParams.get('item') ||
        url.searchParams.get('itemid') ||
        url.searchParams.get('itemId');
      return queryId && /^\d{6,}$/.test(queryId) ? queryId : null;
    } catch {
      const looseMatch = value.match(/\/itm\/(?:[^/]+\/)?(\d{6,})/i);
      return looseMatch?.[1] ?? null;
    }
  }

  private mapItemData(
    item: EbayItemResponse | undefined,
    product: Product
  ): ScrapedProductData | null {
    if (!item) return null;

    const price = this.extractMoney(item.price ?? item.currentBidPrice);
    if (!price) return null;

    return {
      price: price.value,
      currency: price.currency || product.currency,
      availability: this.extractAvailability(item),
      title: item.title || product.title,
      imageUrl: item.image?.imageUrl,
      shippingCost: this.extractMoney(item.shippingOptions?.[0]?.shippingCost)?.value,
      seller: item.seller?.username,
      condition: item.condition,
    };
  }

  private extractMoney(money?: EbayMoney): { value: number; currency: string } | null {
    if (!money) return null;
    const value =
      typeof money.value === 'number' ? money.value : Number(money.value);
    if (!Number.isFinite(value)) return null;
    return {
      value,
      currency: money.currency || '',
    };
  }

  private extractAvailability(item: EbayItemResponse): string {
    const availability = item.estimatedAvailabilities?.[0];
    return (
      availability?.estimatedAvailabilityStatus ||
      availability?.availabilityThresholdType ||
      'unknown'
    );
  }

  private createFailureFromHttp(
    httpStatus: number,
    payload: EbayItemResponse & {
      errors?: Array<{ errorId?: number; message?: string; category?: string }>;
      message?: string;
    },
    startedAt: number,
    context: ProductDataProviderContext,
    itemId: ResolvedItemId
  ): ProductDataAcquisitionResult {
    const message = this.extractProviderMessage(payload, httpStatus);
    const rootCause = this.classifyRootCause(httpStatus, message);
    return this.failure({
      failureReason: this.failureReasonForRootCause(rootCause),
      error: message,
      diagnostics: {
        httpStatus,
        providerErrorCode: rootCause,
        rootCause,
        marketplace: this.marketplace,
        providerMessage: message,
        sanitizedMessage: message,
        ebayItemId: itemId.value,
        itemIdKind: itemId.kind,
        providerErrors: payload.errors,
      },
      startedAt,
      context,
    });
  }

  private extractProviderMessage(
    payload: { errors?: Array<{ message?: string }>; message?: string },
    httpStatus: number
  ): string {
    return (
      payload.errors?.map((error) => error.message).filter(Boolean).join('; ') ||
      payload.message ||
      `eBay Browse API HTTP ${httpStatus}`
    );
  }

  private classifyRootCause(
    httpStatus: number,
    message: string
  ): AcquisitionRootCause {
    const lower = message.toLowerCase();
    if (httpStatus === 401 || httpStatus === 403) return 'auth_failed';
    if (httpStatus === 404) return 'not_found';
    if (httpStatus === 408 || lower.includes('timeout')) return 'network_timeout';
    if (httpStatus === 429) return 'rate_limited';
    if (lower.includes('quota') || lower.includes('limit exceeded')) {
      return 'quota_exhausted';
    }
    if (
      lower.includes('marketplace') ||
      lower.includes('not available for marketplace')
    ) {
      return 'marketplace_mismatch';
    }
    if (lower.includes('price')) return 'price_missing';
    return 'unknown';
  }

  private failureReasonForRootCause(
    rootCause: AcquisitionRootCause
  ): AcquisitionFailureReason {
    switch (rootCause) {
      case 'network_timeout':
        return 'network_timeout';
      case 'not_found':
        return 'not_found';
      case 'price_missing':
        return 'price_missing';
      case 'unsupported_url':
        return 'unsupported_url';
      case 'auth_failed':
      case 'missing_credentials':
      case 'quota_exhausted':
      case 'rate_limited':
      case 'marketplace_mismatch':
        return 'provider_unavailable';
      default:
        return 'unknown';
    }
  }

  private failure(params: {
    failureReason: AcquisitionFailureReason;
    error: string;
    diagnostics?: AcquisitionDiagnostics;
    startedAt: number;
    context: ProductDataProviderContext;
  }): ProductDataAcquisitionResult {
    return createAcquisitionFailure({
      provider: this.name,
      source: this.source,
      failureReason: params.failureReason,
      error: params.error,
      diagnostics: this.createDiagnostics(params.diagnostics),
      startedAt: params.startedAt,
      jobId: params.context.jobId,
      attemptId: params.context.attemptId,
    });
  }

  private createDiagnostics(
    diagnostics: AcquisitionDiagnostics | undefined
  ): AcquisitionDiagnostics | undefined {
    if (!this.captureDiagnostics || !diagnostics) {
      return undefined;
    }

    return sanitizeProviderDiagnostics(
      Object.fromEntries(
        Object.entries(diagnostics).filter(([, value]) => value !== undefined)
      )
    );
  }
}
