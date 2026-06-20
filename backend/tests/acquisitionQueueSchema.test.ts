import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ACQUISITION_QUEUE_CAVEAT,
  acquisitionJobCancelRequestSchema,
  acquisitionJobRetryRequestSchema,
  acquisitionProductJobDiagnosticsSchema,
  acquisitionQueueHealthSchema,
  acquisitionWorkerHeartbeatSchema,
  queueSafeMetadataSchema,
} from '@shared/schemas';

describe('acquisition queue schemas', () => {
  it('validates queue health responses with operational caveat', () => {
    const result = acquisitionQueueHealthSchema.safeParse({
      backend: 'sqlite',
      status: 'healthy',
      scope: {},
      counts: {
        backlog: 0,
        pending: 0,
        running: 0,
        retryScheduled: 0,
        failed: 0,
        cancelled: 0,
        staleLeases: 0,
      },
      workerSummary: {
        total: 1,
        healthy: 1,
        stale: 0,
        busy: 0,
        idle: 1,
        capacity: 4,
        activeJobCount: 0,
      },
      providerGates: [],
      recommendations: [],
      caveat: ACQUISITION_QUEUE_CAVEAT,
      generatedAt: Date.now(),
    });

    expect(result.success).toBe(true);
  });

  it('rejects unsafe queue diagnostic metadata', () => {
    expect(
      queueSafeMetadataSchema.safeParse({
        redisUrl: 'redis://user:secret@example.com:6379',
      }).success
    ).toBe(false);

    expect(
      queueSafeMetadataSchema.safeParse({
        provider: 'rainforest',
        httpStatus: 429,
        rootCause: 'rate_limited',
      }).success
    ).toBe(true);
  });

  it('validates worker heartbeat and product diagnostics contracts', () => {
    expect(
      acquisitionWorkerHeartbeatSchema.safeParse({
        workerId: 'worker-local-1',
        backend: 'sqlite',
        status: 'idle',
        concurrency: 4,
        activeJobCount: 0,
        queues: ['acquisition'],
        startedAt: 100,
        lastHeartbeatAt: 200,
        metadata: { hostname: 'local-dev' },
      }).success
    ).toBe(true);

    expect(
      acquisitionProductJobDiagnosticsSchema.safeParse({
        productId: 'product-1',
        job: null,
        latestAttempt: null,
        providerGate: null,
        recommendations: [],
        caveat: ACQUISITION_QUEUE_CAVEAT,
        generatedAt: 200,
      }).success
    ).toBe(true);
  });

  it('bounds retry and cancel request input', () => {
    expect(
      acquisitionJobRetryRequestSchema.safeParse({
        jobId: 'job-1',
        reason: 'operator_retry',
        operatorNote: 'Retry after provider reset.',
      }).success
    ).toBe(true);

    expect(
      acquisitionJobCancelRequestSchema.safeParse({
        jobId: 'job-1',
        reason: '',
      }).success
    ).toBe(false);
  });
});

describe('acquisition queue config', () => {
  afterEach(() => {
    delete process.env.ACQUISITION_QUEUE_BACKEND;
    delete process.env.REDIS_URL;
    delete process.env.ACQUISITION_REDIS_URL;
    vi.resetModules();
  });

  it('defaults to the SQLite queue backend', async () => {
    delete process.env.ACQUISITION_QUEUE_BACKEND;
    vi.resetModules();

    const { config } = await import('../src/config');

    expect(config.acquisition.queue.backend).toBe('sqlite');
    expect(config.acquisition.queue.workerConcurrency).toBeGreaterThan(0);
  });

  it('rejects BullMQ backend configuration without Redis URL', async () => {
    process.env.ACQUISITION_QUEUE_BACKEND = 'bullmq';
    delete process.env.REDIS_URL;
    delete process.env.ACQUISITION_REDIS_URL;
    vi.resetModules();

    const { validateConfig } = await import('../src/config');

    expect(() => validateConfig()).toThrow(/REDIS_URL/);
  });
});

describe('acquisition queue migration', () => {
  it('persists worker heartbeat records', () => {
    const sqlite = new Database(':memory:');
    const migration = fs.readFileSync(
      path.resolve('migrations/007-acquisition-queue-operations.sql'),
      'utf-8'
    );

    sqlite.exec(migration);
    sqlite
      .prepare(
        `INSERT INTO acquisition_queue_workers (
          worker_id,
          backend,
          status,
          concurrency,
          active_job_count,
          queues_json,
          started_at,
          last_heartbeat_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        'worker-local-1',
        'sqlite',
        'idle',
        4,
        0,
        '["acquisition"]',
        100,
        200,
        100,
        200
      );

    const worker = sqlite
      .prepare(
        'SELECT worker_id as workerId, backend, status, concurrency FROM acquisition_queue_workers'
      )
      .get() as {
      workerId: string;
      backend: string;
      status: string;
      concurrency: number;
    };

    expect(worker).toEqual({
      workerId: 'worker-local-1',
      backend: 'sqlite',
      status: 'idle',
      concurrency: 4,
    });

    sqlite.close();
  });
});
