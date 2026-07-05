## Why

The practice summary API returns a generated timestamp, but the workspace UI does not show when the displayed coverage read model was produced. Users reviewing practice coverage need that timestamp to audit the freshness of the workflow coverage numbers without treating them as scoring or training grades.

## What Changes

- Show saved `summary.generatedAt` in the practice summary strip when practice summary data is loaded.
- Display the timestamp as a neutral `汇总时间 · ...` line near the practice summary caveat.
- Preserve loading and missing-summary states without inventing or backfilling summary time from render time, daily action plan metadata, review summary metadata, action outcome metadata, decision metadata, score, market signals, or business metrics.
- Keep the display read-only workflow practice coverage metadata and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: practice summary UI now exposes the returned practice summary generation timestamp when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, scheduled-action, stale-filter, or scoring changes
