## Why

Production Playwright auditing of a cold-start product detail page showed that the market trend card still exposes internal or English display text such as `missing`, `keepa insufficient_history`, `Confidence`, `Freshness`, and an English caveat. These labels sit next to the Keepa market signal evidence merchants use to decide whether external trend data is available, so they should be readable in the active Chinese UI.

## What Changes

- Display product-detail market signal status badges with merchant-facing Chinese labels.
- Display Keepa provider health status labels in Chinese while preserving the provider name and API status values.
- Localize the market signal metric labels, history table headers, and default caveat on the product detail page.
- Preserve market signal API responses, refresh behavior, health calculations, and scoring logic.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `product-detail-ui`: the product detail market signal card must present status, metric, history, and default caveat text with readable Chinese display labels rather than raw internal or English strings.

## Impact

- Frontend ProductDetail display helpers and tests.
- No backend API, database, Keepa provider, market signal health, or opportunity scoring changes.
