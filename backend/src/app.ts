import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { setupSwaggerUI } from './openapi/swagger';
import { logger } from './utils/logger';

export function createApp() {
  const app = express();

  // 中间件
  // CORS 配置：支持多个源
  const corsOrigins = config.corsOrigin.split(',').map(origin => origin.trim());
  logger.info({ corsOrigins }, 'CORS configured origins');

  app.use(cors({
    origin: (origin, callback) => {
      // 允许没有 origin 的请求（如 Postman）
      if (!origin) return callback(null, true);

      if (corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS. Allowed: ${corsOrigins.join(', ')}`));
      }
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestLogger);

  // API 文档
  setupSwaggerUI(app);

  // 健康检查
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // API 路由
  app.use('/api', apiRouter);

  // 错误处理
  app.use(errorHandler);

  return app;
}
