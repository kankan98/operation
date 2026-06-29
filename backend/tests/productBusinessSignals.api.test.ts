import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { ProductService } from '../src/services/productService';
import { clearProductRelatedData } from './__utils__/dbCleanup';

describe('Product business signals API', () => {
  const app = createApp();
  const productService = new ProductService();

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    for (const migrationName of [
      '002-product-data-acquisition.sql',
      '003-opportunity-business-signals.sql',
    ]) {
      sqlite.exec(
        fs.readFileSync(path.resolve('migrations', migrationName), 'utf-8')
      );
    }
    sqlite.close();
  });

  beforeEach(async () => {
    await clearData();
  });

  it('returns an empty assumption state with missing business signals', async () => {
    const product = await createProduct('BUSINESS_EMPTY');

    const response = await request(app)
      .get(`/api/products/${product.id}/business-signals`)
      .expect(200);

    expect(response.body.data.assumptions).toBeNull();
    expect(response.body.data.metrics.completeness).toBe('partial');
    expect(response.body.data.metrics.missingSignals).toEqual(
      expect.arrayContaining(['costBasis', 'inboundShipping'])
    );
  });

  it('upserts and updates business assumptions with derived metrics', async () => {
    const product = await createProduct('BUSINESS_UPSERT');

    const createResponse = await request(app)
      .put(`/api/products/${product.id}/business-signals`)
      .send(validAssumptions({ targetSellPrice: 120 }))
      .expect(200);

    expect(createResponse.body.data.assumptions.productId).toBe(product.id);
    expect(createResponse.body.data.metrics.priceSource).toBe('target');
    expect(createResponse.body.data.metrics.roi).toBeGreaterThan(0);

    const updateResponse = await request(app)
      .put(`/api/products/${product.id}/business-signals`)
      .send(validAssumptions({ targetSellPrice: 90, notes: 'Lower price test' }))
      .expect(200);

    expect(updateResponse.body.data.assumptions.notes).toBe('Lower price test');
    expect(updateResponse.body.data.metrics.inputs.sellPrice).toBe(90);
  });

  it('rejects invalid assumptions and missing products', async () => {
    const product = await createProduct('BUSINESS_INVALID');

    await request(app)
      .put(`/api/products/${product.id}/business-signals`)
      .send(validAssumptions({ costBasis: -1 }))
      .expect(400);

    await request(app)
      .put('/api/products/missing-product/business-signals')
      .send(validAssumptions())
      .expect(404);
  });

  async function createProduct(suffix: string) {
    return productService.createProduct({
      platform: 'amazon',
      productUrl: `https://example.com/${suffix}-${Date.now()}`,
      asin: suffix,
      title: `${suffix} Product`,
      currentPrice: 100,
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
  }

  function validAssumptions(overrides: Record<string, unknown> = {}) {
    return {
      currency: 'USD',
      costBasis: 40,
      inboundShipping: 5,
      outboundShipping: 4,
      fulfillmentFee: 6,
      platformFee: 2,
      referralFeeRate: 0.15,
      advertisingCost: 8,
      taxCustomsBuffer: 3,
      ...overrides,
    };
  }
});

async function clearData() {
  await clearProductRelatedData();
}
