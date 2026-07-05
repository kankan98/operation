## Context

The opportunity workspace already has daily actions, fixed playbook guidance, latest action outcomes, and a practice summary. The summary answers whether the active queue has execution evidence, but it does not yet help the user navigate directly to entries that need follow-up.

The project direction remains manual-first and single-user. Practice metadata is a workflow aid for improving operator discipline; it must not become scoring input, a habit tracker, a reminder system, or an analytics product.

## Goals / Non-Goals

**Goals:**

- Add explicit filters for latest action outcome coverage.
- Support both product opportunity list filters and opportunity research list filters.
- Let the practice summary strip apply these filters from coverage cards and action buckets.
- Keep labels and caveats scoped to workflow practice evidence.

**Non-Goals:**

- Adding action outcome history or trend analytics.
- Adding reminders, due dates, streaks, training grades, AI coaching, or task persistence.
- Changing action plan priority, decision review rules, opportunity scoring, market signals, business metrics, or export semantics.
- Adding database migrations.

## Decisions

### Use two small query fields

The list contracts will accept `actionOutcome=with|without` and `actionId=<daily action id>`.

Alternative considered: one combined enum with values like `missing`, `add_next_action`, and `continue_research`. Separate fields are easier to compose with existing research filters and map directly to UI controls.

### Filter from existing metadata

The backend will filter product opportunities and research entries using `lastActionOutcome`/`lastActionId` values already stored on `opportunity_research_entries`.

Alternative considered: add a derived practice queue endpoint. That would duplicate list behavior and create another navigation surface. Reusing existing list filters keeps the workspace simpler.

### Keep practice filters out of scoring

Filtering can change which rows are returned, but it must not mutate or recompute scores. Tests should compare score output before and after action outcome metadata changes to keep this invariant visible.

Alternative considered: use practice completion as confidence input. That would blur workflow discipline with market/business evidence and conflicts with the current scoring caveats.

## Risks / Trade-offs

- Users may interpret "without outcome" as poor product quality -> labels and caveats must frame it as missing execution evidence only.
- Combining `actionOutcome=without` with `actionId` is contradictory -> the backend should return no rows rather than silently ignoring one field.
- The UI can accumulate too many filters -> practice filters should appear as compact controls near the practice summary, not as a new dashboard.

## Migration Plan

- No database migration is required.
- Existing entries without latest action outcome are immediately filterable as `actionOutcome=without`.
- Rollback removes query fields and UI controls; persisted outcome metadata remains unchanged.

## Open Questions

- None for this slice.
