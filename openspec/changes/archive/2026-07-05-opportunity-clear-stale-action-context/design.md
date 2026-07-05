## Context

The opportunity workspace keeps `activeActionContext` as transient UI state after a user selects a daily action plan item or practice action bucket. The action outcome form uses that context to preselect an action id for candidates without a saved latest outcome, while saved outcomes still take priority.

Current filter controls can change the candidate set without clearing the transient context. That can carry a stale action id into a later manual filter path and make the form look like it still belongs to the earlier workflow action.

## Goals / Non-Goals

**Goals:**

- Clear transient action context when the user manually changes workspace mode, discovery/review filters, shortlist-only, or sort controls.
- Preserve context when the user intentionally selects a daily action or practice bucket.
- Preserve saved latest outcome behavior: saved outcome action ids must still override transient context.

**Non-Goals:**

- Do not change backend APIs, schemas, storage, exports, or scoring.
- Do not add reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history.
- Do not remove practice filters or daily action context prefill.

## Decisions

- Add a local clear helper in the Opportunities page and call it from manual filter/mode handlers.
  - Rationale: the context is local UI state, so the lifecycle boundary belongs beside the controls that can make it stale.
  - Alternative considered: clear context whenever selected product changes. That would break the intended flow where an action plan selection should prefill the next selected candidate.

- Keep practice bucket and daily action handlers as the only context-setting paths.
  - Rationale: those are explicit workflow action selections. Manual filters are navigation refinements and should not imply an action id.
  - Alternative considered: infer action context from filters such as `decisionReview=needs_action`. That would duplicate backend action-plan logic and make manual filter edits behave like hidden action selections.

- Reset the outcome form through the existing `useEffect` dependency on `contextActionId`.
  - Rationale: no new form state path is needed; when context becomes `null`, candidates without saved outcome fall back to the default action id.
  - Alternative considered: imperative reset from filter handlers. That would couple outer filter controls to inner form state.

## Risks / Trade-offs

- Users who apply a daily action and then tweak filters will lose prefill context -> acceptable because the manual filter edit means the original action context may no longer match the candidate set.
- Some manual filter changes may not actually change the candidate set -> clearing context is still safer than retaining a potentially stale workflow action id.
