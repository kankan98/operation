import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { ScraperService } from '../src/services/scraperService';
import { ProductService } from '../src/services/productService';
import { PriceSnapshotService } from '../src/services/priceSnapshotService';
import { db } from '../src/db';
import {
  acquisitionProviderLimits,
  acquisitionQueueEvents,
  acquisitionQueueWorkers,
  alerts,
  priceSnapshots,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { ProductDataProviderRouter } from '../src/providers/productDataProviderRouter';
import { clearProductRelatedData } from './__utils__/dbCleanup';
import {
  createAcquisitionFailure,
  createAcquisitionSuccess,
  ProductDataProvider,
} from '../src/providers/productDataProvider';
import { AlertTriggerService } from '../src/services/alertTriggerService';
import { config } from '../src/config';
import { BULK_ACQUISITION_DISABLED_CAVEAT } from '@shared/schemas';
import type { Product } from '../src/types';

function createMockProvider(result: 'success' | 'failure'): ProductDataProvider {
  return {
    name: 'amazon-browser',
    source: 'browser',
    supports: (product) => product.platform === 'amazon',
    fetchProduct: async (product) => {
      const startedAt = Date.now();
      if (result === 'success') {
        return createAcquisitionSuccess({
          provider: 'amazon-browser',
          source: 'browser',
          startedAt,
          confidence: 0.82,
          data: {
            price: 199.99,
            currency: product.currency,
            availability: 'In Stock',
            title: 'Updated Product Title',
            imageUrl: 'https://example.com/image.jpg',
          },
        });
      }

      return createAcquisitionFailure({
        provider: 'amazon-browser',
        source: 'browser',
        startedAt,
        failureReason: 'captcha',
        error: 'Robot check detected',
        diagnostics: {
          pageTitle: 'Robot Check',
          detectedState: 'captcha',
        },
      });
    },
  };
}

describe('ScraperService', () => {
  const productService = new ProductService();
  const snapshotService = new PriceSnapshotService();
  let testProductId: string;
  let alertTriggerService: AlertTriggerService;

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    const migration = fs.readFileSync(
      path.resolve('migrations/002-product-data-acquisition.sql'),
      'utf-8'
    );
    sqlite.exec(migration);
    const ebayMigration = fs.readFileSync(
      path.resolve('migrations/004-ebay-browse-provider.sql'),
      'utf-8'
    );
    sqlite.exec(ebayMigration);
    const queueMigration = fs.readFileSync(
      path.resolve('migrations/007-acquisition-queue-operations.sql'),
      'utf-8'
    );
    sqlite.exec(queueMigration);
    sqlite.close();
  });

  beforeEach(async () => {
    (config.acquisition as unknown as { bulkEnabled: boolean }).bulkEnabled =
      false;
    await clearProductRelatedData();

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: 'https://amazon.com/dp/B07XJ8C8F5',
      asin: 'B07XJ8C8F5',
      title: 'Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    testProductId = product.id;

    alertTriggerService = {
      evaluateRules: vi.fn().mockResolvedValue(undefined),
    } as unknown as AlertTriggerService;
  });

  afterEach(async () => {
    await clearProductRelatedData();
  });

  describe('scrapeProduct', () => {
    it('should acquire product data, create snapshot, update product, and trigger alerts', async () => {
      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter(
          [createMockProvider('success')],
          { providerOrder: ['amazon-browser'] }
        ),
        alertTriggerService,
      });

      const result = await scraperService.scrapeProduct(testProductId);

      expect(result.success).toBe(true);
      expect(result.snapshotId).toBeDefined();
      expect(result.attemptId).toBeDefined();
      expect(result.provider).toBe('amazon-browser');
      expect(result.confidence).toBe(0.82);

      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId
      );
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].price).toBe(199.99);

      const metadata = JSON.parse(snapshots[0].metadata || '{}') as {
        provider?: string;
        source?: string;
        confidence?: number;
        attemptId?: string;
      };
      expect(metadata.provider).toBe('amazon-browser');
      expect(metadata.source).toBe('browser');
      expect(metadata.confidence).toBe(0.82);
      expect(metadata.attemptId).toBe(result.attemptId);

      const updatedProduct = await productService.getProductById(testProductId);
      expect(updatedProduct?.currentPrice).toBe(199.99);
      expect(updatedProduct?.title).toBe('Updated Product Title');
      expect(updatedProduct?.imageUrl).toBe('https://example.com/image.jpg');
      expect(updatedProduct?.lastCheckedAt).toBeDefined();
      expect(alertTriggerService.evaluateRules).toHaveBeenCalledWith(
        testProductId
      );
    });

    it('should return structured failure when acquisition fails', async () => {
      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter(
          [createMockProvider('failure')],
          { providerOrder: ['amazon-browser'] }
        ),
        alertTriggerService,
      });

      const result = await scraperService.scrapeProduct(testProductId);

      expect(result.success).toBe(false);
      expect(result.failureReason).toBe('captcha');
      expect(result.provider).toBe('amazon-browser');
      expect(result.source).toBe('browser');
      expect(result.attemptId).toBeDefined();
      expect(result.diagnostics?.detectedState).toBe('captcha');

      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId
      );
      expect(snapshots).toHaveLength(0);
      expect(alertTriggerService.evaluateRules).not.toHaveBeenCalled();
    });

    it('should store Rainforest provenance in snapshot metadata', async () => {
      const rainforestProvider: ProductDataProvider = {
        name: 'rainforest',
        source: 'third_party',
        supports: (product) => product.platform === 'amazon',
        fetchProduct: async (product) => {
          const startedAt = Date.now();
          return createAcquisitionSuccess({
            provider: 'rainforest',
            source: 'third_party',
            startedAt,
            confidence: 0.9,
            data: {
              price: 149.99,
              currency: product.currency,
              availability: 'In Stock',
              title: 'Rainforest Updated Title',
            },
          });
        },
      };

      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter([rainforestProvider], {
          providerOrder: ['rainforest'],
        }),
        alertTriggerService,
      });

      const result = await scraperService.scrapeProduct(testProductId);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('rainforest');
      expect(result.source).toBe('third_party');
      expect(result.confidence).toBe(0.9);

      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId
      );
      expect(snapshots).toHaveLength(1);

      const metadata = JSON.parse(snapshots[0].metadata || '{}') as {
        provider?: string;
        source?: string;
        confidence?: number;
        attemptId?: string;
      };
      expect(metadata.provider).toBe('rainforest');
      expect(metadata.source).toBe('third_party');
      expect(metadata.confidence).toBe(0.9);
      expect(metadata.attemptId).toBe(result.attemptId);
    });

    it('should persist eBay Browse provenance in attempts and snapshot metadata', async () => {
      const ebayProduct = await productService.createProduct({
        platform: 'ebay',
        productUrl: 'https://www.ebay.com/itm/123456789012',
        asin: '',
        title: 'eBay Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });
      const ebayProvider: ProductDataProvider = {
        name: 'ebay-browse',
        source: 'official_api',
        supports: (product) => product.platform === 'ebay',
        fetchProduct: async (product) => {
          const startedAt = Date.now();
          return createAcquisitionSuccess({
            provider: 'ebay-browse',
            source: 'official_api',
            startedAt,
            confidence: 0.95,
            diagnostics: {
              marketplace: 'EBAY_US',
              ebayItemId: 'v1|123456789012|0',
              legacyItemId: '123456789012',
              listingUrl: 'https://www.ebay.com/itm/123456789012',
            },
            data: {
              price: 29.99,
              currency: product.currency,
              availability: 'IN_STOCK',
              title: 'Updated eBay Product',
              imageUrl: 'https://i.ebayimg.com/image.jpg',
              seller: 'seller-one',
              condition: 'New',
            },
          });
        },
      };

      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter([ebayProvider], {
          providerOrder: ['ebay-browse'],
        }),
        alertTriggerService,
      });

      const result = await scraperService.scrapeProduct(ebayProduct.id);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('ebay-browse');
      expect(result.source).toBe('official_api');
      expect(result.confidence).toBe(0.95);

      const attempts = await scraperService.getAttemptsByProduct(ebayProduct.id);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]).toMatchObject({
        provider: 'ebay-browse',
        source: 'official_api',
        status: 'success',
        confidence: 0.95,
      });

      const snapshots = await snapshotService.getSnapshotsByProduct(ebayProduct.id);
      expect(snapshots).toHaveLength(1);
      const metadata = JSON.parse(snapshots[0].metadata || '{}') as {
        provider?: string;
        source?: string;
        confidence?: number;
        attemptId?: string;
        ebayItemId?: string;
        legacyItemId?: string;
        listingUrl?: string;
      };
      expect(metadata).toMatchObject({
        provider: 'ebay-browse',
        source: 'official_api',
        confidence: 0.95,
        attemptId: result.attemptId,
        ebayItemId: 'v1|123456789012|0',
        legacyItemId: '123456789012',
        listingUrl: 'https://www.ebay.com/itm/123456789012',
      });

      const updatedProduct = await productService.getProductById(ebayProduct.id);
      expect(updatedProduct?.currentPrice).toBe(29.99);
      expect(updatedProduct?.title).toBe('Updated eBay Product');
    });

    it('should persist structured eBay Browse failures without creating snapshots', async () => {
      const ebayProduct = await productService.createProduct({
        platform: 'ebay',
        productUrl: 'https://www.ebay.com/sch/i.html?_nkw=test',
        asin: '',
        title: 'Unsupported eBay Product',
        currency: 'USD',
        isMonitoring: true,
        checkInterval: 24,
      });
      const ebayProvider: ProductDataProvider = {
        name: 'ebay-browse',
        source: 'official_api',
        supports: (product) => product.platform === 'ebay',
        fetchProduct: async () => {
          const startedAt = Date.now();
          return createAcquisitionFailure({
            provider: 'ebay-browse',
            source: 'official_api',
            startedAt,
            failureReason: 'unsupported_url',
            error: 'Unsupported eBay URL',
            diagnostics: {
              rootCause: 'unsupported_url',
              marketplace: 'EBAY_US',
            },
          });
        },
      };

      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter([ebayProvider], {
          providerOrder: ['ebay-browse'],
        }),
        alertTriggerService,
      });

      const result = await scraperService.scrapeProduct(ebayProduct.id);

      expect(result.success).toBe(false);
      expect(result.provider).toBe('ebay-browse');
      expect(result.source).toBe('official_api');
      expect(result.failureReason).toBe('unsupported_url');
      expect(result.diagnostics?.rootCause).toBe('unsupported_url');

      const attempts = await scraperService.getAttemptsByProduct(ebayProduct.id);
      expect(attempts).toHaveLength(1);
      expect(attempts[0]).toMatchObject({
        provider: 'ebay-browse',
        source: 'official_api',
        status: 'failed',
        failureReason: 'unsupported_url',
      });

      const snapshots = await snapshotService.getSnapshotsByProduct(ebayProduct.id);
      expect(snapshots).toHaveLength(0);
      expect(alertTriggerService.evaluateRules).not.toHaveBeenCalledWith(
        ebayProduct.id
      );
    });

    it('should handle product not found', async () => {
      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter(
          [createMockProvider('success')],
          { providerOrder: ['amazon-browser'] }
        ),
      });

      const result = await scraperService.scrapeProduct('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should use cached fallback when live provider fails and product data is fresh', async () => {
      await productService.updateProduct(testProductId, {
        currentPrice: 149.5,
        lastCheckedAt: Date.now() - 1000,
      });

      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter(
          [createMockProvider('failure')],
          {
            providerOrder: ['amazon-browser'],
            cacheFreshnessMs: 60_000,
          }
        ),
        alertTriggerService,
      });

      const result = await scraperService.scrapeProduct(testProductId);

      expect(result.success).toBe(true);
      expect(result.provider).toBe('cache');
      expect(result.source).toBe('cache');

      const snapshots = await snapshotService.getSnapshotsByProduct(
        testProductId
      );
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].price).toBe(149.5);
      expect(alertTriggerService.evaluateRules).toHaveBeenCalledWith(
        testProductId
      );
    });
  });

  describe('scrapeAllMonitoringProducts', () => {
    it('should return a disabled no-op result by default', async () => {
      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter(
          [createMockProvider('success')],
          { providerOrder: ['amazon-browser'] }
        ),
      });

      const result = await scraperService.scrapeAllMonitoringProducts();

      expect(result).toEqual({
        enabled: false,
        total: 0,
        queued: 0,
        skipped: 0,
        jobs: [],
        caveat: BULK_ACQUISITION_DISABLED_CAVEAT,
      });
    });

    it('should enqueue all due monitoring products when bulk acquisition is enabled', async () => {
      (config.acquisition as unknown as { bulkEnabled: boolean }).bulkEnabled =
        true;
      const scraperService = new ScraperService({
        providerRouter: new ProductDataProviderRouter(
          [createMockProvider('success')],
          { providerOrder: ['amazon-browser'] }
        ),
      });

      const result = await scraperService.scrapeAllMonitoringProducts();

      expect(result.enabled).toBe(true);
      expect(result.total).toBeGreaterThan(0);
      expect(result.queued).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.jobs[0].productId).toBe(testProductId);
    });

    it('should enqueue monitoring products from later internal batches', async () => {
      const firstBatch = [
        createMonitoringProduct('batch-product-1'),
        createMonitoringProduct('batch-product-2'),
      ];
      const secondBatch = [
        createMonitoringProduct('batch-product-3'),
      ];
      const productServiceMock = {
        listProducts: vi.fn().mockResolvedValue({
          data: firstBatch,
          total: firstBatch.length,
          pagination: { page: 1, limit: 1000, totalPages: 1 },
        }),
        iterateProductBatches: vi.fn(() =>
          (async function* () {
            yield firstBatch;
            yield secondBatch;
          })()
        ),
      };
      const acquisitionQueueServiceMock = {
        enqueueProduct: vi.fn(async ({ productId }: { productId: string }) => ({
          job: {
            id: `job-${productId}`,
            productId,
            status: 'pending',
          },
          created: true,
        })),
      };
      const scraperService = new ScraperService({
        productService: productServiceMock as unknown as ProductService,
        acquisitionQueueService: acquisitionQueueServiceMock as any,
      });

      const result = await scraperService.enqueueMonitoringProducts();

      expect(productServiceMock.iterateProductBatches).toHaveBeenCalled();
      expect(productServiceMock.listProducts).not.toHaveBeenCalled();
      expect(result.total).toBe(3);
      expect(result.queued).toBe(3);
      expect(result.skipped).toBe(0);
      expect(result.jobs.map((job) => job.productId)).toEqual([
        'batch-product-1',
        'batch-product-2',
        'batch-product-3',
      ]);
    });
  });

  function createMonitoringProduct(id: string): Product {
    return {
      id,
      platform: 'amazon',
      productUrl: `https://amazon.com/dp/${id}`,
      asin: id,
      title: `${id} Product`,
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
});
