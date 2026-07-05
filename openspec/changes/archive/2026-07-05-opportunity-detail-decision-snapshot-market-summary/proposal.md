## Why

Saved opportunity decisions already capture the market signal summary that existed when the user made the call, but the selected detail panel does not expose that snapshot. Showing the saved market context makes later review more accurate, especially when live Keepa/provider data changes after the decision.

## What Changes

- Show saved decision snapshot market status in the selected opportunity decision detail when `decision.snapshot.marketSignals` is present.
- Show saved snapshot market provider/source, confidence, freshness, and missing-signal gaps as neutral review context.
- Preserve the empty state when the saved snapshot market summary is `null`; do not backfill from current opportunity market signals.
- Keep the change display-only with no scoring, persistence, API, provider, automation, reminder, analytics, or action-history behavior changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add selected-detail display requirements for saved decision snapshot market summary.

## Impact

- Frontend selected opportunity decision detail rendering in `frontend/src/pages/Opportunities.tsx`.
- Focused frontend tests in `frontend/tests/pages/Opportunities.test.tsx`.
- Opportunity research workspace spec and developer documentation.
