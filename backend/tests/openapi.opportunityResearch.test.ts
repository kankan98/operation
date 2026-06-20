import { describe, expect, it } from 'vitest';
import { generateOpenApiSpec } from '../src/openapi/registry';

describe('OpenAPI opportunity research workspace', () => {
  it('documents research CRUD, comparison, export, and caveat semantics', () => {
    const spec = generateOpenApiSpec();

    expect(spec.components?.schemas).toHaveProperty('OpportunityResearchEntry');
    expect(spec.components?.schemas).toHaveProperty('OpportunityResearchUpsert');
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchComparisonRequest'
    );
    expect(spec.components?.schemas).toHaveProperty(
      'OpportunityResearchExportResponse'
    );

    const listPath = spec.paths['/api/opportunities/research'];
    expect(listPath?.get?.tags).toContain('Opportunity Research');
    expect(listPath?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'status' }),
        expect.objectContaining({ name: 'tag' }),
      ])
    );

    const productResearchPath =
      spec.paths['/api/opportunities/products/{productId}/research'];
    expect(productResearchPath?.get).toBeDefined();
    expect(productResearchPath?.put?.requestBody).toBeDefined();
    expect(productResearchPath?.patch?.requestBody).toBeDefined();
    expect(productResearchPath?.delete).toBeDefined();

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
    expect(JSON.stringify(exportPath?.post)).toContain('not verified sales');
    expect(JSON.stringify(exportPath?.post)).toContain('merchant-entered');
  });
});
