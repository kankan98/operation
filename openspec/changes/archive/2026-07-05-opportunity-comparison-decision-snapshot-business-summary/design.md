## Context

The opportunity comparison table already shows saved decision snapshot score, recommendation, confidence, capture time, gate context, reasons, and missing signals. The selected opportunity decision detail also shows saved snapshot business completeness and missing business signals from `decision.snapshot.businessSignals`.

The comparison table still lacks that business completeness context, so users cannot tell whether a saved decision being compared had complete cost and fee assumptions at the time it was made. Current opportunity business signals may differ from the saved decision snapshot and must remain visually separate.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot business completeness in the comparison table decision column when the saved snapshot contains `businessSignals`.
- Show saved snapshot missing business signals when the saved snapshot contains non-empty `businessSignals.missingSignals`.
- Keep the labels neutral and source-explicit: `快照业务完整度` and `快照业务缺口`.
- Preserve missing saved snapshot business state without backfilling from current opportunity business signals.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No business metric display in the comparison table.
- No automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.
- No inferred business evidence from current `businessSignals`, score factors, notes, review metadata, action outcomes, or render time.

## Decisions

- Read comparison business snapshot context only from `item.research?.decision?.snapshot.businessSignals`.
  - Rationale: this matches the selected detail source of truth and keeps saved decision evidence distinct from current opportunity business signals.
  - Alternative considered: reuse `getBusinessSignals(item)`. Rejected because it reflects current opportunity data and would make historical decision evidence look current or inferred.

- Render compact text rows inside the existing decision column rather than adding a new table column.
  - Rationale: the value is part of saved decision evidence, and the comparison table already groups snapshot score, time, gate, reasons, gaps, and next action in that cell.
  - Alternative considered: add business snapshot fields to the business column. Rejected because that column is already used for current opportunity business signals.

- Limit missing business signals to the first four non-empty entries, joined with `、`.
  - Rationale: this follows the existing snapshot missing-signal rendering pattern and keeps dense comparison rows scannable.
  - Alternative considered: render the full list. Rejected because long saved evidence lists would make the comparison row harder to scan.

## Risks / Trade-offs

- Missing snapshot business context could be mistaken for a UI omission -> Mitigation: render nothing when `businessSignals` is null or missing, and cover that case with tests.
- Current and saved business signals can disagree -> Mitigation: test that comparison display uses the saved snapshot value and does not show current business completeness as snapshot evidence.
- More decision-cell text increases row height -> Mitigation: use the existing compact muted text style and only render the missing-signal row when non-empty.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved snapshot business completeness and missing business signals are visible in the comparison table. Existing data remains unchanged.

## Open Questions

None.
