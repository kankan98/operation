## Why

After a product is created, the current flow returns the user to the product grid and leaves the next operational steps implicit. This weakens the commerce workflow because opportunity scoring and research decisions still need an initial manual reading and merchant business assumptions before they can become useful.

## What Changes

- Redirect users from successful product creation to the created product detail page.
- Preserve normal product list behavior for edit, delete, and quick manual reading actions.
- Show a compact first-research setup guide on product detail when the user arrives from product creation.
- The guide points to existing detail-page actions: record a manual reading, fill business assumptions, and review opportunities after signal collection.
- Add regression coverage for create-to-detail navigation, the transient detail guide, and the cold-start add-product E2E path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-list-ui`: Successful product creation now routes the user to the created product detail page for first research setup instead of ending on the grid.
- `product-detail-ui`: Product detail can show a transient first-research setup guide when opened immediately after product creation.

## Impact

- Frontend: product list submit handler, product detail route state handling, product detail UI, Vitest tests, and Playwright cold-start onboarding E2E.
- Specs and tests: OpenSpec deltas for `product-list-ui` and `product-detail-ui`.
- No backend API change, database migration, or external provider dependency is expected.
