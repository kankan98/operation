## Why

The comparison table now shows rich saved decision evidence, but it does not show the current decision review context that tells users whether a compared candidate needs a next action, is due for review, or how old the current decision is. Users comparing candidates need this workflow context in the same table so they can decide which opportunity to handle first without opening each item.

## What Changes

- Show current `research.decisionReview` badges in the comparison table decision column when a compared opportunity has current decision review metadata.
- Show a neutral decision age label such as `今天决策`, `昨天决策`, or `N 天前决策` in the comparison table decision column when `daysSinceDecision` is present.
- Preserve missing review metadata without inventing or backfilling review context from decision timestamps, saved snapshots, notes, action outcomes, daily action plan metadata, or render time.
- Keep the display read-only workflow context and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision context now includes current decision review badges and decision age when available.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, reminder, scheduled-action, stale-filter, or scoring changes
