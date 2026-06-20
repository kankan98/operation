import { describe, expect, it } from 'vitest';
import { generateOpenApiSpec } from '../src/openapi/registry';

describe('OpenAPI acquisition queue operations', () => {
  it('documents queue health, worker health, product diagnostics, and job controls', () => {
    const spec = generateOpenApiSpec();

    expect(spec.paths['/api/scraper/queue/health']?.get).toBeDefined();
    expect(spec.paths['/api/scraper/queue/workers']?.get).toBeDefined();
    expect(spec.paths['/api/scraper/queue/providers/status']?.get).toBeDefined();
    expect(
      spec.paths['/api/scraper/product/{productId}/job-diagnostics']?.get
    ).toBeDefined();
    expect(spec.paths['/api/scraper/jobs/{jobId}/retry']?.post).toBeDefined();
    expect(spec.paths['/api/scraper/jobs/{jobId}/cancel']?.post).toBeDefined();
  });

  it('includes operational caveats and safe examples', () => {
    const spec = generateOpenApiSpec();
    const queueExamples =
      spec.paths['/api/scraper/queue/health']?.get?.responses?.['200']
        ?.content?.['application/json']?.examples;
    const workerExample =
      spec.paths['/api/scraper/queue/workers']?.get?.responses?.['200']
        ?.content?.['application/json']?.example;
    const diagnosticsExample =
      spec.paths['/api/scraper/product/{productId}/job-diagnostics']?.get
        ?.responses?.['200']?.content?.['application/json']?.example;

    expect(queueExamples?.healthy.value.caveat).toMatch(
      /Queue health describes acquisition operations only/
    );
    expect(diagnosticsExample.caveat).toMatch(
      /not verified evidence of sales/
    );

    const serializedExamples = JSON.stringify({
      queueExamples,
      workerExample,
      diagnosticsExample,
    });
    expect(serializedExamples).not.toMatch(/redis:\/\/.+:.+@/i);
    expect(serializedExamples).not.toMatch(/api[_-]?key/i);
    expect(serializedExamples).not.toMatch(/authorization/i);
    expect(serializedExamples).not.toMatch(/cookie/i);
    expect(serializedExamples).not.toMatch(/<html/i);
    expect(serializedExamples).not.toMatch(/rawProviderPayload/i);
  });
});
