## Context

The product detail guide currently derives visibility directly from `location.state.fromProductCreate`. Clicking a plain hash anchor such as `#manual-reading` creates a same-page navigation where React Router no longer exposes that original route state. The guide then disappears even though the user has not dismissed it.

## Goals / Non-Goals

**Goals:**

- Preserve the original "arrived from product creation" signal for the lifetime of the mounted product-detail component.
- Keep explicit dismissal as the only in-session way to hide the guide.
- Keep direct visits and refreshes unchanged: no guide without create-route state.

**Non-Goals:**

- Persist guide visibility in local storage or backend metadata.
- Replace the anchors with a wizard or modal.
- Change manual reading or business assumptions APIs.

## Decisions

1. **Capture route state once on mount.**

   Product detail will initialize local state from `location.state.fromProductCreate` and then render from that local state plus the existing dismissal flag. Later hash-only navigations cannot erase the initial signal.

   Alternative considered: pass state through every anchor/link. That is brittle because normal anchor navigation does not naturally preserve React Router state and each new guide action would need special handling.

2. **Keep guide dismissal local.**

   Dismissing the guide hides it only for the current mounted page session. This matches the existing transient nature of the guide and avoids stale persistence.

## Risks / Trade-offs

- **Risk: The guide remains visible after the user clicks an anchor.** → This is intentional so the remaining setup actions stay available; the user can still close it.
- **Risk: Direct visits do not show the guide.** → This is unchanged and required because the guide is contextual to product creation.

## Migration Plan

Deploy frontend only. Rollback is the previous release.

## Open Questions

None.
