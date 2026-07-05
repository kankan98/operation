## Why

The comparison table now shows saved decision snapshot business completeness and missing business signals, but it still hides the saved unit-economics values that often determine whether a past go/hold decision was operationally viable. Users comparing candidates need to see the saved net margin, ROI, breakeven price, and contribution profit without mistaking current business metrics for decision-time evidence.

## What Changes

- Show saved `research.decision.snapshot.businessSignals.metrics` values in the comparison table decision column when a current decision exists and saved snapshot metrics are present.
- Display available saved metrics with neutral `快照业务指标` labels, matching selected detail terminology.
- Preserve null or missing saved snapshot metrics without inferring values from current opportunity business metrics.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot business metric values when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
