## Context

The action outcome form already provides action labels, completion criteria, prompts, examples, text length guidance, and save-readiness hints. Users still need to manually start a repeatable evidence note structure each time they record action outcomes.

## Goals / Non-Goals

**Goals:**

- Add static action-specific record frames near the action outcome textarea.
- Provide a `填入记录框架` button that fills the empty textarea with the selected action's frame.
- Disable the frame-fill button when the textarea already contains text to avoid overwriting user work.
- Keep the filled text editable and saved through the existing action outcome save path.

**Non-Goals:**

- No backend, API, schema, persistence model, scoring, analytics, reminders, alerts, AI coaching, training grades, or automation changes.
- No generated text or semantic validation.
- No automatic save after filling the frame.

## Decisions

- Use a local static `dailyActionOutcomeFrames` mapping beside the existing action-specific labels, criteria, prompts, and examples.
- Keep the button adjacent to the textarea guidance rather than adding a separate panel, preserving the compact workflow surface.
- Disable rather than overwrite when outcome text exists. This avoids destructive surprises and keeps the implementation simple.

## Risks / Trade-offs

- Users may treat frame headings as required fields -> mitigated by keeping the frame editable and avoiding save validation based on headings.
- Static frames may need future tuning as action definitions evolve -> mitigated by colocating frames with existing action guidance constants.
