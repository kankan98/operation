## Why

The comparison table helps review shortlisted opportunities side by side, but its decision column currently hides the saved next action. This forces the user to open each candidate detail when comparing follow-up commitments across options.

## What Changes

- Show saved `research.decision.nextAction` in the comparison table decision column with a neutral `下一步 · ...` label.
- Preserve the existing undecided and no-next-action states without inventing or inferring a follow-up action.
- Keep the display workflow-only: it must not change scoring, recommendation, gates, persistence, reminders, alerts, scheduled actions, analytics, or action history.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes the saved next action when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, or OpenAPI changes
