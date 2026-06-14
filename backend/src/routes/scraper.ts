import { Router, Request, Response, NextFunction } from 'express';
import { ScraperService } from '../services/scraperService';
import { AppError } from '../middleware/errorHandler';

const router = Router();
const scraperService = new ScraperService();

// POST /api/scraper/product/:productId - 手动爬取单个产品
router.post(
  '/product/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;
      const result = await scraperService.scrapeProduct(productId);

      if (!result.success) {
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

// POST /api/scraper/all - 手动爬取所有监控产品
router.post('/all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const results = await scraperService.scrapeAllMonitoringProducts();

    const successCount = results.filter((r) => r.success).length;

    res.json({
      total: results.length,
      success: successCount,
      failed: results.length - successCount,
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
