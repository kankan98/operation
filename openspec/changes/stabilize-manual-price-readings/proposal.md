## Why

Production Playwright failure simulation found that the product detail manual reading form clears the user's entered price, rank, rating, and review count after a failed save. A follow-up real save confirmed the backend accepts and stores the reading, so the blocker is the frontend recovery path: failed saves risk losing manually collected operating data.

## What Changes

- Preserve manual reading form input until the save is confirmed successful.
- Keep visible failure feedback on save errors while leaving the product detail page usable.
- Add backend regression coverage for the already-working snapshot creation contract and frontend component coverage for the failure and recovery paths.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `product-detail-ui`: Manual reading input must be retained after a failed save and cleared only after confirmed success.

## Impact

- Affected backend code: price snapshot route tests only.
- Affected frontend code: `frontend/src/components/products/ManualReadingForm.tsx` and its tests.
- Affected systems: product detail first-setup flow, price statistics, price history, opportunity scoring refresh inputs, production deployment.
