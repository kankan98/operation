## Why

The comparison table now shows saved decision snapshot score, recommendation, confidence, capture time, and gate context, but it still hides the saved snapshot reasons and gaps. Users comparing candidates need the decision-time evidence and missing-signal context to understand why a saved decision looked strong or weak.

## What Changes

- Show saved `research.decision.snapshot.keyReasons` in the comparison table decision column when a current decision exists and saved snapshot reasons are present.
- Show saved `research.decision.snapshot.missingSignals` in the comparison table decision column when saved snapshot gaps are present.
- Label the values as `快照依据` and `快照缺口` so they are distinct from current opportunity reasons and missing signals.
- Preserve empty snapshot evidence state without inventing evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot reasons and missing-signal gaps when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
