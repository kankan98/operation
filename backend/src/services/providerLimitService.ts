import { asc, eq } from 'drizzle-orm';
import {
  AcquisitionProviderLimitState,
  AcquisitionProviderQueueStatus,
  AcquisitionQueueBackend,
  AcquisitionProviderGateStatus,
  ACQUISITION_QUEUE_CAVEAT,
} from '@shared/schemas';
import { config } from '../config';
import { db } from '../db';
import { acquisitionProviderLimits } from '../db/schema';
import type { Product } from '../types';
import { parseJsonRecord, sanitizeQueueMetadata, stringifySafeMetadata } from './acquisitionQueueSafety';

interface ProviderLimitInput {
  platform: string;
  provider: string;
  status: AcquisitionProviderGateStatus;
  resetAt?: number | null;
  currentConcurrency?: number;
  maxConcurrency?: number;
  activeCount?: number;
  recentRootCauses?: string[];
  recommendations?: AcquisitionProviderLimitState['recommendations'];
  metadata?: Record<string, unknown>;
}

export class ProviderLimitService {
  async upsertLimit(input: ProviderLimitInput): Promise<AcquisitionProviderLimitState> {
    const now = Date.now();
    const id = this.getLimitId(input.platform, input.provider);
    const existing = await this.getLimitRow(id);
    const row = {
      id,
      platform: input.platform,
      provider: input.provider,
      status: input.status,
      resetAt: input.resetAt ?? null,
      currentConcurrency: input.currentConcurrency ?? 0,
      maxConcurrency:
        input.maxConcurrency ?? this.defaultConcurrencyForProvider(input.provider),
      activeCount: input.activeCount ?? 0,
      recentRootCausesJson: JSON.stringify(input.recentRootCauses ?? []),
      recommendationsJson: JSON.stringify(input.recommendations ?? []),
      metadata: stringifySafeMetadata(input.metadata),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      const [updated] = await db
        .update(acquisitionProviderLimits)
        .set(row)
        .where(eq(acquisitionProviderLimits.id, id))
        .returning();
      return this.toLimitState(updated);
    }

    const [created] = await db
      .insert(acquisitionProviderLimits)
      .values(row)
      .returning();
    return this.toLimitState(created);
  }

  async listLimits(filters: { platform?: string; provider?: string } = {}): Promise<AcquisitionProviderLimitState[]> {
    const rows = await db
      .select()
      .from(acquisitionProviderLimits)
      .orderBy(asc(acquisitionProviderLimits.platform), asc(acquisitionProviderLimits.provider));

    return rows
      .map((row) => this.toLimitState(row))
      .filter((state) => {
        if (filters.platform && state.platform !== filters.platform) return false;
        if (filters.provider && state.provider !== filters.provider) return false;
        return true;
      });
  }

  async getProviderQueueStatus(filters: {
    platform?: string;
    provider?: string;
  } = {}): Promise<AcquisitionProviderQueueStatus> {
    return {
      providerGates: await this.listLimits(filters),
      caveat: ACQUISITION_QUEUE_CAVEAT,
      generatedAt: Date.now(),
    };
  }

  async getMostRelevantGateForProduct(
    product: Product
  ): Promise<AcquisitionProviderLimitState | null> {
    const gates = await this.listLimits({ platform: product.platform });
    return (
      gates.find((gate) => this.isGateActive(gate)) ??
      gates.find((gate) => gate.status !== 'open') ??
      null
    );
  }

  isGateActive(gate: AcquisitionProviderLimitState, now: number = Date.now()): boolean {
    if (gate.status === 'open') return false;
    if (gate.resetAt && gate.resetAt <= now) return false;
    return true;
  }

  getQueueBackend(): AcquisitionQueueBackend {
    return config.acquisition.queue.backend;
  }

  private async getLimitRow(id: string) {
    const [row] = await db
      .select()
      .from(acquisitionProviderLimits)
      .where(eq(acquisitionProviderLimits.id, id))
      .limit(1);
    return row;
  }

  private toLimitState(
    row: typeof acquisitionProviderLimits.$inferSelect
  ): AcquisitionProviderLimitState {
    return {
      platform: row.platform,
      provider: row.provider,
      status: row.status as AcquisitionProviderGateStatus,
      resetAt: row.resetAt,
      currentConcurrency: row.currentConcurrency,
      maxConcurrency: row.maxConcurrency,
      activeCount: row.activeCount,
      recentRootCauses: this.parseStringArray(row.recentRootCausesJson),
      recommendations: this.parseRecommendations(row.recommendationsJson),
      metadata: sanitizeQueueMetadata(parseJsonRecord(row.metadata)),
      updatedAt: row.updatedAt,
    };
  }

  private parseStringArray(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private parseRecommendations(
    value: string
  ): AcquisitionProviderLimitState['recommendations'] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? (parsed as AcquisitionProviderLimitState['recommendations'])
        : [];
    } catch {
      return [];
    }
  }

  private defaultConcurrencyForProvider(provider: string): number {
    return provider === 'amazon-browser'
      ? config.acquisition.queue.browserFallbackConcurrency
      : config.acquisition.queue.defaultProviderConcurrency;
  }

  private getLimitId(platform: string, provider: string): string {
    return `${platform}:${provider}`;
  }
}
