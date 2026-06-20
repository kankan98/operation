# Validation Evidence

Validated on 2026-06-20.

## Build And Lint

- `pnpm --filter backend lint` - passed.
- `pnpm --filter backend build` - passed.
- `pnpm --filter frontend build` - passed.

## Targeted Tests

- `pnpm --filter backend test -- businessMetricsService productBusinessSignals.api opportunityScoringService opportunities.api chatService openapi.businessSignals` - passed, 6 files / 61 tests.
- `pnpm --filter frontend test -- ProductDetail Opportunities` - passed, 2 files / 11 tests.
- `pnpm --filter backend test -- alertService priceSnapshots.api products.api integration` - passed, 4 files / 38 tests after repairing product-related cleanup and delete dependency order.

## Full Regression

- `pnpm --filter backend test` - passed, 32 files / 261 tests.

## OpenSpec

- `openspec validate --changes opportunity-business-signals --json` - passed, 2/2 active changes valid.
- `openspec validate --specs --json` - passed, 72/72 main specs valid.

## Notes

- Full backend tests initially exposed a SQLite foreign-key cleanup gap in legacy product, alert, price snapshot, and integration tests. The fix adds product-related test cleanup that deletes dependent records before products and updates `ProductService.deleteProduct` to remove dependent monitoring, acquisition, alert, and business-signal records before deleting a product.
- Frontend production build completed without chunk-size or dynamic-import warnings in the captured output.
