import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { db } from '../src/db';
import {
  alerts,
  priceSnapshots,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { ProductService } from '../src/services/productService';
import { ScrapeAttemptService } from '../src/services/scrapeAttemptService';
import { ScrapeJobService } from '../src/services/scrapeJobService';

describe('Scrape job and attempt services', () => {
  const productService = new ProductService();
  const jobService = new ScrapeJobService({
    maxAttempts: 3,
    baseBackoffMs: 1000,
    maxBackoffMs: 5000,
    leaseMs: 1000,
    jitterRatio: 0,
  });
  const attemptService = new ScrapeAttemptService();
  let productId: string;

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    const migration = fs.readFileSync(
      path.resolve('migrations/002-product-data-acquisition.sql'),
      'utf-8'
    );
    sqlite.exec(migration);
    sqlite.close();
  });

  beforeEach(async () => {
    await db.delete(scrapeAttempts);
    await db.delete(scrapeJobs);
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);

    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: `https://amazon.com/dp/JOBTEST${Date.now()}`,
      asin: 'JOBTEST001',
      title: 'Job Test Product',
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });
    productId = product.id;
  });

  afterEach(async () => {
    await db.delete(scrapeAttempts);
    await db.delete(scrapeJobs);
    await db.delete(priceSnapshots);
    await db.delete(alerts);
    await db.delete(products);
  });

  it('should create a scrape job', async () => {
    const { job, created } = await jobService.enqueueProduct({ productId });

    expect(created).toBe(true);
    expect(job.id).toBeDefined();
    expect(job.productId).toBe(productId);
    expect(job.status).toBe('pending');
    expect(job.attemptCount).toBe(0);
  });

  it('should prevent duplicate active jobs for a product', async () => {
    const first = await jobService.enqueueProduct({ productId });
    const second = await jobService.enqueueProduct({ productId });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.job.id).toBe(first.job.id);
  });

  it('should claim a due job and set lease metadata', async () => {
    await jobService.enqueueProduct({ productId, nextRunAt: 1000 });

    const claimed = await jobService.claimNextDueJob('worker-a', 1000);

    expect(claimed).toBeDefined();
    expect(claimed?.status).toBe('running');
    expect(claimed?.leaseOwner).toBe('worker-a');
    expect(claimed?.leaseExpiresAt).toBe(2000);
  });

  it('should not claim jobs before next run time', async () => {
    await jobService.enqueueProduct({ productId, nextRunAt: 2000 });

    const claimed = await jobService.claimNextDueJob('worker-a', 1000);

    expect(claimed).toBeNull();
  });

  it('should recover an expired running job lease', async () => {
    await jobService.enqueueProduct({ productId, nextRunAt: 1000 });
    const firstClaim = await jobService.claimNextDueJob('worker-a', 1000);

    const activeLeaseClaim = await jobService.claimNextDueJob('worker-b', 1500);
    const expiredLeaseClaim = await jobService.claimNextDueJob('worker-b', 2001);

    expect(firstClaim?.status).toBe('running');
    expect(activeLeaseClaim).toBeNull();
    expect(expiredLeaseClaim?.id).toBe(firstClaim?.id);
    expect(expiredLeaseClaim?.leaseOwner).toBe('worker-b');
  });

  it('should mark a job successful', async () => {
    const { job } = await jobService.enqueueProduct({ productId });
    await jobService.claimNextDueJob('worker-a');

    const updated = await jobService.markSucceeded(job.id, 'attempt-1', 3000);

    expect(updated.status).toBe('succeeded');
    expect(updated.attemptCount).toBe(1);
    expect(updated.lastAttemptId).toBe('attempt-1');
    expect(updated.completedAt).toBe(3000);
  });

  it('should schedule retry with exponential backoff when attempts remain', async () => {
    const { job } = await jobService.enqueueProduct({
      productId,
      nextRunAt: 1000,
      maxAttempts: 3,
    });
    await jobService.claimNextDueJob('worker-a', 1000);

    const updated = await jobService.markFailedOrRetry(
      job.id,
      'network_timeout',
      'attempt-1',
      2000
    );

    expect(updated.status).toBe('retry_scheduled');
    expect(updated.attemptCount).toBe(1);
    expect(updated.lastFailureReason).toBe('network_timeout');
    expect(updated.nextRunAt).toBe(3000);
  });

  it('should mark job failed when attempts are exhausted', async () => {
    const { job } = await jobService.enqueueProduct({
      productId,
      maxAttempts: 1,
    });
    await jobService.claimNextDueJob('worker-a');

    const updated = await jobService.markFailedOrRetry(
      job.id,
      'captcha',
      'attempt-1',
      2000
    );

    expect(updated.status).toBe('failed');
    expect(updated.attemptCount).toBe(1);
    expect(updated.completedAt).toBe(2000);
    expect(updated.lastFailureReason).toBe('captcha');
  });

  it('should record and query scrape attempts by product', async () => {
    const { job } = await jobService.enqueueProduct({ productId });

    await attemptService.recordAttempt({
      jobId: job.id,
      productId,
      provider: 'amazon-browser',
      source: 'browser',
      status: 'failed',
      failureReason: 'captcha',
      errorMessage: 'Robot check detected',
      durationMs: 1500,
      confidence: 0,
      pageTitle: 'Robot Check',
      finalUrl: 'https://amazon.com/dp/JOBTEST001',
      diagnostics: JSON.stringify({ detectedState: 'captcha' }),
    });

    await attemptService.recordAttempt({
      jobId: job.id,
      productId,
      provider: 'cache',
      source: 'cache',
      status: 'success',
      durationMs: 5,
      confidence: 0.5,
    });

    const attempts = await attemptService.getAttemptsByProduct(productId, {
      limit: 1,
    });

    expect(attempts).toHaveLength(1);
    expect(attempts[0].productId).toBe(productId);
    expect(attempts[0].provider).toBe('cache');
  });
});
