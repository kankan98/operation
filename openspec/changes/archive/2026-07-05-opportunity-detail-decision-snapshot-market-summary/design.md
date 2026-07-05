## Context

The opportunity research workspace already persists a decision snapshot with score, confidence, recommendation gate, key reasons, missing signals, business summary, and nullable market summary. The selected opportunity detail panel currently exposes most of that saved snapshot, but it does not render the saved market summary.

Live market signals can change after a decision because Keepa data is refreshed or unavailable. Review UI must therefore distinguish the saved decision snapshot from current opportunity market signals.

## Goals / Non-Goals

**Goals:**

- Render saved `decision.snapshot.marketSignals` in the selected opportunity decision detail.
- Keep the copy neutral and scoped to historical review context.
- Avoid inferring or recomputing snapshot market context from `opportunity.marketSignals`.
- Cover both present and null snapshot market states with focused frontend tests.

**Non-Goals:**

- No API, schema, database, or scoring changes.
- No market signal refresh, provider, queue, automation, alert, reminder, analytics, or action-history changes.
- No new decision history timeline or multi-decision audit model.

## Decisions

- Render from `decision.snapshot.marketSignals` only.
  - Rationale: the field is already persisted as the source of truth for decision-time market context.
  - Alternative considered: fall back to current `opportunity.marketSignals`; rejected because it would blur saved evidence with live data.

- Show compact text labels beside the existing snapshot evidence.
  - Rationale: selected decision detail already uses compact neutral labels such as `快照业务完整度` and `快照缺口`, so market context should follow the same pattern.
  - Alternative considered: add another full market trend card; rejected because it duplicates the live market section and increases detail-panel weight.

- Include status plus provider/source, confidence, freshness, and gaps when available.
  - Rationale: these fields give enough context to understand whether the saved market evidence was fresh, missing, stale, or low-confidence without exposing factor-level detail.
  - Alternative considered: render every market factor from the snapshot; deferred because the current slice is intended to improve scanability, not expand detailed evidence analysis.

## Risks / Trade-offs

- Snapshot market text could become too dense if all fields are always present. -> Keep provider/source, confidence, freshness, and gaps as short single-line labels and omit missing optional values.
- A saved `null` snapshot could be confused with a current market gap. -> Render no snapshot-market labels when the saved snapshot is `null`, and cover that isolation behavior in tests.
