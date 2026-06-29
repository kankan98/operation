import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { SchedulerService } from './services/schedulerService';

function main() {
  try {
    // 验证配置
    validateConfig();

    // 创建应用
    const app = createApp();

    // 定时自动采集调度器：默认关闭（手动优先定位）。
    // 仅在显式设置 ACQUISITION_SCHEDULER_ENABLED=true 时启动；该路径已弃用，
    // 后续会随采集管道一并移除。
    const scheduler = new SchedulerService();
    if (config.acquisition.schedulerEnabled) {
      scheduler.start();
      logger.warn(
        'Scheduler 已启用（已弃用的自动采集路径）。手动优先模式下建议保持关闭。'
      );
    } else {
      logger.info('Scheduler 已禁用（手动优先模式默认行为）');
    }

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received');
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received');
      scheduler.stop();
      process.exit(0);
    });

    // 启动服务器
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on http://localhost:${config.port}`);
      logger.info(`📊 Environment: ${config.nodeEnv}`);
      logger.info(`💾 Database: ${config.databasePath}`);
    });
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

void main();
