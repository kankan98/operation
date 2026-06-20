# Chat Purple Regression Notes

Date: 2026-06-20

## Scope

Cross-page visual regression for the Chat UI redesign v2 purple system.

Checked surfaces:

- Dashboard overview and chart accent
- Products primary action buttons
- Alerts filter active/count styling
- Settings navigation active styling
- Shared Tailwind/CSS primary and purple utility tokens

## Findings

- `frontend/src/index.css` still exposed the old Tailwind primary scale (`#8b5cf6`, `#7c3aed`) through `primary-*` utilities.
- `--fg-accent` and `--state-focus-ring` still referenced the old purple family.
- `frontend/tailwind.config.js` still mapped `accent-purple` to the legacy color.
- `Dashboard.tsx` and shared `LineChart.tsx` still hardcoded `#7c3aed`.

## Fixes

- Rebased `primary-*` and `purple-*` theme variables to the v2 brand scale.
- Updated `--fg-accent` and focus ring to the v2 purple values.
- Changed `accent-purple` to `#6E54EE` while keeping `legacy-purple` as the explicit temporary compatibility token.
- Updated dashboard and line chart hardcoded accent colors to `#6e54ee`.
- Added `PurpleRegression.test.ts` to lock token values, page usage, and WCAG AA contrast ratios.

## Verified Contrast

- White on `#6e54ee`: AA pass
- White on `#5f46df`: AA pass
- `#6e54ee` on `#f4f1ff`: AA pass
