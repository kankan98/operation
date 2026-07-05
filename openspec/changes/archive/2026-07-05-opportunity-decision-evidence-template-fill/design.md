## Context

The opportunity detail decision form already keeps `status`, `reason`, and `nextAction` in local React state, shows text length guidance, and only persists when the user clicks the save decision button. Action outcome evidence recently gained a frontend-only static frame fill helper; decision evidence has the same blank-state friction but must stay independent from scoring, snapshots, and backend validation.

## Goals / Non-Goals

**Goals:**

- Provide a small manual writing helper for empty decision reason text.
- Keep the helper aligned with the currently selected `go`, `hold`, or `no_go` decision status.
- Avoid overwriting existing manual decision evidence.
- Preserve the current explicit save flow and save payload shape.

**Non-Goals:**

- No backend schema, OpenAPI, migration, dependency, or persistence changes.
- No semantic validation of frame headings or completed content.
- No reminders, alerts, scheduled actions, stale-threshold changes, streaks, analytics, AI coaching, training grades, persistent task systems, action history, or scoring inputs.
- No automatic next-action generation or decision snapshot changes.

## Decisions

- Add static `decisionEvidenceFrames` near the existing label constants in `Opportunities.tsx`.
  - Rationale: the frames are UI copy derived only from existing decision statuses, so colocating them with `decisionLabels` keeps behavior obvious and avoids cross-module dependencies.
  - Alternative considered: generate frame text from score, recommendation, or snapshot data. Rejected because this would blur manual evidence support with inferred coaching or scoring behavior.
- Fill only the `reason` textarea and leave `nextAction` untouched.
  - Rationale: `nextAction` is optional and shorter; adding inferred next-action starts would risk implying a workflow task. The helper should only structure the user's decision evidence.
  - Alternative considered: fill both reason and next action. Rejected to keep scope small and avoid task-generation semantics.
- Disable the fill control whenever trimmed `reason` has text.
  - Rationale: prevents accidental overwrite and mirrors the action outcome frame behavior.
  - Alternative considered: append frames to existing text. Rejected because appending could pollute hand-written evidence.

## Risks / Trade-offs

- Frame copy may not fit every candidate context -> keep it editable and status-specific rather than prescriptive.
- Users could save an unedited frame -> existing required-text validation only checks presence, so tests and docs must make clear the frame is manual writing support, not semantic validation.
- Additional button density in the detail form -> place it beside the decision reason label where it is discoverable without changing the save controls.
