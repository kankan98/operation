## Context

The opportunity comparison table already renders each candidate's current decision status and saved reason from `item.research.decision`. The same decision object already includes `nextAction`, and other workspace views display it with the neutral `下一步 · ...` label.

## Goals / Non-Goals

**Goals:**

- Show saved decision next action in the comparison table when present.
- Keep comparison behavior aligned with existing row and selected-detail decision evidence labels.
- Avoid any backend, schema, persistence, scoring, or automation changes.

**Non-Goals:**

- Do not generate, infer, validate, rank, or schedule next actions.
- Do not add reminders, alerts, scheduled actions, action history, analytics, AI coaching, streaks, or training grades.
- Do not change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions.

## Decisions

- Render from `item.research.decision.nextAction` in `ComparisonTable`.
  - Rationale: the comparison table already receives complete opportunity rows and uses the saved decision object.
  - Alternative considered: recompute from review metadata or daily action plan. Rejected because that would infer workflow intent instead of showing saved user evidence.
- Omit the line when `nextAction` is null or empty.
  - Rationale: existing UI patterns avoid inventing missing decision evidence.
  - Alternative considered: show a missing-next-action badge in the comparison table. Rejected for this slice because the table already has constrained space and review badges remain available in row/detail views.

## Risks / Trade-offs

- Long next-action text could make the decision column taller -> use the existing `line-clamp-2` compact text treatment already used for decision reasons.
- Users may still need detail view for full text -> acceptable because the comparison table is a scanning surface, not the full editor.
