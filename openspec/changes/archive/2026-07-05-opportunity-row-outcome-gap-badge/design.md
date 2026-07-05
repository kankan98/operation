## Context

The opportunity workspace already exposes practice coverage counts, practice filters, daily action context, and latest action outcome summaries. Candidate rows show the latest outcome when present, but active researched rows without an outcome have no row-level signal that execution evidence is missing.

This change is UI-only. The backend read model already exposes `research.lastActionOutcome` and `research.archived`, so no API, schema, migration, scoring, or persistence changes are needed.

## Goals / Non-Goals

**Goals:**

- Make active researched candidates without latest action outcome evidence visible while scanning the opportunity list.
- Keep existing outcome summaries unchanged for researched candidates that already have latest outcome evidence.
- Keep the indicator neutral and scoped to workflow practice evidence.

**Non-Goals:**

- Do not add action history, reminders, alerts, streaks, training grades, AI coaching, analytics, semantic validation, or scoring inputs.
- Do not add backend fields or change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.
- Do not introduce a new filter beyond the existing practice filters.

## Decisions

- Reuse `ResearchSummary` for the row-level indicator.
  - Rationale: `ResearchSummary` already owns row research metadata, tags, notes, decisions, and latest outcome display.
  - Alternative considered: add a new component between `ResearchSummary` and acquisition operations. That would duplicate row metadata responsibility for a one-line display state.

- Display the missing-outcome state only for non-archived research entries.
  - Rationale: practice summary and filters are scoped to active research entries, so archived rows should not be presented as current execution gaps.
  - Alternative considered: show the indicator for all research entries. That would make archived rows look like active work.

- Use neutral workflow wording instead of urgency wording.
  - Rationale: the platform is manual-first and evidence-focused; the row should help scanning without implying a reminder, alert, stale threshold, score penalty, or training grade.
  - Alternative considered: warning-style badge text. That would overstate the metadata and make it look operationally urgent.

## Risks / Trade-offs

- Row density increases slightly -> keep the indicator to one concise line and reuse existing compact text styles.
- Users may confuse the indicator with a scoring issue -> include workflow practice evidence wording and keep it out of score/recommendation UI.
