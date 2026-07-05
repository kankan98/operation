## Context

Opportunity research entries already expose the current decision trace, including `decision.nextAction`, anywhere research metadata is returned. The selected candidate detail shows the next action, and review badges identify missing next actions, but opportunity rows do not show the saved next action text.

This change is UI-only. The frontend can render a concise next-action summary from existing row research metadata.

## Goals / Non-Goals

**Goals:**

- Let users scan saved next actions directly in opportunity rows.
- Keep row text concise and tied to manual workflow follow-up metadata.
- Preserve existing selected detail decision display and missing-next-action badges.

**Non-Goals:**

- Do not change backend APIs, schemas, persistence, exports, or scoring.
- Do not add reminders, alerts, scheduled work, tasks, streaks, training grades, AI coaching, analytics, or action history.
- Do not generate or infer next actions; only show the user's saved decision next action.

## Decisions

- Render the summary inside `ResearchSummary`.
  - Rationale: `ResearchSummary` already owns row-level research metadata, including decision badges, notes, and action outcome summaries.
  - Alternative considered: add another row panel below research summary. That would increase row density and split research metadata across components.

- Show only saved `decision.nextAction`.
  - Rationale: the text is user-authored workflow follow-up evidence. Missing next actions are already represented by existing review badges.
  - Alternative considered: show a placeholder for missing next action. That would duplicate the existing `待下一步` badge without adding actionable text.

- Use neutral wording and compact truncation.
  - Rationale: the row should help scanning without implying a reminder, task assignment, priority escalation, or score effect.
  - Alternative considered: warning-style treatment. That would make a saved next action look like an alert.

## Risks / Trade-offs

- Rows become slightly denser -> use a single line-clamped summary.
- Long next action text may be truncated -> full text remains available in selected candidate detail.
