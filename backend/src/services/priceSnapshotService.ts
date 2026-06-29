import { db } from '../db';
import { priceSnapshots } from '../db/schema';
import { PriceSnapshot, CreatePriceSnapshotData } from '../types';
import { randomUUID } from 'crypto';
import { eq, desc } from 'drizzle-orm';

export class PriceSnapshotService {
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
