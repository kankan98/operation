import { and, desc, eq, gte, SQL } from 'drizzle-orm';
import { db } from '../db';
import { marketSignalAttempts } from '../db/schema';
import {
  AcquisitionDiagnostics,
  AcquisitionFailureReason,
  AcquisitionRootCause,
  MarketSignalAttempt,
  MarketSignalProviderHealthResult,
  Platform,
  ProviderHealthRecommendation,
  ProviderHealthStatus,
} from '../types';
import {
  isAcquisitionRootCause,
  rootCauseFromProviderCode,
  sanitizeProviderDiagnostics,
} from '../utils/providerDiagnostics';

export interface MarketSignalHealthQuery {
  windowHours?: number;
  productId?: string;
  provider?: string;
}

const DEFAULT_WINDOW_HOURS = 24;

export class MarketSignalHealthService {
  async getKeepaHealth(
    query: MarketSignalHealthQuery = {}
  ): Promise<MarketSignalProviderHealthResult> {
    return this.getProviderHealth('amazon', {
      provider: 'keepa',
      ...query,
    });
  }

  async getProviderHealth(
    platform: Platform,
    query: MarketSignalHealthQuery = {}
  ): Promise<MarketSignalProviderHealthResult> {
    const windowHours = query.windowHours ?? DEFAULT_WINDOW_HOURS;
    const until = Date.now();
    const since = until - windowHours * 60 * 60 * 1000;
    const attempts = await this.queryAttempts(platform, {
      ...query,
      since,
    });

    const attemptCount = attempts.length;
    const successCount = attempts.filter((attempt) => attempt.status === 'success').length;
    const failureCount = attemptCount - successCount;
    const failureReasons = this.countBy(
      attempts
        .map((attempt) => attempt.failureReason)
        .filter((value): value is AcquisitionFailureReason => value != null)
    );
    const rootCauses = this.countBy(
      attempts
        .map((attempt) => this.extractRootCause(attempt))
        .filter((value): value is AcquisitionRootCause => value != null)
    );
    const status = this.resolveStatus(attemptCount, successCount, failureCount);

    return {
      provider: (query.provider ?? 'keepa') as MarketSignalProviderHealthResult['provider'],
      source: 'third_party',
      platform,
      status,
      window: { windowHours, since, until },
      attemptCount,
      successCount,
      failureCount,
      successRate:
        attemptCount === 0
          ? 0
          : Number((successCount / attemptCount).toFixed(4)),
      averageDurationMs:
        attemptCount === 0
          ? null
          : Math.round(
              attempts.reduce((sum, attempt) => sum + attempt.durationMs, 0) /
                attemptCount
            ),
      latestSuccessTimestamp:
        attempts.find((attempt) => attempt.status === 'success')?.timestamp ?? null,
      latestFailureReason:
        attempts.find((attempt) => attempt.status === 'failed')?.failureReason ??
        null,
      failureReasons,
      rootCauses,
      recommendations: this.createRecommendations(status, rootCauses),
    };
  }

  private async queryAttempts(
    platform: Platform,
    query: MarketSignalHealthQuery & { since: number }
  ): Promise<MarketSignalAttempt[]> {
    const conditions: SQL[] = [
      eq(marketSignalAttempts.platform, platform),
      gte(marketSignalAttempts.timestamp, query.since),
    ];

    if (query.productId) {
      conditions.push(eq(marketSignalAttempts.productId, query.productId));
    }
    if (query.provider) {
      conditions.push(eq(marketSignalAttempts.provider, query.provider));
    }

    const rows = await db
      .select()
      .from(marketSignalAttempts)
      .where(and(...conditions))
      .orderBy(desc(marketSignalAttempts.timestamp));

    return rows as MarketSignalAttempt[];
  }

  private extractRootCause(
    attempt: MarketSignalAttempt
  ): AcquisitionRootCause | null {
    if (attempt.rootCause) return attempt.rootCause;

    const diagnostics = this.parseDiagnostics(attempt.diagnostics ?? null);
    if (isAcquisitionRootCause(diagnostics?.rootCause)) {
      return diagnostics.rootCause;
    }

    if (diagnostics?.providerErrorCode || attempt.failureReason) {
      return rootCauseFromProviderCode(
        diagnostics?.providerErrorCode,
        attempt.failureReason ?? undefined
      );
    }

    return null;
  }

  private parseDiagnostics(
    diagnostics: string | null
  ): AcquisitionDiagnostics | undefined {
    if (!diagnostics) return undefined;

    try {
      return sanitizeProviderDiagnostics(
        JSON.parse(diagnostics) as AcquisitionDiagnostics
      );
    } catch {
      return undefined;
    }
  }

  private resolveStatus(
    attemptCount: number,
    successCount: number,
    failureCount: number
  ): ProviderHealthStatus {
    if (attemptCount === 0) return 'insufficient_history';
    if (failureCount > successCount) return 'degraded';
    return 'healthy';
  }

  private countBy<T extends string>(values: T[]): Partial<Record<T, number>> {
    return values.reduce<Partial<Record<T, number>>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
  }

  private createRecommendations(
    status: ProviderHealthStatus,
    rootCauses: Partial<Record<AcquisitionRootCause, number>>
  ): ProviderHealthRecommendation[] {
    if (status === 'insufficient_history') {
      return [
        {
          code: 'refresh_market_signals',
          severity: 'info',
          message:
            'No Keepa market signal attempts were found in this window. Refresh market signals to collect trend evidence.',
        },
      ];
    }

    const recommendations: ProviderHealthRecommendation[] = [];

    if (rootCauses.missing_credentials) {
      recommendations.push({
        code: 'configure_keepa',
        severity: 'critical',
        message: 'Configure KEEPA_API_KEY before refreshing market signals.',
      });
    }

    if (rootCauses.auth_failed) {
      recommendations.push({
        code: 'check_keepa_credentials',
        severity: 'critical',
        message:
          'Keepa authentication failed. Verify KEEPA_API_KEY and provider account status.',
      });
    }

    if (rootCauses.quota_exhausted || rootCauses.rate_limited) {
      recommendations.push({
        code: 'check_keepa_quota',
        severity: 'warning',
        message:
          'Keepa returned quota or rate-limit failures. Check token quota and reduce refresh frequency before retrying.',
      });
    }

    if (rootCauses.unsupported_product || rootCauses.not_found) {
      recommendations.push({
        code: 'check_market_signal_identifier',
        severity: 'warning',
        message:
          'Keepa market signals require a deterministic Amazon ASIN. Check product ASIN or safe metadata before retrying.',
      });
    }

    if (rootCauses.insufficient_history) {
      recommendations.push({
        code: 'refresh_market_signals',
        severity: 'info',
        message:
          'Keepa returned insufficient market history for the requested window. Refresh later or adjust the signal window.',
      });
    }

    if (rootCauses.unknown) {
      recommendations.push({
        code: 'investigate_unknown_failures',
        severity: 'warning',
        message:
          'Recent Keepa attempts include unknown failures. Inspect sanitized diagnostics and add a more specific mapping if repeated.',
      });
    }

    return recommendations;
  }
}
