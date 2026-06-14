import express from 'express';
import cors from 'cors';
import { config } from './config';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import apiRouter from './routes';
import { setupSwaggerUI } from './openapi/swagger';

export function createApp() {
  const app = express();

  // 中间件
  app.use(cors({ origin: config.corsOrigin }));
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
