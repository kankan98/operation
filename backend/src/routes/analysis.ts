import { Router, Request, Response, NextFunction } from 'express';
import { PriceAnalysisService } from '../services/priceAnalysisService';
import { ProductService } from '../services/productService';
import { AppError } from '../middleware/errorHandler';
import type { PriceStats } from '../types';

const router = Router();
const analysisService = new PriceAnalysisService();
const productService = new ProductService();

function emptyPriceStats(productId: string): PriceStats {
  return {
    productId,
    currentPrice: 0,
    highestPrice: 0,
    lowestPrice: 0,
    averagePrice: 0,
    priceChange: 0,
    priceChangePercent: 0,
    dataPoints: 0,
    firstRecordedAt: 0,
    lastRecordedAt: 0,
    provenance: {
      source: 'unknown',
      ageMs: 0,
      stale: true,
      trust: 'unknown',
      label: '暂无读数',
    },
  };
}

// GET /api/analysis/price-stats/:productId
router.get('/price-stats/:productId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const stats = await analysisService.getPriceStats(productId);
    res.json({ data: stats });
  } catch (error) {
    if (error instanceof AppError && error.code === 'NO_PRICE_DATA') {
      const productId = req.params.productId as string;
      const product = await productService.getProductById(productId);
      if (product) {
        res.json({ data: emptyPriceStats(productId) });
        return;
      }
    }

    next(error);
  }
});

export default router;
