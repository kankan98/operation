import { Router, Request, Response, NextFunction } from 'express';
import { AlertService, CreateAlertData } from '../services/alertService';
import { AppError } from '../middleware/errorHandler';
import { validateRequest } from '../middleware/zodValidator';
import { createAlertSchema } from '../schemas';

const router = Router();
const alertService = new AlertService();

// POST /api/alerts - 创建报警
router.post(
  '/',
  validateRequest(createAlertSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = await alertService.createAlert(req.body as CreateAlertData);
      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/alerts - 列表查询
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, severity, unreadOnly, page, limit } = req.query;

    const result = await alertService.listAlerts({
      productId: productId as string,
      severity: severity as string,
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/alerts/:id - 获取详情
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await alertService.getAlertById(id);

    if (!alert) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    res.json(alert);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/alerts/:id/read - 标记为已读
router.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await alertService.markAsRead(id);
    res.json(alert);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/alerts/:id/archive - 标记为已归档
router.patch('/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = await alertService.markAsArchived(id);
    res.json(alert);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/alerts/:id - 删除报警
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await alertService.deleteAlert(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
