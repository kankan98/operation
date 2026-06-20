# Validation Evidence

Change: `acquisition-queue-operations`
Date: 2026-06-20

## Commands Run

| Area | Command | Result |
|------|---------|--------|
| Backend lint | `pnpm lint` from `backend/` | Passed |
| Backend build | `pnpm build` from `backend/` | Passed |
| Backend targeted tests | `pnpm test acquisitionQueueSchema.test.ts acquisitionQueueBullMqAdapter.test.ts acquisitionQueueService.test.ts scrapeJobAttemptService.test.ts scraperService.test.ts schedulerService.test.ts scraper.api.test.ts chatService.test.ts openapi.acquisitionQueue.test.ts openapi.providerHealth.test.ts opportunityService.test.ts` from `backend/` | Passed: 10 files / 110 tests |
| Backend full tests | `pnpm test -- --run` from `backend/` | Passed: 46 files / 368 tests |
| Frontend relevant tests | `pnpm test -- Opportunities.operations.test.ts chatStore.test.ts --run` from `frontend/` | Passed: 2 files / 5 tests |
| Frontend build | `pnpm build` from `frontend/` | Passed |
| OpenSpec change validation | `openspec validate --changes acquisition-queue-operations --json` | Passed: 5 changes / 0 failed |
| OpenSpec main specs validation | `openspec validate --specs --json` | Passed: 73 specs / 0 failed |

## Notes

- Backend Vitest still reports the existing `test.poolOptions` deprecation warning and a `node-cron` sourcemap warning. Both are non-blocking and did not fail tests.
- Frontend build completed without chunk-size or dynamic import warnings.
- Queue health and job diagnostics caveats remain explicit: acquisition queue state describes data-source operations only and is not verified evidence of sales, demand, margin, ROI, or profitability.
