## Why

The comparison table is where shortlisted opportunities are reviewed side by side, but it currently omits the latest recorded action outcome. Users must open each candidate detail to see whether the last follow-up produced usable evidence.

## What Changes

- Show saved `research.lastActionOutcome` in the opportunity comparison table when present.
- Display the saved action label, completion recency, and outcome text as neutral workflow practice evidence.
- Preserve missing-outcome state without inventing, inferring, scheduling, or generating action results.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view evidence now includes saved latest action outcome context when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, reminder, alert, scheduled action, analytics, or scoring changes
