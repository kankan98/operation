## Context

The opportunity research workspace already shows a daily action plan whose items apply existing review or discovery filters. Review summary cards and practice summary controls now expose display-only active states when their filters exactly match the current UI state. Daily action items still lack the same orientation feedback after a user enters a queue from the action plan.

## Goals / Non-Goals

**Goals:**

- Derive daily action active state entirely from current frontend UI state and the transient action context.
- Mark the matching daily action item with visual active styling and `aria-pressed=true`.
- Keep inactive or narrowed daily action views unpressed.
- Cover active, inactive, and narrowed-view behavior with focused page tests.

**Non-Goals:**

- No backend, schema, OpenAPI, read-model, persistence, or dependency changes.
- No scoring, recommendation, market signal, business metric, analytics, reminder, scheduled task, or automation changes.
- No new action history, task system, AI coaching, training grade, or habit tracking.

## Decisions

- Use an explicit `activeDailyActionId` derived in `Opportunities.tsx` instead of storing another state value. This keeps the UI display tied to the same filter state that drives the list.
- Require both an exact filter match and `activeActionContext.source === 'daily_action'`. Exact filters prevent a narrowed list from being presented as the whole action queue; the source check prevents practice bucket selections with the same action id from lighting up daily action plan items.
- Pass only the active action id into `DailyActionPlanPanel`. The panel remains presentational and does not need to understand all workspace filters.

## Risks / Trade-offs

- Active state can disappear after a manual filter edit even if the action item's original filter subset still matches. This is intentional to avoid overstating a narrowed view; tests should cover that behavior.
- The active state depends on transient frontend context, so it will not survive a refresh. That matches existing action context behavior and avoids persistence scope creep.
