import { db } from '../db';
import { priceSnapshots } from '../db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import {
  OpportunityPriceSignal,
  PriceStats,
  PriceSnapshot,
  PriceSnapshotSource,
} from '../types';
import { deriveProvenance } from '../utils/snapshotProvenance';

export class PriceAnalysisService {
  async getPriceStats(productId: string): Promise<PriceStats> {
    // Fetch all snapshots for product, ordered by timestamp
    const snapshots = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.productId, productId))
      .orderBy(priceSnapshots.timestamp);

    if (snapshots.length === 0) {
      throw new AppError(404, 'No price data available', 'NO_PRICE_DATA');
    }

    const prices = snapshots.map((s) => s.price);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];

    // Calculate statistics
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const priceChange = currentPrice - firstPrice;
    const priceChangePercent = firstPrice !== 0 ? (priceChange / firstPrice) * 100 : 0;

    // 当前价取自最新一条快照，按其来源 + 时间戳推导溯源，让前端能判断可信度
    const latest = snapshots[snapshots.length - 1];
    const provenance = deriveProvenance(
      (latest.source as PriceSnapshotSource) ?? 'unknown',
      latest.timestamp
    );

    return {
      productId,
      currentPrice,
      highestPrice,
      lowestPrice,
      averagePrice: Math.round(averagePrice * 100) / 100,
      priceChange: Math.round(priceChange * 100) / 100,
      priceChangePercent: Math.round(priceChangePercent * 10) / 10,
      dataPoints: snapshots.length,
      firstRecordedAt: snapshots[0].timestamp,
      lastRecordedAt: latest.timestamp,
      provenance,
    };
  }

  /**
   * Get recent price history for a product, returned in chronological order
   * (oldest first) so it can be plotted directly as a time series.
   */
  async getPriceHistory(productId: string, limit: number = 30): Promise<PriceSnapshot[]> {
    const snapshots = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.productId, productId))
      .orderBy(desc(priceSnapshots.timestamp))
      .limit(limit);

    // Fetched most-recent-first; reverse to chronological order for charting.
    return snapshots.reverse() as PriceSnapshot[];
  }

  async getOpportunityPriceSignal(
    productId: string,
    options: { limit?: number } = {}
  ): Promise<OpportunityPriceSignal> {
    const history = await this.getPriceHistory(productId, options.limit ?? 30);
    return this.buildOpportunityPriceSignal(productId, history);
  }

  async getOpportunityPriceSignals(
    productIds: string[],
    options: { limit?: number } = {}
  ): Promise<Map<string, OpportunityPriceSignal>> {
    const limit = options.limit ?? 30;
    const signals = new Map<string, OpportunityPriceSignal>();

    for (const productId of productIds) {
      signals.set(productId, this.buildOpportunityPriceSignal(productId, []));
    }

    if (productIds.length === 0) {
      return signals;
    }

    const rows = await db
      .select()
      .from(priceSnapshots)
      .where(inArray(priceSnapshots.productId, productIds))
      .orderBy(desc(priceSnapshots.timestamp));

    const grouped = new Map<string, PriceSnapshot[]>();
    for (const row of rows as PriceSnapshot[]) {
      const current = grouped.get(row.productId) ?? [];
      if (current.length < limit) {
        current.push(row);
        grouped.set(row.productId, current);
      }
    }

    for (const productId of productIds) {
      const history = (grouped.get(productId) ?? []).reverse();
      signals.set(productId, this.buildOpportunityPriceSignal(productId, history));
    }

    return signals;
  }

  private buildOpportunityPriceSignal(
    productId: string,
    history: PriceSnapshot[]
  ): OpportunityPriceSignal {
    if (history.length === 0) {
      return {
        productId,
        dataPoints: 0,
        confidence: 0,
        missingSignals: ['price_history'],
      };
    }

    const prices = history.map((snapshot) => snapshot.price);
    const currentPrice = prices[prices.length - 1];
    const firstPrice = prices[0];
    const averagePrice =
      prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const priceChangePercent =
      firstPrice !== 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
    const volatility = this.calculateVolatility(prices, averagePrice);
    const latest = history[history.length - 1];

    return {
      productId,
      currentPrice,
      averagePrice: this.round(averagePrice, 2),
      lowestPrice,
      highestPrice,
      priceChangePercent: this.round(priceChangePercent, 1),
      volatility: this.round(volatility, 3),
      dataPoints: history.length,
      firstRecordedAt: history[0].timestamp,
      lastRecordedAt: latest.timestamp,
      availability: latest.availability,
      rating: latest.rating,
      reviewCount: latest.reviewCount,
      confidence: history.length >= 3 ? 1 : 0.45,
      missingSignals: history.length === 1 ? ['price_trend', 'volatility'] : [],
    };
  }

  private calculateVolatility(prices: number[], average: number): number {
    if (prices.length < 2 || average === 0) {
      return 0;
    }

    const variance =
      prices.reduce((sum, price) => sum + Math.pow(price - average, 2), 0) /
      prices.length;
    return Math.sqrt(variance) / average;
  }

  private round(value: number, digits: number): number {
    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }
}
