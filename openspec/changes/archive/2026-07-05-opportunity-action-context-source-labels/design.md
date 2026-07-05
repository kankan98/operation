## Context

The opportunity workspace already stores transient `activeActionContext` with an action id and a source of either `daily_action` or `practice_bucket`. The action outcome form uses that context to preselect the action type for candidates without saved outcomes, but the visible context chip only says that workflow action context exists.

## Goals / Non-Goals

**Goals:**

- Show whether the transient action context came from a daily action plan item or a practice action bucket.
- Keep the existing action id prefill, completion criteria, evidence prompt, and saved outcome priority behavior unchanged.
- Cover daily action, practice bucket, and saved-outcome behavior with focused frontend tests.

**Non-Goals:**

- No backend, schema, OpenAPI, read-model, persistence, scoring, or dependency changes.
- No reminders, scheduled work, action history, analytics, habit tracking, AI coaching, or training grades.

## Decisions

- Derive the displayed source label from the existing `activeActionContext.source` value. This avoids another state field and keeps the label aligned with the current transient context lifecycle.
- Render the source label only when transient context is visible and no saved latest action outcome exists. Saved outcomes remain the source of truth and should not be visually overridden.

## Risks / Trade-offs

- The label disappears when context is cleared by manual filters. This is intentional and matches the current transient context lifecycle.
- The source label is frontend-only and does not survive refreshes. That is acceptable because the underlying context is also transient.
