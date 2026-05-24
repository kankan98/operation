## Context

The project is currently in a local-only runtime stage. AI review already has:

- tenant/team-scoped repository persistence for runs, input snapshots, knowledge
  snapshots, prompt metadata, provider metadata, structured output, validation,
  decisions, feedback, downstream references, and archive state;
- a server-only `AiProviderPort` with a DeepSeek adapter;
- a server-only generation orchestrator that validates bounded, redacted
  snapshots and structured model output;
- a server-only execution service that coordinates repository state gates and
  generation handoff.

The missing boundary is a protected API runtime. Without it, future UI or thin
Server Actions would need to call repository/service code directly or repeat
auth, CSRF, provider, and redaction behavior. This change belongs to technical
roadmap stage 5 because it exposes AI review execution behind the existing
provider/repository boundaries while still excluding RAG, queues, production AI
release, and browser UI save flows.

Reliable sources checked:

- Next.js official Route Handler and authentication docs: Route Handlers are the
  appropriate App Router API boundary, while authentication must be paired with
  server-side authorization.
- OWASP API Security Top 10: every run, section, decision, feedback signal, and
  downstream reference needs object-level tenant/team authorization.
- OWASP Top 10 for LLM Applications: AI output must be schema-validated, human
  reviewed, and limited in agency before downstream reuse.
- NIST AI RMF: run metadata, validation results, human decisions, and feedback
  are needed as traceability and measurement evidence.
- DeepSeek official docs: provider-specific details remain behind the existing
  environment-configured `AiProviderPort`; verification defaults to fake
  provider and must not require real credentials.

## Goals / Non-Goals

**Goals:**

- Add a protected local-only AI review API runtime for the full stage slice:
  prompt version metadata, run preparation, run execution, list/detail, human
  review decisions, feedback signals, downstream artifact references, and
  archive.
- Preserve the existing architecture boundaries: App Router API -> route helper
  -> auth/session guard -> repository/execution service -> provider port.
- Short-circuit missing mutation CSRF and missing auth cookies before opening a
  database connection in App Router files.
- Return `Cache-Control: no-store` for every response.
- Return safe JSON errors without raw cookies, session references, provider
  tokens, full prompts, provider payloads, raw transcripts, DB URLs, or
  cross-team data.
- Provide a rollback route verifier using a fake provider by default.

**Non-Goals:**

- No browser UI changes, Server Action wrappers, or product copy changes.
- No RAG snapshot generation, pgvector retrieval, web discovery, queue/retry
  worker, or production async job model.
- No public login provider, middleware, team switching UI, or production auth
  provider choice.
- No automatic creation of talk-track assets or next-session tasks. This API
  only records downstream draft references after human acceptance.
- No live DeepSeek smoke test in default verification.

## Decisions

1. **One workflow-level API helper instead of endpoint-local logic.**
   - Decision: add `apps/web/src/server/ai-review/route.ts` containing shared
     preflight, auth context resolution, safe error mapping, request parsing,
     and handler functions.
   - Rationale: talk-track, next-actions, knowledge, sessions, and rackets
     routes already follow this pattern. It keeps auth/CSRF/no-store behavior
     consistent.
   - Alternative considered: implement each App Router file independently.
     Rejected because it would duplicate security behavior and make future UI
     wrappers harder to trust.

2. **Expose the adjacent AI review runtime as one coherent API stage.**
   - Decision: add these local-only API surfaces:
     - `POST /api/ai-review/prompt-versions`
     - `GET /api/ai-review/runs`
     - `POST /api/ai-review/runs`
     - `GET /api/ai-review/runs/[runId]`
     - `POST /api/ai-review/runs/[runId]/execute`
     - `POST /api/ai-review/runs/[runId]/decisions`
     - `POST /api/ai-review/runs/[runId]/feedback-signals`
     - `POST /api/ai-review/runs/[runId]/downstream-artifacts`
     - `POST /api/ai-review/runs/[runId]/archive`
   - Rationale: these share the same user workflow, permission, data boundary,
     and verification path. Splitting them would recreate the over-small
     proposal problem.
   - Alternative considered: only add execute and detail endpoints. Rejected
     because operators still could not prepare runs, review sections, record
     feedback, or prove downstream gates.

3. **Use existing permission and scope rules.**
   - Decision: all read routes require `read_workspace`; mutations require
     `run_ai_review`. Every request must include explicit `tenantId` and
     `teamId` via query params or existing auth scope headers.
   - Rationale: this matches existing protected business route patterns and
     OWASP object-level authorization guidance.
   - Alternative considered: infer tenant/team solely from the session. Rejected
     because current local runtime requires explicit target scope to prevent
     accidental cross-team access.

4. **Keep provider-specific behavior behind injection.**
   - Decision: the route helper accepts an injected `AiProviderPort` for execute
     routes. App Router files create the DeepSeek provider from environment
     only after CSRF/auth preflight; the route-check passes a fake provider.
   - Rationale: default verification must not call real DeepSeek and route code
     must not import provider-native payload types.
   - Alternative considered: execute route always constructs DeepSeek directly.
     Rejected because it would make fake-provider route verification difficult
     and increase secret-handling risk.

5. **Create prompt version metadata through the API but do not expose prompt
   text.**
   - Decision: add a prompt-version metadata create route because execution
     requires a reviewed/active prompt version ID. The existing repository only
     stores model policy and schema metadata, not full prompt bodies.
   - Rationale: this keeps the route workflow self-contained for local runtime
     verification without creating a prompt management UI or storing sensitive
     prompt text.
   - Alternative considered: seed prompt versions only in tests. Rejected
     because future UI/Server Action work would still lack a supported API
     boundary for prompt metadata.

6. **Map errors to safe operator-facing statuses.**
   - Decision: validation errors return 400, unauthenticated returns 401,
     forbidden scope/permission returns 403, not found returns 404, state
     conflicts return 409 or 422, long input returns 413, and provider/config or
     database failures return 500/503 with safe messages and retry hints.
   - Rationale: clients need actionable statuses without receiving sensitive
     provider or persistence internals.

## Risks / Trade-offs

- **Route count grows quickly** -> Mitigation: keep all shared behavior in one
  route helper and mirror existing App Router thin-file pattern.
- **Execute route can trigger a real provider when credentials exist** ->
  Mitigation: default route-check uses a fake provider, docs explicitly state no
  default live smoke, and App Router preflight avoids provider creation for
  missing CSRF/auth.
- **Prompt metadata route could be mistaken for prompt authoring** ->
  Mitigation: only expose existing metadata fields; do not accept full prompt
  text or prompt template bodies.
- **Downstream references could be mistaken for created assets** -> Mitigation:
  name the route and response as downstream artifact references; do not call
  talk-track or next-action repositories.
- **AI review APIs could leak sensitive AI or provider data** -> Mitigation:
  serialize only repository safe records, use existing redaction helpers for
  provider errors, and add verifier checks for raw cookies, secrets, DB URLs,
  bearer tokens, prompts, provider payloads, and cross-team markers.
- **No queue means execute is synchronous** -> Mitigation: keep this as a
  local-only MVP boundary; stage 9 queue/retry remains a later OpenSpec decision.

## Migration Plan

1. Add failing `ai-review:route-check` and package scripts first.
2. Implement the server route helper and thin App Router files.
3. Update contract, README, roadmap, and accepted spec notes.
4. Run route, repository, generation, execution, provider, adjacent auth, type,
   lint, build, and OpenSpec validation.
5. Archive after verification, then commit, push, rebuild Docker, restart the
   public preview container, and run public API health checks.

Rollback: revert the change commit to remove the route helper, App Router files,
script, docs, and archived spec. No new migration or dependency is introduced.

## Open Questions

- None for this local-only API runtime slice. Real login, RAG, queues, Server
  Actions, browser UI, and production AI release remain explicitly separate
  future OpenSpec changes.
