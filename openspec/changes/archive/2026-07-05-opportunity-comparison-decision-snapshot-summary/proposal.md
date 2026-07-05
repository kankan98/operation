## Why

The comparison table shows current score and recommendation, but a saved decision may have been made against different evidence. Showing the saved decision snapshot score and recommendation in comparison helps users review whether current scoring has drifted since the decision.

## What Changes

- Show saved `research.decision.snapshot.score` and `research.decision.snapshot.recommendation` in the comparison table decision column when a current decision exists.
- Label the values as snapshot evidence so they are not confused with the current score and recommendation columns.
- Preserve undecided or missing-decision state without inventing snapshot evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot score and recommendation context when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, or scoring changes
