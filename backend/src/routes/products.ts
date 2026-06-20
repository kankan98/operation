import { Router, Request, Response, NextFunction } from 'express';
import { ProductService, CreateProductData, UpdateProductData } from '../services/productService';
import { ProductBusinessSignalUpsert } from '../types';
import { AppError } from '../middleware/errorHandler';
import { validateQuery, validateRequest } from '../middleware/zodValidator';
import {
  createProductSchema,
  productBusinessSignalUpsertSchema,
  updateProductSchema,
} from '../schemas/product.schema';
import { marketSignalHistoryQuerySchema } from '../schemas/marketSignal.schema';
import { ProductBusinessSignalService } from '../services/productBusinessSignalService';
import { MarketSignalRefreshService } from '../services/marketSignalRefreshService';
import { MarketSignalSnapshotService } from '../services/marketSignalSnapshotService';

const router = Router();
const productService = new ProductService();
const businessSignalService = new ProductBusinessSignalService();
const marketSignalRefreshService = new MarketSignalRefreshService();
const marketSignalSnapshotService = new MarketSignalSnapshotService();

// POST /api/products - 创建产品
router.post(
  '/',
  validateRequest(createProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productService.createProduct(req.body as CreateProductData);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products - 列表查询
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { platform, monitoring, page, limit } = req.query;

    const result = await productService.listProducts({
      platform: platform as string,
      monitoring: monitoring === 'true' ? true : monitoring === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id/business-signals - 获取业务选品假设和派生指标
router.get(
  '/:id/business-signals',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await businessSignalService.getForProduct(id);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/products/:id/business-signals - 创建或更新业务选品假设
router.put(
  '/:id/business-signals',
  validateRequest(productBusinessSignalUpsertSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await businessSignalService.upsertForProduct(
        id,
        req.body as ProductBusinessSignalUpsert
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/products/:id/market-signals/refresh - 刷新产品市场趋势信号
router.post(
  '/:id/market-signals/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);

      if (!product) {
        throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
      }

      const result = await marketSignalRefreshService.refreshProduct(product);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products/:id/market-signals/latest - 获取最新市场趋势信号
router.get(
  '/:id/market-signals/latest',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);

      if (!product) {
        throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
      }

      const snapshot = await marketSignalSnapshotService.getLatestSnapshot(id);
      res.json({
        data: snapshot,
        status: snapshot ? 'fresh' : 'missing',
        missingSignals: snapshot ? snapshot.missingSignals : ['market_history'],
        caveat:
          'Keepa market signals are trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products/:id/market-signals/history - 获取市场趋势信号历史
router.get(
  '/:id/market-signals/history',
  validateQuery(marketSignalHistoryQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const product = await productService.getProductById(id);

      if (!product) {
        throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
      }

      const limit =
        typeof req.query.limit === 'number' ? req.query.limit : undefined;
      const snapshots = await marketSignalSnapshotService.getSnapshotHistory(id, {
        limit,
      });
      res.json({ data: snapshots });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/products/:id - 获取详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const product = await productService.getProductById(id);

    if (!product) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id - 更新产品
router.patch(
  '/:id',
  validateRequest(updateProductSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const product = await productService.updateProduct(id, req.body as UpdateProductData);
      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/products/:id - 删除产品
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    await productService.deleteProduct(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
