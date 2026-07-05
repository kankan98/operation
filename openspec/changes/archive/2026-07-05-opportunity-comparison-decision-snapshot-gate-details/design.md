## Context

The opportunity comparison table already shows saved decision snapshot gate status and recommendation transition from `decision.snapshot.recommendationGate`. The selected opportunity decision detail also shows saved gate reasons, signals, and next actions, but comparison users still need to open each candidate to understand why a saved decision was gated.

Current opportunity recommendation gates can change after the decision, so the comparison table must keep decision-time gate detail display tied to the saved snapshot.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot recommendation gate reasons, signals, and next actions in the comparison table decision column.
- Use compact neutral labels: `快照门控原因`, `快照门控信号`, and `快照门控下一步`.
- Preserve clear or empty saved gate detail state without falling back to current opportunity gates or other current fields.
- Keep the display read-only and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new comparison columns.
- No recalculation, ranking, or interpretation of gate logic.
- No automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.

## Decisions

- Read comparison gate detail context only from `item.research?.decision?.snapshot.recommendationGate`.
  - Rationale: saved decision snapshots are the decision-time source. Current `item.recommendationGate` can change after the decision and must not be presented as saved evidence.
  - Alternative considered: reuse current opportunity gate detail. Rejected because it would blur current state with snapshot state.

- Reuse selected detail formatting and limits in the comparison cell.
  - Rationale: `快照门控原因`, `快照门控信号`, and `快照门控下一步` already establish clear saved-snapshot wording. Limiting reasons and next actions to two and signals to four keeps rows scannable.
  - Alternative considered: show every saved gate detail. Rejected because long gate arrays make the comparison table harder to scan.

- Render gate details only when saved arrays contain non-empty text.
  - Rationale: empty saved gate details should remain visually absent rather than implying missing data from current opportunity state.
  - Alternative considered: display placeholder labels. Rejected because placeholders would add noise to dense comparison rows.

## Risks / Trade-offs

- More decision-cell text can increase row height -> Mitigation: render compact lines and cap array lengths like selected detail.
- Saved gate details may disagree with current gates -> Mitigation: focused tests assert saved details appear and current gate details do not appear as snapshot context.
- Clear saved gate state could look like missing UI -> Mitigation: focused tests assert clear saved gate state does not render inferred gate details.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved snapshot gate details are visible in the comparison table. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
