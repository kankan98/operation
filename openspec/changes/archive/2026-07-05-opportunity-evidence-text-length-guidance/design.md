## Context

Opportunity decision reasons, decision next actions, and latest action outcomes are manual workflow evidence fields. The shared schema already bounds them at 1200, 400, and 600 characters respectively, but the selected opportunity detail form currently does not show those limits before saving.

This change is UI-only. It should make existing backend constraints visible and reduce avoidable failed submissions without changing persistence, read models, scoring, action plan generation, or practice summary semantics.

## Goals / Non-Goals

**Goals:**

- Show concise text length guidance beside the decision reason, decision next action, and action outcome inputs.
- Use the same constants that define request validation limits so the UI does not drift from the contract.
- Prevent save attempts when a field exceeds its known limit.
- Keep copy neutral and scoped to manual evidence writing.

**Non-Goals:**

- Do not add semantic validation, content scoring, AI coaching, reminders, alerts, streaks, training grades, analytics, history, or new persistence.
- Do not change backend request schemas or database columns.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Import existing opportunity research length constants into the frontend page instead of duplicating numeric literals. This keeps displayed limits aligned with the request schema and avoids another local source of truth.
- Render simple character counters as adjacent helper text for the existing inputs. The selected opportunity detail form is already dense and operational, so the guidance should be utilitarian rather than a new panel or workflow step.
- Disable save buttons when their relevant field is over limit. The backend still remains authoritative, but the UI should avoid knowingly sending invalid manual evidence.
- Use threshold-neutral copy: show current length and limit, with an over-limit state only when needed. This is not a quality score or recommendation.

## Risks / Trade-offs

- Frontend imports from shared schemas can increase coupling to shared code. Mitigation: import only exported constants, not runtime validators or schema parsing logic.
- Character counts use JavaScript string length, matching the existing zod string max behavior closely enough for this UI guard. Mitigation: backend validation remains authoritative for edge cases.
- Extra helper text can add visual density. Mitigation: place the counters inline with labels or just below inputs using existing small muted text styles.
