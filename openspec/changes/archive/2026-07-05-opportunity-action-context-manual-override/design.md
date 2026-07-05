## Context

The action outcome form receives transient action context from daily actions or practice buckets. It already lets users choose another action type before saving, and completion criteria/prompts follow that current selection. The visible context chip still only shows the original context action, so a manual override is not obvious.

## Goals / Non-Goals

**Goals:**

- Detect when the current selected action type differs from the transient context action id.
- Show both the original context action and the current action type that will be saved.
- Keep completion criteria, evidence prompt, and save payload tied to the selected action type.
- Preserve saved latest action outcome priority.

**Non-Goals:**

- No backend, schema, OpenAPI, read-model, persistence, scoring, or dependency changes.
- No semantic validation, reminders, scheduled work, action history, analytics, AI coaching, or training grades.

## Decisions

- Derive override state in `DecisionPanel` from `activeActionContext`, `lastActionOutcome`, and local `actionId`. This is the smallest source of truth and matches the existing form state.
- Keep the context chip visible during overrides, but label the original context as preselected and add an explicit current-action label. This keeps the user aware of both the workflow entry point and the action that will be saved.

## Risks / Trade-offs

- The override indicator disappears when transient context is cleared by manual filters. That matches existing context lifecycle behavior.
- The UI adds one more small label to an already dense panel; tests should focus on behavior and keep the copy short.
