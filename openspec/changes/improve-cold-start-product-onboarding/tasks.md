## 1. Product Form Reliability

- [ ] 1.1 Add failing frontend tests for editing products with blank optional URL fields and locating product form fields by accessible labels
- [ ] 1.2 Implement product form optional string normalization, label associations, and hour-based interval copy
- [ ] 1.3 Add or update modal layout tests/styles so long product forms keep actions reachable in shorter viewports

## 2. Cold-Start UI Guidance

- [ ] 2.1 Add failing frontend tests for dashboard zero-product guidance linking to products
- [ ] 2.2 Add failing frontend tests for alerts empty states with and without products
- [ ] 2.3 Add failing frontend tests for opportunities empty states with no products and insufficient data
- [ ] 2.4 Implement contextual Dashboard, Alerts, and Opportunities cold-start guidance

## 3. Chat Agent Contract Alignment

- [ ] 3.1 Add failing backend tests proving Chat product tools reject unsupported platforms and blank product identifiers
- [ ] 3.2 Add failing backend tests proving Chat system prompt references real UI actions and supported platforms
- [ ] 3.3 Implement Chat tool schema/platform validation, product creation schema reuse, and prompt guidance

## 4. End-to-End Regression

- [ ] 4.1 Add Playwright test for product add/edit/manual-reading/delete loop and cold-start empty guidance
- [ ] 4.2 Add Playwright or backend regression coverage for Chat zero-data guidance avoiding unsupported UI entry names
- [ ] 4.3 Verify local lint, unit tests, build, OpenSpec validation, and targeted Playwright tests
