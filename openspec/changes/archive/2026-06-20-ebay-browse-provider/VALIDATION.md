# Validation Evidence

Validated on 2026-06-20.

## Build And Lint

- `pnpm --filter backend lint` - passed.
- `pnpm --filter backend build` - passed.
- `pnpm --filter frontend build` - passed.

## Targeted Tests

- `pnpm --filter backend test -- ebayBrowseProvider providerDiagnostics productDataProviderRouter scraperService scraper.api providerHealthService openapi.providerHealth opportunityScoringService chatService sharedScraperSchema` - passed, 10 files / 108 tests.
- `pnpm --filter frontend test -- ProductDetail Opportunities` - passed, 2 files / 13 tests.

## Full Regression

- `pnpm --filter backend test` - passed, 34 files / 293 tests.

## OpenSpec

- `openspec validate --changes ebay-browse-provider --json` - passed, 3/3 active changes valid.
- `openspec validate --specs --json` - passed, 72/72 main specs valid.

## Notes

- Frontend production build completed without chunk-size warnings or invalid dynamic import warnings in the captured output.
- Backend test output still includes existing Vitest `test.poolOptions` deprecation and `node-cron` sourcemap warnings; no failed tests or OpenSpec validation issues were observed.
- Main OpenSpec spec validation debt is currently clear: `openspec validate --specs --json` reports zero failed specs.
