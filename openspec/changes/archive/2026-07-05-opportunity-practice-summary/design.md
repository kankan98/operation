## Context

The opportunity workspace now has a manual daily action loop: review summary, daily action plan, deterministic playbooks, and latest action outcomes on research entries. The next useful step is a derived read model that lets the user see whether active research entries have any recorded outcome without inspecting each item.

## Goals / Non-Goals

**Goals:**

- Derive a practice coverage summary from active, non-archived research entries.
- Count total active entries, entries with a latest action outcome, entries missing an outcome, and entries by action id.
- Show the latest action completion timestamp for orientation.
- Render the summary near the existing review summary and daily action plan.
- Keep the summary non-scoring and non-persistent.

**Non-Goals:**

- Adding action outcome history or audit events.
- Adding streaks, reminders, due dates, habits, or training scores.
- Inferring quality from the outcome text.
- Changing review filters, decisions, opportunity score, market signals, or business metrics.

## Decisions

### Derive summary on read

The summary is calculated from `opportunity_research_entries` at request time. This avoids a new table and keeps outcome coverage tied to current active research state.

Alternative considered: persist daily summary snapshots. That would support history, but it adds lifecycle and retention complexity before the product has a clear need for trend analysis.

### Keep counts bounded and explicit

The response includes `totalActive`, `withOutcome`, `withoutOutcome`, `byActionId`, `latestCompletedAt`, `generatedAt`, and a caveat. `byActionId` uses the known daily action ids with zero defaults so the UI can render stable cards.

Alternative considered: return arbitrary grouped data. Stable keys make tests and UI rendering simpler and avoid turning this into a generic analytics endpoint.

### Surface as compact cards

The opportunity workspace will show a compact practice strip near the review summary. This keeps it in the daily workflow without creating a separate training dashboard.

Alternative considered: add a dedicated training page. The current scope is single-user and manual-first; a separate page would likely be too much navigation for a lightweight coverage signal.

## Risks / Trade-offs

- Coverage counts may be mistaken for performance metrics -> Use labels and caveats that frame the data as workflow practice coverage only.
- Latest-only outcomes limit trend visibility -> This is intentional; history can be designed later if needed.
- Empty queues produce zero counts -> The UI should show stable zero-state cards without implying failure.

## Migration Plan

- No database migration is required.
- Existing research entries without outcomes count under `withoutOutcome`.
- Removing the feature only removes the endpoint/UI/schema; persisted research metadata is unchanged.

## Open Questions

- None for this slice.
