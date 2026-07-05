## Why

Selected decision detail shows when the user recorded the decision, but the saved evidence snapshot time is only visible near the edit form controls. Showing the snapshot capture time inside the saved decision evidence block helps users distinguish decision timing from evidence timing when reviewing old judgments.

## What Changes

- Show saved `decision.snapshot.capturedAt` in the selected opportunity decision detail with a neutral `快照时间` label.
- Use the saved snapshot timestamp only; do not infer from decision `decidedAt`, `updatedAt`, current opportunity data, or local render time.
- Keep the change display-only with no scoring, persistence, API, provider, automation, reminder, analytics, or action-history behavior changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add selected-detail display requirements for saved decision snapshot capture time.

## Impact

- Frontend selected opportunity decision detail rendering in `frontend/src/pages/Opportunities.tsx`.
- Focused frontend tests in `frontend/tests/pages/Opportunities.test.tsx`.
- Opportunity research workspace spec and developer documentation.
