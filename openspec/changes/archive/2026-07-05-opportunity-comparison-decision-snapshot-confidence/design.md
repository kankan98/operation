## Context

The comparison table already shows current confidence in the score column and saved decision snapshot score/recommendation in the decision column. Selected detail also shows `快照置信度`, but comparison users cannot currently see whether each saved decision snapshot was high or low confidence while reviewing candidates side by side.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot confidence in the comparison table when a decision exists.
- Keep the saved snapshot confidence visually distinct from current confidence.
- Reuse existing percentage formatting used elsewhere in the opportunity workspace.

**Non-Goals:**

- Do not compute confidence drift or freshness warnings.
- Do not add stale filters, reminders, alerts, scheduled actions, analytics, AI coaching, training grades, or action history.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Render snapshot confidence inside the existing decision column, next to the saved snapshot score/recommendation evidence.
  - Rationale: it is decision-time evidence, not the current opportunity confidence.
  - Alternative considered: add a new column. Rejected because the comparison table is already wide and this value belongs with decision evidence.
- Read only `item.research.decision.snapshot.confidence`.
  - Rationale: prevents mixing saved decision-time evidence with current confidence.
  - Alternative considered: fallback to current confidence. Rejected because it would hide historical evidence differences.

## Risks / Trade-offs

- The decision cell becomes slightly denser -> keep the confidence as a compact neutral badge.
- Users still need selected detail for full snapshot context -> acceptable for the comparison scanning surface.
