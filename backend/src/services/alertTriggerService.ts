import { db } from '../db';
import { alertRules, priceSnapshots, alerts } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { AlertService } from './alertService';
import { PriceAnalysisService } from './priceAnalysisService';
import { logger } from '../utils/logger';

export class AlertTriggerService {
  private alertService = new AlertService();
  private analysisService = new PriceAnalysisService();

  async evaluateRules(productId: string): Promise<void> {
    // Get all enabled rules for this product
    const rules = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.productId, productId));

    const enabledRules = rules.filter((r) => r.enabled);

    if (enabledRules.length === 0) {
      return;
    }

    // Get latest snapshot
    const snapshots = await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.productId, productId))
      .orderBy(desc(priceSnapshots.timestamp))
      .limit(2);

    if (snapshots.length === 0) {
      return;
    }

    const currentSnapshot = snapshots[0];

    for (const rule of enabledRules) {
      try {
        if (rule.ruleType === 'price_threshold') {
          await this.evaluatePriceThreshold(productId, rule, currentSnapshot);
        } else if (rule.ruleType === 'price_change_percent') {
          if (snapshots.length >= 2) {
            await this.evaluatePriceChangePercent(productId, rule, snapshots);
          }
        } else if (rule.ruleType === 'stock_change') {
          if (snapshots.length >= 2) {
            await this.evaluateStockChange(productId, rule, snapshots);
          }
        }
      } catch (error) {
        logger.error({ error, ruleId: rule.id }, 'Failed to evaluate rule');
      }
    }
  }

  private async evaluatePriceThreshold(
    productId: string,
    rule: { id: string; condition: string; threshold: number; severity: string },
    snapshot: { price: number; currency: string }
  ): Promise<void> {
    const currentPrice = snapshot.price;
    let shouldAlert = false;

    if (rule.condition === 'below' && currentPrice < rule.threshold) {
      shouldAlert = true;
    } else if (rule.condition === 'above' && currentPrice > rule.threshold) {
      shouldAlert = true;
    }

    if (shouldAlert) {
      // Check for duplicate - don't create if recent alert exists
      const recentAlerts = await db
        .select()
        .from(alerts)
        .where(eq(alerts.productId, productId))
        .orderBy(desc(alerts.createdAt))
        .limit(1);

      const lastAlert = recentAlerts[0];
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

      if (lastAlert && lastAlert.createdAt > fiveMinutesAgo && lastAlert.ruleId === rule.id) {
        return; // Skip duplicate
      }

      await this.alertService.createAlert({
        ruleId: rule.id,
        productId,
        alertType: 'price_drop',
        severity: rule.severity,
        title: `Price ${rule.condition} ${rule.threshold}`,
        message: `Current price: ${currentPrice} ${snapshot.currency}`,
        dataSnapshot: JSON.stringify({ price: currentPrice, threshold: rule.threshold }),
      });
    }
  }

  private async evaluatePriceChangePercent(
    productId: string,
    rule: { id: string; condition: string; threshold: number; severity: string },
    _snapshots: unknown[]
  ): Promise<void> {
    const stats = await this.analysisService.getPriceStats(productId);
    const changePercent = Math.abs(stats.priceChangePercent);

    let shouldAlert = false;

    if (rule.condition === 'decrease' && stats.priceChangePercent < 0 && changePercent >= rule.threshold) {
      shouldAlert = true;
    } else if (rule.condition === 'increase' && stats.priceChangePercent > 0 && changePercent >= rule.threshold) {
      shouldAlert = true;
    }

    if (shouldAlert) {
      await this.alertService.createAlert({
        ruleId: rule.id,
        productId,
        alertType: stats.priceChangePercent < 0 ? 'price_drop' : 'price_surge',
        severity: rule.severity,
        title: `Price ${rule.condition}d by ${changePercent.toFixed(1)}%`,
        message: `From ${stats.lowestPrice} to ${stats.currentPrice}`,
        dataSnapshot: JSON.stringify({ changePercent, stats }),
      });
    }
  }

  private async evaluateStockChange(
    productId: string,
    rule: { id: string; condition: string; severity: string },
    snapshots: { availability: string }[]
  ): Promise<void> {
    const current = snapshots[0];
    const previous = snapshots[1];

    if (current.availability !== previous.availability) {
      await this.alertService.createAlert({
        ruleId: rule.id,
        productId,
        alertType: 'out_of_stock',
        severity: rule.severity,
        title: `Stock status changed`,
        message: `From ${previous.availability} to ${current.availability}`,
        dataSnapshot: JSON.stringify({ current: current.availability, previous: previous.availability }),
      });
    }
  }
}
