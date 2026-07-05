## Why

The comparison table now shows saved decision snapshot market status and provenance, but it still hides the specific saved market factors that explain what proxy trend evidence supported a past decision. Users comparing candidates need a compact view of saved factor labels, values, and explanations without mistaking current market factors for decision-time evidence.

## What Changes

- Show saved `research.decision.snapshot.marketSignals.factors` in the comparison table decision column when a current decision exists and saved snapshot factors are present.
- Display compact `快照市场因子` rows with the saved factor label/name, raw value, and explanation.
- Preserve null or empty saved market factor state without inventing or backfilling factors from current opportunity market signals.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot market factor context when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
