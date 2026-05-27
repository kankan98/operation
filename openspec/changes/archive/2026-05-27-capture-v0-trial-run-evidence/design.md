## Context

The internal V0 can already seed demo data, verify a trial session, show six
workbench readiness counts, collect scoped feedback, and summarize V0.9
readiness. What is missing is a first-class record of a specific evaluator's
trial pass through the path.

Today, a team lead can see that records and feedback exist, but cannot answer:

- Which evaluator actually ran the full six-step path?
- Which step was completed, skipped, or blocked?
- Which feedback belongs to a complete path run versus a loose note?
- Is the V0.9 readiness cockpit based on complete evidence or just demo data
  counts?

This design adds a small local-only trial-run evidence layer on top of the
existing internal trial access, public trial gate, scoped workbench APIs, and
V0 trial feedback system. It belongs to roadmap stages 3/4/8: local
persistence, core workflow evidence, and feedback learning preparation. It does
not move the project into production auth, RAG, source discovery, queues,
external analytics, or real customer data.

## Goals / Non-Goals

**Goals:**

- Persist scoped V0 trial runs and six ordered step evidence records for
  verified trial evaluators.
- Let `/trial` and `/` show a compact run panel that can start/resume a run,
  mark steps as pass/issue/skipped, collect concise friction notes, link to
  each workbench, and complete a run.
- Associate V0 trial feedback with an optional run and step so evidence review
  can distinguish complete-path feedback from loose feedback.
- Extend V0 readiness cockpit logic with complete-run evidence while preserving
  existing workbench count and feedback evidence behavior.
- Keep protected API, CSRF, no-store, tenant/team scope, actor ownership, safe
  errors, and sensitive-note blocking consistent with existing V0 trial
  feedback patterns.

**Non-Goals:**

- No production login provider, public login route, invitation flow, HTTPS/domain
  setup, production database provider, backup/restore, external analytics, or
  monitoring provider.
- No RAG, Q&A model calls, public source discovery, queue, object storage, or
  external platform integration.
- No real customer, order, private message, full transcript, raw prompt, cookie,
  session reference, provider payload, or API key storage.
- No attempt to make run evidence an authoritative product-quality score.
  It is trial evidence for prioritization only.

## Decisions

### Decision 1: Add first-class `v0_trial_runs` and `v0_trial_run_steps`

Add two local-only tables:

- `v0_trial_runs`
  - `id`, `tenant_id`, `team_id`, `actor_id`
  - `evaluator_role`
  - `status`: `active`, `completed`, `abandoned`, `archived`
  - `started_at`, `completed_at`, `created_at`, `updated_at`
  - `summary_note` with short length limit
  - `metadata` JSONB for safe UI/system metadata only
- `v0_trial_run_steps`
  - `id`, `run_id`, `tenant_id`, `team_id`, `actor_id`
  - `step_id`: `sessions`, `rackets`, `knowledge`, `ai_review`,
    `talk_tracks`, `next_actions`
  - `status`: `pending`, `passed`, `issue`, `skipped`
  - `friction_type`: same issue-type vocabulary as V0 trial feedback where
    applicable
  - `note` with short length limit
  - `completed_at`, `created_at`, `updated_at`
  - `metadata` JSONB for safe, non-sensitive evidence metadata

Use a unique index on `(run_id, step_id)` so every run has at most one evidence
row per V0 step. Keep tenant/team/actor columns on steps for efficient scoped
queries and defense in depth, even though they duplicate the parent run scope.

Rationale: this creates an auditable evidence chain without reusing free-form
feedback as state. It follows the existing project pattern of explicit domain
tables, typed statuses, scoped indexes, and server-only repositories.

Alternatives considered:

- Store run state in browser localStorage: rejected because readiness evidence
  must survive refresh and support scoped evidence summaries.
- Store run state inside `v0_trial_feedback.metadata`: rejected because feedback
  would become overloaded and hard to query safely.
- Add external analytics: rejected because the V0 boundary explicitly avoids
  third-party analytics and real sensitive data.

### Decision 2: Link feedback to run evidence with optional columns

Add nullable `trial_run_id` and `trial_run_step_id` to `v0_trial_feedback`.
Existing feedback remains valid with null links. New feedback submissions from
the run panel can include the current run and step, and the repository must
verify the linked run/step belong to the same tenant/team/actor scope.

Rationale: the feedback summary can continue to include all scoped feedback,
while future run evidence summaries can report complete-path feedback separately
from loose notes.

Alternatives considered:

- Store feedback ids on run steps as JSON: rejected because it is harder to
  enforce referential integrity and harder to query by feedback.
- Require every feedback record to link to a run: rejected because existing
  loose feedback is still useful and should remain supported.

### Decision 3: Protected Route Handlers mirror existing trial feedback APIs

Add local-only protected Route Handlers:

- `GET /api/trial-runs`
  - lists recent scoped runs and returns an evidence summary
  - supports `status` and `limit` query params
- `POST /api/trial-runs`
  - creates an active run and its six pending step rows
  - requires `x-operation-csrf: v0-trial-run`
- `GET /api/trial-runs/[runId]`
  - returns scoped run detail with steps
- `PATCH /api/trial-runs/[runId]`
  - updates run status or short summary note
  - completing requires all six steps to be passed, issue, or skipped
- `PATCH /api/trial-runs/[runId]/steps/[stepId]`
  - updates step status, friction type, and note
  - passed steps may have an empty note; issue/skipped steps require a concise
    note

Use the existing app-owned session cookie, explicit tenant/team scope,
`read_workspace` permission, no-store JSON responses, CSRF on mutations, and
safe error mapping.

Rationale: the project has standardized protected V0 local APIs as Route
Handlers. Server Actions remain a future thin wrapper option, but this wave
should stay consistent with existing trial feedback and workbench APIs.

### Decision 4: Evidence summary is derived, not scored

The repository returns a deterministic summary with:

- total runs, active runs, completed runs;
- latest active run;
- step coverage counts;
- issue/skipped counts by step;
- completion readiness label;
- next action and linked workbench;
- representative friction notes.

Do not compute a numeric usability score. The UI should describe what evidence
exists and what to do next.

Rationale: a numeric score would imply precision that the trial data does not
have. The current V0 needs operational evidence and routing, not a generalized
quality metric.

### Decision 5: UI stays inside the existing cockpit

Extend `InternalTrialCockpit` with a restrained "本次试用运行" panel:

- visible after a verified trial session;
- start/resume/complete actions;
- six stable step rows using existing checklist copy;
- status buttons: `通过`, `有卡点`, `跳过`;
- concise note input for issue/skipped;
- per-step workbench link;
- small run summary and next action.

The panel should not become a marketing onboarding page. It should stay dense,
operator-facing, keyboard accessible, and mobile-safe.

## Risks / Trade-offs

- [Risk] More cockpit controls could make `/trial` noisy. → Mitigation: keep the
  panel compact, reuse existing checklist copy, and hide detailed note controls
  behind the current step row state where practical.
- [Risk] Trial run evidence can be mistaken for production readiness. →
  Mitigation: UI copy and roadmap/specs must keep internal V0 trial evidence
  separate from production login, HTTPS, backups, sensitive data governance,
  RAG/Q&A, and monitoring.
- [Risk] Linking feedback to a run could leak cross-team data if only the id is
  checked. → Mitigation: repository must validate tenant/team/actor scope for
  every linked run and step.
- [Risk] Evaluators may paste sensitive content in step notes. → Mitigation:
  reuse sensitive marker blocking from feedback notes and keep length limits
  short.
- [Risk] Complete-run evidence could still be based on demo data only. →
  Mitigation: summary labels must call this "演示/脱敏试用证据" and never imply
  real customer validation.

## Migration Plan

1. Add enums, tables, nullable feedback link columns, and Drizzle migration.
2. Add server-only repository and route handlers with local rollback checks.
3. Add client helpers and cockpit UI.
4. Extend readiness summary to consume run evidence.
5. Update roadmap/spec wording after implementation evidence is known.

Rollback is straightforward: remove the route/UI/repository usage and revert the
new migration before production adoption. Because this is local-only V0 preview
data, no external provider cleanup is required.

## Open Questions

- Whether a future production trial should support multiple evaluator personas
  per run remains deferred until production login/team management exists.
- Whether run evidence should feed formal AI evaluation sets remains deferred to
  an AI evaluation/RAG quality wave.
