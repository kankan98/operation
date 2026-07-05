## Context

Opportunity decisions persist a nullable `decision.snapshot.marketSignals` summary, including `factors`. The selected detail panel now shows saved snapshot market status, source, confidence, freshness, and missing signals, but not the factor-level proxy evidence that helped explain the market trend.

Current opportunity market factors can change after the decision when Keepa data refreshes. Review UI must therefore use only saved snapshot factors when explaining decision-time market evidence.

## Goals / Non-Goals

**Goals:**

- Render saved `decision.snapshot.marketSignals.factors` in the selected opportunity decision detail when present.
- Show concise factor label, raw value, and explanation so the user can review the saved proxy trend.
- Avoid inferring or recomputing saved market factors from current opportunity market signals.
- Cover present factors and empty/null snapshot factor states with focused frontend tests.

**Non-Goals:**

- No API, schema, database, scoring, market signal refresh, or provider changes.
- No factor recalculation, semantic validation, analytics, reminders, alerts, automation, or action-history features.
- No full market factor audit view; this is a compact decision-review display.

## Decisions

- Render from `decision.snapshot.marketSignals.factors` only.
  - Rationale: saved factors are the decision-time source of truth.
  - Alternative considered: reuse `opportunity.marketSignals.factors`; rejected because it would mix live market evidence into historical decision review.

- Limit display to the first two saved factors.
  - Rationale: the decision detail should remain scan-friendly and aligned with the existing compact snapshot evidence style.
  - Alternative considered: render all factors; deferred because long factor lists belong in the full live market section or a future dedicated audit view.

- Include raw value and explanation.
  - Rationale: label alone does not show whether the factor was positive, negative, or weak. The saved explanation provides the cautionary proxy-signal context.
  - Alternative considered: show contribution/weight; rejected for this slice because it can read like score recalculation instead of review evidence.

## Risks / Trade-offs

- Factor text can make the decision panel dense. -> Limit to two factors and use compact neutral labels.
- Users may read proxy factors as verified demand. -> Preserve the saved explanation text and documentation caveats that market factors are proxy evidence only.
