## Context

The current V0 trial path is accessible through `/trial` and the overview
cockpit. Evaluators can enter the deterministic demo team, inspect six
workbenches, and see a dynamic readiness summary. The missing evidence loop is
structured evaluator feedback: without it, the next roadmap wave can only infer
whether the current V0 is useful, confusing, trustworthy, or ready for real
operator work.

This work belongs to the technical roadmap's existing stage-3/stage-4 local
runtime pattern: PostgreSQL + Drizzle migration, Zod validation, server-only
repository, protected Route Handlers, tenant/team scope, no-store safe JSON, and
browser UI over the existing app-owned trial session. It does not select a
production analytics provider or replace production auth decisions.

Target evaluators are live operators, hosts/assistants, product owners, and team
leads. The workflow improved is V0 trial evaluation: after trying a workbench or
the full path, the evaluator can record whether the feature is useful, clear,
and suitable for real work, plus the main friction category.

## Goals / Non-Goals

**Goals:**

- Capture low-friction V0 feedback from verified trial evaluators inside the
  existing trial/overview experience.
- Persist feedback with tenant/team/actor scope and safe metadata so future
  roadmap decisions can be based on trial evidence.
- Keep feedback fields minimal and operator-readable: evaluator role, workbench,
  usefulness rating, clarity rating, issue type, concise note, and optional real
  work signal.
- Provide protected create/list APIs and repeatable local checks for validation,
  scope isolation, auth/CSRF, no-store responses, and redaction.
- Update durable docs so trial feedback becomes the explicit input to the next
  V0/V1 prioritization wave.

**Non-Goals:**

- No production analytics, telemetry SDK, third-party survey tool, event stream,
  or external data processor.
- No production login/provider work, invitation flow, team switching, or HTTPS
  rollout.
- No RAG/Q&A runtime, public source discovery, live AI calls, or prompt changes.
- No storage of raw customer chats, order data, private messages, full live
  transcripts, raw prompts, cookies, session references, API keys, or database
  URLs in feedback.
- No broad visual redesign of the workspace.

## Decisions

1. **Use a first-class `v0_trial_feedback` table rather than audit events only.**

   Feedback has user-value fields that must be queried later by role, workbench,
   issue type, and real-work signal. Audit events are useful for system activity,
   but using them as the primary feedback model would bury product evidence in
   metadata and invite inconsistent payload shapes. A dedicated table keeps the
   data explicit while preserving tenant/team/actor ownership.

2. **Require verified trial/auth session, tenant/team scope, and mutation CSRF.**

   Feedback belongs to the protected internal/demo team context. List and create
   routes will follow existing protected API patterns: read the app-owned cookie,
   require explicit tenant/team scope, resolve `AuthContext`, convert to
   `DataAccessContext`, and return no-store safe JSON. Create uses a custom
   `x-operation-csrf: v0-trial-feedback` header. Any evaluator with
   `read_workspace` may submit feedback because trial feedback should not be
   limited to admins or reviewers.

3. **Keep the model deliberately small.**

   External UX guidance supports collecting focused qualitative feedback near the
   task being evaluated. The model will use enumerations for role, workbench,
   issue type, and real-work signal, plus 1-5 usefulness/clarity ratings and one
   concise note. This is enough to prioritize next work without creating a
   survey product or analytics platform.

4. **Reject known sensitive patterns instead of trying to sanitize arbitrary raw
   business data.**

   Feedback notes are not a transcript field. Repository validation will reject
   obvious secrets and sensitive infrastructure markers such as `sk-`, `Bearer`,
   cookie/session words, raw database URLs, and common authorization strings.
   The UI will use short operator-facing copy asking evaluators to describe the
   friction, not paste customer/private/order data.

5. **Place feedback in the trial cockpit, not as a marketing form.**

   The UI/UX skill suggested a conversion-oriented webinar/hero pattern, but
   that conflicts with the project's operational-tool rules. The useful parts
   are minimal fields, visible submission states, focus states, contrast, and
   responsive checks. The implemented surface will be a compact workbench panel
   available after trial readiness, with stable controls and no decorative
   redesign.

6. **Continue using Route Handlers instead of introducing Server Actions in this
   wave.**

   Next.js supports both patterns, and the UI/UX stack guidance mentions Server
   Actions for forms. Existing project architecture for protected V0 workflows is
   Route Handler based, with reusable route-check scripts. Switching mutation
   architecture just for feedback would create inconsistency without improving
   the user outcome. A future Server Action wrapper can be considered after
   production auth/provider decisions.

## Risks / Trade-offs

- **Feedback notes may include sensitive data** → Keep the note short, warn in
  UI copy, reject obvious secret/session/database patterns, avoid logging raw
  note content in errors, and verify redaction checks.
- **Ratings can be too vague to guide roadmap** → Pair ratings with issue type,
  workbench path, role, and concise note so feedback is sortable and actionable.
- **A feedback panel could add visual noise** → Render it only as a compact
  operator control in `/trial` and overview, using existing card/form styling and
  no marketing layout.
- **Local-only persistence may be mistaken for production analytics** → Document
  the boundary clearly in OpenSpec and roadmap; do not introduce external
  telemetry or production data collection.
- **Route/API shape can diverge from existing workbenches** → Copy the
  established repository/route/check patterns from next-actions and other V0
  domains, including no-store, safe errors, and explicit scope.

## Migration Plan

1. Add Drizzle schema enums/table and generate a checked-in migration.
2. Add server-only repository with validation, scoped create/list, and safe
   error mapping.
3. Add protected Route Handler helpers and `/api/trial-feedback` API route.
4. Add a rollback-style local route/repository check and package scripts.
5. Add a compact client feedback panel to the trial/overview cockpit.
6. Update roadmap docs and OpenSpec task status.
7. Verify locally, run Playwright before archive, archive the change, then
   commit, push, rebuild, redeploy Docker, and smoke the public preview.

Rollback is straightforward: remove the panel/API use and revert the migration
before production adoption. Because the table is local-only V0 feedback, no
external provider cleanup is required.

## Open Questions

None for this wave. Future waves may decide whether trial feedback should feed a
formal evaluation set, analytics dashboard, or production customer feedback
queue after V0 trial evidence exists.
