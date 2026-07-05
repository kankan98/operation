## Context

Decision traces already persist a backend-generated snapshot with score, confidence, recommendation, gate context, `keyReasons`, and `missingSignals`. The selected opportunity detail currently shows the saved decision status, user-authored reason, next action, decision age, and snapshot score/recommendation, but it hides the snapshot reason and gap arrays that explain the captured score at decision time.

This is a frontend-only display change. It reuses the existing decision read model and the current `DecisionPanel` selected detail surface.

## Goals / Non-Goals

**Goals:**

- Show saved `decision.snapshot.keyReasons` in the selected decision detail when the snapshot contains one or more reasons.
- Show saved `decision.snapshot.missingSignals` in the selected decision detail when the snapshot contains one or more missing signals.
- Keep the display clearly scoped to saved snapshot evidence rather than current opportunity evidence.
- Preserve empty states when the saved snapshot arrays are empty.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not recompute, infer, score, generate, or semantically validate decision snapshot evidence in the frontend.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, task history, or persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Update only the saved decision display inside `DecisionPanel`. This keeps decision form behavior, save blockers, mutation refreshes, and review metadata unchanged.
- Render snapshot evidence from `decision.snapshot.keyReasons` and `decision.snapshot.missingSignals` only. Empty arrays stay hidden so current opportunity `keyReasons` or `missingSignals` cannot be mistaken for the saved decision-time evidence.
- Use concise text labels (`快照依据 · ...` and `快照缺口 · ...`) inside the existing decision card instead of adding another nested card. This keeps the selected detail compact and avoids presenting snapshot evidence as editable user evidence.
- Limit displayed reason and gap lists to a small number of entries in the detail panel. The full snapshot remains in the decision model, while the UI stays scannable.

## Risks / Trade-offs

- Snapshot reason text may duplicate current opportunity reason text when the score has not changed. Mitigation: label the text as snapshot evidence so users can distinguish saved decision-time context from live opportunity context.
- Missing signal identifiers may be technical. Mitigation: preserve the existing raw snapshot field names instead of inventing friendly labels that could drift from backend semantics.
- A compact list may hide lower-priority evidence. Mitigation: use the detail panel for quick review only and do not modify the stored snapshot.
