## Context

The production app is currently in a cold-start state with no products, alerts, or opportunities. Playwright audit found three linked issues in the first operational workflow: users are not clearly guided from empty screens to adding a product, product edit can silently fail for products without an image URL, and Chat can recommend unsupported platforms or UI entry names that do not exist in the current app.

The existing specifications already cover product CRUD, dashboard metrics, alert empty states, opportunity workflow, and Chat agent tools. This design keeps the change inside those boundaries and avoids a broader onboarding wizard or new external dependencies.

## Goals / Non-Goals

**Goals:**

- Make product add/edit forms robust for optional URL fields and accessible labels.
- Align monitoring interval copy with the backend contract: hours, 1 to 168, default 24.
- Give cold-start users a concrete next step from Dashboard, Alerts, and Opportunities.
- Keep Chat tool schemas and write behavior consistent with supported product platforms and API validation.
- Constrain Chat guidance to real UI navigation and actions.
- Add focused unit, backend, and Playwright regression coverage for the audited workflow.

**Non-Goals:**

- Add a full onboarding wizard.
- Add a new alert-rule management UI.
- Add Chat action cards or clickable generated deep links.
- Add support for Lazada or any new marketplace.
- Change opportunity scoring logic, provider acquisition behavior, or database schema.

## Decisions

1. **Normalize optional form strings at the form boundary.**

   Product form fields such as `imageUrl`, `brand`, and `category` can be blank in the UI. The form schema will accept blank optional URL values and submit them as `undefined`, matching the existing `normalizeProductData` path. This keeps backend API behavior unchanged and fixes edit failures for products without images.

   Alternative considered: add visible image/category fields to the modal. That increases scope and is not necessary for the observed edit bug.

2. **Use lightweight cold-start CTAs instead of a wizard.**

   Dashboard, Alerts, and Opportunities will render contextual empty-state guidance with buttons linking to Products. If products exist but downstream data is missing, the copy will point users toward manual readings, immediate checks, and business assumptions rather than telling them only that nothing exists.

   Alternative considered: a multi-step onboarding wizard. That would be useful later but would mix workflow design, persistence, and routing concerns into a stabilization pass.

3. **Treat Chat as bounded by current UI/API contracts.**

   Chat tool platform enums will match the supported product platforms (`amazon`, `walmart`, `aliexpress`, `ebay`, `other`). `addProductMonitoring` will validate through the shared product schema before calling the service so Chat cannot create records that the HTTP API would reject. The system prompt will include current UI names for user guidance.

   Alternative considered: keep Chat tools permissive and rely on model behavior. Production audit showed this produces inaccurate guidance, so contracts must be explicit.

4. **Regression tests mirror the audited workflow.**

   Frontend component tests will cover form edit submit, accessible labels, and i18n copy. Backend tests will cover Chat tool platform contracts and validation. Playwright will cover cold-start guidance and the product create/edit/manual-reading/delete loop.

## Risks / Trade-offs

- **Risk: Empty-state copy becomes too verbose.** → Keep copy concise and route users to the next concrete screen instead of embedding instructions.
- **Risk: Chat prompt changes reduce answer flexibility.** → Limit prompt additions to UI contract names and supported platforms; do not constrain analysis style beyond actionability.
- **Risk: Product form normalization diverges from backend schema.** → Keep backend/shared schema as source of truth and test that frontend blanks submit as omitted optional fields.
- **Risk: Playwright tests need production-like clean data.** → Use local test server fixtures or test-created data and clean up after the flow.

## Migration Plan

No data migration is required. Deploy frontend and backend together so Chat tool contracts and UI copy are consistent. Rollback is the previous release if regressions appear.

## Open Questions

None for this iteration. Future work can decide whether to add a richer onboarding wizard, alert-rule UI, or generated Chat action cards.
