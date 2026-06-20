import { randomUUID } from 'crypto';
import { and, asc, desc, eq, inArray, lte, or } from 'drizzle-orm';
import { db } from '../db';
import { scrapeJobs } from '../db/schema';
import {
  AcquisitionFailureReason,
  CreateScrapeJobData,
  ScrapeJob,
  ScrapeJobStatus,
} from '../types';
import { config } from '../config';

const ACTIVE_JOB_STATUSES: ScrapeJobStatus[] = [
  'pending',
  'running',
  'retry_scheduled',
];

interface ScrapeJobServiceOptions {
  maxAttempts?: number;
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  leaseMs?: number;
  jitterRatio?: number;
}

export class ScrapeJobService {
  private readonly maxAttempts: number;
  private readonly baseBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly leaseMs: number;
  private readonly jitterRatio: number;

  constructor(options: ScrapeJobServiceOptions = {}) {
    this.maxAttempts = options.maxAttempts ?? config.acquisition.maxAttempts;
    this.baseBackoffMs =
      options.baseBackoffMs ?? config.acquisition.baseBackoffMs;
    this.maxBackoffMs = options.maxBackoffMs ?? config.acquisition.maxBackoffMs;
    this.leaseMs = options.leaseMs ?? config.acquisition.leaseMs;
    this.jitterRatio = options.jitterRatio ?? 0.2;
  }

  async enqueueProduct(
    data: CreateScrapeJobData
  ): Promise<{ job: ScrapeJob; created: boolean }> {
    const existing = await this.findActiveJobByProduct(data.productId);
    if (existing) {
      return { job: existing, created: false };
    }

    const now = Date.now();
    const [job] = await db
      .insert(scrapeJobs)
      .values({
        id: randomUUID(),
        productId: data.productId,
        status: 'pending',
        priority: data.priority ?? 0,
        nextRunAt: data.nextRunAt ?? now,
        attemptCount: 0,
        maxAttempts: data.maxAttempts ?? this.maxAttempts,
        createdAt: now,
        updatedAt: now,
        metadata: data.metadata,
      })
      .returning();

    return { job: job as ScrapeJob, created: true };
  }

  async findActiveJobByProduct(productId: string): Promise<ScrapeJob | null> {
    const [job] = await db
      .select()
      .from(scrapeJobs)
      .where(
        and(
          eq(scrapeJobs.productId, productId),
          inArray(scrapeJobs.status, ACTIVE_JOB_STATUSES)
        )
      )
      .limit(1);

    return job ? (job as ScrapeJob) : null;
  }

  async getJobById(jobId: string): Promise<ScrapeJob | null> {
    const [job] = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.id, jobId))
      .limit(1);

    return job ? (job as ScrapeJob) : null;
  }

  async getLatestJobByProduct(productId: string): Promise<ScrapeJob | null> {
    const [job] = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.productId, productId))
      .orderBy(desc(scrapeJobs.createdAt))
      .limit(1);

    return job ? (job as ScrapeJob) : null;
  }

  async getJobsByProduct(
    productId: string,
    options: { limit?: number } = {}
  ): Promise<ScrapeJob[]> {
    const jobs = await db
      .select()
      .from(scrapeJobs)
      .where(eq(scrapeJobs.productId, productId))
      .orderBy(desc(scrapeJobs.createdAt))
      .limit(options.limit ?? 20);

    return jobs as ScrapeJob[];
  }

  async findRecentManualJob(
    productId: string,
    throttleWindowMs: number,
    now: number = Date.now()
  ): Promise<ScrapeJob | null> {
    const since = now - throttleWindowMs;
    const jobs = await this.getJobsByProduct(productId, { limit: 10 });

    const recent = jobs.find((job) => {
      if (ACTIVE_JOB_STATUSES.includes(job.status)) {
        return true;
      }

      if (job.createdAt < since) {
        return false;
      }

      const metadata = this.parseJobMetadata(job.metadata);
      return metadata?.trigger === 'manual';
    });

    return recent ?? null;
  }

  async claimNextDueJob(
    leaseOwner: string = 'local-worker',
    now: number = Date.now()
  ): Promise<ScrapeJob | null> {
    const [job] = await db
      .select()
      .from(scrapeJobs)
      .where(
        or(
          and(
            inArray(scrapeJobs.status, ['pending', 'retry_scheduled']),
            lte(scrapeJobs.nextRunAt, now)
          ),
          and(
            eq(scrapeJobs.status, 'running'),
            lte(scrapeJobs.leaseExpiresAt, now)
          )
        )
      )
      .orderBy(desc(scrapeJobs.priority), asc(scrapeJobs.nextRunAt))
      .limit(1);

    if (!job) {
      return null;
    }

    const [claimed] = await db
      .update(scrapeJobs)
      .set({
        status: 'running',
        leaseOwner,
        leaseExpiresAt: now + this.leaseMs,
        updatedAt: now,
      })
      .where(eq(scrapeJobs.id, job.id))
      .returning();

    return claimed as ScrapeJob;
  }

  async claimJobById(
    jobId: string,
    leaseOwner: string = 'local-worker',
    now: number = Date.now()
  ): Promise<ScrapeJob | null> {
    const job = await this.getJobById(jobId);
    if (!job) {
      return null;
    }

    const claimable =
      (['pending', 'retry_scheduled'] as ScrapeJobStatus[]).includes(
        job.status
      ) && job.nextRunAt <= now;
    const expiredLease =
      job.status === 'running' &&
      !!job.leaseExpiresAt &&
      job.leaseExpiresAt <= now;

    if (!claimable && !expiredLease) {
      return null;
    }

    const [claimed] = await db
      .update(scrapeJobs)
      .set({
        status: 'running',
        leaseOwner,
        leaseExpiresAt: now + this.leaseMs,
        updatedAt: now,
      })
      .where(eq(scrapeJobs.id, jobId))
      .returning();

    return claimed as ScrapeJob;
  }

  async markSucceeded(
    jobId: string,
    lastAttemptId?: string,
    now: number = Date.now()
  ): Promise<ScrapeJob> {
    const job = await this.requireJob(jobId);

    const [updated] = await db
      .update(scrapeJobs)
      .set({
        status: 'succeeded',
        attemptCount: job.attemptCount + 1,
        lastAttemptId,
        lastFailureReason: null,
        leaseOwner: null,
        leaseExpiresAt: null,
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(scrapeJobs.id, jobId))
      .returning();

    return updated as ScrapeJob;
  }

  async markFailedOrRetry(
    jobId: string,
    failureReason: AcquisitionFailureReason,
    lastAttemptId?: string,
    now: number = Date.now()
  ): Promise<ScrapeJob> {
    const job = await this.requireJob(jobId);
    const attemptCount = job.attemptCount + 1;
    const exhausted = attemptCount >= job.maxAttempts;

    const [updated] = await db
      .update(scrapeJobs)
      .set({
        status: exhausted ? 'failed' : 'retry_scheduled',
        attemptCount,
        lastAttemptId,
        lastFailureReason: failureReason,
        nextRunAt: exhausted
          ? job.nextRunAt
          : now + this.calculateBackoffMs(attemptCount),
        leaseOwner: null,
        leaseExpiresAt: null,
        completedAt: exhausted ? now : null,
        updatedAt: now,
      })
      .where(eq(scrapeJobs.id, jobId))
      .returning();

    return updated as ScrapeJob;
  }

  async retryJob(
    jobId: string,
    metadata: Record<string, unknown> = {},
    now: number = Date.now()
  ): Promise<{ job: ScrapeJob; changed: boolean; message: string }> {
    const job = await this.requireJob(jobId);
    if (!(['failed', 'cancelled'] as ScrapeJobStatus[]).includes(job.status)) {
      return {
        job,
        changed: false,
        message: `Job ${job.status} cannot be retried`,
      };
    }

    const [updated] = await db
      .update(scrapeJobs)
      .set({
        status: 'pending',
        nextRunAt: now,
        leaseOwner: null,
        leaseExpiresAt: null,
        completedAt: null,
        updatedAt: now,
        metadata: this.mergeJobMetadata(job.metadata, {
          ...metadata,
          retriedAt: now,
        }),
      })
      .where(eq(scrapeJobs.id, jobId))
      .returning();

    return {
      job: updated as ScrapeJob,
      changed: true,
      message: 'Job moved to pending for retry',
    };
  }

  async cancelJob(
    jobId: string,
    metadata: Record<string, unknown> = {},
    now: number = Date.now()
  ): Promise<{ job: ScrapeJob; changed: boolean; message: string }> {
    const job = await this.requireJob(jobId);
    if ((['pending', 'retry_scheduled'] as ScrapeJobStatus[]).includes(job.status)) {
      const [updated] = await db
        .update(scrapeJobs)
        .set({
          status: 'cancelled',
          leaseOwner: null,
          leaseExpiresAt: null,
          completedAt: now,
          updatedAt: now,
          metadata: this.mergeJobMetadata(job.metadata, {
            ...metadata,
            cancelledAt: now,
          }),
        })
        .where(eq(scrapeJobs.id, jobId))
        .returning();

      return {
        job: updated as ScrapeJob,
        changed: true,
        message: 'Job cancelled',
      };
    }

    if (job.status === 'running') {
      const [updated] = await db
        .update(scrapeJobs)
        .set({
          updatedAt: now,
          metadata: this.mergeJobMetadata(job.metadata, {
            ...metadata,
            cancelRequestedAt: now,
          }),
        })
        .where(eq(scrapeJobs.id, jobId))
        .returning();

      return {
        job: updated as ScrapeJob,
        changed: true,
        message:
          'Cancellation requested; running job will stop on cooperative completion or lease expiry',
      };
    }

    return {
      job,
      changed: false,
      message: `Job ${job.status} cannot be cancelled`,
    };
  }

  calculateBackoffMs(attemptCount: number): number {
    const exponential = this.baseBackoffMs * 2 ** Math.max(attemptCount - 1, 0);
    const capped = Math.min(exponential, this.maxBackoffMs);
    const jitter = capped * this.jitterRatio * Math.random();
    return Math.round(capped + jitter);
  }

  private async requireJob(jobId: string): Promise<ScrapeJob> {
    const job = await this.getJobById(jobId);
    if (!job) {
      throw new Error(`Scrape job not found: ${jobId}`);
    }
    return job;
  }

  private parseJobMetadata(metadata?: string | null): Record<string, unknown> | null {
    if (!metadata) return null;
    try {
      const parsed = JSON.parse(metadata) as Record<string, unknown>;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  private mergeJobMetadata(
    metadata: string | null | undefined,
    patch: Record<string, unknown>
  ): string {
    return JSON.stringify({
      ...(this.parseJobMetadata(metadata) ?? {}),
      ...patch,
    });
  }
}
