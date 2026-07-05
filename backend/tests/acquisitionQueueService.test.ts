import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
import { clearProductRelatedData } from './__utils__/dbCleanup';
import { AcquisitionQueueService } from '../src/services/acquisitionQueueService';
import { SQLiteAcquisitionQueueAdapter } from '../src/services/acquisitionQueueAdapter';
import { OpportunityScoringService } from '../src/services/opportunityScoringService';
import { ProductService } from '../src/services/productService';
import { ScrapeAttemptService } from '../src/services/scrapeAttemptService';
import { ScrapeJobService } from '../src/services/scrapeJobService';

describe('AcquisitionQueueService', () => {
  const productService = new ProductService();
  const attemptService = new ScrapeAttemptService();
  let productId: string;

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    for (const migrationName of [
      '002-product-data-acquisition.sql',
      '007-acquisition-queue-operations.sql',
    ]) {
      sqlite.exec(
        fs.readFileSync(path.resolve('migrations', migrationName), 'utf-8')
      );
    }
    sqlite.close();
  });

  beforeEach(async () => {
    await clearQueueTestData();
    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: `https://amazon.com/dp/QUEUE${Date.now()}`,
      asin: 'QUEUE001',
      title: 'Queue Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    productId = product.id;
  });

  it('handles SQLite lifecycle, manual throttle, and stale lease recovery', async () => {
    const queueService = createQueueService({ leaseMs: 1000 });

    const manual = await queueService.enqueueManualProduct(productId, {
      nextRunAt: 1000,
    });
    const duplicateManual = await queueService.enqueueManualProduct(productId, {
      nextRunAt: 1000,
    });

    expect(manual.created).toBe(true);
    expect(duplicateManual.throttled).toBe(true);
    expect(duplicateManual.job.id).toBe(manual.job.id);

    const firstClaim = await queueService.claimNextDueJob('worker-a', 1000);
    const duplicateClaim = await queueService.claimNextDueJob('worker-b', 1500);
    const recoveredClaim = await queueService.claimNextDueJob('worker-b', 2001);

    expect(firstClaim?.id).toBe(manual.job.id);
    expect(duplicateClaim).toBeNull();
    expect(recoveredClaim?.id).toBe(manual.job.id);
    expect(recoveredClaim?.leaseOwner).toBe('worker-b');
  });

  it('records worker heartbeat and queue health summaries', async () => {
    const queueService = createQueueService();

    await queueService.recordWorkerHeartbeat({
      workerId: 'worker-local-1',
      status: 'idle',
      concurrency: 4,
      activeJobCount: 0,
      queues: ['acquisition'],
      metadata: {
        hostname: 'dev-machine',
        redisUrl: 'redis://user:secret@example.com:6379',
      },
    });

    const health = await queueService.getWorkerHealth();
    expect(health.summary.total).toBe(1);
    expect(health.summary.healthy).toBe(1);
    expect(health.workers[0].metadata).toEqual({ hostname: 'dev-machine' });
  });

  it('applies provider gates and clears them on provider success', async () => {
    const queueService = createQueueService();
    const product = await productService.getProductById(productId);
    expect(product).toBeTruthy();

    await queueService.recordProviderFailure(
      product!,
      'rainforest',
      'rate_limited'
    );

    const degraded = await queueService.getQueueHealth({ platform: 'amazon' });
    expect(degraded.status).toBe('degraded');
    expect(degraded.operationsVisible).toBe(false);
    expect(degraded.providerGates[0]).toMatchObject({
      provider: 'rainforest',
      status: 'rate_limited',
    });

    await queueService.recordProviderSuccess(product!, 'rainforest');
    const recovered = await queueService.getProviderQueueStatus({
      platform: 'amazon',
      provider: 'rainforest',
    });
    expect(recovered.providerGates[0].status).toBe('open');
  });

  it('supports retry and cancel controls while preserving job history', async () => {
    const queueService = createQueueService({ maxAttempts: 1 });
    const { job } = await queueService.enqueueProduct({
      productId,
      nextRunAt: Date.now(),
      maxAttempts: 1,
    });

    await queueService.claimJobById(job.id);
    await queueService.failJob(job.id, 'captcha', 'attempt-1');

    const retry = await queueService.retryJob({
      jobId: job.id,
      reason: 'provider_reset',
    });
    const cancel = await queueService.cancelJob({
      jobId: job.id,
      reason: 'operator_cancelled',
    });

    expect(retry.result).toBe('accepted');
    expect(retry.job?.attemptCount).toBe(1);
    expect(cancel.result).toBe('accepted');
    expect(cancel.job?.status).toBe('cancelled');
  });

  it('keeps opportunity score unchanged when queue operations degrade', async () => {
    const queueService = createQueueService();
    const scoringService = new OpportunityScoringService();
    const product = await productService.getProductById(productId);
    expect(product).toBeTruthy();

    const before = await scoringService.explainProduct(productId);
    await queueService.recordProviderFailure(
      product!,
      'rainforest',
      'quota_exhausted'
    );
    const after = await scoringService.explainProduct(productId);

    expect(after.score).toBe(before.score);
    expect(after.confidence).toBe(before.confidence);
  });

  function createQueueService(
    options: { maxAttempts?: number; leaseMs?: number } = {}
  ): AcquisitionQueueService {
    const jobService = new ScrapeJobService({
      maxAttempts: options.maxAttempts ?? 3,
      leaseMs: options.leaseMs ?? 1000,
      baseBackoffMs: 1000,
      maxBackoffMs: 5000,
      jitterRatio: 0,
    });
    return new AcquisitionQueueService({
      adapter: new SQLiteAcquisitionQueueAdapter(jobService),
      productService,
      attemptService,
    });
  }

  async function clearQueueTestData(): Promise<void> {
    await clearProductRelatedData();
  }
});
