import { Express, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { generateOpenApiSpec } from './registry';
import { logger } from '../utils/logger';

/**
 * Setup Swagger UI for API documentation
 */
export function setupSwaggerUI(app: Express) {
  const spec = generateOpenApiSpec();

  logger.debug(
    {
      openapi: spec.openapi,
      totalRoutes: Object.keys(spec.paths || {}).length,
      routes: Object.keys(spec.paths || {}),
    },
    'OpenAPI spec generated'
  );

  // Swagger UI configuration
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Price Monitor API Docs',
  };

  // Serve Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, swaggerUiOptions));

  // Expose OpenAPI JSON spec at /api-docs.json
  app.get('/api-docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(spec);
  });
}
