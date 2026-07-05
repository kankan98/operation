import { Router, Request, Response, NextFunction } from 'express';
import { OpportunityScoringService } from '../services/opportunityScoringService';
import { validateRequest, validateQuery } from '../middleware/zodValidator';
import {
  opportunityListQuerySchema,
  opportunityResearchActionOutcomeRequestSchema,
  opportunityResearchComparisonRequestSchema,
  opportunityResearchDecisionRequestSchema,
  opportunityResearchExportRequestSchema,
  opportunityResearchListQuerySchema,
  opportunityResearchProductParamsSchema,
  opportunityResearchUpdateSchema,
  opportunityResearchUpsertSchema,
} from '../schemas';
import { OpportunityResearchService } from '../services/opportunityResearchService';
import {
  OpportunityListFilters,
  OpportunityResearchExportRequest,
} from '../types';

const router = Router();
const opportunityService = new OpportunityScoringService();
const researchService = new OpportunityResearchService();

router.get(
  '/research/summary',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await researchService.getReviewSummary();
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/research/practice-summary',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await researchService.getPracticeSummary();
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/research/action-plan',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await researchService.getDailyActionPlan();
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/research',
  validateQuery(opportunityResearchListQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await researchService.listEntries(req.query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/research/compare',
  validateRequest(opportunityResearchComparisonRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productIds } = opportunityResearchComparisonRequestSchema.parse(
        req.body
      );
      const opportunities = await Promise.all(
        productIds.map((productId) => opportunityService.explainProduct(productId))
      );
      res.json(researchService.createComparisonResponse(opportunities, productIds));
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/research/export',
  validateRequest(opportunityResearchExportRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exportRequest = opportunityResearchExportRequestSchema.parse(
        req.body
      );
      const opportunities = exportRequest.productIds
        ? await Promise.all(
            exportRequest.productIds.map((productId) =>
              opportunityService.explainProduct(productId)
            )
          )
        : await listExportOpportunities(exportRequest);

      res.json(researchService.createExportResponse(exportRequest, opportunities));
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/products/:productId/research',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const result = await researchService.getForProduct(params.productId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/products/:productId/research',
  validateRequest(opportunityResearchUpsertSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const body = opportunityResearchUpsertSchema.parse(req.body);
      const result = await researchService.upsertForProduct(
        params.productId,
        body
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/products/:productId/research',
  validateRequest(opportunityResearchUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const body = opportunityResearchUpdateSchema.parse(req.body);
      const result = await researchService.updateForProduct(
        params.productId,
        body
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/products/:productId/research/decision',
  validateRequest(opportunityResearchDecisionRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const body = opportunityResearchDecisionRequestSchema.parse(req.body);
      const opportunity = await opportunityService.explainProduct(
        params.productId
      );
      const result = await researchService.saveDecisionForProduct(
        params.productId,
        body,
        researchService.createDecisionSnapshot(opportunity)
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/products/:productId/research/decision',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const result = await researchService.clearDecisionForProduct(
        params.productId
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/products/:productId/research/action-outcome',
  validateRequest(opportunityResearchActionOutcomeRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const body = opportunityResearchActionOutcomeRequestSchema.parse(req.body);
      const result = await researchService.saveActionOutcomeForProduct(
        params.productId,
        body
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/products/:productId/research/action-outcome',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const result = await researchService.clearActionOutcomeForProduct(
        params.productId
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/products/:productId/research/archive',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      const result = await researchService.archiveForProduct(params.productId);
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/products/:productId/research',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const params = opportunityResearchProductParamsSchema.parse(req.params);
      await researchService.deleteForProduct(params.productId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/products',
  validateQuery(opportunityListQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = opportunityListQuerySchema.parse(req.query);
      const result = await opportunityService.listOpportunities(
        filters
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/products/:productId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await opportunityService.explainProduct(
        req.params.productId as string
      );
      res.json({ data: result });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

async function listExportOpportunities(
  exportRequest: OpportunityResearchExportRequest
) {
  const filters: OpportunityListFilters = {
    ...exportRequest.filters,
    limit: exportRequest.limit,
  };
  const result = await opportunityService.listOpportunities(filters);
  return result.data;
}
