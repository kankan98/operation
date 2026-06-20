import { randomUUID } from 'crypto';
import { db } from '../db';
import { marketSignalAttempts } from '../db/schema';
import {
  AcquisitionDiagnostics,
  CreateMarketSignalAttemptData,
  MarketSignalAttempt,
  MarketSignalRefreshResult,
  Product,
} from '../types';
import {
  KeepaMarketSignalProvider,
  KeepaMarketSignalResult,
} from '../providers/keepaMarketSignalProvider';
import { sanitizeProviderDiagnostics } from '../utils/providerDiagnostics';
import { MarketSignalSnapshotService } from './marketSignalSnapshotService';

interface MarketSignalRefreshServiceOptions {
  provider?: KeepaMarketSignalProvider;
  snapshotService?: MarketSignalSnapshotService;
}

export class MarketSignalRefreshService {
  private readonly provider: KeepaMarketSignalProvider;
  private readonly snapshotService: MarketSignalSnapshotService;

  constructor(options: MarketSignalRefreshServiceOptions = {}) {
    this.provider = options.provider ?? new KeepaMarketSignalProvider();
    this.snapshotService =
      options.snapshotService ?? new MarketSignalSnapshotService();
  }

  async refreshProduct(product: Product): Promise<MarketSignalRefreshResult> {
    if (!this.provider.supports(product)) {
      const result: MarketSignalRefreshResult = {
        success: false,
        productId: product.id,
        provider: this.provider.name,
        source: this.provider.source,
        timestamp: Date.now(),
        durationMs: 0,
        failureReason: 'unsupported_platform',
        rootCause: 'unsupported_platform',
        error: `Market signal provider does not support platform ${product.platform}`,
        diagnostics: sanitizeProviderDiagnostics({
          providerErrorCode: 'unsupported_platform',
          rootCause: 'unsupported_platform',
          marketplace: product.platform,
        }),
      };
      await this.recordAttemptFromResult(product, result);
      return result;
    }

    const providerResult = await this.provider.fetchMarketSignals(product);
    if (!providerResult.success) {
      await this.recordAttemptFromResult(product, providerResult);
      return providerResult;
    }

    const snapshot = await this.snapshotService.createSnapshot(
      providerResult.snapshot
    );
    const result: MarketSignalRefreshResult = {
      ...providerResult,
      snapshotId: snapshot.id,
    };

    await this.recordAttemptFromResult(product, result);
    return result;
  }

  async recordAttempt(
    data: CreateMarketSignalAttemptData
  ): Promise<MarketSignalAttempt> {
    const [attempt] = await db
      .insert(marketSignalAttempts)
      .values({
        id: randomUUID(),
        ...data,
        diagnostics: this.sanitizeDiagnosticsString(data.diagnostics),
        timestamp: Date.now(),
      })
      .returning();

    return attempt as MarketSignalAttempt;
  }

  private async recordAttemptFromResult(
    product: Product,
    result: KeepaMarketSignalResult | MarketSignalRefreshResult
  ): Promise<MarketSignalAttempt> {
    return this.recordAttempt({
      productId: product.id,
      provider: result.provider,
      source: result.source,
      platform: product.platform,
      status: result.success ? 'success' : 'failed',
      failureReason: result.failureReason,
      rootCause: result.rootCause,
      errorMessage: result.error,
      durationMs: result.durationMs,
      confidence: result.confidence,
      httpStatus: this.extractHttpStatus(result.diagnostics),
      diagnostics: result.diagnostics
        ? JSON.stringify(result.diagnostics)
        : undefined,
      snapshotId: result.snapshotId,
    });
  }

  private extractHttpStatus(
    diagnostics?: AcquisitionDiagnostics
  ): number | undefined {
    return typeof diagnostics?.httpStatus === 'number'
      ? diagnostics.httpStatus
      : undefined;
  }

  private sanitizeDiagnosticsString(diagnostics?: string): string | undefined {
    if (!diagnostics) return undefined;

    try {
      const parsed = JSON.parse(diagnostics) as AcquisitionDiagnostics;
      const sanitized = sanitizeProviderDiagnostics(parsed);
      return sanitized ? JSON.stringify(sanitized) : undefined;
    } catch {
      return undefined;
    }
  }
}
