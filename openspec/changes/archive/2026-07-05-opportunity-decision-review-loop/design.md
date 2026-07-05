## Context

The opportunity research workspace can already save a current go/hold/no-go decision with reason, next action, and a score evidence snapshot. That makes a single decision auditable, but it does not yet create a review loop: the user cannot quickly answer which decisions are stale, which go/hold decisions need a next action, or which decisions should be revisited.

The project direction is manual-first and accuracy-first. This slice should strengthen human judgment and follow-through without adding automation, new external data sources, or scoring side effects.

## Goals / Non-Goals

**Goals:**

- Add derived decision review metadata to research read models.
- Add filters for decided/undecided, decision status, missing next action, and stale decisions.
- Add a compact decision review mode to the opportunity workspace UI.
- Preserve score determinism: decision review state is workflow metadata only.

**Non-Goals:**

- Adding a new database table or historical decision timeline.
- Automatically scheduling reminders or notifications.
- Changing opportunity score, recommendation, confidence, or factor weights.
- Adding Chat write tools for decision review.

## Decisions

### Derive review state from current decision fields

Use existing `decision`, `nextAction`, and `decidedAt` fields to derive `decisionReview`. This avoids schema migrations and keeps the slice focused on visibility and filtering.

Alternative considered: add a dedicated review table with due dates and completion status. That would support richer workflow later, but it is too much before the user has a simple review surface.

### Use fixed stale threshold first

Default stale decision detection to 14 days from `decidedAt`. The threshold can be made configurable later if real usage shows different review cadence.

Alternative considered: add per-decision review dates. That is useful, but requires write UI and validation beyond this slice.

### Extend existing opportunity list filters

The main opportunity workspace already lists scored candidates and research metadata together, so add `decisionStatus` and `decisionReview` filters to that read model instead of building a separate page.

Alternative considered: add a new `/api/opportunities/research/decisions` endpoint. A dedicated endpoint may be cleaner later, but the current UI and hooks already work from the opportunity list.

## Risks / Trade-offs

- Fixed stale threshold may not match every workflow -> document it as a first-pass review heuristic.
- Derived metadata can be misunderstood as scoring evidence -> include score-separation language in specs, docs, and UI copy.
- Filtering in the enriched opportunity list can require in-memory filtering after research metadata attachment -> keep the initial limit bounded and covered by tests.

## Migration Plan

1. Add shared schema fields and query filters.
2. Extend backend research metadata enrichment and opportunity filtering.
3. Update the opportunity workspace UI with decision review controls and badges.
4. Update tests, OpenAPI examples, and docs.

## Open Questions

- None for this slice.
