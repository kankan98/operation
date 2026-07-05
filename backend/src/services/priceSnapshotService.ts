import { db } from '../db';
import { priceSnapshots } from '../db/schema';
import { PriceSnapshot, CreatePriceSnapshotData } from '../types';
import { ProductService } from './productService';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';

export class PriceSnapshotService {
  private productService = new ProductService();

  async createSnapshot(data: CreatePriceSnapshotData): Promise<PriceSnapshot> {
    const id = randomUUID();
    const { recordedAt, ...rest } = data;
    // 补录历史读数时用用户指定的采集时间，否则用当下
    const timestamp = recordedAt ?? Date.now();

    const [snapshot] = await db
      .insert(priceSnapshots)
      .values({
        id,
        ...rest,
        timestamp,
      })
      .returning();

    // 让最新读数成为商品事实源：仅当本次读数是该商品的最新读数时，
    // 同步更新规范价格与新鲜度；补录的历史（更旧）读数不得覆盖更新的当前价。
    const latest = await this.getLatestSnapshot(snapshot.productId);
    if (latest && timestamp >= latest.timestamp) {
      await this.productService.updateProduct(snapshot.productId, {
        currentPrice: snapshot.price,
        lastCheckedAt: timestamp,
      });
    }

    return snapshot as PriceSnapshot;
  }

  async getSnapshotsByProduct(
    productId: string,
    options: { limit?: number } = {}
  ): Promise<PriceSnapshot[]> {
    const { limit = 100 } = options;

    const snapshots = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.productId, productId))
      .orderBy(desc(priceSnapshots.timestamp))
      .limit(limit);

    return snapshots as PriceSnapshot[];
  }

  async getLatestSnapshot(
    productId: string
  ): Promise<PriceSnapshot | null> {
    const [snapshot] = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.productId, productId))
      .orderBy(desc(priceSnapshots.timestamp))
      .limit(1);

    return snapshot ? (snapshot as PriceSnapshot) : null;
  }
}
