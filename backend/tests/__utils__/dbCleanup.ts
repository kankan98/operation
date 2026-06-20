import { db } from '../../src/db';
import {
  alertRules,
  alerts,
  acquisitionProviderLimits,
  acquisitionQueueEvents,
  acquisitionQueueWorkers,
  marketSignalAttempts,
  marketSignalSnapshots,
  priceSnapshots,
  productBusinessSignals,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../../src/db/schema';

export async function clearProductRelatedData(): Promise<void> {
  await db.delete(acquisitionQueueEvents);
  await db.delete(acquisitionProviderLimits);
  await db.delete(acquisitionQueueWorkers);
  await db.delete(productBusinessSignals);
  await db.delete(marketSignalAttempts);
  await db.delete(marketSignalSnapshots);
  await db.delete(scrapeAttempts);
  await db.delete(scrapeJobs);
  await db.delete(priceSnapshots);
  await db.delete(alerts);
  await db.delete(alertRules);
  await db.delete(products);
}
