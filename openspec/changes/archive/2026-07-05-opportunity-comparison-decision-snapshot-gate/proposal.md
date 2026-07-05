## Why

The comparison table now shows saved decision snapshot score, recommendation, confidence, and capture time, but it still hides whether the saved recommendation was gated at decision time. Users comparing candidates need that saved gate context to distinguish a clean saved recommendation from one that was blocked or downgraded by missing evidence.

## What Changes

- Show saved `research.decision.snapshot.recommendationGate` context in the comparison table decision column when a current decision exists and the saved snapshot gate is non-clear or contains gate evidence.
- Label the value as `快照门控` so it is distinct from the current opportunity recommendation gate.
- Preserve clear or empty saved snapshot gate state without inventing gate evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot recommendation gate context when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
