## Context

The action outcome form derives `selectedActionOutcomePrompt` from the local selected `actionId` and uses it as the textarea placeholder. The placeholder updates correctly, but placeholder text disappears once the user starts typing, which weakens the writing guidance during the actual evidence entry.

## Goals / Non-Goals

**Goals:**

- Display the selected action's evidence prompt as visible helper text near the action outcome textarea.
- Keep the visible prompt synchronized with the selected `actionId` for default, transient context, manual change, and saved latest outcome states.
- Preserve the current placeholder behavior and save payload behavior.

**Non-Goals:**

- No backend, schema, OpenAPI, read-model, persistence, scoring, or dependency changes.
- No semantic validation, generated feedback, reminders, alerts, scheduled actions, action history, analytics, AI coaching, or training grades.
- No broad redesign of the action outcome form.

## Decisions

- Render visible helper text from the existing `selectedActionOutcomePrompt` value. This keeps placeholder and visible guidance aligned without duplicating action-specific strings.
- Place the helper text directly under the textarea with a stable `aria-label`, so tests and assistive technologies can identify the writing guidance independent of placeholder behavior.
- Keep the existing placeholder intact for quick orientation before typing.

## Risks / Trade-offs

- The form gains one additional line of guidance. Keeping it muted and concise should avoid competing with save blockers and completion criteria.
- Because the visible prompt and placeholder share the same source, a copy change affects both. That is intentional and keeps guidance consistent.
