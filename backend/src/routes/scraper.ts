import { Router, Request, Response, NextFunction } from 'express';
import { ScraperService } from '../services/scraperService';
import { AppError } from '../middleware/errorHandler';
import { validateQuery, validateRequest } from '../middleware/zodValidator';
import {
  acquisitionQueueHealthFiltersSchema,
  acquisitionWorkerHealthFiltersSchema,
  cancelJobRequestSchema,
  productJobDiagnosticsFiltersSchema,
  providerHealthQuerySchema,
  retryJobRequestSchema,
} from '../schemas';
import { Platform } from '../types';

const router = Router();
const scraperService = new ScraperService();
const SUPPORTED_HEALTH_PLATFORMS = new Set<Platform>([
  'amazon',
  'ebay',
  'walmart',
  'aliexpress',
  'lazada',
  'other',
]);

interface RetryJobBody {
  reason?: string;
  operatorNote?: string;
}

interface CancelJobBody {
  reason: string;
  operatorNote?: string;
}

// GET /api/scraper/queue/health - 获取采集队列运营健康摘要
router.get(
  '/queue/health',
  validateQuery(acquisitionQueueHealthFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await scraperService.getQueueHealth({
        platform:
          typeof req.query.platform === 'string' ? req.query.platform : undefined,
        provider:
          typeof req.query.provider === 'string' ? req.query.provider : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scraper/queue/workers - 获取采集 worker heartbeat 状态
router.get(
  '/queue/workers',
  validateQuery(acquisitionWorkerHealthFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await scraperService.getWorkerHealth({
        backend:
          typeof req.query.backend === 'string' ? req.query.backend : undefined,
        status:
          typeof req.query.status === 'string' ? req.query.status : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scraper/queue/providers/status - 获取 provider 队列 gate 状态
router.get(
  '/queue/providers/status',
  validateQuery(acquisitionQueueHealthFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await scraperService.getProviderQueueStatus({
        platform:
          typeof req.query.platform === 'string' ? req.query.platform : undefined,
        provider:
          typeof req.query.provider === 'string' ? req.query.provider : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/scraper/product/:productId - 手动爬取单个产品
router.post(
  '/product/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const result = await scraperService.scrapeProduct(productId);

      if (!result.success && result.error?.toLowerCase().includes('not found')) {
        throw new AppError(
          500,
          result.error || 'Scrape failed',
          'SCRAPE_FAILED'
        );
      }

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scraper/product/:productId/job-diagnostics - 获取产品采集 job 诊断
router.get(
  '/product/:productId/job-diagnostics',
  validateQuery(productJobDiagnosticsFiltersSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const diagnostics = await scraperService.getProductJobDiagnostics(productId);
      res.json(diagnostics);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/scraper/all - 手动爬取所有监控产品
router.post('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await scraperService.scrapeAllMonitoringProducts();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/scraper/product/:productId/attempts - 获取产品采集尝试历史
router.get(
  '/product/:productId/attempts',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const limit =
        typeof req.query.limit === 'string'
          ? parseInt(req.query.limit, 10)
          : undefined;
      const attempts = await scraperService.getAttemptsByProduct(productId, {
        limit: Number.isFinite(limit) ? limit : undefined,
      });

      res.json({ data: attempts });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scraper/providers/amazon/health - 获取 Amazon provider 健康摘要
router.get(
  '/providers/amazon/health',
  validateQuery(providerHealthQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await scraperService.getAmazonProviderHealth({
        windowHours:
          typeof req.query.windowHours === 'number'
            ? req.query.windowHours
            : undefined,
        productId:
          typeof req.query.productId === 'string'
            ? req.query.productId
            : undefined,
        provider:
          typeof req.query.provider === 'string'
            ? req.query.provider
            : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scraper/providers/:platform/health - 获取指定平台 provider 健康摘要
router.get(
  '/providers/:platform/health',
  validateQuery(providerHealthQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const platform = req.params.platform as Platform;
      if (!SUPPORTED_HEALTH_PLATFORMS.has(platform)) {
        throw new AppError(400, 'Unsupported provider health platform', 'VALIDATION_ERROR');
      }

      const result = await scraperService.getProviderHealth(platform, {
        windowHours:
          typeof req.query.windowHours === 'number'
            ? req.query.windowHours
            : undefined,
        productId:
          typeof req.query.productId === 'string'
            ? req.query.productId
            : undefined,
        provider:
          typeof req.query.provider === 'string'
            ? req.query.provider
            : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scraper/jobs/:jobId - 获取采集任务状态
router.get(
  '/jobs/:jobId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = req.params.jobId as string;
      const job = await scraperService.getJobById(jobId);

      if (!job) {
        throw new AppError(404, 'Scrape job not found', 'JOB_NOT_FOUND');
      }

      res.json(job);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/scraper/jobs/:jobId/retry - 重试失败/取消的采集 job
router.post(
  '/jobs/:jobId/retry',
  validateRequest(retryJobRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = req.params.jobId as string;
      const body = req.body as RetryJobBody;
      const result = await scraperService.retryJob(
        jobId,
        body.reason,
        body.operatorNote
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/scraper/jobs/:jobId/cancel - 取消 pending/retry-scheduled 采集 job
router.post(
  '/jobs/:jobId/cancel',
  validateRequest(cancelJobRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const jobId = req.params.jobId as string;
      const body = req.body as CancelJobBody;
      const result = await scraperService.cancelJob(
        jobId,
        body.reason,
        body.operatorNote
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
