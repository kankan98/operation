import { Router, Request, Response, NextFunction } from 'express';
import { PriceSnapshotService } from '../services/priceSnapshotService';
import { AppError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/zodValidator';
import { createPriceSnapshotSchema } from '@shared/schemas';
import { CreatePriceSnapshotData } from '../types';

const router = Router();
const snapshotService = new PriceSnapshotService();

// POST /api/price-snapshots - 创建价格快照
router.post(
  '/',
  validateRequest(createPriceSnapshotSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const snapshot = await snapshotService.createSnapshot(req.body as CreatePriceSnapshotData);
      res.status(201).json(snapshot);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/price-snapshots/product/:productId - 查询产品的价格快照
router.get(
  '/product/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;
      const { limit } = req.query;

      const snapshots = await snapshotService.getSnapshotsByProduct(
        productId,
        { limit: limit ? parseInt(limit as string) : undefined }
      );

      res.json(snapshots);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/price-snapshots/product/:productId/latest - 获取最新快照
router.get(
  '/product/:productId/latest',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.productId as string;

      const snapshot = await snapshotService.getLatestSnapshot(productId);

      if (!snapshot) {
        throw new AppError(404, 'No snapshots found', 'NOT_FOUND');
      }

      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
