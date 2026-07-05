## Context

Opportunity research entries already expose the current decision trace, including the user-authored decision reason. The selected candidate detail and comparison table show that reason, but the main opportunity row only exposes decision status, review badges, and the saved next action summary.

This change is UI-only. No backend or schema changes are needed because row data already includes `research.decision.reason`.

## Goals / Non-Goals

**Goals:**

- Let users scan saved decision reasons directly in opportunity rows.
- Keep the summary concise and clearly tied to user-authored workflow evidence.
- Preserve selected detail decision display, row next-action display, and review badges.

**Non-Goals:**

- Do not change backend APIs, schemas, persistence, exports, or scoring.
- Do not generate, rewrite, rank, validate, or score decision reasons.
- Do not add reminders, alerts, scheduled actions, tasks, streaks, training grades, AI coaching, analytics, or action history.

## Decisions

- Render the reason summary in `ResearchSummary` near the existing notes and next-action summaries.
  - Rationale: the component already owns row-level research metadata.
  - Alternative considered: add a separate decision evidence component below the row. That would split row metadata and increase visual density.

- Show only saved `decision.reason`.
  - Rationale: the reason is explicit user evidence. If there is no saved decision, there is no decision reason to display.
  - Alternative considered: derive a reason from score factors or recommendation gates. That would blur scoring evidence with user decision evidence.

- Use neutral, one-line-clamped copy.
  - Rationale: the summary is for scanning, with the full text still available in selected detail.
  - Alternative considered: warning styling or badges. That would make a saved reason look like an alert or status.

## Risks / Trade-offs

- Rows become denser -> keep the reason summary short and line-clamped.
- Long decision reasons are truncated -> selected detail remains the full reading surface.
