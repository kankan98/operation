## 1. Regression Coverage

- [x] 1.1 Add focused frontend tests for non-Chat mobile AppLayout navigation drawer open, close, route navigation, and Chat exclusion.
- [x] 1.2 Add a DonutChart empty-state regression test that verifies center content remains visible and Recharts sizing warnings are not emitted.

## 2. Mobile Navigation

- [x] 2.1 Add a mobile-only global navigation trigger to the non-Chat AppLayout header.
- [x] 2.2 Render the existing primary navigation items in a mobile overlay drawer with active state and translated labels.
- [x] 2.3 Implement close button, Escape close, backdrop close, route-change close, and focus return without changing desktop sidebar behavior.
- [x] 2.4 Confirm Chat pages keep their specialized mobile drawer controls and do not show the new non-Chat trigger.

## 3. Dashboard Chart Stability

- [x] 3.1 Render a static empty donut fallback when DonutChart data totals zero.
- [x] 3.2 Preserve the current Recharts path for non-empty data and keep center label/value rendering unchanged.

## 4. Verification And Release

- [x] 4.1 Run OpenSpec validation for `fix-mobile-navigation-chart-stability`.
- [x] 4.2 Run targeted frontend tests plus frontend lint/build and diff checks.
- [x] 4.3 Run Playwright coverage for mobile non-Chat navigation, Dashboard console cleanliness, and representative existing route flows.
- [x] 4.4 Commit the verified changes.
- [x] 4.5 Deploy to the server and re-run production health plus Playwright smoke checks.
