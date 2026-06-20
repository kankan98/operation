import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockScraperService = vi.hoisted(() => ({
  enqueueMonitoringProducts: vi.fn(),
  processDueJobs: vi.fn(),
  getQueueHealth: vi.fn(),
}));

vi.mock('../src/services/scraperService', () => ({
  ScraperService: vi.fn(function ScraperService() {
    return mockScraperService;
  }),
}));

import { SchedulerService } from '../src/services/schedulerService';

describe('SchedulerService', () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockScraperService.enqueueMonitoringProducts.mockResolvedValue({
      total: 0,
      queued: 0,
      skipped: 0,
      jobs: [],
    });
    mockScraperService.processDueJobs.mockResolvedValue([]);
    mockScraperService.getQueueHealth.mockResolvedValue({
      backend: 'sqlite',
      status: 'healthy',
      counts: { backlog: 0 },
      workerSummary: { stale: 0 },
      providerGates: [],
    });
    scheduler = new SchedulerService();
  });

  afterEach(() => {
    scheduler.stop();
  });

  it('should start scheduler', () => {
    scheduler.start();
    expect(scheduler.isRunning()).toBe(true);
  });

  it('should stop scheduler', () => {
    scheduler.start();
    scheduler.stop();
    expect(scheduler.isRunning()).toBe(false);
  });

  it('should not start twice', () => {
    scheduler.start();
    expect(() => scheduler.start()).toThrow('already running');
  });

  it('should enqueue and process available jobs on manual trigger', async () => {
    await scheduler.triggerNow();

    expect(mockScraperService.enqueueMonitoringProducts).toHaveBeenCalled();
    expect(mockScraperService.processDueJobs).toHaveBeenCalled();
  });

  it('should enqueue and process available jobs on scheduled execution', async () => {
    await scheduler.runScheduledScrape();

    expect(mockScraperService.enqueueMonitoringProducts).toHaveBeenCalled();
    expect(mockScraperService.processDueJobs).toHaveBeenCalled();
  });

  it('should continue running when scheduled execution fails', async () => {
    mockScraperService.processDueJobs.mockRejectedValue(
      new Error('processing failed')
    );

    await expect(scheduler.runScheduledScrape()).resolves.toBeUndefined();
  });
});
