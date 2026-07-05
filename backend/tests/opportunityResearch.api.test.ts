import fs from 'fs';
import path from 'path';
import SQLite from 'better-sqlite3';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS } from '@shared/schemas';
import { createApp } from '../src/app';
import { db } from '../src/db';
import {
  alerts,
  marketSignalAttempts,
  marketSignalSnapshots,
  opportunityResearchEntries,
  priceSnapshots,
  productBusinessSignals,
  products,
  scrapeAttempts,
  scrapeJobs,
} from '../src/db/schema';
import { ProductService } from '../src/services/productService';
import { ScrapeAttemptService } from '../src/services/scrapeAttemptService';
import { applyOpportunityResearchTraceRuntimeMigration } from './migrationTestUtils';

describe('Opportunity Research API', () => {
  const app = createApp();
  const productService = new ProductService();
  const attemptService = new ScrapeAttemptService();

  beforeAll(() => {
    const sqlite = new SQLite('./data/ecommerce.db');
    for (const migrationName of [
      '002-product-data-acquisition.sql',
      '003-opportunity-business-signals.sql',
      '005-keepa-market-signals.sql',
      '006-opportunity-research-workspace.sql',
    ]) {
      sqlite.exec(
        fs.readFileSync(path.resolve('migrations', migrationName), 'utf-8')
      );
    }
    applyOpportunityResearchTraceRuntimeMigration(sqlite);
    sqlite.close();
  });

  beforeEach(async () => {
    await clearData();
  });

  it('creates and updates a product research entry idempotently', async () => {
    const product = await createScoredProduct('RESEARCH_IDEMPOTENT');

    const created = await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'researching',
        priority: 'high',
        tags: [' Amazon ', 'amazon', 'Launch'],
        notes: 'Check supplier MOQ.',
      })
      .expect(200);

    const updated = await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'ready',
        priority: 'medium',
        tags: [' Launch ', 'Margin'],
        notes: 'Ready for sourcing call.',
      })
      .expect(200);

    const list = await request(app)
      .get('/api/opportunities/research?tag=launch')
      .expect(200);

    expect(created.body.data.tags).toEqual(['amazon', 'launch']);
    expect(updated.body.data).toMatchObject({
      productId: product.id,
      status: 'ready',
      priority: 'medium',
      tags: ['launch', 'margin'],
      notesSummary: 'Ready for sourcing call.',
      archived: false,
    });
    expect(list.body.total).toBe(1);
  });

  it('patches status tags notes, archives, deletes, and handles missing products', async () => {
    const product = await createScoredProduct('RESEARCH_PATCH');

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({ status: 'watching' })
      .expect(200);

    const patched = await request(app)
      .patch(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'rejected',
        priority: 'low',
        tags: ['blocked'],
        notes: 'Margin is too thin.',
      })
      .expect(200);

    const archived = await request(app)
      .post(`/api/opportunities/products/${product.id}/research/archive`)
      .expect(200);

    await request(app)
      .delete(`/api/opportunities/products/${product.id}/research`)
      .expect(204);

    const deleted = await request(app)
      .get(`/api/opportunities/products/${product.id}/research`)
      .expect(200);

    await request(app)
      .put('/api/opportunities/products/missing-product/research')
      .send({ status: 'researching' })
      .expect(404);

    expect(patched.body.data).toMatchObject({
      status: 'rejected',
      priority: 'low',
      tags: ['blocked'],
    });
    expect(archived.body.data.archived).toBe(true);
    expect(deleted.body.data).toBeNull();
  });

  it('extends opportunity list and explanation responses with research filters', async () => {
    const shortlisted = await createScoredProduct('RESEARCH_SHORTLISTED');
    const unlisted = await createScoredProduct('RESEARCH_UNLISTED');

    await request(app)
      .put(`/api/opportunities/products/${shortlisted.id}/research`)
      .send({
        status: 'watching',
        priority: 'high',
        tags: ['launch'],
      })
      .expect(200);

    const list = await request(app)
      .get('/api/opportunities/products?shortlisted=true&researchStatus=watching&researchTag=launch')
      .expect(200);
    const explanation = await request(app)
      .get(`/api/opportunities/products/${shortlisted.id}`)
      .expect(200);
    const inverse = await request(app)
      .get('/api/opportunities/products?shortlisted=false')
      .expect(200);

    expect(list.body.total).toBe(1);
    expect(list.body.data[0].product.id).toBe(shortlisted.id);
    expect(list.body.data[0].research).toMatchObject({
      status: 'watching',
      priority: 'high',
      tags: ['launch'],
    });
    expect(explanation.body.data.research.status).toBe('watching');
    expect(inverse.body.data.map((item: any) => item.product.id)).toContain(
      unlisted.id
    );
  });

  it('compares selected opportunities and enforces comparison limits', async () => {
    const first = await createScoredProduct('RESEARCH_COMPARE_1');
    const second = await createScoredProduct('RESEARCH_COMPARE_2');

    await request(app)
      .put(`/api/opportunities/products/${first.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['compare'],
      })
      .expect(200);

    const comparison = await request(app)
      .post('/api/opportunities/research/compare')
      .send({ productIds: [first.id, second.id] })
      .expect(200);
    const overLimit = await request(app)
      .post('/api/opportunities/research/compare')
      .send({
        productIds: [
          'product-1',
          'product-2',
          'product-3',
          'product-4',
          'product-5',
          'product-6',
          'product-7',
        ],
      })
      .expect(400);

    expect(comparison.body.selectedProductIds).toEqual([first.id, second.id]);
    expect(comparison.body.data).toHaveLength(2);
    expect(comparison.body.data[0].research.status).toBe('ready');
    expect(comparison.body.caveats.score).toContain('do not change');
    expect(overLimit.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exports selected opportunities with deterministic caveat fields', async () => {
    const product = await createScoredProduct('RESEARCH_EXPORT');

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['export'],
      })
      .expect(200);

    const response = await request(app)
      .post('/api/opportunities/research/export')
      .send({
        format: 'csv',
        productIds: [product.id],
      })
      .expect(200);

    expect(response.body.rows).toHaveLength(1);
    expect(response.body.rows[0]).toMatchObject({
      productId: product.id,
      researchStatus: 'ready',
      researchPriority: 'high',
      researchTags: ['export'],
    });
    expect(response.body.rows[0].marketSignalCaveat).toContain('not verified');
    expect(response.body.rows[0].businessSignalCaveat).toContain('assumption');
    expect(response.body.rows[0].scoreCaveat).toContain('do not change');
    expect(response.body.csv).toContain('productId,title,platform');
  });

  it('records updates clears and exports opportunity decisions without changing score', async () => {
    const product = await createScoredProduct('RESEARCH_DECISION');
    const before = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    const saved = await request(app)
      .put(`/api/opportunities/products/${product.id}/research/decision`)
      .send({
        status: 'go',
        reason: 'Manual reading and score are strong enough for supplier call.',
        nextAction: 'Call supplier and verify MOQ.',
      })
      .expect(200);

    expect(saved.body.data).toMatchObject({
      productId: product.id,
      status: 'researching',
      priority: 'medium',
      decision: {
        status: 'go',
        reason: 'Manual reading and score are strong enough for supplier call.',
        nextAction: 'Call supplier and verify MOQ.',
      },
    });
    expect(saved.body.data.decision.snapshot).toMatchObject({
      score: before.body.data.score,
      confidence: before.body.data.confidence,
      recommendation: before.body.data.recommendation,
    });
    expect(saved.body.data.decision.snapshot.recommendationGate).toMatchObject(
      before.body.data.recommendationGate
    );

    const updated = await request(app)
      .put(`/api/opportunities/products/${product.id}/research/decision`)
      .send({
        status: 'hold',
        reason: 'Hold until landed cost is verified.',
        nextAction: 'Add cost assumptions.',
      })
      .expect(200);
    const explanation = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);
    const comparison = await request(app)
      .post('/api/opportunities/research/compare')
      .send({ productIds: [product.id] })
      .expect(200);
    const exported = await request(app)
      .post('/api/opportunities/research/export')
      .send({ format: 'csv', productIds: [product.id] })
      .expect(200);

    expect(updated.body.data.decision.status).toBe('hold');
    expect(explanation.body.data.research.decision.status).toBe('hold');
    expect(comparison.body.data[0].research.decision.reason).toContain(
      'landed cost'
    );
    expect(exported.body.rows[0]).toMatchObject({
      decisionStatus: 'hold',
      decisionReason: 'Hold until landed cost is verified.',
      decisionNextAction: 'Add cost assumptions.',
      decisionSnapshotScore: before.body.data.score,
      decisionSnapshotRecommendation: before.body.data.recommendation,
    });
    expect(exported.body.csv).toContain('decisionStatus');

    const cleared = await request(app)
      .delete(`/api/opportunities/products/${product.id}/research/decision`)
      .expect(200);
    const after = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    expect(cleared.body.data.decision).toBeNull();
    expect(after.body.data.score).toBe(before.body.data.score);
    expect(after.body.data.confidence).toBe(before.body.data.confidence);
    expect(after.body.data.factors).toEqual(before.body.data.factors);
    expect(after.body.data.recommendationGate).toEqual(
      before.body.data.recommendationGate
    );
  });

  it('filters research entries by decision status and review state', async () => {
    const needsAction = await createScoredProduct('RESEARCH_REVIEW_NEEDS');
    const stale = await createScoredProduct('RESEARCH_REVIEW_STALE');
    const undecided = await createScoredProduct('RESEARCH_REVIEW_OPEN');

    await request(app)
      .put(`/api/opportunities/products/${needsAction.id}/research/decision`)
      .send({
        status: 'go',
        reason: 'Strong enough to advance, but no follow-up was set.',
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${stale.id}/research/decision`)
      .send({
        status: 'hold',
        reason: 'Review after supplier quote.',
        nextAction: 'Ask supplier for updated MOQ.',
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${undecided.id}/research`)
      .send({
        status: 'watching',
        priority: 'medium',
        tags: ['review'],
      })
      .expect(200);

    await ageDecision(stale.id, OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS);

    const byStatus = await request(app)
      .get('/api/opportunities/research?decisionStatus=go')
      .expect(200);
    const needingAction = await request(app)
      .get('/api/opportunities/research?decisionReview=needs_action')
      .expect(200);
    const staleList = await request(app)
      .get('/api/opportunities/research?decisionReview=stale')
      .expect(200);
    const undecidedList = await request(app)
      .get('/api/opportunities/research?decisionReview=undecided')
      .expect(200);

    expect(byStatus.body.data.map((item: any) => item.productId)).toEqual([
      needsAction.id,
    ]);
    expect(needingAction.body.data[0]).toMatchObject({
      productId: needsAction.id,
      decisionReview: {
        hasDecision: true,
        status: 'go',
        hasNextAction: false,
        needsNextAction: true,
      },
    });
    expect(staleList.body.data[0]).toMatchObject({
      productId: stale.id,
      decisionReview: {
        hasDecision: true,
        status: 'hold',
        stale: true,
      },
    });
    expect(undecidedList.body.data.map((item: any) => item.productId)).toEqual([
      undecided.id,
    ]);
  });

  it('returns active opportunity review summary counts and excludes archived entries', async () => {
    const needsAction = await createScoredProduct('RESEARCH_SUMMARY_NEEDS');
    const stale = await createScoredProduct('RESEARCH_SUMMARY_STALE');
    const undecided = await createScoredProduct('RESEARCH_SUMMARY_OPEN');
    const archived = await createScoredProduct('RESEARCH_SUMMARY_ARCHIVED');

    await request(app)
      .put(`/api/opportunities/products/${needsAction.id}/research/decision`)
      .send({
        status: 'go',
        reason: 'Advance this candidate, but next action is missing.',
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${stale.id}/research/decision`)
      .send({
        status: 'hold',
        reason: 'Wait for supplier evidence.',
        nextAction: 'Refresh supplier quote.',
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${undecided.id}/research`)
      .send({
        status: 'watching',
        priority: 'low',
        tags: ['summary'],
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${archived.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['summary'],
      })
      .expect(200);
    await request(app)
      .post(`/api/opportunities/products/${archived.id}/research/archive`)
      .expect(200);
    await ageDecision(stale.id, OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS);

    const response = await request(app)
      .get('/api/opportunities/research/summary')
      .expect(200);

    expect(response.body.data).toMatchObject({
      totalActive: 3,
      decided: 2,
      undecided: 1,
      needsNextAction: 1,
      stale: 1,
      byStatus: {
        researching: 2,
        watching: 1,
        ready: 0,
        rejected: 0,
      },
      byPriority: {
        low: 1,
        medium: 2,
        high: 0,
      },
    });
    expect(response.body.data.caveat).toContain('workflow queue metadata');
  });

  it('returns ordered daily action plan items and keeps score deterministic', async () => {
    const needsAction = await createScoredProduct('RESEARCH_ACTION_NEEDS');
    const stale = await createScoredProduct('RESEARCH_ACTION_STALE');
    const undecided = await createScoredProduct('RESEARCH_ACTION_OPEN');
    const archived = await createScoredProduct('RESEARCH_ACTION_ARCHIVED');
    const before = await request(app)
      .get(`/api/opportunities/products/${needsAction.id}`)
      .expect(200);

    await request(app)
      .put(`/api/opportunities/products/${needsAction.id}/research/decision`)
      .send({
        status: 'go',
        reason: 'Advance this candidate, but next action is missing.',
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${stale.id}/research/decision`)
      .send({
        status: 'hold',
        reason: 'Wait for supplier evidence.',
        nextAction: 'Refresh supplier quote.',
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${undecided.id}/research`)
      .send({
        status: 'watching',
        priority: 'low',
        tags: ['action'],
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${archived.id}/research`)
      .send({
        status: 'researching',
        priority: 'high',
        tags: ['action'],
      })
      .expect(200);
    await request(app)
      .post(`/api/opportunities/products/${archived.id}/research/archive`)
      .expect(200);
    await ageDecision(stale.id, OPPORTUNITY_RESEARCH_DECISION_REVIEW_STALE_DAYS);

    const response = await request(app)
      .get('/api/opportunities/research/action-plan')
      .expect(200);
    const after = await request(app)
      .get(`/api/opportunities/products/${needsAction.id}`)
      .expect(200);

    expect(response.body.data.items.map((item: any) => item.id)).toEqual([
      'add_next_action',
      'review_stale_decisions',
      'decide_candidates',
      'continue_research',
    ]);
    expect(response.body.data.items).toEqual([
      expect.objectContaining({
        id: 'add_next_action',
        priority: 1,
        count: 1,
        learningGoal: '练习把判断转成可执行跟进。',
        steps: expect.arrayContaining([
          '为每个 go/hold 决策写下一条可执行动作。',
        ]),
        completionCriteria: expect.arrayContaining([
          '每个 go/hold 决策都有下一步行动。',
        ]),
        filters: expect.objectContaining({
          workspaceMode: 'review',
          shortlisted: true,
          decisionReview: 'needs_action',
        }),
      }),
      expect.objectContaining({
        id: 'review_stale_decisions',
        priority: 2,
        count: 1,
        learningGoal: expect.stringContaining('刷新旧判断'),
        filters: expect.objectContaining({
          workspaceMode: 'review',
          decisionReview: 'stale',
        }),
      }),
      expect.objectContaining({
        id: 'decide_candidates',
        priority: 3,
        count: 1,
        completionCriteria: expect.arrayContaining([
          '候选已记录当前决策。',
        ]),
        filters: expect.objectContaining({
          workspaceMode: 'review',
          decisionReview: 'undecided',
        }),
      }),
      expect.objectContaining({
        id: 'continue_research',
        priority: 4,
        count: 2,
        steps: expect.arrayContaining(['补充手动读数、成本假设或研究备注。']),
        filters: expect.objectContaining({
          workspaceMode: 'discover',
          researchStatus: 'researching',
        }),
      }),
    ]);
    expect(response.body.data.caveat).toContain('workflow practice metadata');
    expect(response.body.data.caveat).toContain('do not change opportunity score');
    expect(after.body.data.score).toBe(before.body.data.score);
    expect(after.body.data.confidence).toBe(before.body.data.confidence);
    expect(after.body.data.factors).toEqual(before.body.data.factors);
    expect(after.body.data.recommendationGate).toEqual(
      before.body.data.recommendationGate
    );
  });

  it('records clears lists compares and exports latest action outcomes without changing score', async () => {
    const product = await createScoredProduct('RESEARCH_ACTION_OUTCOME');
    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'researching',
        priority: 'high',
        tags: ['outcome'],
      })
      .expect(200);
    const before = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    const saved = await request(app)
      .put(`/api/opportunities/products/${product.id}/research/action-outcome`)
      .send({
        actionId: 'add_next_action',
        outcome: 'Added supplier quote follow-up and MOQ check.',
        completedAt: 1760087400000,
      })
      .expect(200);
    const listed = await request(app)
      .get('/api/opportunities/research?tag=outcome')
      .expect(200);
    const comparison = await request(app)
      .post('/api/opportunities/research/compare')
      .send({ productIds: [product.id] })
      .expect(200);
    const exported = await request(app)
      .post('/api/opportunities/research/export')
      .send({ format: 'csv', productIds: [product.id] })
      .expect(200);
    const afterSave = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    expect(saved.body.data.lastActionOutcome).toMatchObject({
      actionId: 'add_next_action',
      outcome: 'Added supplier quote follow-up and MOQ check.',
      completedAt: 1760087400000,
    });
    expect(saved.body.data.lastActionOutcome.updatedAt).toEqual(
      expect.any(Number)
    );
    expect(listed.body.data[0].lastActionOutcome.actionId).toBe(
      'add_next_action'
    );
    expect(comparison.body.data[0].research.lastActionOutcome.outcome).toContain(
      'supplier quote'
    );
    expect(exported.body.rows[0]).toMatchObject({
      lastActionId: 'add_next_action',
      lastActionOutcome: 'Added supplier quote follow-up and MOQ check.',
      lastActionCompletedAt: 1760087400000,
    });
    expect(exported.body.csv).toContain('lastActionId');
    expect(afterSave.body.data.score).toBe(before.body.data.score);
    expect(afterSave.body.data.confidence).toBe(before.body.data.confidence);
    expect(afterSave.body.data.factors).toEqual(before.body.data.factors);
    expect(afterSave.body.data.recommendationGate).toEqual(
      before.body.data.recommendationGate
    );

    const cleared = await request(app)
      .delete(`/api/opportunities/products/${product.id}/research/action-outcome`)
      .expect(200);
    expect(cleared.body.data.lastActionOutcome).toBeNull();
  });

  it('returns practice summary coverage and excludes archived entries without changing score', async () => {
    const addNext = await createScoredProduct('RESEARCH_PRACTICE_NEXT');
    const decide = await createScoredProduct('RESEARCH_PRACTICE_DECIDE');
    const missing = await createScoredProduct('RESEARCH_PRACTICE_MISSING');
    const archived = await createScoredProduct('RESEARCH_PRACTICE_ARCHIVED');
    const before = await request(app)
      .get(`/api/opportunities/products/${addNext.id}`)
      .expect(200);

    for (const product of [addNext, decide, missing, archived]) {
      await request(app)
        .put(`/api/opportunities/products/${product.id}/research`)
        .send({
          status: 'researching',
          priority: 'medium',
          tags: ['practice'],
        })
        .expect(200);
    }
    await request(app)
      .put(`/api/opportunities/products/${addNext.id}/research/action-outcome`)
      .send({
        actionId: 'add_next_action',
        outcome: 'Added concrete supplier follow-up.',
        completedAt: 1760087400000,
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${decide.id}/research/action-outcome`)
      .send({
        actionId: 'decide_candidates',
        outcome: 'Recorded a hold decision after checking missing signals.',
        completedAt: 1760087600000,
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${archived.id}/research/action-outcome`)
      .send({
        actionId: 'continue_research',
        outcome: 'Added research note before archiving.',
        completedAt: 1760087800000,
      })
      .expect(200);
    await request(app)
      .post(`/api/opportunities/products/${archived.id}/research/archive`)
      .expect(200);

    const summary = await request(app)
      .get('/api/opportunities/research/practice-summary')
      .expect(200);
    const after = await request(app)
      .get(`/api/opportunities/products/${addNext.id}`)
      .expect(200);

    expect(summary.body.data).toMatchObject({
      totalActive: 3,
      withOutcome: 2,
      withoutOutcome: 1,
      byActionId: {
        add_next_action: 1,
        review_stale_decisions: 0,
        decide_candidates: 1,
        continue_research: 0,
      },
      latestCompletedAt: 1760087600000,
    });
    expect(summary.body.data.caveat).toContain('workflow practice coverage');
    expect(after.body.data.score).toBe(before.body.data.score);
    expect(after.body.data.confidence).toBe(before.body.data.confidence);
    expect(after.body.data.factors).toEqual(before.body.data.factors);
    expect(after.body.data.recommendationGate).toEqual(
      before.body.data.recommendationGate
    );
  });

  it('filters opportunity and research lists by practice outcome metadata', async () => {
    const addNext = await createScoredProduct('RESEARCH_FILTER_NEXT');
    const decide = await createScoredProduct('RESEARCH_FILTER_DECIDE');
    const missing = await createScoredProduct('RESEARCH_FILTER_MISSING');
    const archived = await createScoredProduct('RESEARCH_FILTER_ARCHIVED');

    for (const product of [addNext, decide, missing, archived]) {
      await request(app)
        .put(`/api/opportunities/products/${product.id}/research`)
        .send({
          status: 'researching',
          priority: 'medium',
          tags: ['practice-filter'],
        })
        .expect(200);
    }

    const before = await request(app)
      .get(`/api/opportunities/products/${addNext.id}`)
      .expect(200);

    await request(app)
      .put(`/api/opportunities/products/${addNext.id}/research/action-outcome`)
      .send({
        actionId: 'add_next_action',
        outcome: 'Added the next sourcing step.',
        completedAt: 1760088000000,
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${decide.id}/research/action-outcome`)
      .send({
        actionId: 'decide_candidates',
        outcome: 'Recorded the candidate decision.',
        completedAt: 1760088100000,
      })
      .expect(200);
    await request(app)
      .put(`/api/opportunities/products/${archived.id}/research/action-outcome`)
      .send({
        actionId: 'continue_research',
        outcome: 'Recorded before archiving.',
        completedAt: 1760088200000,
      })
      .expect(200);
    await request(app)
      .post(`/api/opportunities/products/${archived.id}/research/archive`)
      .expect(200);

    const researchWith = await request(app)
      .get('/api/opportunities/research?actionOutcome=with')
      .expect(200);
    const researchWithout = await request(app)
      .get('/api/opportunities/research?actionOutcome=without')
      .expect(200);
    const researchByAction = await request(app)
      .get('/api/opportunities/research?actionId=decide_candidates')
      .expect(200);
    const contradictory = await request(app)
      .get('/api/opportunities/research?actionOutcome=without&actionId=add_next_action')
      .expect(200);
    const opportunitiesWith = await request(app)
      .get('/api/opportunities/products?actionOutcome=with')
      .expect(200);
    const opportunitiesByAction = await request(app)
      .get('/api/opportunities/products?actionId=add_next_action')
      .expect(200);
    const exportWith = await request(app)
      .post('/api/opportunities/research/export')
      .send({
        format: 'json',
        filters: { actionOutcome: 'with' },
      })
      .expect(200);
    const exportWithout = await request(app)
      .post('/api/opportunities/research/export')
      .send({
        format: 'json',
        filters: { actionOutcome: 'without' },
      })
      .expect(200);
    const exportByAction = await request(app)
      .post('/api/opportunities/research/export')
      .send({
        format: 'json',
        filters: { actionId: 'add_next_action' },
      })
      .expect(200);
    const after = await request(app)
      .get(`/api/opportunities/products/${addNext.id}`)
      .expect(200);

    expect(
      researchWith.body.data
        .map((entry: { productId: string }) => entry.productId)
        .sort()
    ).toEqual([addNext.id, decide.id].sort());
    expect(
      researchWithout.body.data.map(
        (entry: { productId: string }) => entry.productId
      )
    ).toEqual([missing.id]);
    expect(
      researchByAction.body.data.map(
        (entry: { productId: string }) => entry.productId
      )
    ).toEqual([decide.id]);
    expect(contradictory.body.total).toBe(0);
    expect(
      opportunitiesWith.body.data
        .map((item: { product: { id: string } }) => item.product.id)
        .sort()
    ).toEqual([addNext.id, decide.id].sort());
    expect(
      opportunitiesByAction.body.data.map(
        (item: { product: { id: string } }) => item.product.id
      )
    ).toEqual([addNext.id]);
    expect(
      exportWith.body.rows
        .map((row: { productId: string }) => row.productId)
        .sort()
    ).toEqual([addNext.id, decide.id].sort());
    expect(
      exportWithout.body.rows.map((row: { productId: string }) => row.productId)
    ).toEqual([missing.id]);
    expect(
      exportByAction.body.rows.map((row: { productId: string }) => row.productId)
    ).toEqual([addNext.id]);
    expect(exportWith.body.caveat).toContain(
      'action outcomes do not change opportunity score'
    );
    expect(after.body.data.score).toBe(before.body.data.score);
    expect(after.body.data.confidence).toBe(before.body.data.confidence);
    expect(after.body.data.factors).toEqual(before.body.data.factors);

    await request(app)
      .get('/api/opportunities/research?actionOutcome=done')
      .expect(400);
    await request(app)
      .get('/api/opportunities/products?actionId=unknown_action')
      .expect(400);
  });

  it('validates opportunity decision writes and missing products', async () => {
    const product = await createScoredProduct('RESEARCH_DECISION_VALIDATE');

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research/decision`)
      .send({
        status: 'maybe',
        reason: 'Invalid decision.',
      })
      .expect(400);

    await request(app)
      .put('/api/opportunities/products/missing-product/research/decision')
      .send({
        status: 'no_go',
        reason: 'Product does not exist.',
      })
      .expect(404);

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research/action-outcome`)
      .send({
        actionId: 'unsupported_action',
        outcome: 'Invalid action id.',
      })
      .expect(400);

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research/action-outcome`)
      .send({
        actionId: 'continue_research',
        outcome: 'x'.repeat(601),
      })
      .expect(400);

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research/action-outcome`)
      .send({
        actionId: 'continue_research',
        outcome: 'Future action evidence is invalid.',
        completedAt: Date.now() + 24 * 60 * 60 * 1000,
      })
      .expect(400);

    await request(app)
      .put('/api/opportunities/products/missing-product/research/action-outcome')
      .send({
        actionId: 'continue_research',
        outcome: 'Product does not exist.',
      })
      .expect(404);
  });

  it('keeps opportunity score deterministic when research metadata changes', async () => {
    const product = await createScoredProduct('RESEARCH_SCORE');
    const before = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    await request(app)
      .put(`/api/opportunities/products/${product.id}/research`)
      .send({
        status: 'ready',
        priority: 'high',
        tags: ['score'],
        notes: 'User workflow note.',
      })
      .expect(200);
    const after = await request(app)
      .get(`/api/opportunities/products/${product.id}`)
      .expect(200);

    expect(after.body.data.score).toBe(before.body.data.score);
    expect(after.body.data.factors).toEqual(before.body.data.factors);
    expect(after.body.data.research.status).toBe('ready');
  });

  async function createScoredProduct(suffix: string) {
    const product = await productService.createProduct({
      platform: 'amazon',
      productUrl: `https://example.com/${suffix}-${Date.now()}`,
      asin: suffix,
      title: `${suffix} Product`,
      currency: 'USD',
      isMonitoring: true,
      checkInterval: 24,
    });

    await addSnapshots(product.id, [100, 90, 80]);
    await attemptService.recordAttempt({
      productId: product.id,
      provider: 'rainforest',
      source: 'third_party',
      status: 'success',
      durationMs: 1000,
      confidence: 0.9,
    });

    return product;
  }

  async function addSnapshots(productId: string, prices: number[]) {
    for (const [index, price] of prices.entries()) {
      await db.insert(priceSnapshots).values({
        id: `${productId}-research-snapshot-${index}`,
        productId,
        price,
        currency: 'USD',
        availability: 'in_stock',
        rating: 4.5,
        reviewCount: 200,
        timestamp: Date.now() - (prices.length - index) * 60 * 60 * 1000,
      });
    }
  }

  async function ageDecision(productId: string, daysOld: number) {
    const timestamp = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    await db
      .update(opportunityResearchEntries)
      .set({
        decidedAt: timestamp,
        decisionUpdatedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(opportunityResearchEntries.productId, productId));
  }
});

async function clearData() {
  await db.delete(opportunityResearchEntries);
  await db.delete(productBusinessSignals);
  await db.delete(marketSignalAttempts);
  await db.delete(marketSignalSnapshots);
  await db.delete(scrapeAttempts);
  await db.delete(scrapeJobs);
  await db.delete(priceSnapshots);
  await db.delete(alerts);
  await db.delete(products);
}
