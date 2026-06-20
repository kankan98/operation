import { Router, Request, Response, NextFunction } from 'express';
import { validateQuery } from '../middleware/zodValidator';
import { marketSignalHealthQuerySchema } from '../schemas/marketSignal.schema';
import { MarketSignalHealthService } from '../services/marketSignalHealthService';

const router = Router();
const marketSignalHealthService = new MarketSignalHealthService();

// GET /api/market-signals/providers/keepa/health - 获取 Keepa 市场趋势信号健康摘要
router.get(
  '/providers/keepa/health',
  validateQuery(marketSignalHealthQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await marketSignalHealthService.getKeepaHealth({
        windowHours:
          typeof req.query.windowHours === 'number'
            ? req.query.windowHours
            : undefined,
        productId:
          typeof req.query.productId === 'string'
            ? req.query.productId
            : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
