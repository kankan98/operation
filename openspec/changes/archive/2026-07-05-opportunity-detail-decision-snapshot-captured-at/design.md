## Context

Decision snapshots already include `capturedAt`. The edit form footer shows the snapshot timestamp, but the saved decision evidence block primarily shows the decision `decidedAt` timestamp and snapshot evidence values. During later review, users need to see when the evidence snapshot itself was captured without opening or interpreting the edit controls.

## Goals / Non-Goals

**Goals:**

- Render saved `decision.snapshot.capturedAt` inside the selected opportunity decision evidence block.
- Use the saved snapshot timestamp as the only source for the `快照时间` label.
- Cover source isolation so the label is not derived from decision `decidedAt`, `updatedAt`, current opportunity data, or render time.

**Non-Goals:**

- No API, schema, database, scoring, decision persistence, or time derivation changes.
- No stale snapshot filtering, reminders, alerts, automation, analytics, or action-history features.
- No changes to the existing form footer snapshot hint.

## Decisions

- Display `快照时间 · {formatDecisionTime(decision.snapshot.capturedAt)}` near the existing snapshot score and confidence badges.
  - Rationale: the timestamp belongs with the saved evidence values and remains compact.
  - Alternative considered: only keep the existing form footer hint; rejected because review users should see the timestamp in the saved decision block before editing.

- Use `decision.snapshot.capturedAt` directly.
  - Rationale: this is the persisted decision-time evidence timestamp.
  - Alternative considered: use `decision.decidedAt`; rejected because a future implementation could capture evidence and save the decision at different times.

## Risks / Trade-offs

- The detail panel already has multiple snapshot labels. -> Keep the timestamp to one compact line and reuse existing date formatting.
- Users may confuse snapshot time with decision time. -> Use distinct labels: decision record remains in the header, snapshot evidence uses `快照时间`.
