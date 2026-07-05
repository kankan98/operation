## Context

The opportunity detail action outcome form already derives `selectedActionOutcomePrompt` from the selected action id and renders the same prompt both as the textarea placeholder and as visible `证据提示 · ...` guidance. The remaining gap is semantic association: the visible helper exists near the textarea but is not referenced by the input for assistive technologies.

## Goals / Non-Goals

**Goals:**

- Give the visible evidence prompt a stable id within the action outcome form.
- Set the action outcome textarea `aria-describedby` to that visible prompt.
- Keep the existing selected-action prompt source unchanged so visible, placeholder, and accessible guidance stay synchronized.
- Cover the association in the existing Opportunities page tests.

**Non-Goals:**

- No backend, schema, OpenAPI, persistence, scoring, analytics, reminder, alert, AI coaching, training-grade, or automation changes.
- No new validation behavior or semantic interpretation of evidence text.
- No redesign of the action outcome form.

## Decisions

- Use a stable static id for the evidence prompt element because only one selected-opportunity decision panel is rendered at a time. This keeps the implementation simple and testable without introducing generated ids.
- Reference the visible helper text directly from `aria-describedby` instead of adding hidden duplicate copy. This avoids divergence between what sighted users see and what assistive technology receives.
- Keep the existing prompt derivation through `selectedActionOutcomePrompt`. The accessibility binding should not create a parallel source of truth.

## Risks / Trade-offs

- Duplicate id risk if multiple decision panels render simultaneously → Mitigated by the current page structure rendering one selected detail panel; tests focus on the selected candidate form.
- Browser and assistive technology announcement behavior can vary → Mitigated by using standard `aria-describedby` on the textarea with an existing visible text element.
