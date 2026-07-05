## Context

Selected opportunity detail already shows saved decision snapshot `keyReasons` and `missingSignals`. The comparison table now shows several saved snapshot fields, but users still cannot compare the decision-time reasons and gaps side by side.

## Goals / Non-Goals

**Goals:**

- Show saved snapshot reasons in the comparison table when saved `keyReasons` exist.
- Show saved snapshot gaps in the comparison table when saved `missingSignals` exist.
- Keep saved snapshot evidence distinct from current opportunity reasons and missing signals.

**Non-Goals:**

- Do not add full evidence expansion, evidence scoring, or semantic validation.
- Do not add reminders, alerts, scheduled actions, AI coaching, training grades, analytics, or action history.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Render compact text lines in the existing comparison decision column.
  - Rationale: reasons and gaps explain the saved decision snapshot and belong with decision evidence.
  - Alternative considered: add new columns. Rejected because the table is already wide and the detail panel remains the full evidence surface.
- Show only saved snapshot arrays, trimmed and capped to keep scanning dense but readable.
  - Rationale: prevents empty/noisy rows and keeps comparison usable.
  - Alternative considered: show all saved reasons and gaps. Rejected because long lists can dominate a comparison row.
- Read only `item.research.decision.snapshot.keyReasons` and `item.research.decision.snapshot.missingSignals`.
  - Rationale: prevents mixing saved decision-time evidence with current opportunity reasons or current missing signals.
  - Alternative considered: fallback to current opportunity key reasons and missing signals. Rejected because it would obscure changes between saved decision evidence and current data.

## Risks / Trade-offs

- Decision cells become denser -> cap each evidence line to a compact summary and keep muted styling.
- Some evidence may be hidden in comparison -> selected detail remains the place for full saved snapshot evidence.
