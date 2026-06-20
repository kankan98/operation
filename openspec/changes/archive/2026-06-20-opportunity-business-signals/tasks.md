## 1. Data Model And Schemas

- [x] 1.1 Add migration and rollback for a product-level `product_business_signals` persistence model.
- [x] 1.2 Define shared business signal schemas for upsert requests, persisted records, derived metrics, missing signals, and assumption caveats.
- [x] 1.3 Export shared business signal types from the shared schema package in both TypeScript and runtime JavaScript entrypoints.
- [x] 1.4 Extend shared opportunity response schemas with optional business metric summaries and missing business signal fields.

## 2. Financial Calculation Service

- [x] 2.1 Implement a pure business metrics calculation helper/service that accepts normalized assumptions and product price context.
- [x] 2.2 Compute total variable cost, gross margin, net margin, ROI, breakeven sell price, contribution profit per unit, completeness, missing signals, and price source.
- [x] 2.3 Ensure missing assumptions are reported as missing and are never treated as zero-cost advantages.
- [x] 2.4 Add unit tests for complete assumptions, missing assumptions, target sell price, current price fallback, zero-cost guards, referral fee rate, and rounding.

## 3. Backend API

- [x] 3.1 Add repository/service functions to read and upsert business assumptions by product ID.
- [x] 3.2 Add product business signal routes for reading assumptions plus metrics and creating/updating assumptions.
- [x] 3.3 Reuse existing request/response validation and product-not-found error conventions.
- [x] 3.4 Register business signal routes and schemas in OpenAPI generation.
- [x] 3.5 Add backend route tests for read empty state, upsert success, update success, validation errors, missing product, and derived metric response shape.

## 4. Opportunity Scoring Integration

- [x] 4.1 Load business assumptions and derived metrics in opportunity ranking and single-product explanation flows.
- [x] 4.2 Add margin, ROI, breakeven distance, and contribution profit factors when derived metrics are complete enough.
- [x] 4.3 Adjust confidence and missing signals when business assumptions are absent or incomplete.
- [x] 4.4 Add scoring tests proving deterministic results and no favorable scoring from missing costs.

## 5. Product And Opportunity UI

- [x] 5.1 Add API client methods and frontend types for reading/upserting product business signals.
- [x] 5.2 Add a product detail section for viewing, editing, validating, and saving business assumptions.
- [x] 5.3 Display derived metrics, missing business signals, price source, and assumption-based caveat in product detail.
- [x] 5.4 Extend the opportunity workbench with business metric summaries, missing signal indicators, and business readiness filtering.
- [x] 5.5 Add frontend tests for product detail edit/save/error states and opportunity workbench business signal rendering.

## 6. Chat Agent Tools

- [x] 6.1 Extend opportunity ranking tool responses with business metric summaries and missing business signals.
- [x] 6.2 Extend opportunity explanation tool responses with derived metrics, formula inputs, score influence, and assumption caveats.
- [x] 6.3 Add Chat tool tests covering complete business metrics, missing assumptions, no matching readiness filters, and avoidance of verified-profit claims.

## 7. Documentation And Verification

- [x] 7.1 Update product opportunity scoring documentation with formulas, assumptions, caveats, and recommended merchant workflow.
- [x] 7.2 Update roadmap to mark business signal enrichment as the next active implementation slice.
- [x] 7.3 Run backend lint, backend build, backend tests, frontend relevant tests, and frontend build.
- [x] 7.4 Run OpenAPI/schema tests covering new business signal endpoints and opportunity response extensions.
- [x] 7.5 Run `openspec validate --changes opportunity-business-signals --json`.
- [x] 7.6 Run `openspec validate --specs --json` before archive to ensure the main spec library stays at zero failed specs.
