## Context

The current `/ai-review` V0 workflow can prepare a run, execute the local fake provider or gated live model, show validation results, record human section decisions, capture feedback signals, and create downstream draft references. The previous evidence-confidence slice already summarizes confidence, source coverage, validation counts, feedback hotspots, review progress, and the next review action.

The remaining trial blocker is that operators still need a more explicit "quality triage" view: what is blocking this run, which sections need repair, and where the repair should happen. The work must stay inside the accepted AI review boundaries: UI/domain helpers may derive safe guidance from protected run detail, but they must not add provider calls, RAG, external discovery, prompt mutation, database migrations, or automatic publication.

External source checks shape the design:

- NIST AI RMF and NIST AI 600-1 GenAI profile support explicit measurement, traceability, and human oversight rather than silent AI reuse.
- OWASP LLM Top 10 guidance supports safe output handling, limiting sensitive data exposure, and avoiding overreliance on model output.
- GOV.UK service-manual usability testing guidance supports task-based issue recording, which maps well to existing V0 trial feedback and run-step evidence.

## Goals / Non-Goals

**Goals:**

- Derive a deterministic quality triage summary from existing `AiReviewRunDetail` fields.
- Rank the most important run-level blocker or repair path in operator language.
- Show section-level repair reasons and target routes such as knowledge review, source review, prompt review, validation repair, human review, or downstream draft.
- Preserve the existing protected route and repository behavior; the browser continues to consume scoped run detail only.
- Extend local V0 verification so the helper catches blocker priority, safe routing, and downstream gating without live DeepSeek calls.

**Non-Goals:**

- No new database table, migration, repository, API route, provider adapter, RAG retrieval, queue, analytics SDK, or production login behavior.
- No automatic knowledge publishing, source trust changes, prompt edits, talk-track publishing, or task completion.
- No change to live model gating, prompt versions, provider payload handling, or DeepSeek configuration.
- No broad UI redesign or marketing-style visual treatment.

## Decisions

### Decision 1: Add a deterministic client/domain helper

Create `summarizeAiReviewQualityTriage(detail)` in `apps/web/src/lib/ai-review-v0-workflow.ts`.

Rationale:

- Existing evidence helpers already live in this file and operate on safe `AiReviewRunDetail`.
- A pure helper is easy to verify in `operator-v0-check.ts` without database or browser-specific setup.
- It avoids adding API fields before there is evidence that the shape should become a persisted contract.

Alternatives considered:

- New API response shape: deferred because the current protected detail route already returns the needed safe fields.
- New persistence model: rejected because triage is a derived view and should not become another source of truth.
- AI-generated triage: rejected for V0 because the current risk is trusting AI output; quality routing should be deterministic first.

### Decision 2: Prioritize repair paths with explicit severity

The triage helper will produce a run-level priority and section-level repair items. Priority order:

1. Validation blocker or failed safety check.
2. Sensitive or long-input policy issue if represented in validation or input snapshot.
3. Missing knowledge or wrong source feedback.
4. Evidence-weak feedback, missing sources, low/unknown confidence, or validation warnings.
5. Human review still pending.
6. Downstream ready after accepted/edited review.
7. Generated but no clear action.
8. Not generated yet.

Rationale:

- This matches the product rule that AI output cannot become business truth before human review.
- It turns feedback signals into review routing without mutating knowledge or prompts.
- It gives operators a single next action while still preserving detailed section cards.

### Decision 3: Surface triage as an operational panel, not a new workflow

Add a compact "质量卡点" panel next to existing evidence confidence and add triage badges/guidance inside generated section cards.

Rationale:

- Operators already work in `/ai-review`; sending them to another page would slow the V0 trial.
- A panel can improve scan speed without adding visual noise.
- The existing component pattern supports badges, rows, and accessible alert copy.

Alternatives considered:

- Replace the evidence confidence panel: rejected because it would remove useful existing context.
- Add charts: rejected because the state is small, categorical, and action-oriented.
- Build an admin analytics view: deferred until trial evidence accumulates.

## Risks / Trade-offs

- Derived triage may feel authoritative even though it is heuristic -> UI copy must use repair guidance and review language, not "truth" or "score" language.
- More status labels can increase cognitive load -> show one run-level priority first, then only the top few section repair items.
- Existing fake-provider demo data may not include every failure mode -> verifier will create or reuse deterministic conditions for missing knowledge, source, validation, and downstream gating.
- Client-side helper can diverge from future server behavior -> keep it pure, typed, and covered by focused verification so it can later move server-side if needed.
- No database/API change means downstream dashboards cannot query triage directly yet -> acceptable for V0 because the immediate user outcome is browser review confidence.

## Migration Plan

1. Add OpenSpec delta specs and validate the change.
2. Add triage types and helper to the existing AI review workflow lib.
3. Extend the local V0 verifier to exercise triage priority, repair routing, and downstream gating.
4. Add the `/ai-review` panel and section-card guidance using existing workbench components and tokens.
5. Run focused AI review verification, lint, typecheck, build, and `openspec validate`.
6. Run Playwright before archive because rendered `/ai-review` UI changes are in scope.

Rollback is straightforward: remove the helper, panel, and spec delta before archive; no data migration or external service state is introduced.
