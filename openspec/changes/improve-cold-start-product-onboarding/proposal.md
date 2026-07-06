## Why

Production Playwright auditing showed the cold-start commerce workflow is fragile: a user with zero products receives mostly passive empty states, the assistant points to UI entries that do not exist, and product editing can silently fail for products without image URLs. These issues block the first operational loop: add a product, collect or enter data, then use alerts and opportunity analysis.

## What Changes

- Fix product form semantics so optional URL fields accept blank values, field labels are accessible, and add/edit dialogs remain usable in shorter viewports.
- Align product monitoring interval copy with backend/shared behavior: interval values are hours, allowed range is 1 to 168, default is 24.
- Improve cold-start guidance on Dashboard, Alerts, and Opportunities so users are directed to the next concrete step when no products or no downstream data exist.
- Align Chat agent tool platform contracts with supported product platforms and prevent Chat write tools from bypassing product validation.
- Constrain Chat onboarding answers to reference real UI navigation and action names so generated guidance is actionable in the current app.
- Add regression coverage for form editing, interval copy, cold-start guidance, Chat tool contracts, and Playwright end-to-end onboarding flow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-list-ui`: Product add/edit forms must handle optional URL blanks, expose accessible field labels, use hour-based interval copy, and allow existing products without image URLs to be edited successfully.
- `dashboard-overview`: Empty dashboard state must guide a cold-start user to add their first product.
- `alert-center-ui`: Empty alert states must distinguish "no products yet" from "products exist but no alerts yet" and provide the correct next action.
- `opportunity-research-workspace`: Empty opportunity states must distinguish "no products yet" from "products exist but insufficient opportunity data" and provide the correct next action.
- `chat-agent-tools`: Chat tool schemas, validation, and system guidance must match supported UI/API platform and workflow contracts.

## Impact

- Frontend: product form, modal layout, dashboard, alerts center, opportunities workspace, i18n copy, related component/unit/e2e tests.
- Backend: Chat agent tools, Chat system prompt, backend Chat/tool tests.
- Specs and tests: OpenSpec deltas for modified capabilities, focused Vitest/backend tests, and Playwright onboarding regression coverage.
- No database migration or external provider dependency is expected.
