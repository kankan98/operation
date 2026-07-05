## 1. Contract

- [x] 1.1 Update shared action outcome request schemas to reject future `completedAt` values.
- [x] 1.2 Add schema tests for present/past accepted and future rejected completion timestamps.

## 2. Backend API

- [x] 2.1 Add API coverage proving future-dated action outcomes are rejected with validation feedback.
- [x] 2.2 Verify accepted action outcome writes still preserve non-scoring behavior.

## 3. Frontend UI

- [x] 3.1 Add a max date and future-date save guard to the opportunity workspace action outcome form.
- [x] 3.2 Add frontend tests for future-date prevention and valid date submission.

## 4. Documentation and Specs

- [x] 4.1 Update opportunity research workspace documentation and main spec with date guard semantics.
- [x] 4.2 Update roadmap/current change state for this change.

## 5. Verification

- [x] 5.1 Run focused backend schema/API tests.
- [x] 5.2 Run focused frontend Opportunities tests and frontend build.
- [x] 5.3 Run OpenSpec change validation, main spec validation, and whitespace check.
