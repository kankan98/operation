## Context

Selected opportunity detail already shows saved decision snapshot gate context from `decision.snapshot.recommendationGate`. The comparison table shows other saved decision snapshot evidence, but it does not expose whether the saved recommendation was blocked or downgraded by a gate at decision time.

## Goals / Non-Goals

**Goals:**

- Show saved snapshot gate status in the comparison table when saved gate context exists.
- Keep saved snapshot gate context distinct from the current opportunity recommendation gate.
- Preserve clear or empty snapshot gate state without fallback text.

**Non-Goals:**

- Do not add current gate drift comparison, stale filters, or gate analytics.
- Do not add reminders, alerts, scheduled actions, AI coaching, training grades, or action history.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Render a compact `快照门控` badge inside the existing comparison decision column.
  - Rationale: the gate is saved decision-time evidence and belongs next to the saved snapshot score, recommendation, confidence, and capture time.
  - Alternative considered: add a new comparison column. Rejected because the table is already wide and gate context is supporting decision evidence.
- Show the gate only when the saved snapshot gate has meaningful context: non-clear status, `applied`, reasons, signals, or next actions.
  - Rationale: this matches selected detail behavior and avoids noisy clear-state labels.
  - Alternative considered: always show clear gate state. Rejected because it makes the dense comparison table harder to scan.
- Read only `item.research.decision.snapshot.recommendationGate`.
  - Rationale: prevents mixing saved gate evidence with the current opportunity gate.
  - Alternative considered: fallback to current `item.recommendationGate`. Rejected because it would hide decision-time evidence differences.

## Risks / Trade-offs

- The decision cell becomes denser -> keep the comparison view to status, optional transition, and a compact first evidence line.
- Full gate evidence remains in selected detail -> acceptable because the comparison table is a scanning surface.
