## Why

Production Playwright auditing of the opportunity workspace showed that the Chinese UI still exposes backend/internal signal keys and English status fragments in opportunity rows, selected details, and missing-signal diagnostics. Examples include `business partial`, `market missing`, `costBasis`, `business_advertisingCost`, `profit_margin`, and `market_trend`, exactly where merchants scan candidates and decide which product needs research, business assumptions, or market evidence.

## What Changes

- Display merchant-facing Chinese labels for opportunity business completeness, market signal status, and known missing-signal badges.
- Convert known opportunity, business, and market signal keys in row summaries, selected detail panels, gate context, snapshots, and comparison displays when those keys are visible to users.
- Preserve API payload fields, backend scoring keys, filters, exports, persistence, recommendation gates, and score calculations.
- Cover the opportunity workspace display contract with regression tests and verify production behavior with Playwright.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `product-opportunity-scoring`: opportunity scoring UIs should present known missing-signal guidance with user-facing labels rather than raw scoring keys.
- `opportunity-business-signals`: opportunity business readiness and missing assumption labels should be merchant-facing without changing persisted fields or derived metric semantics.
- `opportunity-research-workspace`: the workspace UI should show readable signal, gate, snapshot, and comparison labels while preserving workflow and scoring semantics.

## Impact

- Frontend Opportunities display helpers and tests.
- OpenSpec documentation for opportunity scoring, business signals, and research workspace display behavior.
