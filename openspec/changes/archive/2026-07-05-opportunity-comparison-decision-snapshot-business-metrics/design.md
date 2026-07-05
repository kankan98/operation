## Context

The opportunity comparison table now shows saved decision snapshot score, recommendation, confidence, capture time, gate context, reasons, gaps, and business completeness. The selected opportunity decision detail already renders saved snapshot business metric values from `decision.snapshot.businessSignals.metrics`.

Users comparing candidates still cannot see whether a saved decision had viable unit economics at decision time without opening each candidate. Current opportunity business metrics may differ from saved snapshot metrics, so the comparison table needs source-explicit display that stays tied to the saved decision snapshot.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot business metrics in the comparison table decision column when `businessSignals.metrics` exists.
- Display only available saved metric values for net margin, ROI, breakeven sell price, and contribution profit per unit.
- Use the same neutral `快照业务指标` label family as selected detail.
- Preserve null or missing saved snapshot metric state without backfilling from current opportunity business metrics.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new comparison columns and no current business metric reinterpretation.
- No recalculation of business metrics from saved inputs.
- No automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.

## Decisions

- Read metric display values only from `item.research?.decision?.snapshot.businessSignals?.metrics`.
  - Rationale: saved decision snapshots are the source of decision-time evidence. Current `item.businessSignals.metrics` can change after the decision and must not be presented as saved evidence.
  - Alternative considered: use `getBusinessSignals(item)` for convenience. Rejected because it returns current business metrics and would blur current state with snapshot state.

- Reuse the selected detail metric formatting and labels in a compact comparison layout.
  - Rationale: users already see `快照业务指标 · 净利率 ...`, `ROI ...`, `盈亏平衡价 ...`, and `单件贡献 ...` in detail. The comparison table should use the same terms while staying dense.
  - Alternative considered: show one abbreviated summary line such as `净利率/ROI`. Rejected because explicit labels are clearer and easier to test for source isolation.

- Render no metric container when the saved metrics object is null or every supported metric value is null.
  - Rationale: absence of saved metric evidence is meaningful and must not be filled with current metrics or placeholder calculations.
  - Alternative considered: render `无快照业务指标`. Rejected to avoid adding noise to already dense comparison rows.

## Risks / Trade-offs

- More text can increase comparison row height -> Mitigation: use compact inline text and only render metrics that are present.
- Saved metrics may disagree with current business metrics -> Mitigation: focused tests assert saved values appear and current values do not appear as snapshot metrics.
- Null saved metrics might look like a missing implementation -> Mitigation: focused tests assert null saved metrics do not render inferred `快照业务指标` rows.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved snapshot business metric values are visible in the comparison table. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
