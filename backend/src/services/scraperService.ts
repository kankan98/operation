import { ProductService } from './productService';
import { PriceSnapshotService } from './priceSnapshotService';
import { AlertTriggerService } from './alertTriggerService';
import { ScrapeJobService } from './scrapeJobService';
import { ScrapeAttemptService } from './scrapeAttemptService';
import { ProviderHealthService, ProviderHealthQuery } from './providerHealthService';
import { AcquisitionQueueService } from './acquisitionQueueService';
import { SQLiteAcquisitionQueueAdapter } from './acquisitionQueueAdapter';
import { AmazonBrowserProvider } from '../providers/amazonBrowserProvider';
import { EbayBrowseProvider } from '../providers/ebayBrowseProvider';
import { RainforestProvider } from '../providers/rainforestProvider';
import { ProductDataProviderRouter } from '../providers/productDataProviderRouter';
import {
  AcquisitionFailureReason,
  Product,
  ProductDataAcquisitionResult,
  ProviderHealthResult,
  ScrapeAttempt,
  ScrapeJob,
} from '../types';
import { logger } from '../utils/logger';
import { snapshotSourceFromProvider } from '../utils/snapshotProvenance';
import { config } from '../config';

export interface ScrapeProductResult {
  success: boolean;
  productId: string;
  jobId?: string;
  attemptId?: string;
  snapshotId?: string;
  provider?: string;
  source?: string;
  confidence?: number;
  data?: ProductDataAcquisitionResult['data'];
  failureReason?: AcquisitionFailureReason;
  diagnostics?: Record<string, unknown>;
  error?: string;
}

export interface EnqueueMonitoringResult {
  total: number;
  queued: number;
  skipped: number;
  jobs: Array<{
    jobId: string;
    productId: string;
    status: string;
    created: boolean;
  }>;
}

interface ScraperServiceOptions {
  productService?: ProductService;
  snapshotService?: PriceSnapshotService;
  alertTriggerService?: AlertTriggerService;
  scrapeJobService?: ScrapeJobService;
  scrapeAttemptService?: ScrapeAttemptService;
  acquisitionQueueService?: AcquisitionQueueService;
  providerHealthService?: ProviderHealthService;
  providerRouter?: ProductDataProviderRouter;
}

export class ScraperService {
  private productService: ProductService;
  private snapshotService: PriceSnapshotService;
  private alertTriggerService: AlertTriggerService;
  private scrapeJobService: ScrapeJobService;
  private scrapeAttemptService: ScrapeAttemptService;
  private acquisitionQueueService: AcquisitionQueueService;
  private providerHealthService: ProviderHealthService;
  private providerRouter: ProductDataProviderRouter;

  constructor(options: ScraperServiceOptions = {}) {
    this.productService = options.productService ?? new ProductService();
    this.snapshotService =
      options.snapshotService ?? new PriceSnapshotService();
    this.alertTriggerService =
      options.alertTriggerService ?? new AlertTriggerService();
    this.scrapeJobService = options.scrapeJobService ?? new ScrapeJobService();
    this.scrapeAttemptService =
      options.scrapeAttemptService ?? new ScrapeAttemptService();
    this.acquisitionQueueService =
      options.acquisitionQueueService ??
      new AcquisitionQueueService({
        adapter: options.scrapeJobService
          ? new SQLiteAcquisitionQueueAdapter(this.scrapeJobService)
          : undefined,
        productService: this.productService,
        attemptService: this.scrapeAttemptService,
      });
    this.providerHealthService =
      options.providerHealthService ?? new ProviderHealthService();
    this.providerRouter =
      options.providerRouter ??
      new ProductDataProviderRouter([
        new RainforestProvider(),
        new AmazonBrowserProvider(),
        new EbayBrowseProvider(),
      ]);
  }

  async scrapeProduct(productId: string): Promise<ScrapeProductResult> {
    try {
      // 获取产品信息
      const product = await this.productService.getProductById(productId);
      if (!product) {
        return {
          success: false,
          productId,
          error: 'Product not found',
        };
      }

      const { job, throttled } =
        await this.acquisitionQueueService.enqueueManualProduct(product.id, {
          nextRunAt: Date.now(),
        });

      if (throttled && job.status !== 'pending' && job.status !== 'retry_scheduled') {
        return {
          success: false,
          productId: product.id,
          jobId: job.id,
          failureReason: 'provider_unavailable',
          error: 'Manual acquisition reused a recent job that is not ready to process',
        };
      }

      return await this.processJob(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { productId, error: message },
        'Scrape product failed'
      );
      return {
        success: false,
        productId,
        error: message,
      };
    }
  }

  async scrapeAllMonitoringProducts(): Promise<EnqueueMonitoringResult> {
    return await this.enqueueMonitoringProducts();
  }

  async enqueueMonitoringProducts(): Promise<EnqueueMonitoringResult> {
    logger.info('Enqueueing monitoring products for acquisition');

    // 获取所有监控中的产品
    const result = await this.productService.listProducts({
      monitoring: true,
      limit: 1000,
    });

    logger.info({ count: result.data.length }, 'Found monitoring products');

    const jobs: EnqueueMonitoringResult['jobs'] = [];
    for (const product of result.data) {
      if (!this.isProductDue(product)) {
        continue;
      }

      const { job, created } = await this.acquisitionQueueService.enqueueProduct({
        productId: product.id,
        nextRunAt: Date.now(),
        maxAttempts: config.acquisition.maxAttempts,
      });
      jobs.push({
        jobId: job.id,
        productId: product.id,
        status: job.status,
        created,
      });
    }

    logger.info(
      { total: result.data.length, queued: jobs.filter((j) => j.created).length },
      'Monitoring products enqueued'
    );

    return {
      total: result.data.length,
      queued: jobs.filter((j) => j.created).length,
      skipped: result.data.length - jobs.filter((j) => j.created).length,
      jobs,
    };
  }

  async processDueJobs(
    limit: number = config.acquisition.processLimit
  ): Promise<ScrapeProductResult[]> {
    const results: ScrapeProductResult[] = [];

    for (let index = 0; index < limit; index += 1) {
      const job = await this.acquisitionQueueService.claimNextDueJob();
      if (!job) break;
      results.push(await this.processClaimedJob(job));
    }

    return results;
  }

  async processJob(jobId: string): Promise<ScrapeProductResult> {
    const claimed = await this.acquisitionQueueService.claimJobById(jobId);
    if (!claimed) {
      const job = await this.acquisitionQueueService.getJobById(jobId);
      return {
        success: false,
        productId: job?.productId || '',
        jobId,
        failureReason: 'provider_unavailable',
        error: 'Scrape job is not ready to process',
      };
    }

    return await this.processClaimedJob(claimed);
  }

  async getAttemptsByProduct(
    productId: string,
    options: { limit?: number } = {}
  ): Promise<ScrapeAttempt[]> {
    return await this.scrapeAttemptService.getAttemptsByProduct(
      productId,
      options
    );
  }

  async getJobById(jobId: string): Promise<ScrapeJob | null> {
    return await this.acquisitionQueueService.getJobById(jobId);
  }

  async getQueueHealth(
    filters: { platform?: string; provider?: string } = {}
  ) {
    return await this.acquisitionQueueService.getQueueHealth(filters);
  }

  async getWorkerHealth(filters = {}) {
    return await this.acquisitionQueueService.getWorkerHealth(filters);
  }

  async getProductJobDiagnostics(productId: string) {
    return await this.acquisitionQueueService.getProductJobDiagnostics(productId);
  }

  async getProviderQueueStatus(
    filters: { platform?: string; provider?: string } = {}
  ) {
    return await this.acquisitionQueueService.getProviderQueueStatus(filters);
  }

  async retryJob(jobId: string, reason?: string, operatorNote?: string) {
    return await this.acquisitionQueueService.retryJob({
      jobId,
      reason,
      operatorNote,
    });
  }

  async cancelJob(jobId: string, reason: string, operatorNote?: string) {
    return await this.acquisitionQueueService.cancelJob({
      jobId,
      reason,
      operatorNote,
    });
  }

  async getAmazonProviderHealth(
    query: ProviderHealthQuery = {}
  ): Promise<ProviderHealthResult> {
    return await this.providerHealthService.getAmazonHealth(query);
  }

  async getProviderHealth(
    platform: Product['platform'],
    query: ProviderHealthQuery = {}
  ): Promise<ProviderHealthResult> {
    return await this.providerHealthService.getProviderHealth(platform, query);
  }

  private async processClaimedJob(job: ScrapeJob): Promise<ScrapeProductResult> {
    const product = await this.productService.getProductById(job.productId);
    if (!product) {
      const attempt = await this.recordAttempt(job, {
        success: false,
        provider: 'mock',
        source: 'mock',
        failureReason: 'not_found',
        error: 'Product not found',
        timestamp: Date.now(),
        durationMs: 0,
      });
      await this.acquisitionQueueService.failJob(
        job.id,
        'not_found',
        attempt.id
      );
      return {
        success: false,
        productId: job.productId,
        jobId: job.id,
        attemptId: attempt.id,
        failureReason: 'not_found',
        error: 'Product not found',
      };
    }

    const acquisitionResult = await this.providerRouter.acquireProduct(product, {
      jobId: job.id,
    });
    const attempt = await this.recordAttempt(job, acquisitionResult);
    acquisitionResult.attemptId = attempt.id;

    if (!acquisitionResult.success || !acquisitionResult.data) {
      await this.acquisitionQueueService.recordProviderFailure(
        product,
        acquisitionResult.provider,
        acquisitionResult.diagnostics?.rootCause
      );
      await this.acquisitionQueueService.failJob(
        job.id,
        acquisitionResult.failureReason || 'unknown',
        attempt.id
      );

      return {
        success: false,
        productId: product.id,
        jobId: job.id,
        attemptId: attempt.id,
        provider: acquisitionResult.provider,
        source: acquisitionResult.source,
        failureReason: acquisitionResult.failureReason || 'unknown',
        diagnostics: acquisitionResult.diagnostics,
        error: acquisitionResult.error || 'Scrape failed',
      };
    }

    await this.acquisitionQueueService.recordProviderSuccess(
      product,
      acquisitionResult.provider
    );

    const snapshot = await this.snapshotService.createSnapshot({
      productId: product.id,
      price: acquisitionResult.data.price,
      currency: acquisitionResult.data.currency,
      availability: acquisitionResult.data.availability,
      source: snapshotSourceFromProvider(acquisitionResult.provider),
      rating: acquisitionResult.data.rating,
      reviewCount: acquisitionResult.data.reviewCount,
      salesRank: acquisitionResult.data.salesRank,
      shippingCost: acquisitionResult.data.shippingCost,
      seller: acquisitionResult.data.seller,
      condition: acquisitionResult.data.condition,
      metadata: JSON.stringify({
        provider: acquisitionResult.provider,
        source: acquisitionResult.source,
        confidence: acquisitionResult.confidence,
        attemptId: attempt.id,
        jobId: job.id,
        freshnessMs: acquisitionResult.freshnessMs,
        ebayItemId: acquisitionResult.diagnostics?.ebayItemId,
        legacyItemId: acquisitionResult.diagnostics?.legacyItemId,
        listingUrl: acquisitionResult.diagnostics?.listingUrl,
      }),
    });

    await this.productService.updateProduct(product.id, {
      currentPrice: acquisitionResult.data.price,
      lastCheckedAt: Date.now(),
      ...(acquisitionResult.data.title && {
        title: acquisitionResult.data.title,
      }),
      ...(acquisitionResult.data.imageUrl && {
        imageUrl: acquisitionResult.data.imageUrl,
      }),
    });

    await this.acquisitionQueueService.completeJob(job.id, attempt.id);

    logger.info(
      { productId: product.id, snapshotId: snapshot.id, attemptId: attempt.id },
      'Product acquired successfully'
    );

    try {
      await this.alertTriggerService.evaluateRules(product.id);
    } catch (alertError) {
      const message =
        alertError instanceof Error ? alertError.message : 'Unknown error';
      logger.error(
        { productId: product.id, error: message },
        'Alert trigger failed but acquisition succeeded'
      );
    }

    return {
      success: true,
      productId: product.id,
      jobId: job.id,
      attemptId: attempt.id,
      snapshotId: snapshot.id,
      provider: acquisitionResult.provider,
      source: acquisitionResult.source,
      confidence: acquisitionResult.confidence,
      data: acquisitionResult.data,
    };
  }

  private async recordAttempt(
    job: ScrapeJob,
    result: ProductDataAcquisitionResult
  ): Promise<ScrapeAttempt> {
    return await this.scrapeAttemptService.recordAttempt({
      jobId: job.id,
      productId: job.productId,
      provider: result.provider,
      source: result.source,
      status: result.success ? 'success' : 'failed',
      failureReason: result.failureReason,
      errorMessage: result.error,
      durationMs: result.durationMs,
      confidence: result.confidence,
      httpStatus: result.diagnostics?.httpStatus,
      pageTitle: result.diagnostics?.pageTitle,
      finalUrl: result.diagnostics?.finalUrl,
      diagnostics: result.diagnostics
        ? JSON.stringify(result.diagnostics)
        : undefined,
    });
  }

  private isProductDue(product: Product): boolean {
    if (!product.lastCheckedAt) {
      return true;
    }
    const intervalMs = product.checkInterval * 60 * 60 * 1000;
    return Date.now() - product.lastCheckedAt >= intervalMs;
  }
}
