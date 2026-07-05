## Context

Decision traces persist a snapshot with the recommendation gate that was present when the user saved the decision. The selected opportunity detail now shows saved snapshot score, recommendation, key reasons, and missing signals, but it still omits saved gate state. The live opportunity gate can change after new evidence is entered, so the decision detail needs a small saved-snapshot gate display to avoid losing decision-time context.

This is a frontend-only display change. It reuses the existing decision snapshot and the current `DecisionPanel` surface.

## Goals / Non-Goals

**Goals:**

- Show saved snapshot gate status when the saved gate had applied, blocked, caution, reason, signal, or next-action context.
- Show saved snapshot gate reasons, signals, and next actions in compact neutral text.
- Keep clear/empty snapshot gates hidden so the detail panel does not add noise.
- Keep the display scoped to the saved decision snapshot rather than the current live opportunity gate.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not recompute gate thresholds or infer saved gate context from current opportunity data.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, task history, or persistence.
- Do not change opportunity score, confidence, recommendation, live gates, market signals, business metrics, or factor contributions.

## Decisions

- Update only the saved decision display inside `DecisionPanel`. The existing live `RecommendationGatePanel` remains responsible for current candidate gate state.
- Render from `decision.snapshot.recommendationGate` only. If the snapshot gate is clear and has no applied state, reasons, signals, or next actions, render nothing.
- Use concise labels (`快照门控`, `快照门控原因`, `快照门控信号`, `快照门控下一步`) inside the existing decision card instead of adding another nested card.
- Limit reasons, signals, and next actions to a small count for scannability while preserving the full snapshot object in the model.

## Risks / Trade-offs

- Saved gate context may differ from the live gate panel. Mitigation: prefix labels with `快照` to make decision-time context explicit.
- Gate reasons can be long. Mitigation: show a bounded number of entries in compact text and avoid changing the stored snapshot.
- Clear gates are hidden, so users may not see an explicit "no gate" state. Mitigation: the existing snapshot score/recommendation badge already covers normal clear decisions without extra noise.
