## 1. Frontend Display

- [x] 1.1 Render saved `research.decision.snapshot.keyReasons` in the comparison table decision column with a neutral `快照依据` label when saved reasons exist.
- [x] 1.2 Render saved `research.decision.snapshot.missingSignals` in the comparison table decision column with a neutral `快照缺口` label when saved gaps exist.
- [x] 1.3 Preserve empty or missing saved snapshot evidence state without inferred fallback text, stale filters, or scoring changes.

## 2. Tests

- [x] 2.1 Add comparison-table coverage for saved decision snapshot reasons and gaps display.
- [x] 2.2 Add source-isolation coverage proving comparison snapshot evidence uses saved decision snapshot arrays instead of current opportunity reasons, current missing signals, score factors, notes, review metadata, or render time.

## 3. Documentation And Validation

- [x] 3.1 Sync the main opportunity research workspace spec and developer/roadmap docs.
- [x] 3.2 Run focused frontend tests, frontend build, OpenSpec validation, and diff checks before archiving.
