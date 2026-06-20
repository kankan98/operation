# Validation Evidence

Change: `opportunity-research-workspace`

Date: 2026-06-20

## Results

| Gate | Command | Result |
| --- | --- | --- |
| Backend lint | `pnpm --filter backend lint` | Passed |
| Backend build | `pnpm --filter backend build` | Passed |
| Backend targeted tests | `pnpm --filter backend test -- opportunityResearchSchema opportunityResearch.api opportunityScoringService opportunities.api chatService openapi.opportunityResearch` | Passed: 6 files, 75 tests |
| Alerts cleanup regression check | `pnpm --filter backend test -- alerts.api` | Passed: 1 file, 12 tests |
| Full backend tests | `pnpm --filter backend test` | Passed: 42 files, 344 tests |
| Frontend relevant tests | `pnpm --filter frontend test -- Opportunities ProductDetail` | Passed: 2 files, 23 tests |
| Frontend build | `pnpm --filter frontend build` | Passed |
| OpenSpec change validation | `openspec validate --changes opportunity-research-workspace --json` | Passed: 4 changes, 0 failed |
| OpenSpec main spec validation | `openspec validate --specs --json` | Passed: 73 specs, 0 failed |

## Notes

- The first full backend test run failed in `alerts.api.test.ts` with `SqliteError: FOREIGN KEY constraint failed` during test cleanup. The cleanup order was updated to delete opportunity research, business signal, market signal, scrape, price snapshot, alert, and product rows in dependency order. The targeted alerts test and full backend suite passed after the fix.
- Backend test output still includes expected negative-path error logs from validation, missing product, missing job, and provider failure tests.
- Vitest reports a non-blocking deprecation warning for `test.poolOptions`, and the backend full test run reports a non-blocking missing sourcemap warning from `node-cron`.
- Frontend build completed without Vite oversized chunk warnings.
