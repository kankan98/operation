## Context

The comparison table already shows saved decision snapshot score, recommendation, and confidence in the decision column. Selected detail also shows `快照时间`, but comparison users cannot currently see when each saved decision snapshot was captured while reviewing candidates side by side.

## Goals / Non-Goals

**Goals:**

- Show saved decision snapshot capture time in the comparison table when a decision exists.
- Keep the saved snapshot time visually distinct from current render time and decision record time.
- Reuse existing decision-time formatting used elsewhere in the opportunity workspace.

**Non-Goals:**

- Do not compute snapshot age, drift, freshness warnings, or stale filters.
- Do not add reminders, alerts, scheduled actions, analytics, AI coaching, training grades, or action history.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Render snapshot capture time inside the existing decision column below the snapshot score/recommendation/confidence evidence.
  - Rationale: it is saved decision-time evidence and belongs with the decision snapshot, not as a new table dimension.
  - Alternative considered: add a new column. Rejected because the table is already wide and this value is supporting context.
- Read only `item.research.decision.snapshot.capturedAt`.
  - Rationale: prevents mixing saved evidence capture time with decision record time, update time, current opportunity data, or render time.
  - Alternative considered: fallback to `decision.decidedAt`. Rejected because that records when the decision was saved, not necessarily when the evidence snapshot was captured.

## Risks / Trade-offs

- The decision cell becomes slightly denser -> keep the timestamp as compact muted text, not another primary action.
- Snapshot capture time may match decision time for current data -> still useful as source-isolated evidence and consistent with selected detail.
