## Context

**Current State:**
- Phase 1-3 complete: backend infrastructure, price snapshot service, and Amazon scraper are operational
- Price data is being collected and stored but not analyzed
- Basic AlertService exists for CRUD operations, but no rule engine or automatic triggering

**Constraints:**
- Must maintain existing API compatibility
- Continue using Express + TypeScript + SQLite + Drizzle ORM stack
- Follow established patterns from Phase 1-3

**Stakeholders:**
- End users need timely price alerts without manual monitoring
- System needs automated intelligence layer on top of data collection

## Goals / Non-Goals

**Goals:**
- Calculate meaningful price statistics from historical snapshots
- Flexible rule engine supporting multiple alert types
- Automatic alert generation integrated into scrape workflow
- Clean service-layer architecture matching existing patterns

**Non-Goals:**
- Email/SMS notification delivery (future phase)
- Machine learning price predictions
- Multi-user rule management (single user for now)
- Advanced analytics or data visualization

## Decisions

### Decision 1: Service Layer Architecture

**Choice:** Three separate services (PriceAnalysisService, AlertRuleService, AlertTriggerService)

**Rationale:**
- Single Responsibility Principle: each service has one clear job
- PriceAnalysisService: pure computation, no side effects
- AlertRuleService: CRUD operations on rules
- AlertTriggerService: orchestration and business logic

**Alternatives Considered:**
- Single AlertService: rejected, too many responsibilities
- Rule engine in AlertService: rejected, violates SRP

### Decision 2: Alert Rule Data Model

**Choice:** Simple table with rule_type, condition, threshold fields

```
rule_type: 'price_threshold' | 'price_change_percent' | 'stock_change'
condition: 'below' | 'above' | 'increase' | 'decrease'  
threshold: number
```

**Rationale:**
- Covers 80% of use cases with minimal complexity
- Easy to validate and test
- Extensible for future rule types

**Alternatives Considered:**
- JSON-based rule DSL: rejected, over-engineered for current needs
- Separate tables per rule type: rejected, adds schema complexity

### Decision 3: Alert Trigger Hook

**Choice:** Add post-scrape hook in ScraperService.scrapeProduct()

**Rationale:**
- Alerts fire immediately after data collection
- Minimal changes to existing code
- Clear execution flow

**Alternatives Considered:**
- Separate scheduled job: rejected, adds latency
- Event bus: rejected, over-engineered for single-process app

### Decision 4: Price Statistics Calculation

**Choice:** Calculate on-demand from snapshots, no pre-aggregation

**Rationale:**
- SQLite queries are fast enough for current scale
- No cache invalidation complexity
- Always returns accurate results

**Alternatives Considered:**
- Pre-computed aggregates: rejected, premature optimization
- Redis caching: rejected, adds external dependency

## Risks / Trade-offs

**[Risk] N+1 query performance if many products checked simultaneously**
→ Mitigation: Current serial scraping prevents this; monitor if batch operations added

**[Risk] Rule evaluation complexity grows with product count**
→ Mitigation: Index alert_rules on productId; revisit if >1000 products

**[Trade-off] Simple rule model limits expressiveness**
→ Acceptable: covers core use cases; can extend schema later if needed

**[Trade-off] On-demand stats calculation may slow API responses**
→ Acceptable: typical product has <100 snapshots; add caching if needed
