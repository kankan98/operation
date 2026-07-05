## Why

Saved decisions can already capture assumption-based business metrics, but selected decision review only shows business completeness and missing inputs. Showing the saved metric values helps the user revisit whether the original go/hold/no-go call had acceptable margin, ROI, and unit economics at decision time.

## What Changes

- Show saved decision snapshot business metrics in the selected opportunity decision detail when `decision.snapshot.businessSignals.metrics` is present.
- Display compact neutral labels for saved net margin, ROI, breakeven sell price, and contribution profit per unit.
- Preserve the empty state when saved snapshot metrics are `null`; do not backfill from current opportunity business metrics.
- Keep the change display-only with no scoring, persistence, API, provider, automation, reminder, analytics, or action-history behavior changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add selected-detail display requirements for saved decision snapshot business metrics.

## Impact

- Frontend selected opportunity decision detail rendering in `frontend/src/pages/Opportunities.tsx`.
- Focused frontend tests in `frontend/tests/pages/Opportunities.test.tsx`.
- Opportunity research workspace spec and developer documentation.
