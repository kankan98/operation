import { randomUUID } from 'crypto';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { marketSignalSnapshots } from '../db/schema';
import {
  CreateMarketSignalSnapshotData,
  MarketSignalSnapshot,
  MarketSignalTrendSummary,
} from '../types';

export class MarketSignalSnapshotService {
  async createSnapshot(
    data: CreateMarketSignalSnapshotData
  ): Promise<MarketSignalSnapshot> {
    const [snapshot] = await db
      .insert(marketSignalSnapshots)
      .values({
        id: randomUUID(),
        productId: data.productId,
        platform: data.platform,
        provider: data.provider,
        source: data.source,
        asin: data.asin,
        marketplace: data.marketplace,
        windowDays: data.windowDays,
        confidence: data.confidence,
        freshnessMs: data.freshnessMs ?? null,
        priceTrend: this.stringify(data.priceTrend),
        salesRankTrend: this.stringify(data.salesRankTrend),
        reviewVelocity: data.reviewVelocity ?? null,
        ratingMovement: data.ratingMovement ?? null,
        missingSignals: JSON.stringify(data.missingSignals ?? []),
        metadata: this.stringifyMetadata(data.metadata),
        createdAt: Date.now(),
      })
      .returning();

    return this.toSnapshot(snapshot);
  }

  async getLatestSnapshot(productId: string): Promise<MarketSignalSnapshot | null> {
    const [snapshot] = await db
      .select()
      .from(marketSignalSnapshots)
      .where(eq(marketSignalSnapshots.productId, productId))
      .orderBy(desc(marketSignalSnapshots.createdAt))
      .limit(1);

    return snapshot ? this.toSnapshot(snapshot) : null;
  }

  async getLatestSnapshotsForProducts(
    productIds: string[]
  ): Promise<Map<string, MarketSignalSnapshot>> {
    if (productIds.length === 0) return new Map();

    const rows = await db
      .select()
      .from(marketSignalSnapshots)
      .where(inArray(marketSignalSnapshots.productId, productIds))
      .orderBy(desc(marketSignalSnapshots.createdAt));

    const latest = new Map<string, MarketSignalSnapshot>();
    for (const row of rows) {
      if (!latest.has(row.productId)) {
        latest.set(row.productId, this.toSnapshot(row));
      }
    }
    return latest;
  }

  async getSnapshotHistory(
    productId: string,
    options: { limit?: number } = {}
  ): Promise<MarketSignalSnapshot[]> {
    const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const rows = await db
      .select()
      .from(marketSignalSnapshots)
      .where(eq(marketSignalSnapshots.productId, productId))
      .orderBy(desc(marketSignalSnapshots.createdAt))
      .limit(limit);

    return rows.map((row) => this.toSnapshot(row));
  }

  private stringify(value?: MarketSignalTrendSummary | null): string | null {
    return value ? JSON.stringify(value) : null;
  }

  private parseTrend(value: string | null): MarketSignalTrendSummary | null {
    if (!value) return null;
    try {
      return JSON.parse(value) as MarketSignalTrendSummary;
    } catch {
      return null;
    }
  }

  private parseMissingSignals(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : [];
    } catch {
      return [];
    }
  }

  private stringifyMetadata(
    value?: Record<string, unknown> | null
  ): string | null {
    return value ? JSON.stringify(value) : null;
  }

  private parseMetadata(value: string | null): Record<string, unknown> | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private toSnapshot(row: typeof marketSignalSnapshots.$inferSelect): MarketSignalSnapshot {
    return {
      id: row.id,
      productId: row.productId,
      platform: row.platform as MarketSignalSnapshot['platform'],
      provider: row.provider as MarketSignalSnapshot['provider'],
      source: row.source as MarketSignalSnapshot['source'],
      asin: row.asin,
      marketplace: row.marketplace,
      windowDays: row.windowDays,
      confidence: row.confidence,
      freshnessMs: row.freshnessMs,
      priceTrend: this.parseTrend(row.priceTrend),
      salesRankTrend: this.parseTrend(row.salesRankTrend),
      reviewVelocity: row.reviewVelocity,
      ratingMovement: row.ratingMovement,
      missingSignals: this.parseMissingSignals(row.missingSignals),
      metadata: this.parseMetadata(row.metadata),
      createdAt: row.createdAt,
    };
  }
}
