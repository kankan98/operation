## Context

Opportunity decisions persist `decision.snapshot.businessSignals`, including nullable assumption-based business metrics. The selected detail panel currently shows snapshot business completeness and missing business inputs, but it omits saved metric values such as margin, ROI, breakeven, and contribution profit.

Current opportunity business metrics can change after the decision when the user edits cost or fee assumptions. Review UI must therefore distinguish saved decision-time business metrics from live opportunity business metrics.

## Goals / Non-Goals

**Goals:**

- Render saved `decision.snapshot.businessSignals.metrics` in the selected opportunity decision detail when present.
- Use compact labels aligned with the existing snapshot business summary.
- Avoid inferring or recomputing saved business metrics from current opportunity business signals.
- Cover present metrics, null metrics, and source isolation in focused frontend tests.

**Non-Goals:**

- No API, schema, database, scoring, or business metric calculation changes.
- No new persistence, decision history timeline, analytics, reminders, alerts, automation, or action-history features.
- No semantic validation or grading of the business metrics.

## Decisions

- Render from `decision.snapshot.businessSignals.metrics` only.
  - Rationale: saved decision snapshot metrics are the source of truth for decision-time unit economics.
  - Alternative considered: fall back to current `opportunity.businessSignals.metrics`; rejected because it would mix current assumptions into historical review context.

- Show a compact metric group inside the existing decision snapshot block.
  - Rationale: selected detail already shows compact snapshot evidence labels, and metrics should be scannable without duplicating the full live business signal card.
  - Alternative considered: add a full metrics grid/card; rejected because this is a narrow review aid and should not increase panel weight.

- Display net margin, ROI, breakeven sell price, and contribution profit per unit.
  - Rationale: these are the most useful decision-time unit economics for go/hold/no-go review.
  - Alternative considered: display all metric inputs and projected contribution; deferred because the current slice is for concise review, not a full assumptions audit.

## Risks / Trade-offs

- Snapshot metrics can be mistaken for verified profitability. -> Use `快照业务指标` labels and keep documentation clear that they are saved assumption-based metrics.
- Null individual metric values may clutter the panel. -> Show only metric values that are non-null and skip the metric group entirely when no displayable saved values exist.
