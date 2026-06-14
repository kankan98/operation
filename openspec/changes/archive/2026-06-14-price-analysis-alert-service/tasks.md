## 1. Database Schema

- [x] 1.1 Add alertRules table definition to src/db/schema.ts
- [x] 1.2 Add AlertRule and PriceStats types to src/types/index.ts
- [x] 1.3 Run database migration (npm run db:push)
- [x] 1.4 Verify schema changes in database

## 2. PriceAnalysisService

- [x] 2.1 Create tests/priceAnalysisService.test.ts with test structure
- [x] 2.2 Add test: calculate statistics with multiple snapshots
- [x] 2.3 Add test: calculate statistics with single snapshot
- [x] 2.4 Add test: handle product with no snapshots
- [x] 2.5 Add test: detect rising price trend
- [x] 2.6 Add test: detect falling price trend
- [x] 2.7 Add test: detect stable price trend
- [x] 2.8 Create src/services/priceAnalysisService.ts
- [x] 2.9 Implement getPriceStats method
- [x] 2.10 Implement detectTrend method (private helper)
- [x] 2.11 Run tests and verify all pass

## 3. AlertRuleService

- [x] 3.1 Create tests/alertRuleService.test.ts with test structure
- [x] 3.2 Add test: create price threshold rule
- [x] 3.3 Add test: create price change percent rule
- [x] 3.4 Add test: validate required fields
- [x] 3.5 Add test: list rules with filters
- [x] 3.6 Add test: update rule threshold
- [x] 3.7 Add test: enable/disable rule
- [x] 3.8 Add test: delete rule
- [x] 3.9 Create src/services/alertRuleService.ts
- [x] 3.10 Implement createRule method
- [x] 3.11 Implement getRuleById method
- [x] 3.12 Implement listRules method with filters
- [x] 3.13 Implement updateRule method
- [x] 3.14 Implement deleteRule method
- [x] 3.15 Run tests and verify all pass

## 4. AlertTriggerService

- [x] 4.1 Create tests/alertTriggerService.test.ts with test structure
- [x] 4.2 Add test: trigger alert for price below threshold
- [x] 4.3 Add test: trigger alert for price above threshold
- [x] 4.4 Add test: no alert when threshold not met
- [x] 4.5 Add test: trigger alert on price drop percentage
- [x] 4.6 Add test: trigger alert on price increase percentage
- [x] 4.7 Add test: skip change rules with single snapshot
- [x] 4.8 Add test: trigger alert on stock unavailable
- [x] 4.9 Add test: skip disabled rules
- [x] 4.10 Add test: prevent duplicate alerts
- [x] 4.11 Create src/services/alertTriggerService.ts
- [x] 4.12 Implement evaluateRules method
- [x] 4.13 Implement evaluatePriceThreshold (private)
- [x] 4.14 Implement evaluatePriceChangePercent (private)
- [x] 4.15 Implement evaluateStockChange (private)
- [x] 4.16 Implement duplicate detection logic
- [x] 4.17 Run tests and verify all pass

## 5. API Routes - Alert Rules

- [x] 5.1 Create src/routes/alertRules.ts
- [x] 5.2 Implement POST /api/alert-rules (create rule)
- [x] 5.3 Implement GET /api/alert-rules (list rules with filters)
- [x] 5.4 Implement GET /api/alert-rules/:id (get single rule)
- [x] 5.5 Implement PATCH /api/alert-rules/:id (update rule)
- [x] 5.6 Implement DELETE /api/alert-rules/:id (delete rule)
- [x] 5.7 Register /alert-rules route in src/routes/index.ts

## 6. API Routes - Price Analysis

- [x] 6.1 Create src/routes/analysis.ts
- [x] 6.2 Implement GET /api/analysis/price-stats/:productId
- [x] 6.3 Register /analysis route in src/routes/index.ts

## 7. Integration with ScraperService

- [x] 7.1 Add AlertTriggerService import to src/services/scraperService.ts
- [x] 7.2 Add post-scrape hook to call evaluateRules in scrapeProduct method
- [x] 7.3 Add error handling for alert trigger failures
- [x] 7.4 Verify scraper still works if alert trigger fails

## 8. API Integration Tests

- [x] 8.1 Create tests/alertRules.api.test.ts
- [x] 8.2 Add test: POST /api/alert-rules creates rule
- [x] 8.3 Add test: GET /api/alert-rules lists rules
- [x] 8.4 Add test: PATCH /api/alert-rules/:id updates rule
- [x] 8.5 Add test: DELETE /api/alert-rules/:id deletes rule
- [x] 8.6 Create tests/analysis.api.test.ts
- [x] 8.7 Add test: GET /api/analysis/price-stats/:productId returns stats
- [x] 8.8 Run all tests and verify pass

## 9. End-to-End Integration Test

- [x] 9.1 Create tests/alertIntegration.test.ts
- [x] 9.2 Add test: scrape triggers threshold alert
- [x] 9.3 Add test: scrape triggers percentage change alert
- [x] 9.4 Add test: scrape triggers stock change alert
- [x] 9.5 Add test: disabled rules don't trigger
- [x] 9.6 Run all tests and verify pass

## 10. Verification

- [x] 10.1 Run full test suite (npm test) - all tests pass
- [x] 10.2 Test manual scrape with alert rules via API
- [x] 10.3 Verify alerts created in database
- [x] 10.4 Test price stats API endpoint
- [x] 10.5 Review code for consistency with existing patterns
