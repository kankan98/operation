## Context

The selected opportunity detail form now has explicit save guards for decision reasons, decision next actions, and latest action outcomes. Those guards protect manual workflow evidence quality, but the UI still leaves the user to infer why a save button is disabled.

This change is a small frontend-only improvement. It should explain existing local disabled conditions without changing request schemas, persistence, derived read models, scoring, action plans, or practice summaries.

## Goals / Non-Goals

**Goals:**

- Show a concise reason when decision save is unavailable.
- Show a concise reason when action outcome save is unavailable.
- Keep the reason derived during render from the same values used to disable saves.
- Prefer the first actionable blocker so the form stays compact.

**Non-Goals:**

- Do not add backend validation, schema changes, or database changes.
- Do not add semantic validation, quality scoring, AI coaching, reminders, alerts, streaks, training grades, analytics, action history, or new persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Compute `decisionSaveBlocker` and `actionOutcomeSaveBlocker` as simple render-time strings. This avoids additional React state and keeps the disabled condition and explanation easy to audit together.
- Render blocker hints only when saving is disabled for user-fixable evidence conditions. Pending mutation states can keep using the button label such as `保存中`.
- Use compact muted/error helper text near the existing caveat copy and buttons. The form is operational and dense, so a small inline hint is preferable to a separate banner.
- Keep hints deterministic and field-level: empty required text, over-limit text, missing/invalid completion date, future completion date, or missing research entry. Hints should not infer evidence quality.

## Risks / Trade-offs

- Duplicate ordering between disabled conditions and blocker text can drift. Mitigation: compute both from the same boolean values in the same component.
- More helper text can increase visual density. Mitigation: show only one blocker at a time and hide it when the save action is available or only pending.
- Users may expect every backend error to appear as a blocker. Mitigation: document this as local save readiness guidance, not a replacement for API validation.
