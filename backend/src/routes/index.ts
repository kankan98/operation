import { Router } from 'express';
import productsRouter from './products';
import alertsRouter from './alerts';
import priceSnapshotsRouter from './priceSnapshots';
import scraperRouter from './scraper';
import alertRulesRouter from './alertRules';
import analysisRouter from './analysis';
import chatRouter from './chat';
import tasksRouter from './tasks';

const router = Router();

router.use('/products', productsRouter);
router.use('/alerts', alertsRouter);
router.use('/price-snapshots', priceSnapshotsRouter);
router.use('/scraper', scraperRouter);
router.use('/alert-rules', alertRulesRouter);
router.use('/analysis', analysisRouter);
router.use('/chat', chatRouter);
router.use('/tasks', tasksRouter);

export default router;
