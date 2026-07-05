## Why

The daily action plan API returns a generated timestamp, but the workspace UI does not show when the displayed plan read model was produced. Users practicing a daily operating routine need that timestamp to audit the freshness of the workflow guidance without treating the plan as automation.

## What Changes

- Show saved `plan.generatedAt` in the daily action plan panel when a plan is loaded.
- Display the timestamp as a neutral `计划时间 · ...` line near the panel caveat.
- Preserve loading and missing-plan states without inventing or backfilling plan time from render time, action outcome metadata, decision metadata, practice summary metadata, score, market signals, or business metrics.
- Keep the display read-only workflow practice metadata and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: daily action plan UI now exposes the returned plan generation timestamp when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, scheduled-action, stale-filter, or scoring changes
