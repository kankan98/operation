## Context

Opportunity comparison rows already include `research.decision.snapshot`, and selected detail already displays the saved snapshot score, recommendation, confidence, and supporting evidence. The comparison table currently shows the current score and recommendation in separate columns plus saved decision status, reason, and next action in the decision column.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot score and recommendation in the comparison table when a decision exists.
- Keep the saved snapshot visually distinct from current score and recommendation.
- Reuse existing recommendation labels and badge variants.

**Non-Goals:**

- Do not recompute historical scores or compare drift automatically.
- Do not add alerting, stale filters, analytics, AI coaching, training grades, action history, or scheduled tasks.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Render snapshot summary inside the existing decision column.
  - Rationale: snapshot score and recommendation are decision evidence, not current opportunity ranking.
  - Alternative considered: add a separate snapshot column. Rejected for this small slice because the table is already wide and the value is tightly coupled to the decision.
- Read only `item.research.decision.snapshot`.
  - Rationale: this preserves saved decision-time evidence and prevents accidental use of current score or recommendation.
  - Alternative considered: fallback to current score when snapshot is missing. Rejected because that would blur current and historical evidence.

## Risks / Trade-offs

- The decision cell becomes denser -> keep the snapshot line compact with a small badge and short label.
- Users still need selected detail for full snapshot evidence -> acceptable because comparison is a scanning surface.
