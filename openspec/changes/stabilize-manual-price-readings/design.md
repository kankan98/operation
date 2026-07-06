## Context

The product detail first-setup guide sends users to the manual reading form so a newly created product can get its first trusted price observation. Production Playwright testing on `http://203.195.161.93/products/8d0de649-964d-4172-b7a0-c167a1e21c29` used request interception to simulate a failed save. That exposed a frontend recovery failure: the form cleared the entered price, BSR, rating, and review count after the failed request.

A follow-up real save after removing the route interception returned 201 and refreshed price statistics. Backend route regression tests are added to preserve that contract, but the implementation fix is in the frontend component. The component currently clears local state immediately after calling `onSubmit`, before the React Query mutation result is known.

## Goals / Non-Goals

**Goals:**
- Preserve form values on failed saves and clear them only after a confirmed success.
- Cover backend snapshot creation with regression tests and frontend failure recovery with component tests.

**Non-Goals:**
- Redesign the product detail page layout.
- Change opportunity scoring weights or provider acquisition behavior.
- Fully localize every remaining English scoring label in this change.

## Decisions

1. Keep the `ManualReadingForm` callback API callback-based, but add success-edge clearing in the component.

   The parent already exposes `isSuccess`, `isError`, and `isSaving` from React Query. Clearing on the transition from not-success to success avoids changing every caller to an async contract. The alternative was making `onSubmit` return a promise, but the existing hook usage does not require that churn.

2. Keep failed-save feedback generic but accessible.

   The current user-facing message is sufficient for this focused fix. The failure state must be visible and the input must remain available for retry.

3. Keep backend code unchanged unless regression tests reveal a real route failure.

   Real production and local integration tests confirm snapshot creation succeeds. Backend route tests remain valuable because this endpoint is critical to the first-setup workflow.

## Risks / Trade-offs

- `isSuccess` can remain true after an earlier success -> Clear only after a submit has been attempted while the form has pending values, and reset validation/error state when the user edits.
- Backend route tests need isolated database state -> Use the existing temporary SQLite migration pattern from route tests.
