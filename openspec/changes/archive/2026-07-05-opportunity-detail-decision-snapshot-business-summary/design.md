## Context

Decision snapshots already persist `businessSignals` with completeness, missing business signals, optional metrics, and caveats. The selected decision detail displays saved snapshot score, confidence, recommendation, reasons, missing signals, and gate context, but not whether the saved decision had complete business assumptions.

This is a frontend-only display change. It reuses the existing decision snapshot object and the current `DecisionPanel` saved decision card.

## Goals / Non-Goals

**Goals:**

- Show saved business completeness from `decision.snapshot.businessSignals.completeness`.
- Show saved business missing signals from `decision.snapshot.businessSignals.missingSignals` when present.
- Make the labels clearly scoped to the saved decision snapshot rather than the current live opportunity business signals.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not calculate, infer, score, or validate business metrics in the frontend.
- Do not display ROI, margin, or profit values in the compact decision card in this slice.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, task history, or persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Add compact text rows to the existing saved decision card instead of a nested card. This keeps the decision snapshot context scannable and avoids visually elevating proxy assumptions into verified facts.
- Render business completeness unconditionally for saved decisions because `businessSignals` is part of the decision snapshot schema.
- Render business missing signals only when the saved snapshot array has values, and limit the visible list to a small number of entries.
- Read only `decision.snapshot.businessSignals`, not current `opportunity.businessSignals`, so live business edits do not rewrite historical decision context.

## Risks / Trade-offs

- Raw missing signal IDs may be technical. Mitigation: preserve backend field names instead of inventing labels that could drift from API semantics.
- Compact display omits ROI and margin. Mitigation: this slice focuses on decision-time evidence completeness; detailed live business metrics remain in the existing business signal section.
