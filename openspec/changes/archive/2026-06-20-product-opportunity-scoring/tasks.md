## 1. Scoring Contracts and Schemas

- [x] 1.1 Add opportunity score, factor, recommendation, filters, and paginated response types
- [x] 1.2 Add backend Zod schemas for opportunity list query and product explanation responses
- [x] 1.3 Export shared/frontend types needed by the opportunity workbench

## 2. Price and Acquisition Signals

- [x] 2.1 Add reusable price signal helper for current price, average, high, low, change percent, volatility, and data point count
- [x] 2.2 Ensure products with no or one snapshot return missing or low-confidence signals instead of failing list scoring
- [x] 2.3 Add bounded cross-product signal collection for a page of products
- [x] 2.4 Add scrape attempt signal lookup for latest status, failure reason, provider, confidence, duration, and freshness

## 3. Opportunity Scoring Service

- [x] 3.1 Implement deterministic score calculation from weighted factors
- [x] 3.2 Include score, confidence, factor breakdown, missing signals, and recommended action
- [x] 3.3 Add filters for platform, category, monitoring status, minimum score, and recommended action
- [x] 3.4 Add sorting by score and confidence with pagination
- [x] 3.5 Add unit tests for complete data, missing price history, stale acquisition, failed acquisition, and deterministic repeated scoring

## 4. Opportunity API

- [x] 4.1 Add `GET /api/opportunities/products` for ranked opportunity products
- [x] 4.2 Add `GET /api/opportunities/products/:productId` for one-product explanation
- [x] 4.3 Register OpenAPI metadata and response schemas for opportunity endpoints
- [x] 4.4 Add API tests for ranking, filtering, pagination, product-not-found, and missing-signal responses

## 5. Frontend Opportunity Workbench

- [x] 5.1 Add frontend opportunity API methods and React Query hooks
- [x] 5.2 Add route/navigation entry for the opportunity workbench
- [x] 5.3 Build ranked opportunity list with score, confidence, recommendation, platform, price, and key reasons
- [x] 5.4 Add filters for recommendation, minimum score, platform, and sort order
- [x] 5.5 Add score explanation panel with factors, missing signals, acquisition health, and recommended action
- [x] 5.6 Wire `check_data` recommendations to existing manual acquisition action
- [x] 5.7 Add frontend tests for loading, empty state, ranked results, filters, explanation panel, and manual check action

## 6. Chat Opportunity Tools

- [x] 6.1 Add `getProductOpportunities` Chat tool definition and execution
- [x] 6.2 Add `explainProductOpportunity` Chat tool definition and execution
- [x] 6.3 Ensure Chat explanations include score, confidence, recommendation, factors, missing signals, and unsupported-signal caveats
- [x] 6.4 Add Chat tool tests for ranked opportunities, filters, one-product explanation, missing product, and missing profit signal language

## 7. Documentation and Route Plan

- [x] 7.1 Update `docs/roadmap.md` to mark Rainforest/provider observability complete and product opportunity scoring as the current slice
- [x] 7.2 Update README feature and roadmap sections for opportunity scoring MVP
- [x] 7.3 Document opportunity scoring factors, caveats, and unsupported margin/demand claims

## 8. Validation

- [x] 8.1 Run `pnpm --filter backend lint`
- [x] 8.2 Run `pnpm --filter backend build`
- [x] 8.3 Run `pnpm --filter backend test`
- [x] 8.4 Run relevant frontend tests for opportunity workbench and Chat tool rendering
- [x] 8.5 Run `pnpm --filter frontend build`
- [x] 8.6 Run `openspec validate --changes product-opportunity-scoring`
- [x] 8.7 Run `openspec validate --specs --json`
