import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import {
  OPPORTUNITY_RESEARCH_COMPARISON_LIMIT,
  OPPORTUNITY_RESEARCH_EXPORT_LIMIT,
  OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_TAGS,
  opportunityResearchComparisonRequestSchema,
  opportunityResearchExportRequestSchema,
  opportunityResearchTagsSchema,
  opportunityResearchUpdateSchema,
  productOpportunitySchema,
} from '@shared/schemas';

const baseProduct = {
  id: 'product-1',
  platform: 'amazon',
  productUrl: 'https://www.amazon.com/dp/B000TEST01',
  asin: 'B000TEST01',
  title: 'Test Product',
  currentPrice: 29.99,
  currency: 'USD',
  isMonitoring: true,
  monitorType: null,
  checkInterval: 24,
  userId: null,
  createdAt: 100,
  updatedAt: 100,
  lastCheckedAt: null,
  metadata: null,
};

describe('opportunity research schemas and migration', () => {
  it('keeps opportunity responses valid with optional research metadata', () => {
    const withoutResearch = productOpportunitySchema.safeParse({
      ...baseOpportunity(),
    });
    const withResearch = productOpportunitySchema.safeParse({
      ...baseOpportunity(),
      research: {
        productId: 'product-1',
        status: 'researching',
        priority: 'high',
        tags: ['launch', 'amazon'],
        notes: 'Check supplier MOQ before moving to ready.',
        notesSummary: 'Check supplier MOQ before moving to ready.',
        archived: false,
        createdAt: 200,
        updatedAt: 300,
      },
    });

    expect(withoutResearch.success).toBe(true);
    expect(withResearch.success).toBe(true);
  });

  it('normalizes tags and enforces tag limits', () => {
    const parsed = opportunityResearchTagsSchema.parse([
      ' Amazon ',
      'amazon',
      'Launch',
      '',
      ' launch ',
    ]);

    expect(parsed).toEqual(['amazon', 'launch']);

    const tooMany = Array.from(
      { length: OPPORTUNITY_RESEARCH_MAX_TAGS + 1 },
      (_, index) => `tag-${index}`
    );
    expect(opportunityResearchTagsSchema.safeParse(tooMany).success).toBe(false);
    expect(opportunityResearchTagsSchema.safeParse(['x'.repeat(33)]).success).toBe(false);
  });

  it('bounds notes text in update payloads', () => {
    expect(opportunityResearchUpdateSchema.safeParse({
      notes: 'Valid note',
    }).success).toBe(true);
    expect(opportunityResearchUpdateSchema.safeParse({
      notes: 'x'.repeat(OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH + 1),
    }).success).toBe(false);
  });

  it('enforces comparison and export request limits', () => {
    const tooManyComparisonIds = Array.from(
      { length: OPPORTUNITY_RESEARCH_COMPARISON_LIMIT + 1 },
      (_, index) => `product-${index}`
    );
    const tooManyExportIds = Array.from(
      { length: OPPORTUNITY_RESEARCH_EXPORT_LIMIT + 1 },
      (_, index) => `product-${index}`
    );

    expect(opportunityResearchComparisonRequestSchema.safeParse({
      productIds: tooManyComparisonIds,
    }).success).toBe(false);
    expect(opportunityResearchComparisonRequestSchema.parse({
      productIds: ['product-1', 'product-1', 'product-2'],
    }).productIds).toEqual(['product-1', 'product-2']);

    expect(opportunityResearchExportRequestSchema.safeParse({
      format: 'json',
      productIds: tooManyExportIds,
    }).success).toBe(false);
    expect(opportunityResearchExportRequestSchema.safeParse({
      format: 'csv',
    }).success).toBe(false);
    expect(opportunityResearchExportRequestSchema.parse({
      format: 'csv',
      filters: {
        shortlisted: true,
        researchTag: ' Launch ',
      },
    })).toMatchObject({
      format: 'csv',
      limit: OPPORTUNITY_RESEARCH_EXPORT_LIMIT,
      filters: {
        shortlisted: true,
        researchTag: 'launch',
      },
    });
  });

  it('creates research table and cascades entries when products are deleted', () => {
    const sqlite = new SQLite(':memory:');

    try {
      sqlite.pragma('foreign_keys = ON');
      sqlite.exec(`
        CREATE TABLE products (
          id TEXT PRIMARY KEY,
          platform TEXT NOT NULL,
          product_url TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          is_monitoring INTEGER NOT NULL DEFAULT 0,
          check_interval INTEGER NOT NULL DEFAULT 24,
          created_at INTEGER NOT NULL
        );
      `);

      const migration = fs.readFileSync(
        path.resolve('migrations/006-opportunity-research-workspace.sql'),
        'utf-8'
      );
      sqlite.exec(migration);

      sqlite.prepare(`
        INSERT INTO products (
          id,
          platform,
          product_url,
          title,
          created_at
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        'product-1',
        'amazon',
        'https://www.amazon.com/dp/B000TEST01',
        'Test Product',
        100
      );

      sqlite.prepare(`
        INSERT INTO opportunity_research_entries (
          product_id,
          status,
          priority,
          tags_json,
          notes,
          archived,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'product-1',
        'researching',
        'high',
        '["amazon","launch"]',
        'Check MOQ',
        0,
        200,
        300
      );

      const beforeDelete = sqlite
        .prepare('SELECT COUNT(*) as count FROM opportunity_research_entries')
        .get() as { count: number };
      sqlite.prepare('DELETE FROM products WHERE id = ?').run('product-1');
      const afterDelete = sqlite
        .prepare('SELECT COUNT(*) as count FROM opportunity_research_entries')
        .get() as { count: number };

      expect(beforeDelete.count).toBe(1);
      expect(afterDelete.count).toBe(0);
    } finally {
      sqlite.close();
    }
  });
});

function baseOpportunity() {
  return {
    product: baseProduct,
    score: 72,
    confidence: 0.65,
    recommendation: 'investigate',
    keyReasons: ['Healthy current acquisition'],
    missingSignals: ['sales_volume'],
    factors: [],
    acquisitionHealth: {
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      failureReason: null,
      confidence: 0.9,
      durationMs: 200,
      timestamp: 100,
      freshnessMs: 1000,
    },
    businessSignals: {
      completeness: 'none',
      missingSignals: ['cost_basis'],
      metrics: null,
      caveat: 'Business metrics require merchant-entered assumptions.',
    },
    marketSignals: {
      status: 'missing',
      provider: null,
      source: null,
      confidence: null,
      freshnessMs: null,
      missingSignals: ['market_trend'],
      caveat:
        'Keepa market signals are historical trend and proxy evidence, not verified sales, demand, margin, ROI, or profitability facts.',
      factors: [],
    },
  };
}
