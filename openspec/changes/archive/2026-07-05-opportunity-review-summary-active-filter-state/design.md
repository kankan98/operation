## Context

Review summary cards now apply existing review filters, but the cards do not show which card matches the current queue view. The page already owns all filter state, so active state can be derived locally without new data or persistence.

## Goals / Non-Goals

**Goals:**

- Show visual active state for the review summary card that matches the current pure review-summary filter view.
- Expose the same state through `aria-pressed`.
- Avoid marking a card active when additional filters make the candidate list narrower than that summary queue.
- Cover active and non-active states in focused frontend tests.

**Non-Goals:**

- No new filters, enums, backend endpoints, OpenAPI, persistence, scoring, market signals, business metrics, analytics, reminders, tasks, or automation.
- No hidden history of which card was clicked; active state is derived from current UI filter state only.

## Decisions

- Derive `activeReviewSummaryFilter` in the page and pass it into `ReviewSummaryStrip`.
  - Rationale: the parent already owns `workspaceMode`, `shortlistedOnly`, decision review filters, practice filters, and discovery filters.
  - Alternative considered: local state inside `ReviewSummaryStrip`; rejected because it could become stale when the user changes filters elsewhere.
- Only set active state when the view is a pure review summary queue: review mode, researched-only, no decision status, no research status/tag, no practice filters, and no discovery filters that narrow the queue.
  - Rationale: this avoids highlighting a card when the visible list is no longer the full summary queue.
  - Alternative considered: highlight whenever `decisionReview` matches; rejected as misleading with extra filters.
- Use `aria-pressed` on the existing card buttons.
  - Rationale: the controls behave like toggleable queue selectors and need a programmatic selected state.

## Risks / Trade-offs

- The pure-view check is conservative and may leave no card active in some useful filtered contexts -> mitigate by preferring not to overstate what the current list represents.
