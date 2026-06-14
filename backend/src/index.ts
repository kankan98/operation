import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { SchedulerService } from './services/schedulerService';

async function main() {
  try {
    // 验证配置
    validateConfig();

    // 创建应用
    const app = createApp();

    // 启动调度器（仅生产环境）
    const scheduler = new SchedulerService();
    if (config.nodeEnv === 'production') {
      scheduler.start();
      logger.info('Scheduler enabled in production mode');
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
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
