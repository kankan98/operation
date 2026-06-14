import cron from 'node-cron';
import { ScraperService } from './scraperService';
import { logger } from '../utils/logger';

export class SchedulerService {
  private task: cron.ScheduledTask | null = null;
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
      } catch (error: any) {
        logger.error({ error: error.message }, 'Scheduler: Scrape failed');
      }
    });

    logger.info('Scheduler started (runs every hour)');
  }

  stop(): void {
    if (this.task) {
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
