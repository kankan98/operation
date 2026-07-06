## Why

Production Playwright auditing showed that the manual reading form still displays stock status choices as raw internal values: `in_stock`, `low_stock`, and `out_of_stock`. This form is used by merchants to enter observed price and stock readings, so the options should use business-readable labels while preserving the stored enum values.

## What Changes

- Display manual reading stock status options as merchant-facing Chinese labels.
- Preserve submitted `availability` enum values (`in_stock`, `low_stock`, `out_of_stock`) so API validation and stored snapshots remain unchanged.
- Cover the shared manual reading form with tests and production Playwright smoke verification.

## Capabilities

### New Capabilities

- `manual-reading-ui`: shared UI behavior for manually entering price, stock, ranking, rating, and review readings from product and opportunity workflows.

### Modified Capabilities

- None.

## Impact

- Frontend `ManualReadingForm` display labels and component tests.
- No backend API, schema, persistence, or price snapshot behavior changes.
