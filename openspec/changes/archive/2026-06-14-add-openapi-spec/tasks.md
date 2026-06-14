## 1. Phase 1: Infrastructure Setup

- [x] 1.1 Create `shared/` directory at project root
- [x] 1.2 Create `shared/package.json` with name "@shared/schemas" and Zod as peer dependency
- [x] 1.3 Create `shared/tsconfig.json` with appropriate compiler options
- [x] 1.4 Create `shared/schemas/` directory structure
- [x] 1.5 Add TypeScript path mapping for `@shared/*` in `backend/tsconfig.json`
- [x] 1.6 Add TypeScript path mapping for `@shared/*` in `frontend/tsconfig.json`
- [x] 1.7 Install backend dependencies: `zod`, `@asteasolutions/zod-to-openapi`, `swagger-ui-express`, `@types/swagger-ui-express`

## 2. Phase 2: Shared Schemas - Product (Pilot)

- [x] 2.1 Create `shared/schemas/product.schema.ts` with platform enum, createProductSchema, productResponseSchema, and updateProductSchema
- [x] 2.2 Export types using `z.infer<typeof ...>` in product.schema.ts
- [x] 2.3 Create `shared/schemas/index.ts` to re-export all schemas

## 3. Phase 3: Backend Validation Middleware

- [x] 3.1 Create `backend/src/middleware/zodValidator.ts` with `validateRequest` function
- [x] 3.2 Add `validateQuery` function to zodValidator.ts for query parameter validation
- [x] 3.3 Ensure validation errors are converted to AppError format with code "VALIDATION_ERROR"

## 4. Phase 4: OpenAPI Generation Setup

- [x] 4.1 Create `backend/src/openapi/registry.ts` with OpenAPIRegistry initialization
- [x] 4.2 Register Product schemas in registry (Product, CreateProduct, UpdateProduct)
- [x] 4.3 Register POST /api/products path with request/response schemas
- [x] 4.4 Register GET /api/products path with query parameters and response schema
- [x] 4.5 Register GET /api/products/:id path with path parameter and response schema
- [x] 4.6 Register PATCH /api/products/:id path with request/response schemas
- [x] 4.7 Register DELETE /api/products/:id path
- [x] 4.8 Create `generateOpenApiSpec()` function that generates OpenAPI 3.0 document with title, version, description, and server configuration

## 5. Phase 5: Swagger UI Integration

- [x] 5.1 Create `backend/src/openapi/swagger.ts` with `setupSwaggerUI` function
- [x] 5.2 Configure Swagger UI to serve at `/api-docs` route
- [x] 5.3 Expose OpenAPI JSON spec at `/api-docs.json` route
- [x] 5.4 Customize Swagger UI with custom page title "Price Monitor API Docs"
- [x] 5.5 Hide default Swagger topbar with custom CSS
- [x] 5.6 Integrate `setupSwaggerUI` in `backend/src/app.ts`

## 6. Phase 6: Migrate Products Route

- [x] 6.1 Import `validateRequest` middleware in `backend/src/routes/products.ts`
- [x] 6.2 Import shared schemas from `@shared/schemas/product.schema`
- [x] 6.3 Replace manual validation in POST /api/products with `validateRequest(createProductSchema)`
- [x] 6.4 Remove manual sanitization logic from POST handler (Zod handles it)
- [x] 6.5 Replace manual validation in PATCH /api/products/:id with `validateRequest(updateProductSchema)`
- [x] 6.6 Remove manual sanitization logic from PATCH handler
- [x] 6.7 Update route handlers to use typed req.body from Zod

## 7. Phase 7: Verify Product API

- [x] 7.1 Start backend server and verify it compiles without errors
- [x] 7.2 Access `http://localhost:3000/api-docs` and verify Swagger UI loads
- [x] 7.3 Verify Product endpoints appear in Swagger UI with correct schemas
- [x] 7.4 Test POST /api/products with valid data via Swagger UI "Try it out"
- [x] 7.5 Test POST /api/products with invalid data and verify Zod validation error format
- [x] 7.6 Test PATCH /api/products/:id with valid and invalid data
- [x] 7.7 Verify GET /api/products and GET /api/products/:id in Swagger UI

## 8. Phase 8: Shared Schemas - Remaining Entities

- [x] 8.1 Create `shared/schemas/alert.schema.ts` with createAlertSchema and alertResponseSchema
- [x] 8.2 Create `shared/schemas/alertRule.schema.ts` with createAlertRuleSchema, alertRuleResponseSchema, and updateAlertRuleSchema
- [x] 8.3 Create `shared/schemas/priceSnapshot.schema.ts` with priceSnapshotResponseSchema
- [x] 8.4 Create `shared/schemas/analysis.schema.ts` with priceStatsResponseSchema
- [x] 8.5 Create `shared/schemas/scraper.schema.ts` with scrapeResultSchema
- [x] 8.6 Update `shared/schemas/index.ts` to export all new schemas

## 9. Phase 9: Register Remaining Schemas in OpenAPI

- [x] 9.1 Register Alert schemas in `backend/src/openapi/registry.ts`
- [x] 9.2 Register AlertRule schemas in registry
- [x] 9.3 Register PriceSnapshot schemas in registry
- [x] 9.4 Register Analysis schemas in registry
- [x] 9.5 Register Scraper schemas in registry
- [x] 9.6 Register all Alert routes paths (/api/alerts, /api/alerts/:id, /api/alerts/:id/read, /api/alerts/:id/archive)
- [x] 9.7 Register all AlertRule routes paths (/api/alert-rules, /api/alert-rules/:id)
- [x] 9.8 Register all PriceSnapshot routes paths (/api/price-snapshots)
- [x] 9.9 Register all Scraper routes paths (/api/scraper/product/:productId, /api/scraper/all)
- [x] 9.10 Register all Analysis routes paths (/api/analysis/price-stats/:productId)

## 10. Phase 10: Migrate Alerts Route

- [x] 10.1 Import validation middleware and shared schemas in `backend/src/routes/alerts.ts`
- [x] 10.2 Replace manual validation in POST /api/alerts with `validateRequest(createAlertSchema)`
- [x] 10.3 Remove manual sanitization logic from POST handler
- [x] 10.4 Update PATCH /api/alerts/:id/read to use typed params
- [x] 10.5 Update PATCH /api/alerts/:id/archive to use typed params

## 11. Phase 11: Migrate AlertRules Route

- [x] 11.1 Import validation middleware and shared schemas in `backend/src/routes/alertRules.ts`
- [x] 11.2 Add `validateRequest(createAlertRuleSchema)` to POST /api/alert-rules
- [x] 11.3 Add `validateRequest(updateAlertRuleSchema)` to PATCH /api/alert-rules/:id
- [x] 11.4 Update route handlers to use typed req.body

## 12. Phase 12: Migrate PriceSnapshots Route

- [x] 12.1 Import shared schemas in `backend/src/routes/priceSnapshots.ts`
- [x] 12.2 Add query parameter validation for GET /api/price-snapshots
- [x] 12.3 Update route handlers to use typed req.query

## 13. Phase 13: Migrate Scraper Route

- [x] 13.1 Import shared schemas in `backend/src/routes/scraper.ts`
- [x] 13.2 Define response type for POST /api/scraper/product/:productId
- [x] 13.3 Define response type for POST /api/scraper/all

## 14. Phase 14: Migrate Analysis Route

- [x] 14.1 Import shared schemas in `backend/src/routes/analysis.ts`
- [x] 14.2 Update GET /api/analysis/price-stats/:productId to return typed response

## 15. Phase 15: Backend Verification

- [x] 15.1 Run backend tests: `npm test` in backend directory
- [x] 15.2 Verify all routes appear correctly in Swagger UI at `/api-docs`
- [x] 15.3 Test each endpoint group via Swagger UI "Try it out" feature
- [x] 15.4 Verify validation errors return proper format for all POST/PATCH endpoints
- [x] 15.5 Verify OpenAPI JSON is available at `/api-docs.json`

## 16. Phase 16: Frontend Type Migration

- [x] 16.1 Update `frontend/src/types/index.ts` to re-export types from `@shared/schemas` instead of defining interfaces
- [x] 16.2 Remove old Product interface from types/index.ts
- [x] 16.3 Remove old Alert interface from types/index.ts
- [x] 16.4 Remove old AlertRule interface from types/index.ts
- [x] 16.5 Remove old PriceSnapshot interface from types/index.ts
- [x] 16.6 Remove old PriceStats interface from types/index.ts
- [x] 16.7 Keep DashboardStats and other frontend-only types

## 17. Phase 17: Frontend API Client Update

- [x] 17.1 Update `frontend/src/services/api.ts` imports to use types from `@shared/schemas`
- [x] 17.2 Update productsApi.create parameter type to CreateProduct
- [x] 17.3 Update productsApi.update parameter type to UpdateProduct
- [x] 17.4 Update alertsApi.create parameter type to CreateAlert
- [x] 17.5 Update alertRulesApi.create parameter type to CreateAlertRule
- [x] 17.6 Update alertRulesApi.update parameter type to UpdateAlertRule
- [x] 17.7 Ensure all API function return types match response schemas

## 18. Phase 18: Frontend Form Validation

- [x] 18.1 Import `createProductSchema` from `@shared/schemas` in `frontend/src/components/products/ProductForm.tsx`
- [x] 18.2 Replace form validation with `zodResolver(createProductSchema)`
- [x] 18.3 Verify form validation errors display correctly in UI
- [x] 18.4 Test that client-side validation matches backend validation rules

## 19. Phase 19: Frontend Verification

- [x] 19.1 Run frontend build: `npm run build` in frontend directory
- [x] 19.2 Verify TypeScript compilation succeeds without type errors
- [x] 19.3 Run frontend tests: `npm test` in frontend directory
- [x] 19.4 Start frontend dev server and verify app loads without errors
- [x] 19.5 Test ProductForm submission with valid and invalid data
- [x] 19.6 Verify frontend validation errors match backend error format

## 20. Phase 20: Cleanup and Documentation

- [x] 20.1 Review `backend/src/utils/validation.ts` and remove functions replaced by Zod (validateProductUrl, validatePlatform, sanitizeString if fully replaced)
- [x] 20.2 Update backend README.md with OpenAPI/Swagger UI documentation section
- [x] 20.3 Add section on how to access API docs at `/api-docs`
- [x] 20.4 Document the shared schemas architecture in project README
- [x] 20.5 Add instructions for modifying schemas (update shared/schemas, types auto-sync)
- [x] 20.6 Create or update CONTRIBUTING.md with schema modification workflow

## 21. Phase 21: Optional Response Validation (Development)

- [x] 21.1 Create `backend/src/middleware/responseValidator.ts` for development mode
- [x] 21.2 Add response validation middleware that logs warnings for schema mismatches
- [x] 21.3 Only enable response validation when NODE_ENV === 'development'
- [x] 21.4 Test response validation with intentionally mismatched response

## 22. Phase 22: Final Integration Test

- [x] 22.1 Start both backend and frontend servers
- [x] 22.2 Test complete flow: create product via frontend form → backend validates → success response
- [x] 22.3 Test validation error flow: submit invalid product → frontend shows Zod errors → matches backend validation
- [x] 22.4 Verify Swagger UI can successfully execute requests to running backend
- [x] 22.5 Test that frontend type changes immediately after modifying a shared schema
- [x] 22.6 Create git tag `openapi-integration-complete` for rollback point
