## Context

The opportunity workspace already supports shortlisting, current decisions, review filters, daily action plans, and deterministic playbooks. The missing piece is a lightweight record that an action was actually executed. Because this is a single-user manual-first research assistant, the design should keep the record product-scoped and bounded instead of introducing task history, reminders, or analytics.

## Goals / Non-Goals

**Goals:**

- Record the latest daily action outcome for a research entry.
- Keep the outcome tied to an existing daily action id so it can be read as practice evidence.
- Show recent action evidence in the review workflow without adding a separate dashboard.
- Preserve scoring determinism and keep outcome metadata out of market and business signal semantics.

**Non-Goals:**

- Storing a full action history or immutable audit timeline.
- Adding reminders, due dates, streaks, habit analytics, or progress scoring.
- Automatically completing next actions or changing decisions from an outcome note.
- Adding AI-generated coaching, summaries, or recommendations.

## Decisions

### Store only the latest outcome on the research entry

Add nullable columns to `opportunity_research_entries` for `lastActionId`, `lastActionOutcome`, `lastActionCompletedAt`, and `lastActionUpdatedAt`. This keeps the feature close to existing research metadata and avoids a new table before there is evidence that a historical log is needed.

Alternative considered: create an `opportunity_research_action_events` table. That would support history, but it also creates retention, ordering, export, and UI complexity that is not needed for the current single-user training loop.

### Use an explicit outcome endpoint

Add a product-scoped endpoint for saving and clearing the latest action outcome. Keeping it separate from generic research metadata updates makes validation clearer and keeps action ids constrained to the daily action enum.

Alternative considered: extend the generic research PATCH endpoint. That would be smaller, but it would blur routine metadata edits with practice completion records.

### Keep outcome text bounded and manual

The user supplies a concise outcome note. The backend validates action id and text length, sets completion/update timestamps, and returns the updated research metadata. No model-generated text is stored.

Alternative considered: derive outcomes automatically from decision or next-action edits. That would hide state changes behind unrelated forms and make the practice loop less explicit.

## Risks / Trade-offs

- Outcome overwrites lose history -> This is intentional for the first slice; export or history can be added later if there is a real need.
- Extra fields may be mistaken for score evidence -> API caveats, docs, tests, and UI labels keep outcome metadata scoped to workflow practice.
- Users may expect an outcome to clear the underlying review condition -> The outcome record does not automatically edit decision or next-action fields; the existing decision form remains the source of truth for review filters.

## Migration Plan

- Add nullable columns with a forward migration. Existing entries read `lastActionOutcome` as `null`.
- Clearing an outcome sets all latest action outcome columns to `null`.
- Rollback drops the nullable columns without affecting decisions, notes, tags, scores, or signal snapshots.

## Open Questions

- None for this slice.
