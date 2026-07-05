import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { opportunityResearchEntries } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import {
  OpportunityListFilters,
  OpportunityResearchActionOutcome,
  OpportunityResearchActionOutcomeRequest,
  OpportunityResearchDecision,
  OpportunityResearchDecisionReview,
  OpportunityResearchDecisionReviewFilter,
  OpportunityResearchDecisionRequest,
  OpportunityResearchDecisionSnapshot,
  OpportunityResearchDailyActionItem,
  OpportunityResearchDailyActionPlan,
  OpportunityResearchEntry,
  OpportunityResearchExportRequest,
  OpportunityResearchExportResponse,
  OpportunityResearchExportRow,
  OpportunityResearchListFilters,
  OpportunityResearchMetadata,
  OpportunityResearchPracticeSummary,
  OpportunityResearchReviewSummary,
  OpportunityResearchUpdate,
  OpportunityResearchUpsert,
  ProductOpportunity,
} from '../types';
import {
  OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT,
  OPPORTUNITY_RESEARCH_EXPORT_LIMIT,
  OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS,
  OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT,
  OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT,
  opportunityResearchDecisionSnapshotSchema,
  normalizeOpportunityResearchTags,
} from '@shared/schemas';
import { ProductService } from './productService';

export const OPPORTUNITY_RESEARCH_MARKET_CAVEAT =
  'Market trend, rank, and review signals are proxy evidence only, not verified sales or demand facts.';
export const OPPORTUNITY_RESEARCH_BUSINESS_CAVEAT =
  'Business metrics depend on merchant-entered assumptions and are not verified margin, ROI, or profitability facts.';
export const OPPORTUNITY_RESEARCH_SCORE_CAVEAT =
  'Research status, tags, notes, priority, decisions, review metadata, daily action plans, and action outcomes do not change opportunity score or factor contributions.';

const DAY_MS = 24 * 60 * 60 * 1000;

interface ResearchRecord {
  productId: string;
  status: string;
  priority: string;
  tagsJson: string;
  notes: string | null;
  archived: boolean;
  decisionStatus: string | null;
  decisionReason: string | null;
  decisionNextAction: string | null;
  decisionSnapshotJson: string | null;
  decidedAt: number | null;
  decisionUpdatedAt: number | null;
  lastActionId: string | null;
  lastActionOutcome: string | null;
  lastActionCompletedAt: number | null;
  lastActionUpdatedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export class OpportunityResearchService {
  constructor(private readonly productService = new ProductService()) {}

  async upsertForProduct(
    productId: string,
    data: OpportunityResearchUpsert
  ): Promise<OpportunityResearchMetadata> {
    await this.requireProduct(productId);
    const existing = await this.getEntry(productId);
    const now = Date.now();
    const values = {
      productId,
      status: data.status ?? existing?.status ?? 'researching',
      priority: data.priority ?? existing?.priority ?? 'medium',
      tagsJson: JSON.stringify(
        this.normalizeTags(data.tags ?? existing?.tags ?? [])
      ),
      notes: data.notes !== undefined ? data.notes : existing?.notes ?? null,
      archived: data.archived ?? existing?.archived ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await db
      .insert(opportunityResearchEntries)
      .values(values)
      .onConflictDoUpdate({
        target: opportunityResearchEntries.productId,
        set: {
          status: values.status,
          priority: values.priority,
          tagsJson: values.tagsJson,
          notes: values.notes,
          archived: values.archived,
          updatedAt: values.updatedAt,
        },
      });

    return this.requireEntry(productId);
  }

  async updateForProduct(
    productId: string,
    data: OpportunityResearchUpdate
  ): Promise<OpportunityResearchMetadata> {
    await this.requireProduct(productId);
    const existing = await this.requireEntry(productId);
    const update = {
      status: data.status ?? existing.status,
      priority: data.priority ?? existing.priority,
      tagsJson: JSON.stringify(
        this.normalizeTags(data.tags ?? existing.tags)
      ),
      notes: data.notes !== undefined ? data.notes : existing.notes,
      archived: data.archived ?? existing.archived,
      updatedAt: Date.now(),
    };

    await db
      .update(opportunityResearchEntries)
      .set(update)
      .where(eq(opportunityResearchEntries.productId, productId));

    return this.requireEntry(productId);
  }

  async getForProduct(
    productId: string
  ): Promise<OpportunityResearchMetadata | null> {
    await this.requireProduct(productId);
    return this.getEntry(productId);
  }

  async listEntries(filters: OpportunityResearchListFilters = {}) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(opportunityResearchEntries.status, filters.status));
    }
    if (filters.priority) {
      conditions.push(eq(opportunityResearchEntries.priority, filters.priority));
    }
    if (filters.archived !== undefined) {
      conditions.push(eq(opportunityResearchEntries.archived, filters.archived));
    }

    const records = await db
      .select()
      .from(opportunityResearchEntries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(opportunityResearchEntries.updatedAt));

    const tag = filters.tag?.trim().toLowerCase();
    const filtered = records
      .map((record) => this.toMetadata(record))
      .filter((entry) => (tag ? entry.tags.includes(tag) : true))
      .filter((entry) => this.matchesDecisionReviewFilters(entry, filters))
      .filter((entry) => this.matchesPracticeFilters(entry, filters));
    const total = filtered.length;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit),
      total,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewSummary(): Promise<OpportunityResearchReviewSummary> {
    const records = await db
      .select()
      .from(opportunityResearchEntries)
      .where(eq(opportunityResearchEntries.archived, false));
    const entries = records.map((record) => this.toMetadata(record));
    const summary: OpportunityResearchReviewSummary = {
      totalActive: entries.length,
      decided: 0,
      undecided: 0,
      needsNextAction: 0,
      stale: 0,
      byStatus: {
        researching: 0,
        watching: 0,
        ready: 0,
        rejected: 0,
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
      },
      generatedAt: Date.now(),
      caveat: OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT,
    };

    for (const entry of entries) {
      summary.byStatus[entry.status] += 1;
      summary.byPriority[entry.priority] += 1;
      if (entry.decisionReview.hasDecision) {
        summary.decided += 1;
      } else {
        summary.undecided += 1;
      }
      if (entry.decisionReview.needsNextAction) {
        summary.needsNextAction += 1;
      }
      if (entry.decisionReview.stale) {
        summary.stale += 1;
      }
    }

    return summary;
  }

  async getDailyActionPlan(): Promise<OpportunityResearchDailyActionPlan> {
    const records = await db
      .select()
      .from(opportunityResearchEntries)
      .where(eq(opportunityResearchEntries.archived, false));
    const entries = records.map((record) => this.toMetadata(record));
    const actionItems: OpportunityResearchDailyActionItem[] = [
      {
        id: 'add_next_action',
        label: '补齐下一步行动',
        reason: '推进或暂缓的决策需要明确下一步，避免判断停在纸面上。',
        learningGoal: '练习把判断转成可执行跟进。',
        steps: [
          '打开缺下一步的决策队列。',
          '为每个 go/hold 决策写下一条可执行动作。',
          '确认动作包含对象、证据或时间线。',
        ],
        completionCriteria: [
          '每个 go/hold 决策都有下一步行动。',
          '下一步不依赖系统自动推断。',
        ],
        priority: 1,
        count: entries.filter((entry) => entry.decisionReview.needsNextAction)
          .length,
        filters: {
          workspaceMode: 'review',
          shortlisted: true,
          decisionReview: 'needs_action',
        },
      },
      {
        id: 'review_stale_decisions',
        label: '复盘过期决策',
        reason: '超过复盘阈值的判断需要重新检查证据和行动状态。',
        learningGoal: '练习定期刷新旧判断，避免过期证据继续驱动行动。',
        steps: [
          '打开需复盘的决策队列。',
          '检查价格、趋势、业务假设和缺失信号是否有变化。',
          '保留、调整或清除当前决策，并更新下一步。',
        ],
        completionCriteria: [
          '每个 stale 决策都被重新确认或调整。',
          '复盘后的下一步仍然具体可执行。',
        ],
        priority: 2,
        count: entries.filter((entry) => entry.decisionReview.stale).length,
        filters: {
          workspaceMode: 'review',
          shortlisted: true,
          decisionReview: 'stale',
        },
      },
      {
        id: 'decide_candidates',
        label: '判断未决策候选',
        reason: '未决策候选需要被推进、暂缓或排除，保持研究队列可执行。',
        learningGoal: '练习把候选从观察状态推进到明确判断。',
        steps: [
          '打开未决策候选队列。',
          '检查评分门控、缺失信号和业务假设完整度。',
          '记录 go、hold 或 no-go，并写下判断依据。',
        ],
        completionCriteria: [
          '候选已记录当前决策。',
          '决策依据说明了关键证据或缺口。',
        ],
        priority: 3,
        count: entries.filter((entry) => !entry.decisionReview.hasDecision)
          .length,
        filters: {
          workspaceMode: 'review',
          shortlisted: true,
          decisionReview: 'undecided',
        },
      },
      {
        id: 'continue_research',
        label: '继续调研中候选',
        reason: '调研中的候选需要补证据、补读数或更新研究备注。',
        learningGoal: '练习补齐能支持后续判断的最小证据。',
        steps: [
          '打开调研中候选。',
          '补充手动读数、成本假设或研究备注。',
          '将状态调整为观察、准备推进或排除。',
        ],
        completionCriteria: [
          '至少补充一项缺失证据或备注。',
          '研究状态反映当前处理阶段。',
        ],
        priority: 4,
        count: entries.filter((entry) => entry.status === 'researching')
          .length,
        filters: {
          workspaceMode: 'discover',
          shortlisted: true,
          researchStatus: 'researching',
        },
      },
    ];

    return {
      items: actionItems.filter((item) => item.count > 0),
      generatedAt: Date.now(),
      caveat: OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT,
    };
  }

  async getPracticeSummary(): Promise<OpportunityResearchPracticeSummary> {
    const records = await db
      .select()
      .from(opportunityResearchEntries)
      .where(eq(opportunityResearchEntries.archived, false));
    const entries = records.map((record) => this.toMetadata(record));
    const summary: OpportunityResearchPracticeSummary = {
      totalActive: entries.length,
      withOutcome: 0,
      withoutOutcome: 0,
      byActionId: {
        add_next_action: 0,
        review_stale_decisions: 0,
        decide_candidates: 0,
        continue_research: 0,
      },
      latestCompletedAt: null,
      generatedAt: Date.now(),
      caveat: OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT,
    };

    for (const entry of entries) {
      const outcome = entry.lastActionOutcome;
      if (!outcome) {
        summary.withoutOutcome += 1;
        continue;
      }

      summary.withOutcome += 1;
      summary.byActionId[outcome.actionId] += 1;
      summary.latestCompletedAt = Math.max(
        summary.latestCompletedAt ?? 0,
        outcome.completedAt
      );
    }

    return summary;
  }

  async archiveForProduct(productId: string): Promise<OpportunityResearchMetadata> {
    return this.updateForProduct(productId, { archived: true });
  }

  async saveDecisionForProduct(
    productId: string,
    data: OpportunityResearchDecisionRequest,
    snapshot: OpportunityResearchDecisionSnapshot
  ): Promise<OpportunityResearchMetadata> {
    await this.requireProduct(productId);
    const existing = await this.getEntry(productId);
    const now = Date.now();
    const decisionValues = {
      decisionStatus: data.status,
      decisionReason: data.reason,
      decisionNextAction: data.nextAction,
      decisionSnapshotJson: JSON.stringify(snapshot),
      decidedAt: now,
      decisionUpdatedAt: now,
      updatedAt: now,
    };

    if (existing) {
      await db
        .update(opportunityResearchEntries)
        .set(decisionValues)
        .where(eq(opportunityResearchEntries.productId, productId));
    } else {
      await db.insert(opportunityResearchEntries).values({
        productId,
        status: 'researching',
        priority: 'medium',
        tagsJson: '[]',
        notes: null,
        archived: false,
        ...decisionValues,
        createdAt: now,
      });
    }

    return this.requireEntry(productId);
  }

  async clearDecisionForProduct(
    productId: string
  ): Promise<OpportunityResearchMetadata> {
    await this.requireProduct(productId);
    await this.requireEntry(productId);
    const now = Date.now();

    await db
      .update(opportunityResearchEntries)
      .set({
        decisionStatus: null,
        decisionReason: null,
        decisionNextAction: null,
        decisionSnapshotJson: null,
        decidedAt: null,
        decisionUpdatedAt: null,
        updatedAt: now,
      })
      .where(eq(opportunityResearchEntries.productId, productId));

    return this.requireEntry(productId);
  }

  async saveActionOutcomeForProduct(
    productId: string,
    data: OpportunityResearchActionOutcomeRequest
  ): Promise<OpportunityResearchMetadata> {
    await this.requireProduct(productId);
    await this.requireEntry(productId);
    const now = Date.now();

    await db
      .update(opportunityResearchEntries)
      .set({
        lastActionId: data.actionId,
        lastActionOutcome: data.outcome,
        lastActionCompletedAt: data.completedAt ?? now,
        lastActionUpdatedAt: now,
        updatedAt: now,
      })
      .where(eq(opportunityResearchEntries.productId, productId));

    return this.requireEntry(productId);
  }

  async clearActionOutcomeForProduct(
    productId: string
  ): Promise<OpportunityResearchMetadata> {
    await this.requireProduct(productId);
    await this.requireEntry(productId);
    const now = Date.now();

    await db
      .update(opportunityResearchEntries)
      .set({
        lastActionId: null,
        lastActionOutcome: null,
        lastActionCompletedAt: null,
        lastActionUpdatedAt: null,
        updatedAt: now,
      })
      .where(eq(opportunityResearchEntries.productId, productId));

    return this.requireEntry(productId);
  }

  async deleteForProduct(productId: string): Promise<void> {
    await this.requireProduct(productId);
    await db
      .delete(opportunityResearchEntries)
      .where(eq(opportunityResearchEntries.productId, productId));
  }

  async deleteForDeletedProduct(productId: string): Promise<void> {
    await db
      .delete(opportunityResearchEntries)
      .where(eq(opportunityResearchEntries.productId, productId));
  }

  async getMetadataMap(
    productIds: string[]
  ): Promise<Map<string, OpportunityResearchMetadata>> {
    const result = new Map<string, OpportunityResearchMetadata>();
    if (productIds.length === 0) return result;

    const records = await db
      .select()
      .from(opportunityResearchEntries)
      .where(inArray(opportunityResearchEntries.productId, productIds));

    for (const record of records) {
      const entry = this.toMetadata(record);
      result.set(entry.productId, entry);
    }

    return result;
  }

  attachMetadata(
    opportunities: ProductOpportunity[],
    metadata: Map<string, OpportunityResearchMetadata>
  ): ProductOpportunity[] {
    return opportunities.map((opportunity) => {
      const research = metadata.get(opportunity.product.id);
      return research ? { ...opportunity, research } : opportunity;
    });
  }

  filterOpportunities(
    opportunities: ProductOpportunity[],
    filters: Pick<
      OpportunityListFilters,
      | 'shortlisted'
      | 'researchStatus'
      | 'researchTag'
      | 'decisionStatus'
      | 'decisionReview'
      | 'actionOutcome'
      | 'actionId'
    >
  ): ProductOpportunity[] {
    return opportunities
      .filter((opportunity) => {
        if (filters.shortlisted === undefined) return true;
        const shortlisted = Boolean(opportunity.research && !opportunity.research.archived);
        return filters.shortlisted ? shortlisted : !shortlisted;
      })
      .filter((opportunity) =>
        filters.researchStatus
          ? opportunity.research?.status === filters.researchStatus &&
            !opportunity.research.archived
          : true
      )
      .filter((opportunity) =>
        filters.researchTag
          ? Boolean(
              opportunity.research &&
                !opportunity.research.archived &&
                opportunity.research.tags.includes(
                  filters.researchTag.trim().toLowerCase()
                )
            )
          : true
      )
      .filter((opportunity) =>
        this.matchesDecisionReviewFilters(
          opportunity.research ?? null,
          filters
        )
      )
      .filter((opportunity) =>
        this.matchesPracticeFilters(opportunity.research ?? null, filters)
      );
  }

  createComparisonResponse(
    opportunities: ProductOpportunity[],
    selectedProductIds: string[]
  ) {
    return {
      data: opportunities,
      selectedProductIds,
      comparedAt: Date.now(),
      caveats: {
        marketSignals: OPPORTUNITY_RESEARCH_MARKET_CAVEAT,
        businessSignals: OPPORTUNITY_RESEARCH_BUSINESS_CAVEAT,
        score: OPPORTUNITY_RESEARCH_SCORE_CAVEAT,
      },
    };
  }

  createDecisionSnapshot(
    opportunity: ProductOpportunity
  ): OpportunityResearchDecisionSnapshot {
    return {
      capturedAt: Date.now(),
      score: opportunity.score,
      confidence: opportunity.confidence,
      recommendation: opportunity.recommendation,
      recommendationGate: opportunity.recommendationGate,
      keyReasons: opportunity.keyReasons.slice(0, 5),
      missingSignals: opportunity.missingSignals,
      businessSignals: opportunity.businessSignals,
      marketSignals: opportunity.marketSignals ?? null,
    };
  }

  createExportResponse(
    request: OpportunityResearchExportRequest,
    opportunities: ProductOpportunity[]
  ): OpportunityResearchExportResponse {
    const limit = Math.min(request.limit, OPPORTUNITY_RESEARCH_EXPORT_LIMIT);
    const rows = opportunities.slice(0, limit).map((opportunity) =>
      this.toExportRow(opportunity)
    );
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `opportunity-research-${timestamp}.${request.format}`;
    const response: OpportunityResearchExportResponse = {
      format: request.format,
      filename,
      rows,
      caveat: OPPORTUNITY_RESEARCH_SCORE_CAVEAT,
    };

    if (request.format === 'csv') {
      response.csv = this.toCsv(rows);
    }

    return response;
  }

  normalizeTags(tags: string[]): string[] {
    return normalizeOpportunityResearchTags(tags);
  }

  private async getEntry(
    productId: string
  ): Promise<OpportunityResearchMetadata | null> {
    const [record] = await db
      .select()
      .from(opportunityResearchEntries)
      .where(eq(opportunityResearchEntries.productId, productId))
      .limit(1);

    return record ? this.toMetadata(record) : null;
  }

  private async requireEntry(
    productId: string
  ): Promise<OpportunityResearchMetadata> {
    const entry = await this.getEntry(productId);
    if (!entry) {
      throw new AppError(
        404,
        'Opportunity research entry not found',
        'RESEARCH_ENTRY_NOT_FOUND'
      );
    }
    return entry;
  }

  private async requireProduct(productId: string) {
    const product = await this.productService.getProductById(productId);
    if (!product) {
      throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');
    }
    return product;
  }

  private toMetadata(record: ResearchRecord): OpportunityResearchMetadata {
    const decision = this.parseDecision(record);
    const entry: OpportunityResearchEntry = {
      productId: record.productId,
      status: record.status as OpportunityResearchEntry['status'],
      priority: record.priority as OpportunityResearchEntry['priority'],
      tags: this.parseTags(record.tagsJson),
      notes: record.notes ?? null,
      archived: Boolean(record.archived),
      decision,
      lastActionOutcome: this.parseActionOutcome(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return {
      ...entry,
      notesSummary: this.notesSummary(entry.notes),
      decisionReview: this.createDecisionReview(decision),
    };
  }

  private createDecisionReview(
    decision: OpportunityResearchDecision | null,
    now: number = Date.now()
  ): OpportunityResearchDecisionReview {
    if (!decision) {
      return {
        hasDecision: false,
        status: null,
        decidedAt: null,
        daysSinceDecision: null,
        hasNextAction: false,
        needsNextAction: false,
        stale: false,
      };
    }

    const daysSinceDecision = Math.max(
      0,
      Math.floor((now - decision.decidedAt) / DAY_MS)
    );
    const hasNextAction = Boolean(decision.nextAction);
    const needsNextAction =
      (decision.status === 'go' || decision.status === 'hold') &&
      !hasNextAction;

    return {
      hasDecision: true,
      status: decision.status,
      decidedAt: decision.decidedAt,
      daysSinceDecision,
      hasNextAction,
      needsNextAction,
      stale:
        daysSinceDecision >= OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS,
    };
  }

  private matchesDecisionReviewFilters(
    research: OpportunityResearchMetadata | null,
    filters: {
      decisionStatus?: OpportunityResearchDecision['status'];
      decisionReview?: OpportunityResearchDecisionReviewFilter;
    }
  ): boolean {
    const review = research?.decisionReview ?? this.createDecisionReview(null);

    if (
      filters.decisionStatus &&
      review.status !== filters.decisionStatus
    ) {
      return false;
    }

    switch (filters.decisionReview ?? 'all') {
      case 'decided':
        return review.hasDecision;
      case 'undecided':
        return !review.hasDecision;
      case 'needs_action':
        return review.needsNextAction;
      case 'stale':
        return review.stale;
      case 'all':
      default:
        return true;
    }
  }

  private matchesPracticeFilters(
    research: OpportunityResearchMetadata | null,
    filters: {
      actionOutcome?: OpportunityListFilters['actionOutcome'];
      actionId?: OpportunityListFilters['actionId'];
    }
  ): boolean {
    if (!filters.actionOutcome && !filters.actionId) return true;
    if (!research || research.archived) return false;

    const outcome = research.lastActionOutcome;
    if (filters.actionOutcome === 'with' && !outcome) return false;
    if (filters.actionOutcome === 'without' && outcome) return false;
    if (filters.actionId && outcome?.actionId !== filters.actionId) {
      return false;
    }

    return true;
  }

  private parseTags(value: string): string[] {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed)
        ? this.normalizeTags(parsed.filter((tag): tag is string => typeof tag === 'string'))
        : [];
    } catch {
      return [];
    }
  }

  private notesSummary(notes: string | null): string | null {
    if (!notes) return null;
    return notes.length <= 240 ? notes : `${notes.slice(0, 237)}...`;
  }

  private toExportRow(
    opportunity: ProductOpportunity
  ): OpportunityResearchExportRow {
    const decision = opportunity.research?.decision ?? null;
    const actionOutcome = opportunity.research?.lastActionOutcome ?? null;
    return {
      productId: opportunity.product.id,
      title: opportunity.product.title,
      platform: opportunity.product.platform,
      category: opportunity.product.category ?? null,
      currentPrice: opportunity.product.currentPrice ?? null,
      currency: opportunity.product.currency,
      score: opportunity.score,
      confidence: opportunity.confidence,
      recommendation: opportunity.recommendation,
      researchStatus: opportunity.research?.status ?? null,
      researchPriority: opportunity.research?.priority ?? null,
      researchTags: opportunity.research?.tags ?? [],
      researchNotesSummary: opportunity.research?.notesSummary ?? null,
      decisionStatus: decision?.status ?? null,
      decisionReason: decision?.reason ?? null,
      decisionNextAction: decision?.nextAction ?? null,
      decidedAt: decision?.decidedAt ?? null,
      decisionSnapshotScore: decision?.snapshot.score ?? null,
      decisionSnapshotRecommendation: decision?.snapshot.recommendation ?? null,
      lastActionId: actionOutcome?.actionId ?? null,
      lastActionOutcome: actionOutcome?.outcome ?? null,
      lastActionCompletedAt: actionOutcome?.completedAt ?? null,
      topReasons: opportunity.keyReasons.slice(0, 3),
      missingSignals: opportunity.missingSignals,
      marketSignalCaveat:
        opportunity.marketSignals?.caveat ?? OPPORTUNITY_RESEARCH_MARKET_CAVEAT,
      businessSignalCaveat: opportunity.businessSignals.caveat,
      scoreCaveat: OPPORTUNITY_RESEARCH_SCORE_CAVEAT,
    };
  }

  private toCsv(rows: OpportunityResearchExportRow[]): string {
    const headers = [
      'productId',
      'title',
      'platform',
      'category',
      'currentPrice',
      'currency',
      'score',
      'confidence',
      'recommendation',
      'researchStatus',
      'researchPriority',
      'researchTags',
      'researchNotesSummary',
      'decisionStatus',
      'decisionReason',
      'decisionNextAction',
      'decidedAt',
      'decisionSnapshotScore',
      'decisionSnapshotRecommendation',
      'lastActionId',
      'lastActionOutcome',
      'lastActionCompletedAt',
      'topReasons',
      'missingSignals',
      'marketSignalCaveat',
      'businessSignalCaveat',
      'scoreCaveat',
    ];
    const lines = rows.map((row) =>
      headers
        .map((header) =>
          this.csvCell(row[header as keyof OpportunityResearchExportRow])
        )
        .join(',')
    );
    return [headers.join(','), ...lines].join('\n');
  }

  private csvCell(value: unknown): string {
    const text = this.csvValueToString(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private csvValueToString(value: unknown): string {
    if (Array.isArray(value)) return value.join('|');
    if (value === null || value === undefined) return '';
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }

    return JSON.stringify(value) ?? '';
  }

  private parseDecision(record: ResearchRecord): OpportunityResearchDecision | null {
    if (!record.decisionStatus || !record.decisionReason || !record.decisionSnapshotJson) {
      return null;
    }

    try {
      const parsed = opportunityResearchDecisionSnapshotSchema.safeParse(
        JSON.parse(record.decisionSnapshotJson)
      );
      if (!parsed.success) return null;

      return {
        status: record.decisionStatus as OpportunityResearchDecision['status'],
        reason: record.decisionReason,
        nextAction: record.decisionNextAction ?? null,
        decidedAt:
          record.decidedAt ?? record.decisionUpdatedAt ?? record.updatedAt,
        updatedAt: record.decisionUpdatedAt ?? record.updatedAt,
        snapshot: parsed.data,
      };
    } catch {
      return null;
    }
  }

  private parseActionOutcome(
    record: ResearchRecord
  ): OpportunityResearchActionOutcome | null {
    if (
      !record.lastActionId ||
      !record.lastActionOutcome ||
      record.lastActionCompletedAt === null ||
      record.lastActionUpdatedAt === null
    ) {
      return null;
    }

    return {
      actionId: record.lastActionId as OpportunityResearchActionOutcome['actionId'],
      outcome: record.lastActionOutcome,
      completedAt: record.lastActionCompletedAt,
      updatedAt: record.lastActionUpdatedAt,
    };
  }
}
