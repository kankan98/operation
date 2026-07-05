## Why

Full-project Playwright audit of the production deployment found two user-visible stability gaps outside the Chat flow:

- On mobile non-Chat pages such as `/products`, the persistent sidebar is hidden and there is no visible navigation trigger, leaving users without a way to move between modules.
- The Dashboard emits a Recharts size warning when the monitoring overview donut renders with empty data, adding console noise and indicating an unstable chart container state.

These matter because the app is now deployed as a cross-module operations console; mobile users need global navigation on every page, and production smoke tests should stay free of avoidable rendering warnings.

## What Changes

- Add a mobile global navigation trigger to the shared `AppLayout` for non-Chat pages.
- Render the same primary navigation items in a mobile overlay drawer with close button, outside-click close, Escape close, and focus return.
- Keep desktop/tablet persistent sidebar behavior unchanged.
- Keep the Chat page's specialized single-column header and Chat drawers unchanged.
- Make the Dashboard monitoring overview stable when product counts are zero, avoiding Recharts `width(-1) and height(-1)` warnings while preserving the visual empty state.
- Add targeted regression coverage and production-like Playwright coverage for these audited paths.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `main-navigation`: Mobile non-Chat pages must expose a reachable global navigation entry and overlay drawer.
- `dashboard-overview`: Empty dashboard chart states must render without console warnings or unstable chart sizing.

## Impact

- Frontend shared layout: `frontend/src/components/layout/AppLayout.tsx`
- Dashboard chart component: `frontend/src/components/ui/charts/DonutChart.tsx`
- Tests for shared navigation and dashboard chart empty state.
- Production Playwright smoke coverage for mobile non-Chat navigation and Dashboard console cleanliness.
