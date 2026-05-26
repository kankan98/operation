## Why

The internal V0 can now be entered and walked through as a connected trial path,
but the project still lacks a structured way to capture whether evaluators
actually find the path useful, clear, trustworthy, and ready for real work. This
matters now because the next roadmap choices should be driven by trial evidence,
not by adding more isolated capabilities before validating the current V0.

Pre-proposal research and value exploration:

- Nielsen Norman Group usability testing guidance was checked as a professional
  UX source for small-sample, task-oriented feedback loops. It supports keeping
  the feedback surface close to the real workflow and using qualitative notes to
  find friction quickly rather than waiting for broad analytics.
- OWASP Logging Cheat Sheet was checked as a security source for data that
  should not be logged directly, including secrets, session identifiers, and
  sensitive personal/business data. This keeps feedback notes scoped and
  redacted instead of becoming a raw transcript or customer-data dump.
- NIST Privacy Framework was checked as a standards-body source for limiting
  data processing to necessary, purposeful collection. This keeps the V0
  feedback model minimal: role, workbench, ratings, issue type, concise note,
  and whether the evaluator would use the workflow in real work.
- Next.js Route Handler, Drizzle migration, and Zod validation docs were checked
  as official technical sources. They confirm this wave can follow the existing
  project pattern: protected Route Handlers, Drizzle PostgreSQL migration, and
  explicit schema validation without adding dependencies or switching to a new
  mutation architecture.
- Skill-backed exploration used OpenSpec exploration, roadmap planning, problem
  framing, and UI/UX guidance. The durable conclusion is that V0 trial feedback
  is the next coherent workflow-level wave: it reduces planning guesswork,
  serves operators/hosts/product owners/team leads, and creates a restrained
  product highlight by making the trial cockpit visibly evidence-driven.

## What Changes

- Add a new V0 trial feedback capability for internal/demo evaluators.
- Persist trial feedback locally with tenant/team/actor scope, evaluator role,
  workbench/path, usefulness rating, clarity/friction rating, issue type,
  concise note, optional "can use in real work" signal, safe metadata, and
  timestamps.
- Add a protected feedback API for creating and listing scoped V0 trial feedback
  using the existing app-owned session cookie, explicit tenant/team scope,
  no-store responses, custom CSRF header for mutations, and safe error bodies.
- Add a compact feedback entry surface to `/trial` and the overview cockpit so
  evaluators can submit feedback without leaving the workbench flow.
- Add a local feedback verification script that covers valid create/list,
  validation failures, long-note rejection, unauthorized access, cross-team
  isolation, no-store responses, and sensitive metadata redaction.
- Update roadmap documentation so the project records that V0 feedback is now
  the evidence source for subsequent V0/V1 prioritization.

No external telemetry, analytics SDK, production login, third-party survey tool,
RAG, real customer data entry, or live AI call is introduced.

## Capabilities

### New Capabilities

- `v0-trial-feedback`: V0 trial feedback persistence, protected API, cockpit
  entry surface, safe data handling, and local/browser verification.

### Modified Capabilities

- None.

## Impact

- Affected app areas: `apps/web/src/server/db/schema.ts`, Drizzle migrations,
  a new feedback repository/route/check under `apps/web/src/server`, a new API
  route under `apps/web/src/app/api`, trial/overview UI components, workspace
  helper libraries, root and app package scripts, and roadmap docs.
- Data impact: local-only PostgreSQL table(s) for scoped evaluator feedback.
  Records are tenant/team/actor scoped and must not store raw cookies, session
  references, API keys, database URLs, raw transcripts, customer private data,
  or full prompts.
- Security impact: feedback submission requires an existing trial/auth session,
  explicit tenant/team scope, server-side authorization, mutation CSRF header,
  and no-store safe JSON responses.
- Dependency impact: no new runtime or development dependencies.
- Verification impact: OpenSpec validation, feedback repository/route check,
  existing trial/auth checks, lint, typecheck, build, Playwright desktop/mobile
  before archive, then archive, conventional commit, push, Docker redeploy, and
  public smoke check.
