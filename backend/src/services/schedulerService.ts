import cron from 'node-cron';
import { ScraperService } from './scraperService';
import { logger } from '../utils/logger';

export class SchedulerService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private task: any = null;
  private scraperService = new ScraperService();

  start(): void {
    if (this.task) {
      throw new Error('Scheduler already running');
    }

    // 每小时执行一次
    this.task = cron.schedule('0 * * * *', async () => {
      logger.info('Scheduler: Starting scheduled scrape');
      try {
        await this.scraperService.scrapeAllMonitoringProducts();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error({ error: message }, 'Scheduler: Scrape failed');
      }
    });

    logger.info('Scheduler started (runs every hour)');
  }

  stop(): void {
    if (this.task) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.task.stop();
      this.task = null;
      logger.info('Scheduler stopped');
    }
  }

  isRunning(): boolean {
    return this.task !== null;
  }

  // 手动触发一次
  async triggerNow(): Promise<void> {
    logger.info('Scheduler: Manual trigger');
    await this.scraperService.scrapeAllMonitoringProducts();
  }
}
