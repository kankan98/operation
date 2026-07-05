## Context

The selected opportunity decision detail already displays the current decision status, saved reason, next action, and score snapshot. Row-level summaries now label saved decision evidence as `决策依据 · ...` and `下一步 · ...`, but the selected detail still presents the reason and next action as unlabeled paragraphs.

This is a frontend-only display consistency change. It reuses the existing selected decision object and does not change backend decision trace storage.

## Goals / Non-Goals

**Goals:**

- Label the saved selected-detail decision reason as `决策依据 · ...`.
- Label the saved selected-detail decision next action as `下一步 · ...` when it exists.
- Preserve the existing state when no next action exists.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not generate, infer, score, or validate decision evidence semantically.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, task history, or persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Update only the saved decision display inside `DecisionPanel`. This keeps the form behavior, save blockers, badges, and review metadata unchanged.
- Use the same visible labels as row summaries. This keeps scanning language consistent between list and detail without introducing another formatter.
- Keep the next action conditional on `decision.nextAction`. Missing next action continues to be represented by existing review metadata such as `待下一步`.

## Risks / Trade-offs

- The label may duplicate row summary text when the selected row is visible. Mitigation: the detail panel is the review/edit surface, so explicit labels are useful there as well.
- Tests that previously matched row-level labels could accidentally pass without checking detail. Mitigation: add count-based assertions so row and detail copies are both present.
