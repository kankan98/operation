import { randomUUID } from 'crypto';
import {
  AcquisitionJobCancelRequest,
  AcquisitionJobControlResponse,
  AcquisitionJobRetryRequest,
  AcquisitionProductJobDiagnostics,
  AcquisitionQueueHealth,
  AcquisitionWorkerHealth,
  ACQUISITION_QUEUE_CAVEAT,
} from '@shared/schemas';
import { db } from '../db';
import { acquisitionQueueEvents } from '../db/schema';
import {
  AcquisitionFailureReason,
  AcquisitionRootCause,
  CreateScrapeJobData,
  Product,
  ScrapeAttempt,
  ScrapeJob,
} from '../types';
import { config } from '../config';
import { ProductService } from './productService';
import { ScrapeAttemptService } from './scrapeAttemptService';
import {
  AcquisitionQueueAdapter,
  createAcquisitionQueueAdapter,
} from './acquisitionQueueAdapter';
import { WorkerHeartbeatService } from './workerHeartbeatService';
import { ProviderLimitService } from './providerLimitService';
import { parseJsonRecord, sanitizeQueueMetadata, stringifySafeMetadata } from './acquisitionQueueSafety';

interface AcquisitionQueueServiceOptions {
  adapter?: AcquisitionQueueAdapter;
  productService?: ProductService;
  attemptService?: ScrapeAttemptService;
  workerHeartbeatService?: WorkerHeartbeatService;
  providerLimitService?: ProviderLimitService;
}

export class AcquisitionQueueService {
  private readonly adapter: AcquisitionQueueAdapter;
  private readonly productService: ProductService;
  private readonly attemptService: ScrapeAttemptService;
  private readonly workerHeartbeatService: WorkerHeartbeatService;
  private readonly providerLimitService: ProviderLimitService;

  constructor(options: AcquisitionQueueServiceOptions = {}) {
    this.adapter = options.adapter ?? createAcquisitionQueueAdapter();
    this.productService = options.productService ?? new ProductService();
    this.attemptService = options.attemptService ?? new ScrapeAttemptService();
    this.workerHeartbeatService =
      options.workerHeartbeatService ?? new WorkerHeartbeatService();
    this.providerLimitService =
      options.providerLimitService ?? new ProviderLimitService();
  }

  async enqueueProduct(
    data: CreateScrapeJobData
  ): Promise<{ job: ScrapeJob; created: boolean }> {
    const result = await this.adapter.enqueueProduct(data);
    await this.recordEvent({
      jobId: result.job.id,
      productId: result.job.productId,
      action: 'enqueue',
      status: result.created ? 'created' : 'reused',
      message: result.created
        ? 'Acquisition job enqueued'
        : 'Existing active acquisition job reused',
    });
    return result;
  }

  async enqueueManualProduct(
    productId: string,
    data: Omit<CreateScrapeJobData, 'productId'> = {}
  ): Promise<{ job: ScrapeJob; created: boolean; throttled: boolean }> {
    const result = await this.adapter.enqueueManualProduct(
      {
        productId,
        ...data,
        metadata: JSON.stringify({
          trigger: 'manual',
          requestedAt: Date.now(),
          ...(data.metadata ? parseJsonRecord(data.metadata) : {}),
        }),
      },
      config.acquisition.queue.manualRefreshThrottleMs
    );

    await this.recordEvent({
      jobId: result.job.id,
      productId,
      action: 'manual_enqueue',
      status: result.throttled ? 'throttled' : result.created ? 'created' : 'reused',
      message: result.throttled
        ? 'Manual refresh reused a recent acquisition job'
        : 'Manual acquisition job accepted',
    });

    return result;
  }

  async claimNextDueJob(
    leaseOwner: string = 'local-worker',
    now: number = Date.now()
  ): Promise<ScrapeJob | null> {
    const job = await this.adapter.claimNextDueJob(leaseOwner, now);
    if (job) {
      await this.recordEvent({
        jobId: job.id,
        productId: job.productId,
        action: 'claim',
        status: 'running',
        workerId: leaseOwner,
        message: 'Acquisition job claimed',
      });
    }
    return job;
  }

  async claimJobById(
    jobId: string,
    leaseOwner: string = 'local-worker',
    now: number = Date.now()
  ): Promise<ScrapeJob | null> {
    const job = await this.adapter.claimJobById(jobId, leaseOwner, now);
    if (job) {
      await this.recordEvent({
        jobId: job.id,
        productId: job.productId,
        action: 'claim',
        status: 'running',
        workerId: leaseOwner,
        message: 'Acquisition job claimed by id',
      });
    }
    return job;
  }

  async completeJob(jobId: string, attemptId?: string): Promise<ScrapeJob> {
    const job = await this.adapter.completeJob(jobId, attemptId);
    await this.recordEvent({
      jobId,
      productId: job.productId,
      action: 'complete',
      status: 'succeeded',
      message: 'Acquisition job completed',
    });
    return job;
  }

  async failJob(
    jobId: string,
    failureReason: AcquisitionFailureReason,
    attemptId?: string
  ): Promise<ScrapeJob> {
    const job = await this.adapter.failJob(jobId, failureReason, attemptId);
    await this.recordEvent({
      jobId,
      productId: job.productId,
      action: 'fail',
      status: job.status,
      message: `Acquisition job ${job.status}`,
      metadata: { failureReason },
    });
    return job;
  }

  async retryJob(
    request: AcquisitionJobRetryRequest
  ): Promise<AcquisitionJobControlResponse> {
    const result = await this.adapter.retryJob(request.jobId, {
      reason: request.reason,
      operatorNote: request.operatorNote,
    });

    await this.recordEvent({
      jobId: result.job.id,
      productId: result.job.productId,
      action: 'retry',
      status: result.changed ? 'accepted' : 'rejected',
      message: result.message,
      metadata: { reason: request.reason, operatorNote: request.operatorNote },
    });

    return {
      action: 'retry',
      result: result.changed ? 'accepted' : 'rejected',
      job: this.toProductJobState(result.job),
      message: result.message,
      caveat: ACQUISITION_QUEUE_CAVEAT,
    };
  }

  async cancelJob(
    request: AcquisitionJobCancelRequest
  ): Promise<AcquisitionJobControlResponse> {
    const result = await this.adapter.cancelJob(request.jobId, {
      reason: request.reason,
      operatorNote: request.operatorNote,
    });

    await this.recordEvent({
      jobId: result.job.id,
      productId: result.job.productId,
      action: 'cancel',
      status: result.changed ? 'accepted' : 'rejected',
      message: result.message,
      metadata: { reason: request.reason, operatorNote: request.operatorNote },
    });

    return {
      action: 'cancel',
      result: result.changed ? 'accepted' : 'rejected',
      job: this.toProductJobState(result.job),
      message: result.message,
      caveat: ACQUISITION_QUEUE_CAVEAT,
    };
  }

  async getJobById(jobId: string): Promise<ScrapeJob | null> {
    return await this.adapter.getJobById(jobId);
  }

  async getQueueHealth(filters: {
    platform?: string;
    provider?: string;
  } = {}): Promise<AcquisitionQueueHealth> {
    const now = Date.now();
    const counts = await this.adapter.getQueueCounts(
      { platform: filters.platform },
      now
    );
    const workerHealth = await this.workerHeartbeatService.getWorkerHealth();
    const providerGates = await this.providerLimitService.listLimits(filters);
    const activeProviderGates = providerGates.filter((gate) =>
      this.providerLimitService.isGateActive(gate, now)
    );
    const recommendations = this.buildQueueRecommendations(
      counts,
      workerHealth,
      activeProviderGates
    );
    const hasHistory =
      counts.pending +
        counts.running +
        counts.retryScheduled +
        counts.failed +
        counts.cancelled +
        workerHealth.summary.total +
        providerGates.length >
      0;

    return {
      backend: this.adapter.backend,
      status: !hasHistory
        ? 'insufficient_history'
        : recommendations.some((item) => item.severity !== 'info')
          ? 'degraded'
          : 'healthy',
      scope: filters,
      counts,
      workerSummary: workerHealth.summary,
      providerGates,
      recommendations,
      caveat: ACQUISITION_QUEUE_CAVEAT,
      generatedAt: now,
    };
  }

  async getWorkerHealth(filters = {}): Promise<AcquisitionWorkerHealth> {
    return await this.workerHeartbeatService.getWorkerHealth(filters);
  }

  async recordWorkerHeartbeat(
    input: Parameters<WorkerHeartbeatService['recordHeartbeat']>[0]
  ) {
    return await this.workerHeartbeatService.recordHeartbeat(input);
  }

  async getProviderQueueStatus(filters: {
    platform?: string;
    provider?: string;
  } = {}) {
    return await this.providerLimitService.getProviderQueueStatus(filters);
  }

  async recordProviderSuccess(product: Product, provider: string): Promise<void> {
    await this.providerLimitService.upsertLimit({
      platform: product.platform,
      provider,
      status: 'open',
      currentConcurrency: 0,
      activeCount: 0,
      recentRootCauses: [],
      recommendations: [],
      metadata: { source: 'acquisition_success' },
    });
  }

  async recordProviderFailure(
    product: Product,
    provider: string,
    rootCause?: AcquisitionRootCause
  ): Promise<void> {
    if (rootCause !== 'rate_limited' && rootCause !== 'quota_exhausted') {
      return;
    }

    const status =
      rootCause === 'quota_exhausted' ? 'quota_exhausted' : 'rate_limited';
    await this.providerLimitService.upsertLimit({
      platform: product.platform,
      provider,
      status,
      resetAt: Date.now() + config.acquisition.queue.defaultRateLimitResetMs,
      recentRootCauses: [rootCause],
      recommendations: [
        {
          code: `provider_${status}`,
          severity: status === 'quota_exhausted' ? 'critical' : 'warning',
          message: `${provider} reported ${status}. Check quota, credentials, reset time, or reduce concurrency before retrying.`,
        },
      ],
      metadata: { source: 'acquisition_failure', rootCause },
    });
  }

  async getProductJobDiagnostics(
    productId: string
  ): Promise<AcquisitionProductJobDiagnostics> {
    const now = Date.now();
    const product = await this.productService.getProductById(productId);
    const job = await this.adapter.getLatestJobByProduct(productId);
    const attempts = await this.attemptService.getAttemptsByProduct(productId, {
      limit: 1,
    });
    const providerGate = product
      ? await this.providerLimitService.getMostRelevantGateForProduct(product)
      : null;
    const recommendations = this.buildProductRecommendations(
      job,
      attempts[0],
      providerGate,
      product
    );

    return {
      productId,
      job: job ? this.toProductJobState(job, providerGate) : null,
      latestAttempt: attempts[0] ? this.toAttemptSummary(attempts[0]) : null,
      providerGate,
      recommendations,
      caveat: ACQUISITION_QUEUE_CAVEAT,
      generatedAt: now,
    };
  }

  private buildQueueRecommendations(
    counts: AcquisitionQueueHealth['counts'],
    workerHealth: AcquisitionWorkerHealth,
    activeProviderGates: AcquisitionQueueHealth['providerGates']
  ): AcquisitionQueueHealth['recommendations'] {
    const recommendations: AcquisitionQueueHealth['recommendations'] = [];

    if (counts.backlog > config.acquisition.queue.degradedBacklogThreshold) {
      recommendations.push({
        code: 'reduce_backlog',
        severity: 'warning',
        message:
          'Acquisition backlog exceeds the configured threshold. Check worker capacity or provider gates.',
      });
    }

    if (counts.staleLeases > 0 || workerHealth.summary.stale > 0) {
      recommendations.push({
        code: 'check_workers',
        severity: 'warning',
        message:
          'One or more workers or leases are stale. Restart workers or wait for leases to expire before retrying.',
      });
    }

    for (const gate of activeProviderGates) {
      recommendations.push({
        code: `provider_${gate.status}`,
        severity: gate.status === 'quota_exhausted' ? 'critical' : 'warning',
        message: `${gate.provider} on ${gate.platform} is ${gate.status}. Check credentials, quota, reset time, or concurrency settings.`,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        code: 'queue_operational',
        severity: 'info',
        message: 'Acquisition queue operations are within configured thresholds.',
      });
    }

    return recommendations;
  }

  private buildProductRecommendations(
    job: ScrapeJob | null,
    latestAttempt: ScrapeAttempt | undefined,
    providerGate: AcquisitionProductJobDiagnostics['providerGate'],
    product: Product | null
  ): AcquisitionProductJobDiagnostics['recommendations'] {
    if (!product) {
      return [
        {
          code: 'product_missing',
          severity: 'warning',
          message: 'Product was not found; acquisition cannot run for this ID.',
        },
      ];
    }

    if (!job) {
      return [
        {
          code: 'no_acquisition_job',
          severity: 'info',
          message: 'No acquisition job history exists for this product.',
        },
      ];
    }

    if (providerGate && this.providerLimitService.isGateActive(providerGate)) {
      return [
        {
          code: `provider_${providerGate.status}`,
          severity:
            providerGate.status === 'quota_exhausted' ? 'critical' : 'warning',
          message: `${providerGate.provider} is ${providerGate.status}; check provider quota, credentials, or reset timing.`,
        },
      ];
    }

    if (job.status === 'failed' || job.status === 'cancelled') {
      return [
        {
          code: 'retry_available',
          severity: 'warning',
          message: 'This acquisition job can be retried through the operations API/UI.',
        },
      ];
    }

    if (latestAttempt?.status === 'failed') {
      return [
        {
          code: 'latest_attempt_failed',
          severity: 'warning',
          message:
            'The latest acquisition attempt failed. Review provider diagnostics before retrying.',
        },
      ];
    }

    return [
      {
        code: 'job_observable',
        severity: 'info',
        message: 'Product acquisition job state is available for operations review.',
      },
    ];
  }

  private toProductJobState(
    job: ScrapeJob,
    providerGate: AcquisitionProductJobDiagnostics['providerGate'] = null
  ): NonNullable<AcquisitionProductJobDiagnostics['job']> {
    return {
      id: job.id,
      productId: job.productId,
      status: job.status,
      priority: job.priority,
      attemptCount: job.attemptCount,
      maxAttempts: job.maxAttempts,
      nextRunAt: job.nextRunAt,
      leaseOwner: job.leaseOwner ?? null,
      leaseExpiresAt: job.leaseExpiresAt ?? null,
      lastAttemptId: job.lastAttemptId ?? null,
      lastFailureReason: job.lastFailureReason ?? null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      completedAt: job.completedAt ?? null,
      retryable: job.status === 'failed' || job.status === 'cancelled',
      cancellable: job.status === 'pending' || job.status === 'retry_scheduled',
      delayReason: this.getDelayReason(job, providerGate),
      metadata: sanitizeQueueMetadata(parseJsonRecord(job.metadata)),
    };
  }

  private toAttemptSummary(
    attempt: ScrapeAttempt
  ): NonNullable<AcquisitionProductJobDiagnostics['latestAttempt']> {
    return {
      id: attempt.id,
      provider: attempt.provider,
      source: attempt.source,
      status: attempt.status,
      failureReason: attempt.failureReason ?? null,
      durationMs: attempt.durationMs,
      confidence: attempt.confidence ?? null,
      httpStatus: attempt.httpStatus ?? null,
      timestamp: attempt.timestamp,
      diagnostics: sanitizeQueueMetadata(parseJsonRecord(attempt.diagnostics)),
    };
  }

  private getDelayReason(
    job: ScrapeJob,
    providerGate: AcquisitionProductJobDiagnostics['providerGate']
  ): string | null {
    if (providerGate && this.providerLimitService.isGateActive(providerGate)) {
      return `provider_${providerGate.status}`;
    }

    if (job.status === 'retry_scheduled' && job.nextRunAt > Date.now()) {
      return 'retry_backoff';
    }

    if (
      job.status === 'running' &&
      job.leaseExpiresAt &&
      job.leaseExpiresAt <= Date.now()
    ) {
      return 'stale_lease';
    }

    return null;
  }

  private async recordEvent(input: {
    jobId?: string;
    productId?: string;
    action: string;
    status: string;
    workerId?: string;
    platform?: string;
    provider?: string;
    message?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await db.insert(acquisitionQueueEvents).values({
      id: randomUUID(),
      jobId: input.jobId,
      productId: input.productId,
      action: input.action,
      status: input.status,
      workerId: input.workerId,
      platform: input.platform,
      provider: input.provider,
      message: input.message,
      metadata: stringifySafeMetadata(input.metadata),
      timestamp: Date.now(),
    });
  }
}
