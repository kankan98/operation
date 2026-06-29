import { asc, desc, eq } from 'drizzle-orm';
import { AcquisitionFailureReason, CreateScrapeJobData, ScrapeJob } from '../types';
import { db } from '../db';
import { products, scrapeJobs } from '../db/schema';
import { ScrapeJobService } from './scrapeJobService';

export interface QueueCountFilters {
  platform?: string;
}

export interface QueueCounts {
  backlog: number;
  pending: number;
  running: number;
  retryScheduled: number;
  failed: number;
  cancelled: number;
  staleLeases: number;
}

export interface AcquisitionQueueAdapter {
  readonly backend: 'sqlite' | 'bullmq';
  enqueueProduct(data: CreateScrapeJobData): Promise<{ job: ScrapeJob; created: boolean }>;
  enqueueManualProduct(
    data: CreateScrapeJobData,
    throttleWindowMs: number
  ): Promise<{ job: ScrapeJob; created: boolean; throttled: boolean }>;
  claimNextDueJob(leaseOwner?: string, now?: number): Promise<ScrapeJob | null>;
  claimJobById(jobId: string, leaseOwner?: string, now?: number): Promise<ScrapeJob | null>;
  completeJob(jobId: string, attemptId?: string, now?: number): Promise<ScrapeJob>;
  failJob(
    jobId: string,
    failureReason: AcquisitionFailureReason,
    attemptId?: string,
    now?: number
  ): Promise<ScrapeJob>;
  retryJob(
    jobId: string,
    metadata?: Record<string, unknown>,
    now?: number
  ): Promise<{ job: ScrapeJob; changed: boolean; message: string }>;
  cancelJob(
    jobId: string,
    metadata?: Record<string, unknown>,
    now?: number
  ): Promise<{ job: ScrapeJob; changed: boolean; message: string }>;
  getJobById(jobId: string): Promise<ScrapeJob | null>;
  getLatestJobByProduct(productId: string): Promise<ScrapeJob | null>;
  getQueueCounts(filters?: QueueCountFilters, now?: number): Promise<QueueCounts>;
  close?(): Promise<void>;
}

export class SQLiteAcquisitionQueueAdapter implements AcquisitionQueueAdapter {
  readonly backend = 'sqlite' as const;

  constructor(private readonly scrapeJobService = new ScrapeJobService()) {}

  async enqueueProduct(
    data: CreateScrapeJobData
  ): Promise<{ job: ScrapeJob; created: boolean }> {
    return await this.scrapeJobService.enqueueProduct(data);
  }

  async enqueueManualProduct(
    data: CreateScrapeJobData,
    throttleWindowMs: number
  ): Promise<{ job: ScrapeJob; created: boolean; throttled: boolean }> {
    const recent = await this.scrapeJobService.findRecentManualJob(
      data.productId,
      throttleWindowMs
    );
    if (recent) {
      return { job: recent, created: false, throttled: true };
    }

    const result = await this.scrapeJobService.enqueueProduct({
      ...data,
      metadata: JSON.stringify({
        trigger: 'manual',
        ...(data.metadata ? this.parseMetadata(data.metadata) : {}),
      }),
    });
    return { ...result, throttled: false };
  }

  async claimNextDueJob(
    leaseOwner?: string,
    now?: number
  ): Promise<ScrapeJob | null> {
    return await this.scrapeJobService.claimNextDueJob(leaseOwner, now);
  }

  async claimJobById(
    jobId: string,
    leaseOwner?: string,
    now?: number
  ): Promise<ScrapeJob | null> {
    return await this.scrapeJobService.claimJobById(jobId, leaseOwner, now);
  }

  async completeJob(
    jobId: string,
    attemptId?: string,
    now?: number
  ): Promise<ScrapeJob> {
    return await this.scrapeJobService.markSucceeded(jobId, attemptId, now);
  }

  async failJob(
    jobId: string,
    failureReason: AcquisitionFailureReason,
    attemptId?: string,
    now?: number
  ): Promise<ScrapeJob> {
    return await this.scrapeJobService.markFailedOrRetry(
      jobId,
      failureReason,
      attemptId,
      now
    );
  }

  async retryJob(
    jobId: string,
    metadata?: Record<string, unknown>,
    now?: number
  ): Promise<{ job: ScrapeJob; changed: boolean; message: string }> {
    return await this.scrapeJobService.retryJob(jobId, metadata, now);
  }

  async cancelJob(
    jobId: string,
    metadata?: Record<string, unknown>,
    now?: number
  ): Promise<{ job: ScrapeJob; changed: boolean; message: string }> {
    return await this.scrapeJobService.cancelJob(jobId, metadata, now);
  }

  async getJobById(jobId: string): Promise<ScrapeJob | null> {
    return await this.scrapeJobService.getJobById(jobId);
  }

  async getLatestJobByProduct(productId: string): Promise<ScrapeJob | null> {
    return await this.scrapeJobService.getLatestJobByProduct(productId);
  }

  async getQueueCounts(
    filters: QueueCountFilters = {},
    now: number = Date.now()
  ): Promise<QueueCounts> {
    const rows = await db
      .select({
        status: scrapeJobs.status,
        nextRunAt: scrapeJobs.nextRunAt,
        leaseExpiresAt: scrapeJobs.leaseExpiresAt,
        platform: products.platform,
      })
      .from(scrapeJobs)
      .leftJoin(products, eq(scrapeJobs.productId, products.id))
      .where(
        filters.platform ? eq(products.platform, filters.platform) : undefined
      )
      .orderBy(desc(scrapeJobs.priority), asc(scrapeJobs.nextRunAt));

    const counts: QueueCounts = {
      backlog: 0,
      pending: 0,
      running: 0,
      retryScheduled: 0,
      failed: 0,
      cancelled: 0,
      staleLeases: 0,
    };

    for (const row of rows) {
      if (row.status === 'pending') counts.pending += 1;
      if (row.status === 'running') counts.running += 1;
      if (row.status === 'retry_scheduled') counts.retryScheduled += 1;
      if (row.status === 'failed') counts.failed += 1;
      if (row.status === 'cancelled') counts.cancelled += 1;
      if (
        (row.status === 'pending' || row.status === 'retry_scheduled') &&
        row.nextRunAt <= now
      ) {
        counts.backlog += 1;
      }
      if (
        row.status === 'running' &&
        row.leaseExpiresAt !== null &&
        row.leaseExpiresAt <= now
      ) {
        counts.staleLeases += 1;
      }
    }

    return counts;
  }

  private parseMetadata(value: string): Record<string, unknown> {
    try {
      const parsed = JSON.parse(value) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
}

export function createAcquisitionQueueAdapter(): AcquisitionQueueAdapter {
  // 手动优先模式仅支持本地 SQLite 队列后端
  return new SQLiteAcquisitionQueueAdapter();
}
