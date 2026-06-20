import { db } from '../db';
import {
  alertRules,
  alerts,
  marketSignalAttempts,
  marketSignalSnapshots,
  opportunityResearchEntries,
  priceSnapshots,
  productBusinessSignals,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import { Product } from '../types';
import { randomUUID } from 'crypto';

export interface CreateProductData {
  platform: string;
  productUrl: string;
  asin: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  currency: string;
  isMonitoring: boolean;
  monitorType?: string;
  checkInterval: number;
  userId?: string;
  metadata?: string;
}

export interface UpdateProductData {
  title?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  currentPrice?: number;
  isMonitoring?: boolean;
  monitorType?: string;
  checkInterval?: number;
  lastCheckedAt?: number;
  metadata?: string;
}

interface ListProductsFilters {
  platform?: string;
  monitoring?: boolean;
  page?: number;
  limit?: number;
}

export class ProductService {
  async createProduct(data: CreateProductData): Promise<Product> {
    const id = randomUUID();
    const now = Date.now();

    try {
      const [product] = await db
        .insert(products)
        .values({
          id,
          ...data,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return product as Product;
    } catch (error) {
      if (error instanceof Error && error.message?.includes('UNIQUE constraint failed')) {
        throw new AppError(409, 'Product URL already exists', 'DUPLICATE_URL');
      }
      throw error;
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return product ? (product as Product) : null;
  }

  async listProducts(filters: ListProductsFilters = {}) {
    const { platform, monitoring, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (platform) {
      conditions.push(eq(products.platform, platform));
    }
    if (monitoring !== undefined) {
      conditions.push(eq(products.isMonitoring, monitoring));
    }

    // 查询数据
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db
      .select()
      .from(products)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    // 查询总数
    const totalResult = await db
      .select()
      .from(products)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data: data as Product[],
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProduct(id: string, data: UpdateProductData): Promise<Product> {
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    const [updated] = await db
      .update(products)
      .set({
        ...data,
        updatedAt: Date.now(),
      })
      .where(eq(products.id, id))
      .returning();

    return updated as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    // Delete dependent records before the product so product removal works
    // even when monitoring, acquisition, alerts, and business assumptions exist.
    await db.delete(productBusinessSignals).where(eq(productBusinessSignals.productId, id));
    await db.delete(opportunityResearchEntries).where(eq(opportunityResearchEntries.productId, id));
    await db.delete(marketSignalAttempts).where(eq(marketSignalAttempts.productId, id));
    await db.delete(marketSignalSnapshots).where(eq(marketSignalSnapshots.productId, id));
    await db.delete(scrapeAttempts).where(eq(scrapeAttempts.productId, id));
    await db.delete(scrapeJobs).where(eq(scrapeJobs.productId, id));
    await db.delete(priceSnapshots).where(eq(priceSnapshots.productId, id));
    await db.delete(alerts).where(eq(alerts.productId, id));
    await db.delete(alertRules).where(eq(alertRules.productId, id));

    await db.delete(products).where(eq(products.id, id));
  }
}
