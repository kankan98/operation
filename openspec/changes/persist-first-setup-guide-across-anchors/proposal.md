## Why

Production Playwright testing showed that the first-research setup guide disappears after the user clicks one of its hash-anchor actions. This breaks the intended setup sequence because users can record the first reading but then lose the guided path to business assumptions and opportunities.

## What Changes

- Preserve the first-research setup guide for the current product-detail page session after hash-anchor navigation.
- Keep the existing dismiss behavior: the guide disappears only when the user explicitly closes it or leaves the page session.
- Add regression coverage for clicking guide anchors without losing the rest of the guide.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-detail-ui`: First-research setup guidance remains visible across same-page anchor navigation until dismissed.

## Impact

- Frontend: product detail guide state, ProductDetail tests, cold-start Playwright E2E.
- No backend, database, or API changes.
