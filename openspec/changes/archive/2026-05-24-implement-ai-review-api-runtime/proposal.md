## Why

AI review already has local persistence, a DeepSeek-backed `AiProviderPort`,
generation orchestration, and an execution service, but operators still have no
protected HTTP boundary to prepare, execute, inspect, review, feed back, or
archive review runs. This blocks the product from turning saved session and
knowledge snapshots into an auditable AI review workflow.

This proposal is intentionally scoped as a workflow-level runtime slice, not as
one or two isolated endpoints. It bundles the adjacent AI review API surfaces
that share the same operator goal, tenant/team authorization boundary, CSRF
mutation model, sensitive AI output rules, and route-check verification path.

Pre-proposal source checks:

- Next.js official Route Handler and authentication guidance confirmed that App
  Router Route Handlers are the right BFF/API boundary and that authentication
  must still be paired with server-side authorization:
  https://nextjs.org/docs/app/getting-started/route-handlers and
  https://nextjs.org/docs/app/building-your-application/authentication
- OWASP API Security Top 10 reinforced object-level authorization and sensitive
  data exposure risks for every run, section, and downstream artifact boundary:
  https://owasp.org/API-Security/editions/2023/en/0x11-t10/
- OWASP Top 10 for LLM Applications reinforced prompt/output validation,
  sensitive information disclosure controls, and limiting AI agency before
  downstream reuse:
  https://owasp.org/www-project-top-10-for-large-language-model-applications/
- NIST AI RMF reinforced traceability, measurement, and human oversight for AI
  workflow outputs before they influence operational decisions:
  https://www.nist.gov/itl/ai-risk-management-framework
- DeepSeek official API docs confirmed the provider remains behind the existing
  `AiProviderPort` and environment-based key/base URL/model configuration:
  https://api-docs.deepseek.com/zh-cn/

Skill-backed value exploration:

- Problem statement: a live-commerce operator is trying to turn a submitted
  session into reusable review suggestions, but must currently rely on
  server-only verifiers and cannot inspect or approve AI output through an API
  boundary, which makes the AI review work feel disconnected from the rest of
  the operations workflow.
- Opportunity-solution tree: the desired outcome is faster, safer review-to-
  execution handoff. The best opportunity is the missing protected AI review
  runtime boundary; the chosen solution is a single API slice covering prepare,
  execute, detail/list, decision, feedback, downstream artifact reference, and
  archive.
- AI-shaped readiness check: the product should not just "call an LLM"; this
  slice strengthens agent orchestration and human review by making run state,
  provider metadata, validation, decisions, and feedback traceable.

## What Changes

- Add local-only protected AI review Route Handler runtime helpers for:
  - creating prompt version metadata used by runs,
  - preparing bounded AI review runs from redacted session and reviewed
    knowledge snapshots,
  - listing and reading tenant/team-scoped runs,
  - executing a run through the existing execution service and injected
    `AiProviderPort`,
  - recording human review decisions,
  - recording feedback signals,
  - linking accepted sections to downstream draft artifact references,
  - archiving runs.
- Add App Router API files under `/api/ai-review/**` that short-circuit missing
  auth cookies and missing CSRF headers before opening the database connection.
- Add an `ai-review:route-check` verifier that uses rollback transactions and a
  fake provider by default, covering success, auth, CSRF, tenant/team isolation,
  execution failure, review gates, downstream gates, no-store responses, and
  sensitive metadata redaction.
- Update project scripts, contracts, roadmap, README, and accepted specs so
  future work starts from the new AI review API boundary.
- Keep out of scope: browser UI save flows, Server Actions, RAG snapshots,
  queues/retries, public login provider, production AI release, and automatic
  creation of talk-track or next-action records.

## Capabilities

### New Capabilities

- `ai-review-api-runtime`: protected local-only AI review API runtime for
  prompt metadata, run preparation, execution, reading, human review, feedback,
  downstream artifact references, archive, authorization, CSRF, no-store
  responses, provider safety, and rollback verification.

### Modified Capabilities

- `ai-review-run-contract`: update durable status requirements so the contract
  recognizes the new local-only protected AI review API runtime.
- `ai-review-execution-service`: update durable status requirements so future
  agents can distinguish the implemented local API runtime from still-deferred
  Server Actions, UI save flows, RAG, queues, and production AI release.

## Impact

- Affected code:
  - `apps/web/src/server/ai-review/route.ts`
  - `apps/web/src/server/ai-review/route-check.ts`
  - `apps/web/src/app/api/ai-review/**/route.ts`
  - root and web `package.json` scripts
- Affected docs:
  - `docs/contracts/ai-review-run.md`
  - `docs/contracts/README.md`
  - `docs/roadmap/ai-continuous-development-goal.md`
  - `docs/roadmap/autonomous-development-roadmap.md`
  - `docs/architecture/technical-implementation-roadmap.md`
  - `README.md`
  - `apps/web/README.md`
- Dependencies: no new runtime or npm dependencies.
- Deployment: Docker preview is redeployed only after archive, per project
  rule. Playwright is skipped unless this API-only wave later changes rendered
  UI.
