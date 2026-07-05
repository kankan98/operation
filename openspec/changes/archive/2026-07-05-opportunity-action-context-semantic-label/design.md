## Context

The action outcome form already displays transient workflow context from daily action selections and practice buckets. It can also show a manual override when the selected action id differs from that transient context. The visible chip is clear to sighted users, but it is assembled from multiple small text tokens without a single semantic label for the overall state.

## Goals / Non-Goals

**Goals:**

- Expose the visible transient action context as one accessible semantic label.
- Include source, original preselected action, and current action-to-save when a manual override exists.
- Preserve the current saved-outcome priority, prefill, prompt, criteria, and save behavior.

**Non-Goals:**

- No backend, schema, OpenAPI, read-model, persistence, scoring, or dependency changes.
- No reminder, alert, scheduled action, stale filter, streak, training grade, AI coaching, analytics, or action history behavior.
- No broader visual redesign of the decision panel.

## Decisions

- Build the semantic label inside `DecisionPanel` from the existing `activeActionContext`, `actionContextSourceLabels`, `dailyActionLabels`, and `actionId`. This keeps the accessible state aligned with the visible state and avoids another source of truth.
- Attach the label to the existing context chip instead of adding hidden-only copy elsewhere. The chip already represents the context state, so this keeps the DOM structure simple and testable.
- Only render the semantic label while transient context is shown and no saved latest action outcome is taking priority. This matches the existing rule that saved outcomes suppress transient context display.

## Risks / Trade-offs

- If action labels change, the semantic label changes with them. Tests should query the meaningful role/name while avoiding brittle DOM structure expectations.
- The label is display-only and does not enforce workflow correctness. Existing form state, validation, and save payload tests remain the source of truth for behavior.
