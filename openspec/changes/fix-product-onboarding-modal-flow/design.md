## Context

The product list empty state is the first operational step for a new ecommerce user. The current add-product modal uses a flex column container with `max-h-[90vh]` and `overflow-hidden`, while its body is a flex child without `min-h-0`/`flex-1`. In browser layout this lets the body keep its full content height, then the outer modal clips it. ProductForm also places a `sticky bottom-0` action row inside the form, so when validation errors expand the form, the action row overlays fields instead of staying after them.

The create/edit submit handlers currently await React Query mutations but do not render mutation errors. A backend failure leaves the user in the dialog with no visible explanation.

## Goals / Non-Goals

**Goals:**
- Keep modal headers visible while long modal bodies scroll inside the viewport.
- Make all add/edit product fields and actions reachable on desktop and mobile.
- Display backend submission failures in the product form dialog without clearing user-entered values.
- Cover the behavior with targeted component/page tests and Playwright verification.

**Non-Goals:**
- Redesign product onboarding or add URL metadata extraction.
- Change backend product validation or database constraints.
- Add a new notification/toast system.
- Archive older completed OpenSpec changes.

## Decisions

1. **Fix the shared Modal flex boundary.** The modal content wrapper will use a shrinking scroll region (`min-h-0 flex-1 overflow-y-auto`) under the fixed header. This addresses the root layout bug for all long modals instead of adding one-off max heights to ProductForm.

2. **Make ProductForm actions part of normal document flow.** The action row will remain at the end of the form, not sticky inside the scroll area. This removes overlap and keeps the implementation simple. Users can scroll to review all required fields and then submit.

3. **Pass a submission error string into ProductForm.** ProductsList will derive user-facing create/edit errors from the mutation error and pass them to the form. ProductForm will render the error near the action row with `role="alert"` so it is visible and accessible. Form values stay in React Hook Form state because the dialog remains mounted.

4. **Keep tests focused on behavior.** Unit tests will assert the Modal exposes the scroll-region classes that make long content reachable, ProductForm renders validation/submission errors, and ProductsList surfaces a create failure. Playwright will verify rendered layout because jsdom cannot calculate real clipping.

## Risks / Trade-offs

- **Risk: Removing sticky actions makes submit buttons require scrolling in very long forms.** → Mitigation: the current form is short enough once the modal body scrolls correctly, and non-overlapping fields are more important than always-visible buttons for a data-entry form.
- **Risk: Generic backend error text may be less specific than ideal.** → Mitigation: extract Axios-style response messages/codes when available and fall back to a clear retry message.
- **Risk: Modal layout changes affect other dialogs.** → Mitigation: the change preserves the fixed header and existing max-height, only correcting flex shrink/scroll behavior.

## Migration Plan

Deploy as a frontend-only change. Rollback is the previous release symlink if unexpected modal regressions appear. No data migration is required.
