import { config } from '../config';
import {
  AcquisitionDiagnostics,
  AcquisitionFailureReason,
  AcquisitionRootCause,
  CreateMarketSignalSnapshotData,
  MarketSignalRefreshResult,
  MarketSignalTrendSummary,
  Product,
} from '../types';
import { sanitizeProviderDiagnostics } from '../utils/providerDiagnostics';

type FetchLike = typeof fetch;

interface KeepaMarketSignalProviderOptions {
  enabled?: boolean;
  apiKey?: string;
  apiBaseUrl?: string;
  domain?: number;
  marketplace?: string;
  timeoutMs?: number;
  refreshWindowDays?: number;
  captureDiagnostics?: boolean;
  fetchImpl?: FetchLike;
  now?: () => number;
}

interface KeepaErrorPayload {
  error?: string | { type?: string; message?: string };
  message?: string;
  tokensLeft?: number;
  refillIn?: number;
}

interface KeepaProductPayload {
  asin?: string;
  title?: string;
  stats?: Record<string, unknown>;
  priceHistory?: unknown;
  salesRankHistory?: unknown;
  reviewCountHistory?: unknown;
  ratingHistory?: unknown;
  csv?: unknown;
  salesRanks?: unknown;
  reviews?: unknown;
  rating?: unknown;
}

interface KeepaResponsePayload extends KeepaErrorPayload {
  products?: KeepaProductPayload[];
}

interface DataPoint {
  timestamp: number;
  value: number;
}

interface KeepaMarketSignalSuccess extends MarketSignalRefreshResult {
  success: true;
  snapshot: CreateMarketSignalSnapshotData;
}

interface KeepaMarketSignalFailure extends MarketSignalRefreshResult {
  success: false;
}

export type KeepaMarketSignalResult =
  | KeepaMarketSignalSuccess
  | KeepaMarketSignalFailure;

export class KeepaMarketSignalProvider {
  name = 'keepa' as const;
  source = 'third_party' as const;

  private readonly enabled: boolean;
  private readonly apiKey: string;
  private readonly apiBaseUrl: string;
  private readonly domain: number;
  private readonly marketplace: string;
  private readonly timeoutMs: number;
  private readonly refreshWindowDays: number;
  private readonly captureDiagnostics: boolean;
  private readonly fetchImpl: FetchLike;
  private readonly now: () => number;

  constructor(options: KeepaMarketSignalProviderOptions = {}) {
    this.enabled = options.enabled ?? config.marketSignals.keepa.enabled;
    this.apiKey = options.apiKey ?? config.marketSignals.keepa.apiKey;
    this.apiBaseUrl =
      options.apiBaseUrl ?? config.marketSignals.keepa.apiBaseUrl;
    this.domain = options.domain ?? config.marketSignals.keepa.domain;
    this.marketplace =
      options.marketplace ?? config.marketSignals.keepa.marketplace;
    this.timeoutMs = options.timeoutMs ?? config.marketSignals.keepa.timeoutMs;
    this.refreshWindowDays =
      options.refreshWindowDays ?? config.marketSignals.refreshWindowDays;
    this.captureDiagnostics =
      options.captureDiagnostics ??
      config.marketSignals.keepa.captureDiagnostics;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? (() => Date.now());
  }

  supports(product: Product): boolean {
    return product.platform === 'amazon';
  }

  async fetchMarketSignals(
    product: Product
  ): Promise<KeepaMarketSignalResult> {
    const startedAt = this.now();

    if (!this.enabled) {
      return this.failure({
        productId: product.id,
        failureReason: 'provider_unavailable',
        rootCause: 'unknown',
        error: 'Keepa market signal provider is disabled',
        diagnostics: {
          providerErrorCode: 'provider_disabled',
          rootCause: 'unknown',
          marketplace: this.marketplace,
        },
        startedAt,
      });
    }

    if (!this.apiKey) {
      return this.failure({
        productId: product.id,
        failureReason: 'provider_unavailable',
        rootCause: 'missing_credentials',
        error: 'Keepa API key is not configured',
        diagnostics: {
          providerErrorCode: 'missing_credentials',
          rootCause: 'missing_credentials',
          marketplace: this.marketplace,
        },
        startedAt,
      });
    }

    const asin = this.resolveAsin(product);
    if (!asin) {
      return this.failure({
        productId: product.id,
        failureReason: 'unsupported_product',
        rootCause: 'unsupported_product',
        error: 'Amazon ASIN could not be resolved for Keepa market signals',
        diagnostics: {
          providerErrorCode: 'unsupported_product',
          rootCause: 'unsupported_product',
          marketplace: this.marketplace,
          finalUrl: product.productUrl,
        },
        startedAt,
      });
    }

    try {
      const response = await this.fetchWithTimeout(this.buildProductUrl(asin));
      const payload = (await response.json().catch(() => ({}))) as KeepaResponsePayload;

      if (!response.ok || payload.error) {
        return this.createFailureFromPayload(
          response.status,
          payload,
          product.id,
          asin,
          startedAt
        );
      }

      const keepaProduct = payload.products?.[0];
      if (!keepaProduct) {
        return this.failure({
          productId: product.id,
          failureReason: 'not_found',
          rootCause: 'not_found',
          error: 'Keepa response did not include a matching product',
          diagnostics: {
            httpStatus: response.status,
            providerErrorCode: 'not_found',
            rootCause: 'not_found',
            marketplace: this.marketplace,
            keepaAsin: asin,
          },
          startedAt,
        });
      }

      const snapshot = this.normalizeProduct(product, asin, keepaProduct);
      if (!snapshot) {
        return this.failure({
          productId: product.id,
          failureReason: 'unknown',
          rootCause: 'insufficient_history',
          error: 'Keepa response did not include enough history to build market signals',
          diagnostics: {
            httpStatus: response.status,
            providerErrorCode: 'insufficient_history',
            rootCause: 'insufficient_history',
            marketplace: this.marketplace,
            keepaAsin: asin,
          },
          startedAt,
        });
      }

      const timestamp = this.now();
      return {
        success: true,
        productId: product.id,
        provider: this.name,
        source: this.source,
        timestamp,
        durationMs: timestamp - startedAt,
        confidence: snapshot.confidence,
        diagnostics: this.createDiagnostics({
          httpStatus: response.status,
          marketplace: this.marketplace,
          keepaAsin: asin,
          windowDays: this.refreshWindowDays,
          tokensLeft: payload.tokensLeft,
          refillIn: payload.refillIn,
        }),
        snapshot,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const failureReason: AcquisitionFailureReason =
        error instanceof Error && error.name === 'AbortError'
          ? 'network_timeout'
          : 'unknown';
      const rootCause: AcquisitionRootCause =
        failureReason === 'network_timeout' ? 'network_timeout' : 'unknown';

      return this.failure({
        productId: product.id,
        failureReason,
        rootCause,
        error: message,
        diagnostics: {
          providerErrorCode: rootCause,
          rootCause,
          marketplace: this.marketplace,
          providerMessage: message,
          sanitizedMessage: message,
        },
        startedAt,
      });
    }
  }

  private buildProductUrl(asin: string): string {
    const url = new URL(`${this.apiBaseUrl.replace(/\/$/, '')}/product`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('domain', String(this.domain));
    url.searchParams.set('asin', asin);
    url.searchParams.set('history', '1');
    url.searchParams.set('stats', String(this.refreshWindowDays));
    url.searchParams.set('rating', '1');
    return url.toString();
  }

  private async fetchWithTimeout(input: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      return await this.fetchImpl(input, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private resolveAsin(product: Product): string | null {
    if (this.isAsin(product.asin)) {
      return product.asin.toUpperCase();
    }

    const metadata = this.parseMetadata(product.metadata);
    const metadataAsin = this.firstString(
      metadata.asin,
      metadata.amazonAsin,
      metadata.keepaAsin
    );
    return this.isAsin(metadataAsin) ? metadataAsin.toUpperCase() : null;
  }

  private isAsin(value: unknown): value is string {
    return typeof value === 'string' && /^[A-Z0-9]{10}$/i.test(value);
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
    }
    return null;
  }

  private createFailureFromPayload(
    httpStatus: number,
    payload: KeepaResponsePayload,
    productId: string,
    asin: string,
    startedAt: number
  ): KeepaMarketSignalFailure {
    const message = this.extractProviderMessage(payload, httpStatus);
    const rootCause = this.classifyRootCause(httpStatus, message);
    return this.failure({
      productId,
      failureReason: this.failureReasonForRootCause(rootCause),
      rootCause,
      error: message,
      diagnostics: {
        httpStatus,
        providerErrorCode: rootCause,
        rootCause,
        marketplace: this.marketplace,
        keepaAsin: asin,
        providerMessage: message,
        sanitizedMessage: message,
        tokensLeft: payload.tokensLeft,
        refillIn: payload.refillIn,
      },
      startedAt,
    });
  }

  private extractProviderMessage(
    payload: KeepaErrorPayload,
    httpStatus: number
  ): string {
    if (typeof payload.error === 'string') return payload.error;
    return (
      payload.error?.message ||
      payload.error?.type ||
      payload.message ||
      `Keepa API HTTP ${httpStatus}`
    );
  }

  private classifyRootCause(
    httpStatus: number,
    message: string
  ): AcquisitionRootCause {
    const lower = message.toLowerCase();
    if (httpStatus === 401 || httpStatus === 403) return 'auth_failed';
    if (httpStatus === 404 || lower.includes('not found')) return 'not_found';
    if (httpStatus === 408 || lower.includes('timeout')) return 'network_timeout';
    if (httpStatus === 429 || lower.includes('rate')) return 'rate_limited';
    if (
      lower.includes('quota') ||
      lower.includes('token') ||
      lower.includes('limit')
    ) {
      return 'quota_exhausted';
    }
    if (lower.includes('asin') || lower.includes('unsupported')) {
      return 'unsupported_product';
    }
    if (lower.includes('history')) return 'insufficient_history';
    if (lower.includes('auth') || lower.includes('key')) return 'auth_failed';
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
      case 'unsupported_platform':
        return 'unsupported_platform';
      case 'unsupported_product':
        return 'unsupported_product';
      case 'auth_failed':
      case 'missing_credentials':
      case 'quota_exhausted':
      case 'rate_limited':
        return 'provider_unavailable';
      default:
        return 'unknown';
    }
  }

  private normalizeProduct(
    product: Product,
    asin: string,
    keepaProduct: KeepaProductPayload
  ): CreateMarketSignalSnapshotData | null {
    const priceTrend = this.buildTrendSummary(
      this.extractSeries(keepaProduct.priceHistory, keepaProduct.csv)
    );
    const salesRankTrend = this.buildTrendSummary(
      this.extractSeries(keepaProduct.salesRankHistory, keepaProduct.salesRanks)
    );
    const reviewSeries = this.extractSeries(
      keepaProduct.reviewCountHistory,
      keepaProduct.reviews
    );
    const ratingSeries = this.extractSeries(
      keepaProduct.ratingHistory,
      keepaProduct.rating
    );
    const reviewVelocity = this.calculateVelocity(reviewSeries);
    const ratingMovement = this.calculateMovement(ratingSeries);
    const missingSignals = [
      priceTrend ? null : 'price_history',
      salesRankTrend ? null : 'sales_rank_history',
      reviewVelocity == null ? 'review_velocity' : null,
      ratingMovement == null ? 'rating_movement' : null,
    ].filter((signal): signal is string => signal != null);

    if (!priceTrend && !salesRankTrend && reviewVelocity == null && ratingMovement == null) {
      return null;
    }

    const signalCount = 4 - missingSignals.length;
    const confidence = Math.min(0.95, 0.35 + signalCount * 0.15);
    const freshestTimestamp = Math.max(
      priceTrend?.lastObservedAt ?? 0,
      salesRankTrend?.lastObservedAt ?? 0,
      reviewSeries.at(-1)?.timestamp ?? 0,
      ratingSeries.at(-1)?.timestamp ?? 0
    );

    return {
      productId: product.id,
      platform: product.platform,
      provider: this.name,
      source: this.source,
      asin,
      marketplace: this.marketplace,
      windowDays: this.refreshWindowDays,
      confidence,
      freshnessMs: freshestTimestamp > 0 ? Math.max(0, this.now() - freshestTimestamp) : null,
      priceTrend,
      salesRankTrend,
      reviewVelocity,
      ratingMovement,
      missingSignals,
      metadata: {
        keepaTitle: keepaProduct.title,
        domain: this.domain,
      },
    };
  }

  private extractSeries(primary: unknown, fallback: unknown): DataPoint[] {
    const fromPrimary = this.toSeries(primary);
    return fromPrimary.length > 0 ? fromPrimary : this.toSeries(fallback);
  }

  private toSeries(value: unknown): DataPoint[] {
    if (!value) return [];

    if (Array.isArray(value)) {
      if (value.every((item) => typeof item === 'number')) {
        return this.fromNumberPairs(value);
      }

      return value
        .map((item, index) => this.toDataPoint(item, index))
        .filter((point): point is DataPoint => point != null);
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      for (const key of ['amazon', 'new', 'salesRank', 'rank', 'reviews', 'rating']) {
        const nested = this.toSeries(record[key]);
        if (nested.length > 0) return nested;
      }
    }

    return [];
  }

  private fromNumberPairs(values: number[]): DataPoint[] {
    const points: DataPoint[] = [];
    for (let index = 0; index < values.length - 1; index += 2) {
      const timestamp = values[index];
      const rawValue = values[index + 1];
      if (
        Number.isFinite(timestamp) &&
        Number.isFinite(rawValue) &&
        rawValue >= 0
      ) {
        points.push({ timestamp, value: rawValue });
      }
    }
    return points;
  }

  private toDataPoint(value: unknown, index: number): DataPoint | null {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    const timestamp = this.numberValue(
      record.timestamp,
      record.time,
      record.date,
      index
    );
    const pointValue = this.numberValue(
      record.value,
      record.price,
      record.rank,
      record.count,
      record.rating
    );
    return timestamp != null && pointValue != null
      ? { timestamp, value: pointValue }
      : null;
  }

  private numberValue(...values: unknown[]): number | null {
    for (const value of values) {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  private buildTrendSummary(points: DataPoint[]): MarketSignalTrendSummary | null {
    if (points.length === 0) return null;
    const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
    const values = sorted.map((point) => point.value);
    const first = values[0];
    const current = values.at(-1) ?? first;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const lowest = Math.min(...values);
    const highest = Math.max(...values);
    const changePercent = first === 0 ? 0 : ((current - first) / first) * 100;
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) /
      values.length;
    const volatility = average === 0 ? 0 : Math.sqrt(variance) / Math.abs(average);

    return {
      current,
      average,
      lowest,
      highest,
      changePercent,
      volatility,
      direction:
        Math.abs(changePercent) < 2
          ? 'stable'
          : changePercent > 0
            ? 'up'
            : 'down',
      dataPoints: values.length,
      firstObservedAt: sorted[0].timestamp,
      lastObservedAt: sorted.at(-1)?.timestamp ?? sorted[0].timestamp,
    };
  }

  private calculateVelocity(points: DataPoint[]): number | null {
    if (points.length < 2) return null;
    const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
    const first = sorted[0];
    const last = sorted.at(-1) ?? first;
    const elapsedDays = Math.max(
      1,
      (last.timestamp - first.timestamp) / (24 * 60 * 60 * 1000)
    );
    return (last.value - first.value) / elapsedDays;
  }

  private calculateMovement(points: DataPoint[]): number | null {
    if (points.length < 2) return null;
    const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
    return (sorted.at(-1)?.value ?? sorted[0].value) - sorted[0].value;
  }

  private failure(params: {
    productId: string;
    failureReason: AcquisitionFailureReason;
    rootCause: AcquisitionRootCause;
    error: string;
    diagnostics?: AcquisitionDiagnostics;
    startedAt: number;
  }): KeepaMarketSignalFailure {
    const timestamp = this.now();
    return {
      success: false,
      productId: params.productId,
      provider: this.name,
      source: this.source,
      timestamp,
      durationMs: timestamp - params.startedAt,
      failureReason: params.failureReason,
      rootCause: params.rootCause,
      error: params.error,
      diagnostics: this.createDiagnostics(params.diagnostics),
    };
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
