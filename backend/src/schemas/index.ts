import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI methods (must be done before any schemas are imported)
extendZodWithOpenApi(z);

// Re-export all schemas after extending Zod
export * from '@shared/schemas';
