## Why

Playwright audit of the production cold-start product flow showed the add-product dialog clips long form content: currency, monitoring, and check-interval fields fall outside the visible dialog while the action bar overlays the middle of the form. This blocks the first meaningful ecommerce operation because a new merchant cannot confidently review or complete the full product onboarding form.

The same flow also lacks a visible submission error area for backend failures such as duplicate product URLs, leaving users without a recovery path when create or edit requests fail.

## What Changes

- Fix the shared modal layout so long dialog content gets an internal scroll area instead of being clipped by the modal container.
- Adjust the product form action area so cancel/submit controls no longer overlap form fields.
- Surface create/edit product submission failures inside the dialog without discarding entered values.
- Add targeted tests covering long modal content, product form validation, and product list submission errors.
- Verify the production-style add-product dialog with Playwright at desktop and mobile viewport sizes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `component-library`: Modal dialogs with content taller than the viewport must preserve header visibility, provide a scrollable body, and avoid clipping reachable content.
- `product-list-ui`: Add/edit product dialogs must keep all required fields and actions reachable and must display backend submission errors with entered values preserved.

## Impact

- Frontend components: `frontend/src/components/ui/Modal.tsx`, `frontend/src/components/products/ProductForm.tsx`, `frontend/src/pages/ProductsList.tsx`
- Frontend tests: targeted Vitest/Testing Library coverage for modal and product onboarding flow
- No backend API, database schema, or dependency changes are expected.
