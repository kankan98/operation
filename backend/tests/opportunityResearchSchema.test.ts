import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { applyOpportunityResearchTraceRuntimeMigration } from './migrationTestUtils';
import {
  OPPORTUNITY_RESEARCH_COMPARISON_LIMIT,
  OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT,
  OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS,
  OPPORTUNITY_RESEARCH_EXPORT_LIMIT,
  OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT,
  OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT,
  OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_NOTES_LENGTH,
  OPPORTUNITY_RESEARCH_MAX_TAGS,
  opportunityResearchComparisonRequestSchema,
  opportunityResearchActionOutcomeRequestSchema,
  opportunityResearchDecisionRequestSchema,
  opportunityResearchDailyActionPlanSchema,
  opportunityResearchExportRequestSchema,
  opportunityResearchListQuerySchema,
  opportunityResearchMetadataSchema,
  opportunityResearchPracticeSummarySchema,
  opportunityResearchReviewSummarySchema,
  opportunityResearchTagsSchema,
  opportunityResearchUpdateSchema,
  opportunityListQuerySchema,
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
        decision: {
          status: 'hold',
          reason: 'Waiting for supplier quote.',
          nextAction: 'Confirm landed cost.',
          decidedAt: 250,
          updatedAt: 260,
          snapshot: baseDecisionSnapshot(),
        },
        decisionReview: {
          hasDecision: true,
          status: 'hold',
          decidedAt: 250,
          daysSinceDecision: 1,
          hasNextAction: true,
          needsNextAction: false,
          stale: false,
        },
        lastActionOutcome: {
          actionId: 'add_next_action',
          outcome: 'Added supplier quote follow-up.',
          completedAt: 280,
          updatedAt: 290,
        },
        createdAt: 200,
        updatedAt: 300,
      },
    });

    expect(withoutResearch.success).toBe(true);
    expect(withResearch.success).toBe(true);
  });

  it('validates decision requests and nullable decision metadata', () => {
    const parsed = opportunityResearchDecisionRequestSchema.parse({
      status: 'go',
      reason: ' Strong score after cost check. ',
      nextAction: ' Call supplier. ',
    });
    const blankNextAction = opportunityResearchDecisionRequestSchema.parse({
      status: 'hold',
      reason: 'Need another manual reading.',
      nextAction: '   ',
    });

    expect(parsed).toEqual({
      status: 'go',
      reason: 'Strong score after cost check.',
      nextAction: 'Call supplier.',
    });
    expect(blankNextAction.nextAction).toBeNull();
    expect(opportunityResearchDecisionRequestSchema.safeParse({
      status: 'maybe',
      reason: 'Invalid status',
    }).success).toBe(false);
    expect(opportunityResearchDecisionRequestSchema.safeParse({
      status: 'no_go',
      reason: 'x'.repeat(OPPORTUNITY_RESEARCH_MAX_DECISION_REASON_LENGTH + 1),
    }).success).toBe(false);
    expect(opportunityResearchDecisionRequestSchema.safeParse({
      status: 'hold',
      reason: 'Valid reason',
      nextAction: 'x'.repeat(
        OPPORTUNITY_RESEARCH_MAX_DECISION_NEXT_ACTION_LENGTH + 1
      ),
    }).success).toBe(false);

    expect(opportunityResearchMetadataSchema.safeParse({
      productId: 'product-1',
      status: 'watching',
      priority: 'medium',
      tags: [],
      notes: null,
      notesSummary: null,
      archived: false,
      decision: null,
      lastActionOutcome: null,
      decisionReview: {
        hasDecision: false,
        status: null,
        decidedAt: null,
        daysSinceDecision: null,
        hasNextAction: false,
        needsNextAction: false,
        stale: false,
      },
      createdAt: 100,
      updatedAt: 200,
    }).success).toBe(true);
  });

  it('validates decision review query filters and metadata', () => {
    expect(opportunityResearchListQuerySchema.parse({
      decisionStatus: 'go',
      decisionReview: 'needs_action',
      actionOutcome: 'with',
      actionId: 'add_next_action',
    })).toMatchObject({
      decisionStatus: 'go',
      decisionReview: 'needs_action',
      actionOutcome: 'with',
      actionId: 'add_next_action',
    });
    expect(opportunityResearchListQuerySchema.parse({}).decisionReview).toBe(
      'all'
    );
    expect(opportunityResearchListQuerySchema.safeParse({
      decisionReview: 'overdue',
    }).success).toBe(false);
    expect(opportunityResearchListQuerySchema.safeParse({
      actionOutcome: 'done',
    }).success).toBe(false);
    expect(opportunityListQuerySchema.parse({
      actionOutcome: 'without',
      actionId: 'continue_research',
    })).toMatchObject({
      actionOutcome: 'without',
      actionId: 'continue_research',
    });
    expect(opportunityListQuerySchema.safeParse({
      actionId: 'unknown_action',
    }).success).toBe(false);
    expect(opportunityResearchMetadataSchema.safeParse({
      productId: 'product-1',
      status: 'ready',
      priority: 'high',
      tags: ['launch'],
      notes: null,
      notesSummary: null,
      archived: false,
      decision: {
        status: 'go',
        reason: 'Ready to test listing.',
        nextAction: null,
        decidedAt: 100,
        updatedAt: 100,
        snapshot: baseDecisionSnapshot(),
      },
      decisionReview: {
        hasDecision: true,
        status: 'go',
        decidedAt: 100,
        daysSinceDecision: OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS,
        hasNextAction: false,
        needsNextAction: true,
        stale: true,
      },
      lastActionOutcome: {
        actionId: 'review_stale_decisions',
        outcome: 'Reviewed price trend and kept hold decision.',
        completedAt: 120,
        updatedAt: 130,
      },
      createdAt: 100,
      updatedAt: 100,
    }).success).toBe(true);
  });

  it('validates action outcome requests and metadata', () => {
    const now = Date.now();
    const parsed = opportunityResearchActionOutcomeRequestSchema.parse({
      actionId: 'continue_research',
      outcome: ' Added manual reading and updated cost assumptions. ',
      completedAt: now,
    });

    expect(parsed).toEqual({
      actionId: 'continue_research',
      outcome: 'Added manual reading and updated cost assumptions.',
      completedAt: now,
    });
    expect(opportunityResearchActionOutcomeRequestSchema.safeParse({
      actionId: 'continue_research',
      outcome: 'Backfilled yesterday evidence.',
      completedAt: now - 24 * 60 * 60 * 1000,
    }).success).toBe(true);
    expect(opportunityResearchActionOutcomeRequestSchema.safeParse({
      actionId: 'continue_research',
      outcome: 'Future evidence should not be accepted.',
      completedAt: now + 24 * 60 * 60 * 1000,
    }).success).toBe(false);
    expect(opportunityResearchActionOutcomeRequestSchema.safeParse({
      actionId: 'unknown',
      outcome: 'Invalid action.',
    }).success).toBe(false);
    expect(opportunityResearchActionOutcomeRequestSchema.safeParse({
      actionId: 'add_next_action',
      outcome: 'x'.repeat(OPPORTUNITY_RESEARCH_MAX_ACTION_OUTCOME_LENGTH + 1),
    }).success).toBe(false);
    expect(opportunityResearchMetadataSchema.safeParse({
      productId: 'product-1',
      status: 'watching',
      priority: 'medium',
      tags: [],
      notes: null,
      notesSummary: null,
      archived: false,
      decision: null,
      lastActionOutcome: {
        actionId: 'decide_candidates',
        outcome: 'Recorded hold decision after checking missing signals.',
        completedAt: 500,
        updatedAt: 510,
      },
      decisionReview: {
        hasDecision: false,
        status: null,
        decidedAt: null,
        daysSinceDecision: null,
        hasNextAction: false,
        needsNextAction: false,
        stale: false,
      },
      createdAt: 100,
      updatedAt: 200,
    }).success).toBe(true);
  });

  it('validates opportunity review summary counts', () => {
    const parsed = opportunityResearchReviewSummarySchema.parse({
      totalActive: 4,
      decided: 2,
      undecided: 2,
      needsNextAction: 1,
      stale: 1,
      byStatus: {
        researching: 1,
        watching: 1,
        ready: 2,
        rejected: 0,
      },
      byPriority: {
        low: 1,
        medium: 1,
        high: 2,
      },
      generatedAt: 500,
      caveat: OPPORTUNITY_RESEARCH_REVIEW_SUMMARY_CAVEAT,
    });

    expect(parsed.caveat).toContain('do not change opportunity score');
    expect(opportunityResearchReviewSummarySchema.safeParse({
      ...parsed,
      needsNextAction: -1,
    }).success).toBe(false);
  });

  it('validates opportunity practice summary coverage buckets', () => {
    const parsed = opportunityResearchPracticeSummarySchema.parse({
      totalActive: 4,
      withOutcome: 2,
      withoutOutcome: 2,
      byActionId: {
        add_next_action: 1,
        review_stale_decisions: 0,
        decide_candidates: 1,
        continue_research: 0,
      },
      latestCompletedAt: 700,
      generatedAt: 800,
      caveat: OPPORTUNITY_RESEARCH_PRACTICE_SUMMARY_CAVEAT,
    });

    expect(parsed.byActionId.review_stale_decisions).toBe(0);
    expect(parsed.caveat).toContain('workflow practice coverage metadata');
    expect(opportunityResearchPracticeSummarySchema.safeParse({
      ...parsed,
      withOutcome: -1,
    }).success).toBe(false);
    expect(opportunityResearchPracticeSummarySchema.parse({
      ...parsed,
      latestCompletedAt: null,
    }).latestCompletedAt).toBeNull();
  });

  it('validates opportunity daily action plan items', () => {
    const parsed = opportunityResearchDailyActionPlanSchema.parse({
      items: [
        {
          id: 'add_next_action',
          label: '补齐下一步行动',
          reason: '推进或暂缓的决策需要明确下一步。',
          learningGoal: '练习把判断转成可执行跟进。',
          steps: [
            '打开缺下一步的决策队列。',
            '为每个 go/hold 决策写下一条可执行动作。',
          ],
          completionCriteria: ['每个 go/hold 决策都有下一步行动。'],
          priority: 1,
          count: 2,
          filters: {
            workspaceMode: 'review',
            shortlisted: true,
            decisionReview: 'needs_action',
          },
        },
        {
          id: 'continue_research',
          label: '继续调研中候选',
          reason: '调研中的候选需要补证据。',
          learningGoal: '练习补齐能支持后续判断的最小证据。',
          steps: ['打开调研中候选。'],
          completionCriteria: ['至少补充一项缺失证据或备注。'],
          priority: 4,
          count: 1,
          filters: {
            workspaceMode: 'discover',
            shortlisted: true,
            researchStatus: 'researching',
          },
        },
      ],
      generatedAt: 500,
      caveat: OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT,
    });

    expect(parsed.items.map((item) => item.id)).toEqual([
      'add_next_action',
      'continue_research',
    ]);
    expect(parsed.items[0].steps).toContain(
      '为每个 go/hold 决策写下一条可执行动作。'
    );
    expect(parsed.caveat).toContain('workflow practice metadata');
    expect(opportunityResearchDailyActionPlanSchema.safeParse({
      ...parsed,
      items: [{ ...parsed.items[0], count: 0 }],
    }).success).toBe(false);
    expect(opportunityResearchDailyActionPlanSchema.safeParse({
      ...parsed,
      items: [{ ...parsed.items[0], steps: [] }],
    }).success).toBe(false);
    expect(opportunityResearchDailyActionPlanSchema.parse({
      items: [],
      generatedAt: 500,
      caveat: OPPORTUNITY_RESEARCH_DAILY_ACTION_PLAN_CAVEAT,
    }).items).toEqual([]);
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
        actionOutcome: 'without',
        actionId: 'continue_research',
      },
    })).toMatchObject({
      format: 'csv',
      limit: OPPORTUNITY_RESEARCH_EXPORT_LIMIT,
      filters: {
        shortlisted: true,
        researchTag: 'launch',
        actionOutcome: 'without',
        actionId: 'continue_research',
      },
    });
    expect(opportunityResearchExportRequestSchema.safeParse({
      format: 'csv',
      filters: {
        actionOutcome: 'done',
      },
    }).success).toBe(false);
    expect(opportunityResearchExportRequestSchema.safeParse({
      format: 'csv',
      filters: {
        actionId: 'unknown_action',
      },
    }).success).toBe(false);
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
      applyOpportunityResearchTraceRuntimeMigration(sqlite);

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
          decision_status,
          decision_reason,
          decision_next_action,
          decision_snapshot_json,
          decided_at,
          decision_updated_at,
          last_action_id,
          last_action_outcome,
          last_action_completed_at,
          last_action_updated_at,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'product-1',
        'researching',
        'high',
        '["amazon","launch"]',
        'Check MOQ',
        0,
        'hold',
        'Need supplier quote',
        'Call supplier',
        JSON.stringify(baseDecisionSnapshot()),
        250,
        260,
        'add_next_action',
        'Added supplier quote follow-up.',
        270,
        280,
        200,
        300
      );

      const inserted = sqlite
        .prepare(`
          SELECT
            decision_status as status,
            decision_reason as reason,
            last_action_id as actionId
          FROM opportunity_research_entries
          WHERE product_id = ?
        `)
        .get('product-1') as {
          status: string;
          reason: string;
          actionId: string;
        };
      const beforeDelete = sqlite
        .prepare('SELECT COUNT(*) as count FROM opportunity_research_entries')
        .get() as { count: number };
      sqlite.prepare('DELETE FROM products WHERE id = ?').run('product-1');
      const afterDelete = sqlite
        .prepare('SELECT COUNT(*) as count FROM opportunity_research_entries')
        .get() as { count: number };

      expect(inserted).toEqual({
        status: 'hold',
        reason: 'Need supplier quote',
        actionId: 'add_next_action',
      });
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
    recommendationGate: {
      status: 'clear',
      applied: false,
      originalRecommendation: 'investigate',
      finalRecommendation: 'investigate',
      reasons: [],
      signals: [],
      nextActions: [],
    },
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

function baseDecisionSnapshot() {
  return {
    capturedAt: 240,
    score: 72,
    confidence: 0.65,
    recommendation: 'investigate',
    recommendationGate: {
      status: 'clear',
      applied: false,
      originalRecommendation: 'investigate',
      finalRecommendation: 'investigate',
      reasons: [],
      signals: [],
      nextActions: [],
    },
    keyReasons: ['Healthy current acquisition'],
    missingSignals: ['sales_volume'],
    businessSignals: {
      completeness: 'none',
      missingSignals: ['cost_basis'],
      metrics: null,
      caveat: 'Business metrics require merchant-entered assumptions.',
    },
    marketSignals: null,
  };
}
