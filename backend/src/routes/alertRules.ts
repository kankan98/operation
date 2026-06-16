import { Router, Request, Response, NextFunction } from 'express';
import { AlertRuleService, CreateRuleData, UpdateRuleData } from '../services/alertRuleService';
import { validateRequest } from '../middleware/zodValidator';
import { createAlertRuleSchema, updateAlertRuleSchema } from '../schemas';

const router = Router();
const ruleService = new AlertRuleService();

// POST /api/alert-rules - Create rule
router.post(
  '/',
  validateRequest(createAlertRuleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rule = await ruleService.createRule(req.body as CreateRuleData);
      res.status(201).json({ data: rule });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/alert-rules - List rules
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, enabled, page, limit } = req.query;
    const result = await ruleService.listRules({
      productId: productId as string,
      enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/alert-rules/:id - Get single rule
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rule = await ruleService.getRuleById(req.params.id);
    res.json({ data: rule });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/alert-rules/:id - Update rule
router.patch(
  '/:id',
  validateRequest(updateAlertRuleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rule = await ruleService.updateRule(req.params.id, req.body as UpdateRuleData);
      res.json({ data: rule });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/alert-rules/:id - Delete rule
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ruleService.deleteRule(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
