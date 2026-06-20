import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScrapeJob } from '../src/types';

const bullMqMocks = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  close: vi.fn(),
  Queue: vi.fn(),
}));

vi.mock('bullmq', () => ({
  Queue: bullMqMocks.Queue,
}));

describe('BullMqAcquisitionQueueAdapter', () => {
  beforeEach(() => {
    vi.resetModules();
    bullMqMocks.add.mockResolvedValue(undefined);
    bullMqMocks.remove.mockResolvedValue(1);
    bullMqMocks.close.mockResolvedValue(undefined);
    bullMqMocks.Queue.mockImplementation(function QueueMock() {
      return {
        add: bullMqMocks.add,
        remove: bullMqMocks.remove,
        close: bullMqMocks.close,
      };
    });
  });

  it('maps enqueue, retry, and cancel operations to BullMQ while preserving SQLite provenance', async () => {
    const { BullMqAcquisitionQueueAdapter } = await import(
      '../src/services/acquisitionQueueAdapter'
    );
    const job = createJob('pending');
    const sqliteAdapter = {
      enqueueProduct: vi.fn().mockResolvedValue({ job, created: true }),
      enqueueManualProduct: vi.fn().mockResolvedValue({
        job,
        created: true,
        throttled: false,
      }),
      claimNextDueJob: vi.fn(),
      claimJobById: vi.fn(),
      completeJob: vi.fn(),
      failJob: vi.fn(),
      retryJob: vi.fn().mockResolvedValue({
        job,
        changed: true,
        message: 'Job moved to pending for retry',
      }),
      cancelJob: vi.fn().mockResolvedValue({
        job: createJob('cancelled'),
        changed: true,
        message: 'Job cancelled',
      }),
      getJobById: vi.fn(),
      getLatestJobByProduct: vi.fn(),
      getQueueCounts: vi.fn(),
    };

    const adapter = new BullMqAcquisitionQueueAdapter({
      redisUrl: 'redis://localhost:6379/0',
      sqliteAdapter,
    });

    await adapter.enqueueProduct({ productId: job.productId });
    await adapter.retryJob(job.id, { reason: 'provider_reset' });
    await adapter.cancelJob(job.id, { reason: 'operator_cancelled' });
    await adapter.close();

    expect(sqliteAdapter.enqueueProduct).toHaveBeenCalledWith({
      productId: job.productId,
    });
    expect(sqliteAdapter.retryJob).toHaveBeenCalledWith(
      job.id,
      { reason: 'provider_reset' },
      undefined
    );
    expect(sqliteAdapter.cancelJob).toHaveBeenCalledWith(
      job.id,
      { reason: 'operator_cancelled' },
      undefined
    );
    expect(bullMqMocks.add).toHaveBeenCalledWith(
      'product-acquisition',
      { jobId: job.id, productId: job.productId },
      expect.objectContaining({ jobId: job.id })
    );
    expect(bullMqMocks.remove).toHaveBeenCalledWith(job.id);
    expect(bullMqMocks.close).toHaveBeenCalled();
  });

  function createJob(status: ScrapeJob['status']): ScrapeJob {
    return {
      id: 'job-1',
      productId: 'product-1',
      status,
      priority: 0,
      nextRunAt: Date.now(),
      attemptCount: 0,
      maxAttempts: 3,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
});
