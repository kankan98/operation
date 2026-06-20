import { eq } from 'drizzle-orm';
import { db } from '../db';
import { productBusinessSignals } from '../db/schema';
import {
  BusinessMetrics,
  Product,
  ProductBusinessSignal,
  ProductBusinessSignalUpsert,
} from '../types';
import { AppError } from '../middleware/errorHandler';
import { ProductService } from './productService';
import { BusinessMetricsService } from './businessMetricsService';

export interface ProductBusinessSignalResult {
  assumptions: ProductBusinessSignal | null;
  metrics: BusinessMetrics;
}

export class ProductBusinessSignalService {
  constructor(
    private readonly productService = new ProductService(),
    private readonly metricsService = new BusinessMetricsService()
  ) {}

  async getForProduct(productId: string): Promise<ProductBusinessSignalResult> {
    const product = await this.requireProduct(productId);
    const assumptions = await this.getAssumptions(productId);
    return this.toResult(product, assumptions);
  }

  async getAssumptions(
    productId: string
  ): Promise<ProductBusinessSignal | null> {
    const [record] = await db
      .select()
      .from(productBusinessSignals)
      .where(eq(productBusinessSignals.productId, productId))
      .limit(1);

    return record ?? null;
  }

  async upsertForProduct(
    productId: string,
    data: ProductBusinessSignalUpsert
  ): Promise<ProductBusinessSignalResult> {
    const product = await this.requireProduct(productId);
    const existing = await this.getAssumptions(productId);
    const now = Date.now();
    const values = {
      productId,
      ...this.nullableFields(data),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await db
      .insert(productBusinessSignals)
      .values(values)
      .onConflictDoUpdate({
        target: productBusinessSignals.productId,
        set: {
          ...this.nullableFields(data),
          updatedAt: now,
        },
      });

    const assumptions = await this.getAssumptions(productId);
    return this.toResult(product, assumptions);
  }

  calculateForProduct(
    product: Product,
    assumptions: ProductBusinessSignal | null
  ): ProductBusinessSignalResult {
    return this.toResult(product, assumptions);
  }

  private async requireProduct(productId: string): Promise<Product> {
    const product = await this.productService.getProductById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  private toResult(
    product: Product,
    assumptions: ProductBusinessSignal | null
  ): ProductBusinessSignalResult {
    return {
      assumptions,
      metrics: this.metricsService.calculate(product, assumptions),
    };
  }

  private nullableFields(data: ProductBusinessSignalUpsert) {
    return {
      currency: data.currency,
      costBasis: data.costBasis ?? null,
      inboundShipping: data.inboundShipping ?? null,
      outboundShipping: data.outboundShipping ?? null,
      fulfillmentFee: data.fulfillmentFee ?? null,
      platformFee: data.platformFee ?? null,
      referralFeeRate: data.referralFeeRate ?? null,
      advertisingCost: data.advertisingCost ?? null,
      taxCustomsBuffer: data.taxCustomsBuffer ?? null,
      targetSellPrice: data.targetSellPrice ?? null,
      targetUnits: data.targetUnits ?? null,
      notes: data.notes ?? null,
    };
  }
}
