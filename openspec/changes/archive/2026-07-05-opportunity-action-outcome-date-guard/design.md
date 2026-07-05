## Context

The opportunity workspace records the latest daily action outcome on a research entry. The current request schema validates action id, outcome text, and non-negative `completedAt`, while the frontend converts a local date input into a timestamp. Neither layer prevents future dates.

Because action outcomes feed practice coverage, exports, and review evidence, future completion dates should be rejected at the contract boundary and discouraged in the UI.

## Goals / Non-Goals

**Goals:**

- Reject future `completedAt` values in the shared action outcome request schema.
- Keep today valid so users can record work completed earlier today.
- Prevent future date selection in the opportunity workspace UI.
- Keep selected future dates from being submitted if a browser allows manual entry.

**Non-Goals:**

- No action history model or additional persistence.
- No reminders, scheduling, streaks, training grades, AI coaching, or analytics.
- No opportunity scoring, recommendation, market signal, or business metric changes.

## Decisions

1. Validate `completedAt <= Date.now()` in the shared request schema.

   Rationale: frontend safeguards are not enough, and the backend already uses the shared request schema for action outcome writes. Alternative considered: enforce only in the service method. Schema-level validation also protects OpenAPI/request validation tests and any future route reuse.

2. Use the date input's `max` attribute with today's local date.

   Rationale: the UI records day-level evidence, and today's date should remain valid. Alternative considered: compare timestamps only on save without input constraints; this gives weaker user feedback.

3. Disable save when the parsed selected date is in the future.

   Rationale: `max` can be bypassed by manual input or browser differences. A local guard keeps the mutation payload clean before it reaches the API.

## Risks / Trade-offs

- [Risk] Client and server clocks can differ. -> Mitigation: the backend remains authoritative; frontend validation is only a user-facing guard.
- [Risk] A local date at start-of-day may not represent exact completion time. -> Mitigation: the workflow intentionally captures day-level evidence, not exact timestamps.
