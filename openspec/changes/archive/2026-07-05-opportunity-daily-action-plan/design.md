## Context

The opportunity workspace has become a manual-first research surface: users can shortlist products, add assumptions, record decisions, review stale or incomplete decisions, and see active queue counts. The next gap is operating guidance. A count such as "3 need next action" is useful, but it still forces the user to decide what habit to practice first.

This change should convert the existing summary and decision review metadata into a compact daily action plan. It should organize the user's own research queue; it must not infer demand, schedule reminders, create durable tasks, or alter opportunity scoring.

## Goals / Non-Goals

**Goals:**

- Add a backend read model that returns ordered daily action items for active, non-archived opportunity research entries.
- Make each action item actionable by including the existing filter state the workspace can apply.
- Render the action plan in the opportunity workspace near the review summary.
- Keep all action plan language scoped to workflow practice and operating discipline.

**Non-Goals:**

- Adding a new task table, reminder system, notification engine, or calendar integration.
- Persisting daily snapshots or historical completion analytics.
- Creating AI-generated coaching text.
- Changing opportunity score, confidence, recommendation, recommendation gate, factor weights, market signals, or business assumptions.

## Decisions

### Derive actions from current research metadata

The action plan will reuse the same active research metadata and `decisionReview` fields used by the summary. This keeps action counts aligned with review filters and avoids duplicating stale/needs-action logic.

Alternative considered: compute a separate planning model from score and recommendation. That would be tempting, but it would mix workflow discipline with opportunity quality signals and increase the risk that the UI presents plan items as score evidence.

### Keep the action vocabulary deterministic

The initial action item set will be small and stable:

- `add_next_action`: go/hold decisions missing a next action.
- `review_stale_decisions`: decisions that crossed the stale review threshold.
- `decide_candidates`: active undecided research entries.
- `continue_research`: active entries still in the research workflow state.

The service will return only actions with a positive count, ordered by fixed priority. This gives the user a daily work queue without introducing ML ranking or personalized heuristics.

### Use existing filters as the action target

Each action item will include a suggested filter payload such as `decisionReview=needs_action`, `decisionReview=stale`, or `decisionReview=undecided`. The frontend can apply that filter and switch to review mode instead of creating a second task execution system.

Alternative considered: return product IDs directly. That would make the plan feel precise, but it would duplicate list/query behavior and become stale faster than filter-driven navigation.

## Risks / Trade-offs

- Action labels may be mistaken for automated advice -> Mitigate with a response caveat and UI labels that call them workflow actions, not demand or score signals.
- Fixed priorities may not match every user session -> Keep the list small and deterministic; future changes can add user preferences after observing actual use.
- Counts can change after filters are applied -> Acceptable because the plan is a live read model over active research state, not a persisted daily snapshot.

## Migration Plan

1. Add shared schemas and types for action plan responses.
2. Add a service method and API endpoint that derive action items from active research metadata.
3. Add frontend API/hook support and render the action plan in the opportunity workspace.
4. Add focused backend/frontend tests and update docs/roadmap.
