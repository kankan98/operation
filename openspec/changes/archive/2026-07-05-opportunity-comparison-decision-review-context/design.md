## Context

The opportunity workspace already shows decision review badges and decision age in row summaries and selected opportunity detail. The comparison table is now rich with saved decision snapshot evidence, but it still omits current workflow review metadata, so users lose `待下一步`, `需复盘`, and decision-age context while comparing candidates side by side.

`decisionReview` is an existing derived read model. This change only surfaces that existing metadata in the comparison table.

## Goals / Non-Goals

**Goals:**

- Show current decision review badges in the comparison table decision column when `research.decisionReview` is available.
- Show current decision age labels in the comparison table decision column when `daysSinceDecision` is present.
- Preserve missing or undecided review state without inferring review badges or age from other fields.
- Keep the display read-only workflow context and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new comparison columns.
- No new filters, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.
- No recalculation of decision review metadata in the frontend.

## Decisions

- Read comparison review context only from `item.research?.decisionReview`.
  - Rationale: this is the existing backend-derived workflow review metadata used elsewhere in the workspace.
  - Alternative considered: infer age from `decision.decidedAt`. Rejected because the spec already treats `decisionReview` as the review source and avoids render-time inference.

- Reuse existing `DecisionReviewBadges` and `formatDecisionAge`.
  - Rationale: row and detail views already use these labels, so the comparison table should stay consistent.
  - Alternative considered: create new comparison-specific labels. Rejected because a second vocabulary would make review context harder to scan.

- Render review context only when a current decision exists and metadata is present.
  - Rationale: undecided candidates already display `未决策`; comparison cells should not add inferred review context.
  - Alternative considered: always include undecided review badges. Rejected because the decision cell already has a clear undecided state.

## Risks / Trade-offs

- More decision-cell badges can increase visual density -> Mitigation: reuse compact badges and a single age line.
- `decisionReview` can change over time as backend metadata changes -> Mitigation: display it as current workflow context, not saved decision evidence.
- Missing review metadata may look like missing UI -> Mitigation: focused tests assert no inferred badges or age when metadata is absent.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether current decision review context is visible in the comparison table. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
