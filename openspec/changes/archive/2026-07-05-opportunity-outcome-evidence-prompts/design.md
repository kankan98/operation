## Context

The opportunity workspace action outcome form already stores a bounded latest outcome text and now displays completion criteria for the selected daily action. Users still need to decide what to write in the textarea, and repeated vague outcomes reduce the review value of practice coverage.

## Goals / Non-Goals

**Goals:**

- Provide one static evidence-writing prompt for each `OpportunityResearchDailyActionId`.
- Show the selected action's prompt as the textarea placeholder.
- Keep the prompt synchronized with manual action type changes and transient action context defaults.

**Non-Goals:**

- No backend, database, schema, API, or export changes.
- No semantic validation of outcome text.
- No AI-generated coaching, reminders, streaks, grades, analytics, score inputs, or additional persistence.

## Decisions

1. Use a local frontend mapping keyed by daily action id.

   Rationale: every selectable action should have a prompt even when today's action plan omits that action because count is zero. Alternative considered: derive text from backend playbook guidance, but that would require API shape changes or fragile inference from plan items.

2. Render prompts as textarea placeholders.

   Rationale: placeholders guide empty-state writing without adding persistent state or extra visible controls. Alternative considered: a visible helper block, but the form already has completion criteria and a non-scoring caveat; adding another block would make the panel too dense.

3. Keep prompts short and evidence-oriented.

   Rationale: prompts should nudge users toward reusable review evidence, not grade or coach their work.

## Risks / Trade-offs

- [Risk] Placeholder text disappears after typing. -> Mitigation: completion criteria remain visible, and the prompt is only a writing cue for empty outcomes.
- [Risk] Frontend prompt strings can drift from backend action language. -> Mitigation: keep prompts short, action-id keyed, and covered by focused frontend tests.
