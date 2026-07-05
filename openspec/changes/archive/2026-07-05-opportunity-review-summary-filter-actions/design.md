## Context

The opportunity research workspace already has derived review summary counts and existing review filters (`all`, `undecided`, `needs_action`, `stale`). Daily action and practice summary surfaces already apply filters from their cards/buttons, but review summary cards remain read-only.

## Goals / Non-Goals

**Goals:**

- Let users click review summary cards to apply existing review filters.
- Keep the action local to the current opportunity workspace UI state.
- Clear transient action context when review summary navigation changes the candidate set.
- Cover the card-to-filter behavior with focused frontend tests.

**Non-Goals:**

- No new filter enums, backend endpoints, OpenAPI contract, persistence, scoring, market signal, or business metric behavior.
- No reminder, alert, schedule, stale-threshold, task-history, analytics, streak, training grade, or AI coaching system.
- No automatic decision edits, action outcome writes, or hidden state persistence.

## Decisions

- Add a review-summary filter callback from the page into `ReviewSummaryStrip`.
  - Rationale: the parent owns workspace filters and transient action context, while the strip only renders summary cards.
  - Alternative considered: placing navigation logic inside the strip; rejected because it would duplicate parent state decisions and make the component less reusable.
- Render loaded summary cards as buttons with explicit aria labels.
  - Rationale: card-sized buttons preserve the current visual density while making the controls keyboard-accessible and testable.
  - Alternative considered: adding separate text links under cards; rejected because it adds extra UI while the card itself is the natural target.
- Reuse existing review filter values instead of introducing new filters.
  - Rationale: the backend and frontend already understand the queue states; this slice should only improve navigation.

## Risks / Trade-offs

- The active research card could be interpreted as a new data view -> mitigate by mapping it to existing `review/all` plus researched-only filter state.
- Card buttons may visually resemble static cards -> mitigate with button semantics, hover/focus styles, and accessible labels.
