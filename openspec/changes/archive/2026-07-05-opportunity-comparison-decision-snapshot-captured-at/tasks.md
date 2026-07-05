## 1. Frontend Display

- [x] 1.1 Render saved `research.decision.snapshot.capturedAt` in the comparison table decision column with a neutral `快照时间` label.
- [x] 1.2 Preserve missing-decision state without inferred snapshot-time fallback text, stale filters, or scoring changes.

## 2. Tests

- [x] 2.1 Add comparison-table coverage for saved decision snapshot capture time display.
- [x] 2.2 Add source-isolation coverage proving comparison snapshot time uses saved decision snapshot capture time instead of decision record time, decision update time, current opportunity data, review metadata, or render time.

## 3. Documentation And Validation

- [x] 3.1 Sync the main opportunity research workspace spec and developer/roadmap docs.
- [x] 3.2 Run focused frontend tests, frontend build, OpenSpec validation, and diff checks before archiving.
