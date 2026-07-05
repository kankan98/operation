## Context

Decision snapshots already persist confidence alongside score, recommendation, gate context, key reasons, missing signals, business summary, and market summary. The selected decision detail displays most of that saved snapshot context, but it does not show the saved confidence percentage. The live opportunity confidence can change as data changes, so the detail panel should expose the saved value explicitly.

This is a frontend-only display change. It reuses the existing decision snapshot object and the current `DecisionPanel` card.

## Goals / Non-Goals

**Goals:**

- Show saved `decision.snapshot.confidence` in the selected decision detail as a readable percentage.
- Make the label clearly scoped to the decision snapshot rather than the current opportunity.
- Preserve existing decision reason, next action, snapshot evidence, snapshot gate, and review metadata behavior.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not recompute, infer, normalize, or recalibrate confidence in the frontend.
- Do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, task history, or persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Add the confidence value to the existing snapshot badge row in `DecisionPanel`. This keeps saved score, recommendation, and confidence close together.
- Format with `Math.round(decision.snapshot.confidence * 100)` to match existing opportunity confidence display patterns elsewhere in the page.
- Read only `decision.snapshot.confidence`, not `opportunity.confidence`, so changed live confidence does not rewrite historical decision context.

## Risks / Trade-offs

- The snapshot confidence can differ from the current row confidence. Mitigation: prefix the display with `快照置信度` so users understand it is decision-time context.
- A percentage without deeper explanation may not show why confidence changed. Mitigation: the existing snapshot reasons, gaps, gate context, and live factor details remain visible nearby.
