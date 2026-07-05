## Context

The opportunity comparison table now shows saved decision snapshot market status, source, confidence, freshness, and missing market signals. The selected opportunity decision detail already renders saved snapshot market factors from `decision.snapshot.marketSignals.factors`.

Users comparing candidates still cannot see the specific saved market proxy factors that supported a past decision without opening each candidate. Current opportunity market factors may differ from saved snapshot factors, so the comparison table needs compact, source-explicit factor display tied to the saved decision snapshot.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot market factors in the comparison table decision column when `marketSignals.factors` contains saved entries.
- Display compact `快照市场因子` rows with saved factor label/name, raw value, and explanation.
- Preserve null or empty saved factor state without backfilling from current opportunity market factors.
- Keep the display read-only and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new comparison columns.
- No recalculation, ranking, or scoring of market factors.
- No automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.

## Decisions

- Read comparison factor context only from `item.research?.decision?.snapshot.marketSignals?.factors`.
  - Rationale: saved decision snapshots are the source of decision-time evidence. Current `item.marketSignals.factors` can change after the decision and must not be presented as saved evidence.
  - Alternative considered: use `getMarketSignals(item).factors`. Rejected because it returns current market factors and would blur current state with snapshot state.

- Reuse selected detail formatting in a compact comparison layout.
  - Rationale: `快照市场因子 · <label> <value>` plus explanation is already the established decision detail wording. Reusing it keeps the source clear and avoids a new vocabulary.
  - Alternative considered: show only factor labels. Rejected because saved raw values and explanations are the actual evidence users compare.

- Limit comparison factor display to the first two saved factors with non-empty label or name.
  - Rationale: this matches selected detail and keeps dense comparison rows scannable.
  - Alternative considered: render every saved factor. Rejected because long factor lists make the comparison table harder to scan.

## Risks / Trade-offs

- More decision-cell text can increase row height -> Mitigation: render at most two compact saved factor summaries.
- Saved market factors may disagree with current market factors -> Mitigation: focused tests assert saved factors appear and current factors do not appear as snapshot factor evidence.
- Null or empty saved factors might look like missing UI -> Mitigation: focused tests assert empty saved factor state does not render inferred `快照市场因子` rows.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved snapshot market factors are visible in the comparison table. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
