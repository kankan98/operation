## Context

Practice summary controls can already apply existing practice filters (`actionOutcome=with|without` and `actionId=<daily action id>`). They do not currently show which practice filter is active, so users must infer the state from the top filter badge or list results.

## Goals / Non-Goals

**Goals:**

- Show visual active state for the practice summary control that matches the current pure practice filter view.
- Expose the same state through `aria-pressed`.
- Avoid marking practice summary controls active when additional filters narrow the list beyond the practice coverage view.
- Cover active, inactive, and narrowed-view states with focused frontend tests.

**Non-Goals:**

- No backend, schema, OpenAPI, filter enum, persistence, scoring, recommendation, analytics, reminder, task, streak, training grade, or AI coaching changes.
- No history of which practice control was clicked; active state is derived from current UI filter state only.

## Decisions

- Derive `activePracticeSummaryFilter` in the parent page and pass it into `PracticeSummaryStrip`.
  - Rationale: the parent owns workspace mode, discovery filters, research filters, review filters, and practice filters.
  - Alternative considered: local state inside the strip; rejected because manual filter changes could make it stale.
- Only set active state when the view is a pure practice summary filter: discover mode, exactly one practice filter, no shortlist/research/review/discovery filters, and no operational narrowing.
  - Rationale: this prevents summary controls from claiming a narrowed list is the full practice coverage queue.
  - Alternative considered: highlight whenever `actionOutcome` or `actionId` matches; rejected as misleading with extra filters.
- Use `aria-pressed` on the existing practice buttons and action bucket buttons.
  - Rationale: the controls behave like queue selectors and need a programmatic selected state.

## Risks / Trade-offs

- The pure-view check can leave no active control when a user combines useful filters -> mitigate by prioritizing accurate state over overstating what the visible list represents.
