import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

function main() {
  try {
    // 验证配置
    validateConfig();

    // 创建应用
    const app = createApp();

    // 手动优先模式：无后台定时采集调度器。数据通过手动录入或按需单品检查获取。

    // 优雅关闭
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received');
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
