# Implementation Notes

## OpenSpec Validation Debt Baseline

Captured with `openspec validate --specs --json` before implementation.

Failing specs:

1. `amazon-scraper` - missing `## Purpose` / `## Requirements`
2. `frontend-type-safety` - missing `## Purpose` / `## Requirements`
3. `message-enhancement` - requirement 9 missing SHALL/MUST wording
4. `openapi-generation` - missing `## Purpose` / `## Requirements`
5. `price-snapshot-api` - missing `## Purpose` / `## Requirements`
6. `request-validation` - missing `## Purpose` / `## Requirements`
7. `response-validation` - missing `## Purpose` / `## Requirements`
8. `scheduler` - missing `## Purpose` / `## Requirements`
9. `scraper-api` - missing `## Purpose` / `## Requirements`
10. `session-grouping` - requirements 8 and 12 missing SHALL/MUST wording
11. `shared-schemas` - missing `## Purpose` / `## Requirements`
12. `swagger-ui` - missing `## Purpose` / `## Requirements`
13. `task-management-api` - requirements 10 and 11 missing SHALL/MUST wording
14. `task-overview-panel` - requirement 7 missing SHALL/MUST wording

## OpenSpec Validation Debt Result

After repairing main spec structure and normative wording, `openspec validate --specs --json` reports 68 passed and 0 failed specs. Two non-blocking warnings remain for brief Purpose text in specs that already validate.
