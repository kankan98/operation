import { and, desc, eq, gte, SQL } from 'drizzle-orm';
import { db } from '../db';
import { products, scrapeAttempts } from '../db/schema';
import {
  AcquisitionDiagnostics,
  AcquisitionFallbackType,
  AcquisitionFailureReason,
  AcquisitionProvider,
  AcquisitionRootCause,
  AcquisitionSource,
  Platform,
  ProviderHealthAttempt,
  ProviderHealthRecommendation,
  ProviderHealthResult,
  ProviderHealthStatus,
  ProviderHealthSummary,
  ScrapeAttemptStatus,
} from '../types';
import {
  isAcquisitionFallbackType,
  isAcquisitionRootCause,
  rootCauseFromProviderCode,
  sanitizeProviderDiagnostics,
} from '../utils/providerDiagnostics';
import { logger } from '../utils/logger';

export interface ProviderHealthQuery {
  windowHours?: number;
  productId?: string;
  provider?: string;
  latestLimit?: number;
}

type AttemptRow = {
  id: string;
  productId: string;
  provider: string;
  source: string;
  status: string;
  failureReason: string | null;
  durationMs: number;
  confidence: number | null;
  diagnostics: string | null;
  timestamp: number;
};

interface ProviderAccumulator {
  provider: AcquisitionProvider;
  source: AcquisitionSource;
  attemptCount: number;
  successCount: number;
  failureCount: number;
  durationTotal: number;
  latestSuccessTimestamp: number | null;
  latestFailureReason: AcquisitionFailureReason | null;
  latestConfidence: number | null;
  fallbackCount: number;
  cacheCount: number;
  failureReasons: Partial<Record<AcquisitionFailureReason, number>>;
  rootCauses: Partial<Record<AcquisitionRootCause, number>>;
}

const DEFAULT_WINDOW_HOURS = 24;
const DEFAULT_LATEST_LIMIT = 10;

export class ProviderHealthService {
  async getAmazonHealth(
    query: ProviderHealthQuery = {}
  ): Promise<ProviderHealthResult> {
    return this.getProviderHealth('amazon', query);
  }

  async getProviderHealth(
    platform: Platform,
    query: ProviderHealthQuery = {}
  ): Promise<ProviderHealthResult> {
    const windowHours = query.windowHours ?? DEFAULT_WINDOW_HOURS;
    const latestLimit = query.latestLimit ?? DEFAULT_LATEST_LIMIT;
    const until = Date.now();
    const since = until - windowHours * 60 * 60 * 1000;
    const rows = await this.queryAttempts(platform, {
      ...query,
      windowHours,
      since,
    });

    const attempts = rows.map((row) => this.toHealthAttempt(row));
    const providerSummaries = this.summarizeProviders(attempts);
    const chainSummary = this.summarizeChain(attempts);
    const status = this.resolveStatus(attempts, chainSummary);
    this.logHealthSummary(platform, windowHours, status, providerSummaries, chainSummary);

    return {
      platform,
      status,
      window: { windowHours, since, until },
      providerSummaries,
      chainSummary,
      latestAttempts: attempts.slice(0, latestLimit),
      recommendations: this.createRecommendations(
        platform,
        attempts,
        providerSummaries,
        chainSummary,
        status
      ),
    };
  }

  private async queryAttempts(
    platform: Platform,
    query: ProviderHealthQuery & { since: number }
  ): Promise<AttemptRow[]> {
    const conditions: SQL[] = [
      eq(products.platform, platform),
      gte(scrapeAttempts.timestamp, query.since),
    ];

    if (query.productId) {
      conditions.push(eq(scrapeAttempts.productId, query.productId));
    }
    if (query.provider) {
      conditions.push(eq(scrapeAttempts.provider, query.provider));
    }

    const rows = await db
      .select({
        id: scrapeAttempts.id,
        productId: scrapeAttempts.productId,
        provider: scrapeAttempts.provider,
        source: scrapeAttempts.source,
        status: scrapeAttempts.status,
        failureReason: scrapeAttempts.failureReason,
        durationMs: scrapeAttempts.durationMs,
        confidence: scrapeAttempts.confidence,
        diagnostics: scrapeAttempts.diagnostics,
        timestamp: scrapeAttempts.timestamp,
      })
      .from(scrapeAttempts)
      .innerJoin(products, eq(scrapeAttempts.productId, products.id))
      .where(and(...conditions))
      .orderBy(desc(scrapeAttempts.timestamp));

    return rows;
  }

  private toHealthAttempt(row: AttemptRow): ProviderHealthAttempt {
    const diagnostics = this.parseDiagnostics(row.diagnostics);
    const failureReason =
      (row.failureReason as AcquisitionFailureReason | null) ?? null;
    const provider = row.provider as AcquisitionProvider;
    const source = row.source as AcquisitionSource;
    const status = row.status as ScrapeAttemptStatus;

    return {
      id: row.id,
      productId: row.productId,
      provider,
      source,
      status,
      failureReason,
      durationMs: row.durationMs,
      confidence: row.confidence ?? null,
      timestamp: row.timestamp,
      diagnostics,
      rootCause: this.extractRootCause(diagnostics, failureReason),
      marketplace: this.extractText(diagnostics, 'marketplace'),
      httpStatus: this.extractNumber(diagnostics, 'httpStatus'),
      fallbackType: this.extractFallbackType(provider, source, status, diagnostics),
      sanitizedMessage:
        this.extractText(diagnostics, 'sanitizedMessage') ??
        this.extractText(diagnostics, 'providerMessage') ??
        this.extractText(diagnostics, 'message'),
    };
  }

  private parseDiagnostics(
    diagnostics: string | null
  ): AcquisitionDiagnostics | undefined {
    if (!diagnostics) return undefined;

    try {
      const parsed = JSON.parse(diagnostics) as AcquisitionDiagnostics;
      return sanitizeProviderDiagnostics(parsed);
    } catch {
      return undefined;
    }
  }

  private summarizeProviders(
    attempts: ProviderHealthAttempt[]
  ): ProviderHealthSummary[] {
    const byProvider = new Map<string, ProviderAccumulator>();

    for (const attempt of attempts) {
      const key = `${attempt.provider}:${attempt.source}`;
      const summary =
        byProvider.get(key) ??
        this.createAccumulator(attempt.provider, attempt.source);

      summary.attemptCount += 1;
      summary.durationTotal += attempt.durationMs;
      if (attempt.status === 'success') {
        summary.successCount += 1;
        summary.latestSuccessTimestamp = Math.max(
          summary.latestSuccessTimestamp ?? 0,
          attempt.timestamp
        );
        summary.latestConfidence = attempt.confidence ?? summary.latestConfidence;
      } else {
        summary.failureCount += 1;
        summary.latestFailureReason =
          attempt.failureReason ?? summary.latestFailureReason;
      if (attempt.failureReason) {
          summary.failureReasons[attempt.failureReason] =
            (summary.failureReasons[attempt.failureReason] ?? 0) + 1;
        }
      }
      if (attempt.rootCause) {
        summary.rootCauses[attempt.rootCause] =
          (summary.rootCauses[attempt.rootCause] ?? 0) + 1;
      }

      if (attempt.provider === 'amazon-browser' || attempt.source === 'browser') {
        summary.fallbackCount += 1;
      }
      if (attempt.provider === 'cache' || attempt.source === 'cache') {
        summary.cacheCount += 1;
      }

      const failures = this.providerFailures(attempt.diagnostics);
      for (const failure of failures) {
        const failureKey = `${failure.provider}:${failure.source}`;
        const failureSummary =
          byProvider.get(failureKey) ??
          this.createAccumulator(failure.provider, failure.source);
        failureSummary.attemptCount += 1;
        failureSummary.failureCount += 1;
        failureSummary.latestFailureReason =
          failure.failureReason ?? failureSummary.latestFailureReason;
        if (failure.rootCause) {
          failureSummary.rootCauses[failure.rootCause] =
            (failureSummary.rootCauses[failure.rootCause] ?? 0) + 1;
        }
        if (failure.failureReason) {
          failureSummary.failureReasons[failure.failureReason] =
            (failureSummary.failureReasons[failure.failureReason] ?? 0) + 1;
        }
        byProvider.set(failureKey, failureSummary);
      }

      byProvider.set(key, summary);
    }

    return [...byProvider.values()].map((summary) => ({
      provider: summary.provider,
      source: summary.source,
      attemptCount: summary.attemptCount,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
      successRate:
        summary.attemptCount === 0
          ? 0
          : Number((summary.successCount / summary.attemptCount).toFixed(4)),
      averageDurationMs:
        summary.attemptCount === 0
          ? null
          : Math.round(summary.durationTotal / summary.attemptCount),
      latestSuccessTimestamp: summary.latestSuccessTimestamp,
      latestFailureReason: summary.latestFailureReason,
      latestConfidence: summary.latestConfidence,
      fallbackCount: summary.fallbackCount,
      cacheCount: summary.cacheCount,
      failureReasons: summary.failureReasons,
      rootCauses: summary.rootCauses,
    }));
  }

  private createAccumulator(
    provider: AcquisitionProvider,
    source: AcquisitionSource
  ): ProviderAccumulator {
    return {
      provider,
      source,
      attemptCount: 0,
      successCount: 0,
      failureCount: 0,
      durationTotal: 0,
      latestSuccessTimestamp: null,
      latestFailureReason: null,
      latestConfidence: null,
      fallbackCount: 0,
      cacheCount: 0,
      failureReasons: {},
      rootCauses: {},
    };
  }

  private summarizeChain(attempts: ProviderHealthAttempt[]) {
    const providerFailures = attempts.flatMap((attempt) =>
      this.providerFailures(attempt.diagnostics)
    );
    const browserFallbackCount = attempts.filter(
      (attempt) => attempt.provider === 'amazon-browser' || attempt.source === 'browser'
    ).length;
    const cacheFallbackCount = attempts.filter(
      (attempt) => attempt.provider === 'cache' || attempt.source === 'cache'
    ).length;

    return {
      totalAttempts: attempts.length,
      liveSuccessCount: attempts.filter(
        (attempt) =>
          attempt.status === 'success' &&
          attempt.source !== 'cache' &&
          attempt.provider !== 'cache'
      ).length,
      liveFailureCount:
        attempts.filter((attempt) => attempt.status === 'failed').length +
        providerFailures.length,
      browserFallbackCount,
      cacheFallbackCount,
      primaryFailureCount: providerFailures.length,
      degradedPathCounts: this.countFallbackTypes(attempts),
      rootCauses: this.countRootCauses(attempts, providerFailures),
    };
  }

  private resolveStatus(
    attempts: ProviderHealthAttempt[],
    chainSummary: ProviderHealthResult['chainSummary']
  ): ProviderHealthStatus {
    if (attempts.length === 0) return 'insufficient_history';
    if (
      chainSummary.cacheFallbackCount > 0 ||
      chainSummary.browserFallbackCount > 0 ||
      chainSummary.primaryFailureCount > 0 ||
      chainSummary.liveFailureCount > chainSummary.liveSuccessCount
    ) {
      return 'degraded';
    }
    return 'healthy';
  }

  private createRecommendations(
    platform: Platform,
    attempts: ProviderHealthAttempt[],
    providerSummaries: ProviderHealthSummary[],
    chainSummary: ProviderHealthResult['chainSummary'],
    status: ProviderHealthStatus
  ): ProviderHealthRecommendation[] {
    if (status === 'insufficient_history') {
      return [
        {
          code: 'refresh_stale_data',
          severity: 'info',
          message:
            `No ${platform} acquisition attempts were found in this window. Run a manual check to collect provider health evidence.`,
        },
      ];
    }

    const recommendations: ProviderHealthRecommendation[] = [];
    const rootCauses = new Set<AcquisitionRootCause>(
      [
        ...attempts.map((attempt) => attempt.rootCause),
        ...attempts.flatMap((attempt) =>
          this.providerFailures(attempt.diagnostics).map(
            (failure) => failure.rootCause ?? null
          )
        ),
      ].filter((rootCause): rootCause is AcquisitionRootCause => rootCause != null)
    );

    if (rootCauses.has('missing_api_key')) {
      recommendations.push({
        code: 'configure_rainforest',
        severity: 'critical',
        message:
          'Rainforest is in the Amazon provider chain but credentials are missing. Configure RAINFOREST_API_KEY and verify provider order.',
      });
    }

    if (rootCauses.has('missing_credentials')) {
      recommendations.push({
        code: platform === 'ebay' ? 'configure_ebay' : 'configure_rainforest',
        severity: 'critical',
        message:
          platform === 'ebay'
            ? 'eBay Browse provider credentials are missing. Configure EBAY_CLIENT_ID and EBAY_CLIENT_SECRET before retrying.'
            : 'Primary provider credentials are missing. Configure the provider credentials and verify provider order.',
      });
    }

    if (rootCauses.has('auth_failed')) {
      recommendations.push({
        code: platform === 'ebay' ? 'check_ebay_credentials' : 'check_quota',
        severity: 'critical',
        message:
          platform === 'ebay'
            ? 'eBay OAuth authentication failed. Verify EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, scopes, and environment base URLs.'
            : 'Provider authentication failed. Verify credentials, quota, and configured provider account status.',
      });
    }

    if (platform === 'ebay' && rootCauses.has('marketplace_mismatch')) {
      recommendations.push({
        code: 'check_ebay_marketplace',
        severity: 'warning',
        message:
          'eBay item data is not available for the configured marketplace. Check EBAY_MARKETPLACE and the item listing region.',
      });
    }

    if (
      platform === 'ebay' &&
      (rootCauses.has('unsupported_url') || rootCauses.has('not_found'))
    ) {
      recommendations.push({
        code: 'check_ebay_item_id',
        severity: 'warning',
        message:
          'eBay acquisition requires a deterministic item ID. Use a supported /itm/<id> URL or store ebayItemId metadata for the product.',
      });
    }

    if (
      rootCauses.has('quota_exhausted') ||
      rootCauses.has('rate_limited') ||
      rootCauses.has('invalid_key')
    ) {
      recommendations.push({
        code: 'check_quota',
        severity: 'warning',
        message:
          platform === 'ebay'
            ? 'eBay Browse returned quota or rate-limit failures. Check API limits and reduce acquisition frequency before retrying.'
            : 'Rainforest returned authorization, quota, credit, or rate-limit failures. Check provider quota and reduce acquisition frequency before retrying.',
      });
    }

    if (rootCauses.has('captcha_or_blocked') || rootCauses.has('selector_drift')) {
      recommendations.push({
        code: 'investigate_browser_blocking',
        severity: 'warning',
        message:
          'Amazon browser fallback is encountering blocking or selector drift. Treat this as degraded diagnostic behavior and prefer restoring the primary provider path.',
      });
    }

    if (chainSummary.browserFallbackCount > 0 || chainSummary.cacheFallbackCount > 0) {
      recommendations.push({
        code: 'reduce_fallback_reliance',
        severity: 'warning',
        message:
          `${platform} acquisition is relying on browser or cache fallback. Treat these as degraded diagnostics and restore the primary provider path.`,
      });
    }

    const unknownFailures = providerSummaries.reduce(
      (total, summary) =>
        total +
        (summary.failureReasons.unknown ?? 0) +
        (summary.rootCauses.unknown ?? 0) +
        (summary.rootCauses.insufficient_diagnostics ?? 0),
      0
    );
    if (unknownFailures > 0) {
      recommendations.push({
        code: 'investigate_unknown_failures',
        severity: 'warning',
        message:
          `Recent ${platform} provider attempts include unknown failures. Inspect sanitized diagnostics and add a more specific failure mapping if repeated.`,
      });
    }

    return recommendations;
  }

  private providerFailures(
    diagnostics?: AcquisitionDiagnostics
  ): Array<{
    provider: AcquisitionProvider;
    source: AcquisitionSource;
    failureReason?: AcquisitionFailureReason;
    rootCause?: AcquisitionRootCause;
    providerErrorCode?: string;
  }> {
    const failures = diagnostics?.providerFailures;
    return Array.isArray(failures)
      ? failures.filter(
          (failure): failure is {
            provider: AcquisitionProvider;
            source: AcquisitionSource;
            failureReason?: AcquisitionFailureReason;
            rootCause?: AcquisitionRootCause;
            providerErrorCode?: string;
          } =>
            Boolean(failure) &&
            typeof failure === 'object' &&
            typeof (failure as { provider?: unknown }).provider === 'string' &&
            typeof (failure as { source?: unknown }).source === 'string'
        )
      : [];
  }

  private extractRootCause(
    diagnostics: AcquisitionDiagnostics | undefined,
    failureReason: AcquisitionFailureReason | null
  ): AcquisitionRootCause | null {
    if (isAcquisitionRootCause(diagnostics?.rootCause)) {
      return diagnostics.rootCause;
    }

    if (diagnostics?.providerErrorCode || failureReason) {
      return rootCauseFromProviderCode(diagnostics?.providerErrorCode, failureReason ?? undefined);
    }

    return null;
  }

  private extractFallbackType(
    provider: AcquisitionProvider,
    source: AcquisitionSource,
    status: ScrapeAttemptStatus,
    diagnostics?: AcquisitionDiagnostics
  ): AcquisitionFallbackType | null {
    if (isAcquisitionFallbackType(diagnostics?.fallbackType)) {
      return diagnostics.fallbackType;
    }
    if (provider === 'cache' || source === 'cache') return 'cache_fallback';
    if (provider === 'amazon-browser' || source === 'browser') {
      return 'browser_fallback';
    }
    if (status === 'success') return 'primary_live';
    return null;
  }

  private extractText(
    diagnostics: AcquisitionDiagnostics | undefined,
    key: string
  ): string | null {
    const value = diagnostics?.[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  }

  private extractNumber(
    diagnostics: AcquisitionDiagnostics | undefined,
    key: string
  ): number | null {
    const value = diagnostics?.[key];
    return typeof value === 'number' ? value : null;
  }

  private countFallbackTypes(
    attempts: ProviderHealthAttempt[]
  ): Partial<Record<AcquisitionFallbackType, number>> {
    return attempts.reduce<Partial<Record<AcquisitionFallbackType, number>>>(
      (counts, attempt) => {
        if (attempt.fallbackType) {
          counts[attempt.fallbackType] = (counts[attempt.fallbackType] ?? 0) + 1;
        }
        return counts;
      },
      {}
    );
  }

  private countRootCauses(
    attempts: ProviderHealthAttempt[],
    providerFailures: Array<{ rootCause?: AcquisitionRootCause }>
  ): Partial<Record<AcquisitionRootCause, number>> {
    return [...attempts, ...providerFailures].reduce<
      Partial<Record<AcquisitionRootCause, number>>
    >((counts, item) => {
      if (item.rootCause) {
        counts[item.rootCause] = (counts[item.rootCause] ?? 0) + 1;
      }
      return counts;
    }, {});
  }

  private logHealthSummary(
    platform: Platform,
    windowHours: number,
    status: ProviderHealthStatus,
    providerSummaries: ProviderHealthSummary[],
    chainSummary: ProviderHealthResult['chainSummary']
  ) {
    logger.info(
      {
        platform,
        windowHours,
        status,
        providerCount: providerSummaries.length,
        browserFallbackCount: chainSummary.browserFallbackCount,
        cacheFallbackCount: chainSummary.cacheFallbackCount,
        rootCauses: chainSummary.rootCauses,
      },
      'Provider health aggregated'
    );
  }
}
