## Context

The internal V0 already supports `/ai-review` session selection, run
preparation, V0 fake-provider generation, gated live-model generation, human
decisions, feedback signals, and downstream draft references. The run detail
shape already contains the signals needed for operator trust: input snapshot,
knowledge snapshot, output overall confidence, section confidence, source refs,
validation results, decisions, and feedback signals.

The current page exposes those signals in separate places, but it does not turn
them into a clear answer to the operator's core question: "Can I use this
suggestion, and what must I check first?" The next V0 wave should make that
answer obvious while staying inside the existing local-only protected runtime.

This work belongs to the technical roadmap's stage 5 AI review MVP and stage 8
feedback-learning preparation, but it does not advance to new RAG, queue,
provider, production auth, or evaluation infrastructure.

## Goals / Non-Goals

**Goals:**

- Add a run-level evidence confidence model derived from existing
  `AiReviewRunDetail` fields.
- Add section-level evidence guidance derived from existing section,
  validation, and feedback fields.
- Show concise Chinese operator-facing trust summaries, warnings, and next
  review actions in `/ai-review`.
- Preserve current protected API, tenant/team scope, CSRF, no-store, review
  state, and downstream draft gates.
- Provide deterministic focused verification without live DeepSeek calls.

**Non-Goals:**

- No new database table, migration, API route, external analytics, AI provider,
  RAG retrieval, source discovery, queue, or dependency.
- No automatic publication of knowledge, talk tracks, short-video topics, or
  tasks.
- No claim that low-risk UI labels prove model quality. They only help
  operators inspect the current run.
- No replacement of formal evaluation sets or production monitoring.

## Decisions

### Decision 1: Derive evidence confidence in a shared browser helper

Create typed helper functions in `apps/web/src/lib/ai-review-v0-workflow.ts`
that accept `AiReviewRunDetail` and return a small view model:

- run stage label and tone;
- confidence label;
- evidence coverage summary;
- validation warning/blocker counts;
- reviewed/accepted/rejected/pending section counts;
- feedback hotspot summary;
- next review action;
- whether the run is ready for downstream draft creation.

Rationale: this keeps business interpretation out of JSX without creating a new
server contract. It also gives the route/check scripts a deterministic function
to verify.

Alternatives considered:

- Put the calculations directly in React: faster initially but harder to test
  and easier to duplicate across cards.
- Add server-side fields to `GET /api/ai-review/runs/[runId]`: unnecessary for
  V0 because all source data already exists in the response.
- Add persistence for trust scores: premature because trust scores are derived
  from current validation and review state, not authoritative records.

### Decision 2: Use operator-facing status labels, not numeric model scores

The UI will show labels such as `证据较完整`, `需要补证据`, `存在阻断`,
and `先审核再下游`, backed by counts and reasons. It will not display a
single numeric trust score.

Rationale: existing confidence values are coarse model/run metadata. A numeric
score would create false precision and could increase overreliance. NIST and
OWASP source review both point toward visible risk communication and human
oversight rather than hidden confidence claims.

Alternatives considered:

- Percent score: rejected because it implies model calibration that V0 does not
  have.
- Large warning banner only: rejected because operators need compact section
  guidance while scanning generated output.

### Decision 3: Keep downstream readiness tied to accepted review state

The evidence cockpit can explain why a section is or is not ready, but it will
not loosen the existing `accepted` / `edited` downstream requirement. If a
section has weak evidence, wrong-source, or missing-knowledge feedback, the UI
will keep the issue visible even after a review action.

Rationale: OWASP LLM05 highlights risk when generated output is passed
downstream without validation and handling. This preserves the current safety
model while improving operator understanding.

Alternatives considered:

- Block all downstream actions when any warning exists: too strict for V0,
  because some warnings may be review reminders rather than hard blockers.
- Allow downstream when confidence is high even if unreviewed: rejected because
  human acceptance remains the product boundary.

### Decision 4: Avoid redesigning the page shell

The change will insert a compact cockpit panel and enrich existing section
cards, using existing `workbench-*` styling, badges, buttons, and lucide icons.

Rationale: the product is an operational dashboard, and the UI/UX skill search
returned some high-energy marketing recommendations that do not fit. The useful
part is preserving feedback, focus, loading, error, and dense status states.

## Risks / Trade-offs

- [Risk] Derived labels could be mistaken for formal AI quality evaluation. →
  Mitigation: copy must say what to check or do next, not claim model accuracy.
- [Risk] More badges and warnings can make section cards noisy on mobile. →
  Mitigation: keep labels short, use stable grid dimensions, and verify mobile
  layout before archive.
- [Risk] Validation results are run-level today, not mapped to each section. →
  Mitigation: section guidance uses section-local source/confidence/feedback
  plus run-level warnings, and does not pretend to know unsupported per-section
  validation.
- [Risk] This improves review confidence but not actual generation quality. →
  Mitigation: feed weak evidence, wrong source, and missing knowledge back into
  visible feedback routing and record follow-up in roadmap/specs.

## Migration Plan

1. Add helper functions and focused checks.
2. Render the run-level cockpit and section-level guidance in `/ai-review`.
3. Update specs and roadmap wording after verification.
4. If a regression appears, rollback is limited to the helper and UI panel; no
   data migration or deployment rollback path is required beyond reverting the
   change.

## Open Questions

- Whether later V1 should persist aggregate trust snapshots for audit reporting
  remains deferred until a production evaluation/observability change.
- Whether validation results should become section-scoped belongs in a future
  AI review evaluation or RAG grounding change.
