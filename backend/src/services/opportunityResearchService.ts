import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import { opportunityResearchEntries } from '../db/schema';
import { AppError } from '../middleware/errorHandler';
import {
  OpportunityListFilters,
  OpportunityResearchEntry,
  OpportunityResearchExportRequest,
  OpportunityResearchExportResponse,
  OpportunityResearchExportRow,
  OpportunityResearchListFilters,
  OpportunityResearchMetadata,
  OpportunityResearchUpdate,
  OpportunityResearchUpsert,
  ProductOpportunity,
} from '../types';
import {
  OPPORTUNITY_RESEARCH_EXPORT_LIMIT,
  normalizeOpportunityResearchTags,
} from '@shared/schemas';
import { ProductService } from './productService';

export const OPPORTUNITY_RESEARCH_MARKET_CAVEAT =
  'Market trend, rank, and review signals are proxy evidence only, not verified sales or demand facts.';
export const OPPORTUNITY_RESEARCH_BUSINESS_CAVEAT =
  'Business metrics depend on merchant-entered assumptions and are not verified margin, ROI, or profitability facts.';
export const OPPORTUNITY_RESEARCH_SCORE_CAVEAT =
  'Research status, tags, notes, and priority do not change opportunity score or factor contributions.';

interface ResearchRecord {
  productId: string;
  status: string;
  priority: string;
  tagsJson: string;
  notes: string | null;
  archived: boolean;
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
    const filtered = tag
      ? records
          .map((record) => this.toMetadata(record))
          .filter((entry) => entry.tags.includes(tag))
      : records.map((record) => this.toMetadata(record));
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

  async archiveForProduct(productId: string): Promise<OpportunityResearchMetadata> {
    return this.updateForProduct(productId, { archived: true });
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
      'shortlisted' | 'researchStatus' | 'researchTag'
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
    const entry: OpportunityResearchEntry = {
      productId: record.productId,
      status: record.status as OpportunityResearchEntry['status'],
      priority: record.priority as OpportunityResearchEntry['priority'],
      tags: this.parseTags(record.tagsJson),
      notes: record.notes ?? null,
      archived: Boolean(record.archived),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };

    return {
      ...entry,
      notesSummary: this.notesSummary(entry.notes),
    };
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
}
