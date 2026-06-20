import { describe, expect, it } from 'vitest';
import { generateOpenApiSpec } from '../src/openapi/registry';

describe('OpenAPI business signals', () => {
  it('includes product business signal endpoints and opportunity extensions', () => {
    const spec = generateOpenApiSpec();

    const businessPath = spec.paths['/api/products/{id}/business-signals'];
    expect(businessPath?.get).toBeDefined();
    expect(businessPath?.put).toBeDefined();
    expect(businessPath?.get?.tags).toContain('Products');
    expect(businessPath?.put?.requestBody).toBeDefined();

    const opportunitiesPath = spec.paths['/api/opportunities/products'];
    expect(opportunitiesPath?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'businessReadiness' }),
        expect.objectContaining({ name: 'minRoi' }),
      ])
    );
  });
});
