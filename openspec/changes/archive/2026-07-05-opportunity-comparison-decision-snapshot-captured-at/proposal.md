## Why

The comparison table now shows saved decision snapshot score, recommendation, and confidence, but it still hides when that evidence snapshot was captured. Users comparing candidates need the snapshot timestamp to judge whether side-by-side decision evidence is recent or based on older saved context.

## What Changes

- Show saved `research.decision.snapshot.capturedAt` in the comparison table decision column when a current decision exists.
- Label the value as `快照时间` so it is distinct from the decision record time and current render time.
- Preserve undecided or missing-decision state without inventing snapshot-time evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot capture time when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
