## Why

The comparison table shows several saved decision snapshot fields, but it still hides whether the saved decision had complete business assumptions. Users comparing candidates need the saved business completeness and missing business signals to judge whether a past decision was based on enough cost and fee evidence.

## What Changes

- Show saved `research.decision.snapshot.businessSignals.completeness` in the comparison table decision column when a current decision exists and saved business snapshot context is present.
- Show saved `research.decision.snapshot.businessSignals.missingSignals` in the comparison table decision column when saved business gaps exist.
- Label the values as `快照业务完整度` and `快照业务缺口` so they are distinct from current opportunity business signals.
- Preserve missing saved business snapshot state without inventing business evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot business completeness and business gaps when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
