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
import { asc, count, eq, and, getTableColumns } from 'drizzle-orm';
import type { SelectedFields } from 'drizzle-orm/sqlite-core/query-builders/select.types';
import { AppError } from '../middleware/errorHandler';
import { Product } from '../types';
import { randomUUID } from 'crypto';
import { invalidateByPattern } from './productCache';
import { logger } from '../utils/logger';

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

export interface ListProductsFilters {
  platform?: string;
  monitoring?: boolean;
  page?: number;
  limit?: number;
  fields?: string[];
}

export type ProductBatchFilters = Omit<ListProductsFilters, 'page' | 'limit' | 'fields'>;

const DEFAULT_PRODUCT_BATCH_SIZE = 100;

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

      // Task 4.4: 细粒度失效 - 创建产品时失效所有产品列表缓存
      const invalidatedCount = invalidateByPattern('products:*');
      logger.debug({ invalidatedCount, platform: data.platform }, 'Cache invalidated after product creation');

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
    const startTime = Date.now();
    const { platform, monitoring, page = 1, limit = 20, fields } = filters;
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

    let data;
    if (fields && fields.length > 0) {
      // 使用字段选择查询（仅查询指定字段）
      const productColumns = getTableColumns(products);
      const selectFields = fields.reduce<SelectedFields>((acc, field) => {
        if (field in productColumns) {
          acc[field] = productColumns[field as keyof typeof productColumns];
        }
        return acc;
      }, {});

      data = await db
        .select(selectFields)
        .from(products)
        .where(whereClause)
        .orderBy(asc(products.createdAt), asc(products.id))
        .limit(limit)
        .offset(offset);
    } else {
      // 默认查询所有字段
      data = await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(asc(products.createdAt), asc(products.id))
        .limit(limit)
        .offset(offset);
    }

    // 查询总数
    const [totalResult] = await db
      .select({ total: count() })
      .from(products)
      .where(whereClause);
    const total = totalResult?.total ?? 0;

    // Log slow queries (>500ms)
    const duration = Date.now() - startTime;
    if (duration > 500) {
      logger.warn({
        method: 'listProducts',
        durationMs: duration,
        filters: { platform, monitoring, page, limit, fieldsCount: fields?.length },
        resultCount: data.length,
      }, 'Slow query detected in listProducts');
    }

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

  async *iterateProductBatches(
    filters: ProductBatchFilters = {},
    batchSize = DEFAULT_PRODUCT_BATCH_SIZE
  ): AsyncGenerator<Product[], void, unknown> {
    const limit = Math.max(1, batchSize);

    for (let page = 1; ; page += 1) {
      const result = await this.listProducts({
        ...filters,
        page,
        limit,
      });

      if (result.data.length === 0) {
        break;
      }

      yield result.data;

      if (page >= result.pagination.totalPages) {
        break;
      }
    }
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

    // Task 4.5: 细粒度失效 - 更新产品时只失效该平台的缓存
    const platform = updated.platform;
    const pattern = `products:platform=${platform}:*`;
    const invalidatedCount = invalidateByPattern(pattern);
    logger.debug({ invalidatedCount, platform, productId: id }, 'Cache invalidated after product update');

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

    // Task 4.6: 细粒度失效 - 删除产品时只失效该平台的缓存
    const platform = existing.platform;
    const pattern = `products:platform=${platform}:*`;
    const invalidatedCount = invalidateByPattern(pattern);
    logger.debug({ invalidatedCount, platform, productId: id }, 'Cache invalidated after product deletion');
  }
}
