import { db } from '../db';
import { alerts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AppError } from '../middleware/errorHandler';
import { Alert } from '../types';
import { randomUUID } from 'crypto';

export interface CreateAlertData {
  ruleId?: string;
  productId: string;
  alertType: string;
  severity: string;
  title: string;
  message?: string;
  dataSnapshot?: string;
}

interface ListAlertsFilters {
  productId?: string;
  severity?: string;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

export class AlertService {
  async createAlert(data: CreateAlertData): Promise<Alert> {
    const id = randomUUID();
    const now = Date.now();

    const [alert] = await db
      .insert(alerts)
      .values({
        id,
        ...data,
        isRead: false,
        isArchived: false,
        createdAt: now,
      })
      .returning();

    return alert as Alert;
  }

  async getAlertById(id: string): Promise<Alert | null> {
    const [alert] = await db
      .select()
      .from(alerts)
      .where(eq(alerts.id, id))
      .limit(1);

    return alert ? (alert as Alert) : null;
  }

  async listAlerts(filters: ListAlertsFilters = {}) {
    const { productId, severity, unreadOnly, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    // 构建查询条件
    const conditions = [];
    if (productId) {
      conditions.push(eq(alerts.productId, productId));
    }
    if (severity) {
      conditions.push(eq(alerts.severity, severity));
    }
    if (unreadOnly) {
      conditions.push(eq(alerts.isRead, false));
    }

    // 查询数据
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db
      .select()
      .from(alerts)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(alerts.createdAt);

    // 查询总数
    const totalResult = await db
      .select()
      .from(alerts)
      .where(whereClause);
    const total = totalResult.length;

    return {
      data: data as Alert[],
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string): Promise<Alert> {
    const existing = await this.getAlertById(id);
    if (!existing) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    const [updated] = await db
      .update(alerts)
      .set({ isRead: true })
      .where(eq(alerts.id, id))
      .returning();

    return updated as Alert;
  }

  async markAsArchived(id: string): Promise<Alert> {
    const existing = await this.getAlertById(id);
    if (!existing) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    const [updated] = await db
      .update(alerts)
      .set({ isArchived: true })
      .where(eq(alerts.id, id))
      .returning();

    return updated as Alert;
  }

  async deleteAlert(id: string): Promise<void> {
    const existing = await this.getAlertById(id);
    if (!existing) {
      throw new AppError(404, 'Alert not found', 'ALERT_NOT_FOUND');
    }

    await db.delete(alerts).where(eq(alerts.id, id));
  }
}
