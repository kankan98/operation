## Context

Opportunity rows already expose `research.lastActionOutcome`, and the list/detail views display this latest outcome as workflow practice evidence. The comparison table currently receives the same opportunity row shape but only shows product, score, recommendation, research state, decision, acquisition, market, business, and missing signals.

## Goals / Non-Goals

**Goals:**

- Show saved latest action outcome context in the comparison table when present.
- Keep the display compact enough for side-by-side scanning.
- Reuse existing labels and recency formatting from the opportunity workspace.

**Non-Goals:**

- Do not create an action history timeline or persist additional outcomes.
- Do not infer outcomes from notes, decisions, review metadata, daily action plan items, or practice summary counts.
- Do not add reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or scoring inputs.

## Decisions

- Add a comparison table column labelled `行动结果`.
  - Rationale: action outcome is separate workflow evidence and should not be mixed into the decision column.
  - Alternative considered: append outcome text under the decision column. Rejected because decision evidence and execution evidence have different semantics.
- Render only `item.research.lastActionOutcome` fields.
  - Rationale: this is saved user workflow evidence already returned in the read model.
  - Alternative considered: derive missing states from practice summary or daily action plan. Rejected because that would infer evidence from aggregate metadata.
- Use existing `dailyActionLabels` and `formatActionOutcomeRecency`.
  - Rationale: keeps wording consistent with row and selected-detail views and avoids new formatting logic.

## Risks / Trade-offs

- Wider comparison table -> increase table minimum width slightly and keep outcome text line-clamped.
- Latest-only outcome can omit earlier context -> acceptable because the current model intentionally stores latest outcome only.
