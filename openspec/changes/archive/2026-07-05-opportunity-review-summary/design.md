## Context

The opportunity workspace already supports shortlist metadata, decision traces, and decision review filters. The missing piece is a compact summary that answers "what should I work on next?" without forcing the user to manually switch through each filter. This should reinforce an operator habit: start from the queue, clear missing next actions, revisit stale decisions, and keep undecided candidates visible.

The project is manual-first and accuracy-first. This slice should organize existing workflow state; it should not infer demand, automate decisions, or add a new scheduling/reminder system.

## Goals / Non-Goals

**Goals:**

- Add a backend summary read model derived from active opportunity research entries.
- Count key review queues: total active entries, decided, undecided, needs next action, stale, research status buckets, and priority buckets.
- Render the summary in the opportunity workspace near the existing filters.
- Preserve scoring determinism: summary counts are workflow metadata only.

**Non-Goals:**

- Adding a new database table or persistent daily snapshot.
- Adding notifications, reminders, due dates, or calendar scheduling.
- Changing opportunity scoring, recommendation gates, confidence, or factor weights.
- Building a separate analytics dashboard or historical outcome report.

## Decisions

### Derive summary from research metadata

The summary will reuse the same metadata mapping that powers research list responses, including `decisionReview`. This avoids duplicating stale/needs-action logic and keeps the summary consistent with filters.

Alternative considered: compute independent SQL aggregate counts. That would be faster for large data sets, but it risks diverging from the derived review rules and is unnecessary for a personal research workspace.

### Add a dedicated summary endpoint

Expose `GET /api/opportunities/research/summary` so the frontend can fetch one compact object instead of issuing several list calls. The endpoint should default to active/non-archived research entries because archived work is not part of today's queue.

Alternative considered: derive the summary entirely client-side from the current opportunity list. That would only summarize the current paginated/filter result, not the full active research queue.

### Keep summary outside scoring

The summary must be framed and tested as a workflow overview. It can guide the user's attention, but it must not change score, recommendation, recommendation gate, confidence, or factor contributions.

## Risks / Trade-offs

- Summary counts may not include archived entries -> make the default active-queue scope explicit.
- In-memory derivation may be less efficient if the workspace grows -> acceptable for the current personal-use scope and simpler to keep correct.
- Counts can be mistaken for quality metrics -> label them as queue/workflow counts, not performance or demand signals.

## Migration Plan

1. Add shared summary schemas and backend types.
2. Implement a summary method in the research service and expose it through the existing opportunities route.
3. Add frontend API/hook support and render summary cards in the workspace.
4. Update tests, OpenAPI docs, and project documentation.
