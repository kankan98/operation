## Why

The comparison table can show that a saved decision snapshot was gated, but it still hides the saved gate reasons, signals, and next actions that explain why the recommendation was blocked or downgraded. Users comparing candidates need that context without opening each item and without mistaking current recommendation gates for decision-time evidence.

## What Changes

- Show saved `research.decision.snapshot.recommendationGate.reasons`, `signals`, and `nextActions` in the comparison table decision column when a current decision exists and saved gate context is present.
- Display compact neutral rows with `快照门控原因`, `快照门控信号`, and `快照门控下一步` labels.
- Preserve clear or empty saved gate state without inventing or backfilling details from current opportunity recommendation gates, current score/recommendation, notes, action outcomes, review metadata, daily action plan metadata, or render time.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot recommendation gate detail context when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
