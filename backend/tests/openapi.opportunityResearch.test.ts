import { describe, expect, it } from 'vitest';
import { generateOpenApiSpec } from '../src/openapi/registry';

describe('OpenAPI opportunity research workspace', () => {
  it('documents research CRUD, comparison, export, and caveat semantics', () => {
    const spec = generateOpenApiSpec();

    expect(spec.components?.schemas).toHaveProperty('OpportunityResearchEntry');
    expect(spec.components?.schemas).toHaveProperty('OpportunityResearchUpsert');
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchActionOutcomeRequest'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchDecisionRequest'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchDecisionReview'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchReviewSummary'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchDailyActionPlan'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchPracticeSummary'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchComparisonRequest'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchExportResponse'
    );

    const productsPath = spec.paths['/api/opportunities/products'];
    expect(productsPath?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'decisionStatus' }),
        expect.objectContaining({ name: 'decisionReview' }),
        expect.objectContaining({ name: 'actionOutcome' }),
        expect.objectContaining({ name: 'actionId' }),
      ])
    );
    expect(JSON.stringify(productsPath?.get)).toContain(
      'do not change score'
    );
    expect(JSON.stringify(productsPath?.get)).toContain('actionOutcome');
    expect(JSON.stringify(productsPath?.get)).toContain('actionId');

    const listPath = spec.paths['/api/opportunities/research'];
    expect(listPath?.get?.tags).toContain('Opportunity Research');
    expect(listPath?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'status' }),
        expect.objectContaining({ name: 'tag' }),
        expect.objectContaining({ name: 'decisionStatus' }),
        expect.objectContaining({ name: 'decisionReview' }),
        expect.objectContaining({ name: 'actionOutcome' }),
        expect.objectContaining({ name: 'actionId' }),
      ])
    );
    expect(JSON.stringify(listPath?.get)).toContain('needs_action');
    expect(JSON.stringify(listPath?.get)).toContain('decisionReview');
    expect(JSON.stringify(listPath?.get)).toContain('known daily action bucket');

    const summaryPath = spec.paths['/api/opportunities/research/summary'];
    expect(summaryPath?.get?.tags).toContain('Opportunity Research');
    expect(JSON.stringify(summaryPath?.get)).toContain('workflow queue');
    expect(JSON.stringify(summaryPath?.get)).toContain('totalActive');
    expect(JSON.stringify(summaryPath?.get)).toContain('needsNextAction');

    const practiceSummaryPath =
      spec.paths['/api/opportunities/research/practice-summary'];
    expect(practiceSummaryPath?.get?.tags).toContain('Opportunity Research');
    expect(JSON.stringify(practiceSummaryPath?.get)).toContain(
      'practice coverage'
    );
    expect(JSON.stringify(practiceSummaryPath?.get)).toContain('withOutcome');
    expect(JSON.stringify(practiceSummaryPath?.get)).toContain('byActionId');
    expect(JSON.stringify(practiceSummaryPath?.get)).toContain(
      'does not change score'
    );

    const actionPlanPath = spec.paths['/api/opportunities/research/action-plan'];
    expect(actionPlanPath?.get?.tags).toContain('Opportunity Research');
    expect(JSON.stringify(actionPlanPath?.get)).toContain('workflow actions');
    expect(JSON.stringify(actionPlanPath?.get)).toContain('add_next_action');
    expect(JSON.stringify(actionPlanPath?.get)).toContain('decisionReview');
    expect(JSON.stringify(actionPlanPath?.get)).toContain('learningGoal');
    expect(JSON.stringify(actionPlanPath?.get)).toContain('completionCriteria');
    expect(JSON.stringify(actionPlanPath?.get)).toContain(
      'does not change score'
    );

    const productResearchPath =
      spec.paths['/api/opportunities/products/{productId}/research'];
    expect(productResearchPath?.get).toBeDefined();
    expect(productResearchPath?.put?.requestBody).toBeDefined();
    expect(productResearchPath?.patch?.requestBody).toBeDefined();
    expect(productResearchPath?.delete).toBeDefined();

    const decisionPath =
      spec.paths['/api/opportunities/products/{productId}/research/decision'];
    expect(decisionPath?.put?.requestBody).toBeDefined();
    expect(decisionPath?.delete).toBeDefined();
    expect(JSON.stringify(decisionPath?.put)).toContain(
      'does not affect score calculations'
    );

    const outcomePath =
      spec.paths['/api/opportunities/products/{productId}/research/action-outcome'];
    expect(outcomePath?.put?.requestBody).toBeDefined();
    expect(outcomePath?.delete).toBeDefined();
    expect(JSON.stringify(outcomePath?.put)).toContain('workflow practice');
    expect(JSON.stringify(outcomePath?.put)).toContain('add_next_action');

    const archivePath =
      spec.paths['/api/opportunities/products/{productId}/research/archive'];
    expect(archivePath?.post).toBeDefined();

    const comparePath = spec.paths['/api/opportunities/research/compare'];
    expect(comparePath?.post?.requestBody).toBeDefined();
    expect(JSON.stringify(comparePath?.post)).toContain(
      'does not affect score calculations'
    );
    expect(JSON.stringify(comparePath?.post)).toContain(
      'not verified sales or demand'
    );

    const exportPath = spec.paths['/api/opportunities/research/export'];
    expect(exportPath?.post?.requestBody).toBeDefined();
    expect(JSON.stringify(exportPath?.post)).toContain('selectedCsv');
    expect(JSON.stringify(exportPath?.post)).toContain('filteredJson');
    expect(JSON.stringify(exportPath?.post)).toContain('scoreCaveat');
    expect(JSON.stringify(exportPath?.post)).toContain('decisionReview');
    expect(JSON.stringify(exportPath?.post)).toContain('actionOutcome');
    expect(JSON.stringify(exportPath?.post)).toContain('actionId');
    expect(JSON.stringify(exportPath?.post)).toContain('lastActionId');
    expect(JSON.stringify(exportPath?.post)).toContain('lastActionOutcome');
    expect(JSON.stringify(exportPath?.post)).toContain('needs_action');
    expect(JSON.stringify(exportPath?.post)).toContain('not verified sales');
    expect(JSON.stringify(exportPath?.post)).toContain('merchant-entered');
  });
});
