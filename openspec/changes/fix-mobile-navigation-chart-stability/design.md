## Context

The production Playwright audit covered the deployed app across Dashboard, Products, Opportunities, Alerts, Chat, and Settings on desktop and mobile viewports. The main Chat flow was already stabilized by the prior change, but two cross-module issues remain outside Chat:

- Mobile non-Chat routes hide the persistent sidebar below `md` and do not expose a replacement global navigation entry.
- Dashboard renders the monitoring overview donut through Recharts even when all product counts are zero, which emits a `width(-1) and height(-1)` warning in production.

Both issues are stability defects rather than new product scope. The repair should preserve the current navigation model, existing route list, and Chat page's specialized mobile drawers.

## Goals / Non-Goals

**Goals:**
- Give every non-Chat mobile page a visible, keyboard-accessible global navigation trigger.
- Reuse the existing `AppLayout` route and translation source for the mobile drawer so navigation labels stay consistent.
- Support close button, Escape close, backdrop close, route-change close, and focus return for the mobile drawer.
- Preserve desktop/tablet persistent sidebar behavior and Chat's existing mobile session/task drawers.
- Render Dashboard's empty monitoring overview without mounting a zero-size Recharts container.
- Add focused regression tests and Playwright coverage for the audited paths.

**Non-Goals:**
- Redesign the desktop sidebar or change the route hierarchy.
- Replace Chat's specialized layout or mobile controls.
- Add authentication, user profile behavior, or a new settings model.
- Rewrite charting across the app.

## Decisions

1. **Add the mobile drawer in shared `AppLayout`.**
   - Recommended approach: add a small header menu button on non-Chat pages below `md`, then render the same `navItems` in an overlay drawer.
   - Alternative: duplicate menu logic in every page. Rejected because it spreads navigation rules across pages and would miss future routes.
   - Alternative: expose the desktop sidebar as an off-canvas version at all breakpoints. Rejected because Chat already owns a separate mobile interaction model, and the fix should not alter Chat.

2. **Close the drawer on navigation and common dismissal gestures.**
   - `AppLayout` already observes `location`; it can close the drawer when the pathname changes.
   - Escape/backdrop/close button keep pointer and keyboard flows predictable.
   - The trigger ref should receive focus after closing when it still exists.

3. **Use a static empty donut fallback.**
   - When total value is zero, `DonutChart` should render a fixed-size CSS/SVG fallback rather than `ResponsiveContainer`.
   - This keeps the empty visual and center labels but avoids Recharts measurement warnings.
   - Non-empty chart data continues through the current Recharts implementation.

## Risks / Trade-offs

- [Risk] Drawer focus handling can fight route navigation. -> Mitigation: return focus only when closing without a route change and the trigger is still mounted.
- [Risk] Adding labels to the mobile drawer could create duplicate active nav elements in larger viewports. -> Mitigation: hide the drawer trigger and drawer below/above breakpoints using existing responsive classes and close on route changes.
- [Risk] Static empty chart fallback differs slightly from Recharts' empty segment. -> Mitigation: match the same dimensions and muted color, and keep center content unchanged.

## Verification Plan

1. Add component-level tests for mobile non-Chat navigation trigger, drawer open/close behavior, and route navigation.
2. Add a chart regression test proving empty donut render does not call Recharts warning paths and still displays center labels.
3. Run OpenSpec validation for this change.
4. Run targeted frontend tests, frontend lint, frontend build, and diff whitespace checks.
5. Use Playwright against a production-like URL to verify mobile navigation on non-Chat pages, Dashboard console cleanliness, and representative existing flows.
6. Deploy through the existing release/current symlink process and repeat health plus Playwright smoke checks on production.
