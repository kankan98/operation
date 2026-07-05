## Why

Selected decision review now shows the saved market summary, but it still hides the specific saved market factors that made the trend evidence useful or weak at decision time. Showing the saved factor labels, values, and explanations helps the user review whether the original judgment leaned on a concrete proxy trend or just a high-level market status.

## What Changes

- Show saved decision snapshot market factors in the selected opportunity decision detail when `decision.snapshot.marketSignals.factors` has entries.
- Display compact neutral `快照市场因子` labels using saved factor label, raw value, and explanation.
- Preserve the empty state when saved snapshot market signals are `null` or have no factors; do not backfill from current opportunity market factors.
- Keep the change display-only with no scoring, persistence, API, provider, automation, reminder, analytics, or action-history behavior changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add selected-detail display requirements for saved decision snapshot market factors.

## Impact

- Frontend selected opportunity decision detail rendering in `frontend/src/pages/Opportunities.tsx`.
- Focused frontend tests in `frontend/tests/pages/Opportunities.test.tsx`.
- Opportunity research workspace spec and developer documentation.
