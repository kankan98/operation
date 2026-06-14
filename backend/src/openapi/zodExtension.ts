// This file must be imported FIRST to extend Zod with OpenAPI support globally
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend the global Zod instance with OpenAPI methods
extendZodWithOpenApi(z);

// This ensures all schemas imported after this will have .openapi() available
export {};
