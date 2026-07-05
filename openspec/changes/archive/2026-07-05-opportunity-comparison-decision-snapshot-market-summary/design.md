## Context

The opportunity comparison table now shows saved decision snapshot score, recommendation, confidence, capture time, gate context, reasons, gaps, and business snapshot context. The selected opportunity decision detail already renders saved snapshot market summary fields from `decision.snapshot.marketSignals`.

Users comparing candidates still cannot see whether a saved decision had fresh market proxy evidence at decision time without opening each candidate. Current opportunity market signals may differ from saved snapshot market signals, so the comparison table needs source-explicit display that stays tied to the saved decision snapshot.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot market status in the comparison table decision column when `marketSignals` exists.
- Show saved market provider/source, confidence, freshness, and missing market signals when those saved fields exist.
- Use the same neutral `快照市场...` label family as selected detail.
- Preserve null or missing saved snapshot market state without backfilling from current opportunity market signals.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No market factor display in the comparison table for this slice.
- No current market signal reinterpretation and no recomputation of freshness or confidence.
- No automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.

## Decisions

- Read comparison market snapshot context only from `item.research?.decision?.snapshot.marketSignals`.
  - Rationale: saved decision snapshots are the source of decision-time evidence. Current `item.marketSignals` can change after the decision and must not be presented as saved evidence.
  - Alternative considered: use `getMarketSignals(item)` for convenience. Rejected because it returns current market signals and would blur current state with snapshot state.

- Render compact market summary rows inside the existing decision column rather than adding a new table column.
  - Rationale: the value is part of saved decision evidence, and the comparison table already groups saved snapshot score, time, gate, reasons, gaps, business context, and next action in that cell.
  - Alternative considered: add market snapshot values to the existing current market column. Rejected because that column is already used for current opportunity market signals.

- Limit saved missing market signals to the first four non-empty entries, joined with `、`.
  - Rationale: this follows the existing snapshot missing-signal rendering pattern and keeps dense comparison rows scannable.
  - Alternative considered: render the full list. Rejected because long saved evidence lists would make the comparison row harder to scan.

## Risks / Trade-offs

- More decision-cell text can increase row height -> Mitigation: use compact muted text rows and render only saved fields that exist.
- Saved market signals may disagree with current market signals -> Mitigation: focused tests assert saved values appear and current values do not appear as snapshot market evidence.
- Null saved market context might look like missing UI -> Mitigation: focused tests assert null saved market state does not render inferred `快照市场...` rows.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved snapshot market summary values are visible in the comparison table. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
