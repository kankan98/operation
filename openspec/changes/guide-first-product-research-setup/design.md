## Context

The app already has the pieces needed for a product's first research setup: product detail includes manual reading entry, business assumptions, market/acquisition context, and opportunity research state. The weak point is the transition after product creation: the product list closes the dialog and leaves the user on the grid, so the user has to discover the detail workflow manually.

This change keeps the workflow inside existing pages and data APIs. It does not add a wizard, persistence flag, database field, or new backend contract.

## Goals / Non-Goals

**Goals:**

- Send users directly to the created product detail page after a successful create.
- Pass transient route state so product detail can explain the immediate next setup steps.
- Keep the guide compact, dismissible, and tied to existing controls instead of adding a new onboarding subsystem.
- Cover behavior with focused Vitest tests and the existing cold-start Playwright flow.

**Non-Goals:**

- Add a new onboarding wizard or checklist persistence.
- Change product creation, price snapshot, opportunity scoring, or business signal APIs.
- Force users to complete setup before leaving product detail.
- Remove the product list quick manual reading entry point.

## Decisions

1. **Navigate to detail after create.**

   `ProductsList` will use the `Product` returned from `createProduct.mutateAsync` and navigate to `/products/:id` after closing the add dialog. This is the smallest change that makes the next workflow discoverable because detail already owns the needed forms.

   Alternative considered: show a follow-up modal on the product list. That keeps the user on the grid but duplicates detail-page guidance and still requires another navigation step before entering assumptions.

2. **Use transient React Router state for the setup guide.**

   The create flow will pass route state such as `fromProductCreate: true`. Product detail reads this state and shows a setup guide only for that navigation path. Direct visits, refreshes, and normal card views will not show the guide.

   Alternative considered: persist a "new product" marker in local storage or backend metadata. Persistence is unnecessary for this first-step hint and could become stale across devices or sessions.

3. **Anchor the guide to existing page sections.**

   Product detail will add stable section ids around business assumptions and manual reading. The guide actions link to those anchors and to `/opportunities`. This avoids new domain logic while making the next steps concrete.

   Alternative considered: auto-scroll to the manual reading form. Auto-scroll can be disorienting on a long operational page and hides the broader setup sequence.

## Risks / Trade-offs

- **Risk: Users expecting to remain on the grid after create are moved to detail.** → The detail page has a back action, and create is the moment when setup is most useful.
- **Risk: Route state disappears on refresh.** → This is intentional; the guide is a contextual transition hint, not a persistent task tracker.
- **Risk: More detail-page content adds noise.** → The guide is only shown from the create flow and can be dismissed.

## Migration Plan

Deploy the frontend with the existing backend. Rollback is the previous frontend release because no database or API migration is involved.

## Open Questions

None for this iteration.
