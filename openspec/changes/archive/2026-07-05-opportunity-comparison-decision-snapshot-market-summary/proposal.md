## Why

The comparison table now shows saved decision snapshot score, confidence, gates, evidence, and business snapshot context, but it still hides the saved market signal summary that explains whether the decision-time market evidence was fresh and complete. Users comparing candidates need the saved market status, source, confidence, freshness, and market gaps without mistaking current market signals for decision-time evidence.

## What Changes

- Show saved `research.decision.snapshot.marketSignals.status` in the comparison table decision column when a current decision exists and saved market snapshot context is present.
- Show saved market source, confidence, freshness, and missing market signals when those saved fields exist.
- Label the values as `快照市场状态`, `快照市场来源`, `快照市场置信度`, `快照市场新鲜度`, and `快照市场缺口` so they are distinct from current opportunity market signals.
- Preserve null or missing saved market snapshot state without inventing or backfilling market evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot market summary context when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, stale-filter, or scoring changes
