import { db } from '../db';
import { alertRules } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import { AlertRule } from '../types';
import { randomUUID } from 'crypto';

export interface CreateRuleData {
  productId: string;
  ruleType: 'price_threshold' | 'price_change_percent' | 'stock_change';
  condition: 'below' | 'above' | 'increase' | 'decrease';
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
}

export interface UpdateRuleData {
  threshold?: number;
  enabled?: boolean;
  severity?: 'info' | 'warning' | 'critical';
}

interface ListRulesFilters {
  productId?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export class AlertRuleService {
  async createRule(data: CreateRuleData): Promise<AlertRule> {
    if (!data.productId) {
      throw new AppError(400, 'Product ID is required', 'VALIDATION_ERROR');
    }

    const id = randomUUID();
    const now = Date.now();

    const [rule] = await db
      .insert(alertRules)
      .values({
        id,
        ...data,
        enabled: true,
        createdAt: now,
      })
      .returning();

    return rule as AlertRule;
  }

  async getRuleById(id: string): Promise<AlertRule> {
    const [rule] = await db
      .select()
      .from(alertRules)
      .where(eq(alertRules.id, id))
      .limit(1);

    if (!rule) {
      throw new AppError(404, 'Alert rule not found', 'RULE_NOT_FOUND');
    }

    return rule as AlertRule;
  }

  async listRules(filters: ListRulesFilters = {}) {
    const { productId, enabled, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (productId) {
      conditions.push(eq(alertRules.productId, productId));
    }
    if (enabled !== undefined) {
      conditions.push(eq(alertRules.enabled, enabled));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(alertRules)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(alertRules.createdAt);

    const totalResult = await db.select().from(alertRules).where(whereClause);
    const total = totalResult.length;

    return {
      data: data as AlertRule[],
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateRule(id: string, data: UpdateRuleData): Promise<AlertRule> {
    // Verify rule exists
    await this.getRuleById(id);
    const now = Date.now();

    const [updated] = await db
      .update(alertRules)
      .set({
        ...data,
        updatedAt: now,
      })
      .where(eq(alertRules.id, id))
      .returning();

    return updated as AlertRule;
  }

  async deleteRule(id: string): Promise<void> {
    await this.getRuleById(id); // Check exists

    await db.delete(alertRules).where(eq(alertRules.id, id));
  }
}
