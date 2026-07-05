## Context

Opportunity and research lists already support workflow-only practice filters: `actionOutcome=with|without` and `actionId=<daily action id>`. Research exports already include latest action outcome fields, but the export request filters cannot express the active practice view, and the frontend omits those filters when exporting without selected product IDs.

The project direction is manual-first and evidence-oriented. Exported files often leave the UI, so they must preserve the user's review context while keeping caveats explicit.

## Goals / Non-Goals

**Goals:**

- Let filtered research exports use the same practice outcome filters as the opportunity and research lists.
- Make the opportunity workspace export the current practice filter context when exporting by filters.
- Keep practice filter metadata non-scoring and caveated.
- Reuse existing daily action ids and action outcome filter enums.

**Non-Goals:**

- No new action history table, reminders, streaks, training grades, or AI coaching.
- No changes to opportunity scoring, recommendation gates, market signals, or business metrics.
- No changes to selected-product export semantics; explicit selections continue to export the selected rows.

## Decisions

1. Extend `opportunityResearchExportFiltersSchema` with `actionOutcome` and `actionId`.

   Rationale: export filters already mirror a subset of opportunity list filters. Reusing the same enums keeps validation and OpenAPI behavior consistent. Alternative considered: add a separate `practice` object in the export request. That would create a new shape for the same filter semantics and increase frontend/backend mapping work without adding value.

2. Reuse the existing filtered export path through `OpportunityScoringService.listOpportunities`.

   Rationale: the filtered export path already delegates to the opportunity list read model, and `OpportunityResearchService.filterOpportunities` already applies practice filters. Alternative considered: filter exported rows inside `createExportResponse`. That would duplicate filtering after scoring and could drift from the visible list.

3. Include practice filters only when exporting by filters, not when explicit product IDs are selected.

   Rationale: an explicit selection is stronger user intent than the current filter state. This preserves existing comparison/export behavior and avoids surprising omissions from a selected export.

## Risks / Trade-offs

- [Risk] Export filter payloads can grow as more list filters are mirrored. → Mitigation: keep using shared schemas and tests for request validation.
- [Risk] Users may misread practice-filtered exports as score evidence. → Mitigation: keep exported action outcome fields and score caveats labeled as workflow metadata that does not affect scoring.
