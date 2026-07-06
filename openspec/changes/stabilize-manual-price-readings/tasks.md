## 1. Backend Snapshot Contract

- [x] 1.1 Add backend regression coverage for required-only manual snapshot creation.
- [x] 1.2 Add backend regression coverage for partial optional numeric manual snapshot creation.
- [x] 1.3 Confirm backend implementation already satisfies the snapshot creation contract, or fix it if regression tests fail.

## 2. Frontend Manual Reading Recovery

- [x] 2.1 Add a failing frontend test proving failed saves keep manual reading values.
- [x] 2.2 Add a frontend test proving successful saves clear manual reading values.
- [x] 2.3 Update `ManualReadingForm` to clear only after confirmed success and keep accessible failure feedback.

## 3. Verification And Release

- [x] 3.1 Run targeted backend and frontend tests for the new regressions.
- [x] 3.2 Run full backend/frontend quality gates and strict OpenSpec validation.
- [ ] 3.3 Commit, push, deploy, and smoke test production manual reading save.
