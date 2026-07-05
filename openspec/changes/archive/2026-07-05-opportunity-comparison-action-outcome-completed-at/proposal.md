## Why

The comparison table shows latest action outcome recency, but it omits the saved completion timestamp that the selected detail view already exposes. Users comparing candidates need the exact saved completion time to audit when execution evidence was recorded, not just a relative recency label.

## What Changes

- Show saved `research.lastActionOutcome.completedAt` in the opportunity comparison table action outcome column when a latest action outcome exists.
- Display the timestamp as a neutral `完成时间 · ...` line alongside the saved action label, recency label, and outcome text.
- Preserve missing outcome state without inventing or backfilling completion time from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, or render time.
- Keep the display read-only workflow practice evidence and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view action outcome evidence now includes the saved latest action outcome completion timestamp when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, scheduled-action, stale-filter, or scoring changes
