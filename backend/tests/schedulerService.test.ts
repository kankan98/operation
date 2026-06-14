import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SchedulerService } from '../src/services/schedulerService';

describe('SchedulerService', () => {
  let scheduler: SchedulerService;

  beforeEach(() => {
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
});
