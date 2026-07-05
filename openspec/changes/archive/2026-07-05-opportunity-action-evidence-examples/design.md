## Context

The action outcome form already derives labels, completion criteria, and evidence prompts from the selected daily action id. Users can see what to write, but the form does not show concrete examples of a good manual evidence note for each action type.

## Goals / Non-Goals

**Goals:**

- Add static, action-specific evidence examples next to the action outcome input.
- Keep examples derived from the same selected action id as labels, completion criteria, and prompts.
- Include the visible examples in the action outcome textarea's descriptive guidance.
- Cover default, changed, transient context, and saved-outcome states in focused tests.

**Non-Goals:**

- No backend, API, schema, persistence, scoring, analytics, reminders, alerts, AI coaching, training grades, or automation changes.
- No semantic validation of the user's outcome text.
- No generated or personalized coaching content.

## Decisions

- Use a local static `dailyActionOutcomeExamples` mapping beside the existing action labels, criteria, and prompts. This keeps all action-specific writing guidance together.
- Render the examples as concise visible text under the prompt, using the existing compact form style rather than adding a new card.
- Reference both the prompt and examples from `aria-describedby`, so visible guidance and accessible guidance stay aligned.

## Risks / Trade-offs

- Example text can become stale if action definitions change -> mitigated by colocating examples with the existing action prompt and criteria constants.
- Users might treat examples as required templates -> mitigated by labeling them as examples and keeping save validation unchanged.
