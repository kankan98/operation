import { Router, Request, Response, NextFunction } from 'express';
import { PriceAnalysisService } from '../services/priceAnalysisService';

const router = Router();
const analysisService = new PriceAnalysisService();

// GET /api/analysis/price-stats/:productId
router.get('/price-stats/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await analysisService.getPriceStats(req.params.productId);
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
});

export default router;
