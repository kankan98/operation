import { db } from '../db';
import { priceSnapshots } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import { PriceStats, PriceSnapshot } from '../types';

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
      lastRecordedAt: snapshots[snapshots.length - 1].timestamp,
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
}
