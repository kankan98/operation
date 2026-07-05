## Context

The selected decision detail now shows saved decision reason and saved next action labels. When a go/hold decision lacks a next action, the workspace already exposes `decisionReview.needsNextAction` and renders `待下一步` badges, but the saved decision evidence block itself has no next-action gap cue.

This is a frontend-only display change. It reuses existing review metadata and does not change the decision trace model or write behavior.

## Goals / Non-Goals

**Goals:**

- Show a compact `待补下一步` indicator inside selected decision detail when `decisionReview.needsNextAction` is true.
- Preserve saved `下一步 · ...` text when `decision.nextAction` exists.
- Avoid showing the gap for no-go decisions, undecided candidates, or decisions that do not need a next action.

**Non-Goals:**

- Do not generate, infer, validate, or score a next action.
- Do not change backend schemas, read models, database columns, exports, or Chat tools.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, action history, or persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Use `review?.needsNextAction` as the display gate. This keeps detail behavior aligned with backend-derived review semantics for go/hold decisions.
- Place the indicator in the saved decision card under the decision reason. This keeps it near the missing evidence rather than only in the summary badge row.
- Keep the existing `DecisionReviewBadges` output unchanged. The new label is a local evidence-gap cue, not a new filter or state.

## Risks / Trade-offs

- Users may see both `待下一步` and `待补下一步` for the same candidate. Mitigation: one is a review badge and the other is a local evidence-gap cue in the editable decision context.
- If review metadata is missing, the detail will not infer the gap from decision status alone. Mitigation: this intentionally avoids frontend inference and relies on the existing read model.
