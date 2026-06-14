## Why

The system currently collects price snapshots but doesn't analyze them or notify users when important changes occur. Users need intelligent alerts when prices drop below thresholds, when competitors change pricing strategy, or when stock availability changes. This phase transforms raw data into actionable insights.

## What Changes

- Add price statistics calculation (min/max/avg prices, trends, change percentages)
- Implement flexible alert rule engine supporting price thresholds, change percentages, and stock changes
- Auto-trigger alert evaluation after each product scrape
- Add alert rule management API (CRUD operations)
- Add price analysis API endpoints
- Create comprehensive test coverage for new services

## Capabilities

### New Capabilities
- `price-analysis`: Calculate price statistics and trends from historical snapshots
- `alert-rules`: Manage alert rules (price thresholds, change percentages, stock monitoring)
- `alert-trigger`: Evaluate rules and generate alerts when conditions are met

### Modified Capabilities
<!-- No existing capabilities require requirement changes -->

## Impact

**Code:**
- New: PriceAnalysisService, AlertRuleService, AlertTriggerService
- New: API routes for alert rules and price analysis
- Modified: ScraperService (add post-scrape alert trigger hook)
- New: alert_rules database table

**APIs:**
- New endpoints: GET/POST/PATCH/DELETE `/api/alert-rules`
- New endpoints: GET `/api/analysis/price-stats/:productId`
- Existing alerts API remains unchanged

**Database:**
- New table: alert_rules (for rule storage)
- Leverages existing: alerts, products, price_snapshots

**Dependencies:**
- No new external dependencies
- Builds on existing services (ProductService, PriceSnapshotService, AlertService)
