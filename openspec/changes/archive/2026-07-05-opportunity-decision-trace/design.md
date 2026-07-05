## Context

The opportunity research workspace already stores shortlist metadata (`status`, `priority`, `tags`, `notes`, `archived`) on `opportunity_research_entries`. Opportunity scores and recommendation gates are computed separately and are returned with optional research metadata.

The missing operational step is an explicit decision record: after reviewing a candidate, the user needs to preserve whether the candidate is a go, hold, or no-go, why, and what evidence was visible when that decision was made. This must remain workflow metadata and must not feed back into scoring.

## Goals / Non-Goals

**Goals:**

- Persist one current decision trace per product-scoped research entry.
- Capture a backend-generated evidence snapshot when the decision is saved.
- Include decision metadata in research reads, opportunity explain/list responses, comparison, and export.
- Provide a compact selected-candidate UI for saving and clearing the decision.

**Non-Goals:**

- Full append-only decision history or audit log.
- Changing opportunity score, confidence, factor weights, or recommendation gate thresholds.
- Adding new external data providers or automatic decision recommendations.

## Decisions

### Store the current decision on the existing research entry

Add nullable decision columns to `opportunity_research_entries`: decision status, reason, next action, snapshot JSON, decided timestamp, and decision update timestamp.

Alternative considered: a separate `opportunity_research_decisions` history table. That is a better fit for multi-user review or full audit history, but it is heavier than the current solo-user workflow needs. The current-entry model keeps reads simple and follows the existing one-entry-per-product workspace contract.

### Save decisions through a dedicated decision route

Add a dedicated endpoint for decision writes instead of overloading the generic metadata patch route. The route can call the scoring service to build the evidence snapshot, then pass that snapshot to the research service for persistence.

Alternative considered: accepting a snapshot from the frontend. That would be easier to wire, but it would allow stale or tampered client state to become the decision record. The backend should own the snapshot.

### Keep the snapshot compact and bounded

The snapshot should contain only decision-relevant read model fields: score, confidence, recommendation, recommendation gate, key reasons, missing signals, business/market summaries, and captured timestamp. It should not persist the full product or full factor arrays.

Alternative considered: storing the entire opportunity explain response. That gives maximum context but creates large JSON payloads, stores unnecessary product details, and increases migration risk if response shapes change.

### Treat decisions as workflow metadata

Decision metadata is attached to opportunity responses through the existing research metadata path. Scoring service inputs and factor calculations must not read decision fields.

Alternative considered: using a `go` decision to boost sort order or recommendation. That would blur user judgment with computed evidence and make the score less transparent.

## Risks / Trade-offs

- Decision snapshot can become stale after new evidence arrives -> show `decidedAt` and captured recommendation/score so the user understands it is a point-in-time record.
- Existing local databases need new nullable columns -> ship an additive migration with no data backfill required.
- Snapshot JSON can drift from current schemas -> validate the current decision request and response, and keep snapshot fields intentionally small.
- Clearing a decision loses the current trace -> this is acceptable for the current one-decision model; full history can be added later if repeated decisions become important.

## Migration Plan

1. Add an additive SQL migration that appends nullable decision columns to `opportunity_research_entries`.
2. Update the Drizzle table definition and shared/backend schemas.
3. Update service reads so old rows return `decision: null`.
4. Add a rollback migration that removes decision columns for SQLite versions that support `DROP COLUMN`; otherwise local rollback can recreate the table from the previous schema.

## Open Questions

- None for this slice.
