import { desc, eq } from 'drizzle-orm';
import {
  AcquisitionQueueBackend,
  AcquisitionWorkerHeartbeat,
  AcquisitionWorkerHealth,
  AcquisitionWorkerStatus,
  ACQUISITION_QUEUE_CAVEAT,
} from '@shared/schemas';
import { config } from '../config';
import { db } from '../db';
import { acquisitionQueueWorkers } from '../db/schema';
import { parseJsonRecord, sanitizeQueueMetadata, stringifySafeMetadata } from './acquisitionQueueSafety';

interface WorkerHeartbeatInput {
  workerId: string;
  backend?: AcquisitionQueueBackend;
  status: Exclude<AcquisitionWorkerStatus, 'stale'>;
  concurrency: number;
  activeJobCount?: number;
  queues?: string[];
  startedAt?: number;
  metadata?: Record<string, unknown>;
}

interface WorkerHealthFilters {
  backend?: AcquisitionQueueBackend;
  status?: AcquisitionWorkerStatus;
}

export class WorkerHeartbeatService {
  private readonly staleThresholdMs: number;

  constructor(options: { staleThresholdMs?: number } = {}) {
    this.staleThresholdMs =
      options.staleThresholdMs ?? config.acquisition.queue.staleWorkerThresholdMs;
  }

  async recordHeartbeat(input: WorkerHeartbeatInput): Promise<AcquisitionWorkerHeartbeat> {
    const now = Date.now();
    const existing = await this.getWorkerRow(input.workerId);
    const row = {
      workerId: input.workerId,
      backend: input.backend ?? config.acquisition.queue.backend,
      status: input.status,
      concurrency: input.concurrency,
      activeJobCount: input.activeJobCount ?? 0,
      queuesJson: JSON.stringify(input.queues ?? ['acquisition']),
      startedAt: input.startedAt ?? existing?.startedAt ?? now,
      lastHeartbeatAt: now,
      metadata: stringifySafeMetadata(input.metadata),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    if (existing) {
      const [updated] = await db
        .update(acquisitionQueueWorkers)
        .set(row)
        .where(eq(acquisitionQueueWorkers.workerId, input.workerId))
        .returning();
      return this.toHeartbeat(updated, now);
    }

    const [created] = await db
      .insert(acquisitionQueueWorkers)
      .values(row)
      .returning();
    return this.toHeartbeat(created, now);
  }

  async getWorkerHealth(filters: WorkerHealthFilters = {}): Promise<AcquisitionWorkerHealth> {
    const now = Date.now();
    const rows = await db
      .select()
      .from(acquisitionQueueWorkers)
      .orderBy(desc(acquisitionQueueWorkers.lastHeartbeatAt));

    const workers = rows
      .map((row) => this.toHeartbeat(row, now))
      .filter((worker) => {
        if (filters.backend && worker.backend !== filters.backend) return false;
        if (filters.status && worker.status !== filters.status) return false;
        return true;
      });

    return {
      workers,
      summary: this.summarizeWorkers(workers),
      caveat: ACQUISITION_QUEUE_CAVEAT,
      generatedAt: now,
    };
  }

  summarizeWorkers(workers: AcquisitionWorkerHeartbeat[]) {
    return {
      total: workers.length,
      healthy: workers.filter((worker) => !worker.stale).length,
      stale: workers.filter((worker) => worker.stale).length,
      busy: workers.filter((worker) => worker.status === 'busy').length,
      idle: workers.filter((worker) => worker.status === 'idle').length,
      capacity: workers.reduce((sum, worker) => sum + worker.concurrency, 0),
      activeJobCount: workers.reduce(
        (sum, worker) => sum + worker.activeJobCount,
        0
      ),
    };
  }

  private async getWorkerRow(workerId: string) {
    const [row] = await db
      .select()
      .from(acquisitionQueueWorkers)
      .where(eq(acquisitionQueueWorkers.workerId, workerId))
      .limit(1);
    return row;
  }

  private toHeartbeat(
    row: typeof acquisitionQueueWorkers.$inferSelect,
    now: number
  ): AcquisitionWorkerHeartbeat {
    const stale = now - row.lastHeartbeatAt > this.staleThresholdMs;
    return {
      workerId: row.workerId,
      backend: row.backend as AcquisitionQueueBackend,
      status: stale ? 'stale' : (row.status as AcquisitionWorkerStatus),
      concurrency: row.concurrency,
      activeJobCount: row.activeJobCount,
      queues: this.parseQueues(row.queuesJson),
      startedAt: row.startedAt,
      lastHeartbeatAt: row.lastHeartbeatAt,
      stale,
      metadata: sanitizeQueueMetadata(parseJsonRecord(row.metadata)),
    };
  }

  private parseQueues(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === 'string')
        : ['acquisition'];
    } catch {
      return ['acquisition'];
    }
  }
}
