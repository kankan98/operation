import { config } from '../config';
import {
  AcquisitionProvider,
  Product,
  ProductDataAcquisitionResult,
} from '../types';
import {
  createAcquisitionFailure,
  createAcquisitionSuccess,
  ProductDataProvider,
  ProductDataProviderContext,
} from './productDataProvider';
import {
  mergeProviderDiagnostics,
  ProviderFailureDiagnostic,
  rootCauseFromProviderCode,
  sanitizeProviderDiagnostics,
} from '../utils/providerDiagnostics';

interface ProductDataProviderRouterOptions {
  providerOrder?: string[];
  browserFallbackEnabled?: boolean;
  cacheFreshnessMs?: number;
}

export class ProductDataProviderRouter {
  private readonly providerOrder: string[];
  private readonly browserFallbackEnabled: boolean;
  private readonly cacheFreshnessMs: number;

  constructor(
    private readonly providers: ProductDataProvider[],
    options: ProductDataProviderRouterOptions = {}
  ) {
    this.providerOrder = options.providerOrder ?? config.acquisition.providerOrder;
    this.browserFallbackEnabled =
      options.browserFallbackEnabled ??
      config.acquisition.browserFallbackEnabled;
    this.cacheFreshnessMs =
      options.cacheFreshnessMs ?? config.acquisition.cacheFreshnessMs;
  }

  async acquireProduct(
    product: Product,
    context: ProductDataProviderContext = {}
  ): Promise<ProductDataAcquisitionResult> {
    const startedAt = Date.now();
    const providerChain = this.getProviderChain(product);

    if (providerChain.length === 0) {
      return createAcquisitionFailure({
        provider: 'mock',
        source: 'mock',
        failureReason: 'unsupported_platform',
        error: `Unsupported platform: ${product.platform}`,
        startedAt,
        jobId: context.jobId,
        attemptId: context.attemptId,
      });
    }

    const failures: ProductDataAcquisitionResult[] = [];
    for (const provider of providerChain) {
      const result = await provider.fetchProduct(product, context);
      if (result.success) {
        return failures.length > 0
          ? {
              ...result,
              diagnostics: this.createFallbackDiagnostics(
                failures,
                result.diagnostics,
                provider.name,
                provider.source === 'browser' ? 'browser_fallback' : 'primary_live'
              ),
            }
          : result;
      }
      failures.push(result);
    }

    const cached = this.tryCreateCachedResult(product, startedAt, context, failures);
    if (cached) {
      return cached;
    }

    const lastFailure = failures[failures.length - 1];
    if (lastFailure) {
      return {
        ...lastFailure,
        diagnostics: sanitizeProviderDiagnostics({
          ...lastFailure.diagnostics,
          fallbackType: 'all_failed',
          degraded: true,
          providerFailures: this.createProviderFailures(failures),
        }),
      };
    }

    return createAcquisitionFailure({
      provider: 'mock',
      source: 'mock',
      failureReason: 'unknown',
      error: 'No acquisition provider returned a result',
      startedAt,
      jobId: context.jobId,
      attemptId: context.attemptId,
    });
  }

  private getProviderChain(product: Product): ProductDataProvider[] {
    const supported = this.providers.filter((provider) => {
      if (!provider.supports(product)) return false;
      if (!this.browserFallbackEnabled && provider.source === 'browser') {
        return false;
      }
      return true;
    });

    return supported.sort((a, b) => {
      const aIndex = this.getProviderOrderIndex(a.name);
      const bIndex = this.getProviderOrderIndex(b.name);
      return aIndex - bIndex;
    });
  }

  private getProviderOrderIndex(provider: AcquisitionProvider): number {
    const index = this.providerOrder.indexOf(provider);
    return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
  }

  private tryCreateCachedResult(
    product: Product,
    startedAt: number,
    context: ProductDataProviderContext,
    failures: ProductDataAcquisitionResult[] = []
  ): ProductDataAcquisitionResult | null {
    if (!product.currentPrice || !product.lastCheckedAt) {
      return null;
    }

    const freshnessMs = Date.now() - product.lastCheckedAt;
    if (freshnessMs > this.cacheFreshnessMs) {
      return null;
    }

    return createAcquisitionSuccess({
      provider: 'cache',
      source: 'cache',
      confidence: 0.45,
      freshnessMs,
      diagnostics:
        failures.length > 0
          ? this.createFallbackDiagnostics(failures, {
              cacheFallback: true,
              freshnessMs,
              fallbackType: 'cache_fallback',
              rootCause: 'cache_only',
            }, undefined, 'cache_fallback')
          : sanitizeProviderDiagnostics({
              cacheFallback: true,
              freshnessMs,
              fallbackType: 'cache_fallback',
              rootCause: 'cache_only',
            }),
      startedAt,
      jobId: context.jobId,
      attemptId: context.attemptId,
      data: {
        price: product.currentPrice,
        currency: product.currency,
        availability: 'unknown',
        title: product.title,
        imageUrl: product.imageUrl,
      },
    });
  }

  private createProviderFailures(
    failures: ProductDataAcquisitionResult[]
  ): ProviderFailureDiagnostic[] {
    return failures.map((failure) => ({
      provider: failure.provider,
      source: failure.source,
      failureReason: failure.failureReason,
      rootCause: rootCauseFromProviderCode(
        failure.diagnostics?.rootCause ?? failure.diagnostics?.providerErrorCode,
        failure.failureReason
      ),
      error: failure.error,
      providerErrorCode:
        typeof failure.diagnostics?.providerErrorCode === 'string'
          ? failure.diagnostics.providerErrorCode
          : undefined,
      marketplace:
        typeof failure.diagnostics?.marketplace === 'string'
          ? failure.diagnostics.marketplace
          : undefined,
      durationMs: failure.durationMs,
    }));
  }

  private createFallbackDiagnostics(
    failures: ProductDataAcquisitionResult[],
    existingDiagnostics?: ProductDataAcquisitionResult['diagnostics'],
    finalProvider?: AcquisitionProvider,
    fallbackType: 'browser_fallback' | 'cache_fallback' | 'primary_live' | 'all_failed' = 'browser_fallback'
  ) {
    return mergeProviderDiagnostics(existingDiagnostics, {
      degraded: true,
      primaryProviderFailed: true,
      degradedReason: 'primary_provider_failed',
      fallbackType,
      fallbackProviders: finalProvider ? [finalProvider] : undefined,
      providerFailures: this.createProviderFailures(failures),
    });
  }
}
