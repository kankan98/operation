## 1. TDD Verifier

- [x] 1.1 Add `ai-review:generation-check` scripts to the web and root package manifests.
- [x] 1.2 Add a failing `apps/web/src/server/ai-review/generation-check.ts` verifier that imports the not-yet-implemented generation module and covers the required success and failure scenarios.
- [x] 1.3 Run `pnpm ai-review:generation-check` and observe the expected RED failure.

## 2. Orchestrator Implementation

- [x] 2.1 Implement server-only generation input, output, validation-result, metadata, and safe error types.
- [x] 2.2 Implement bounded snapshot validation for redaction, long input, reviewed evidence, session signal, freshness, and conflict states before provider invocation.
- [x] 2.3 Implement prompt message construction with version metadata, output schema instructions, safe prompt fingerprinting, and no full prompt leakage.
- [x] 2.4 Implement provider invocation through injected `AiProviderPort` and map provider errors to safe AI review generation errors with retryability hints.
- [x] 2.5 Implement structured AI review output schema validation and local output validation for empty sections, source grounding, sensitive markers, stale/conflict warnings, and low evidence.
- [x] 2.6 Update the verifier until `pnpm ai-review:generation-check` passes.

## 3. Durable Records

- [x] 3.1 Update `docs/contracts/ai-review-run.md` with the local generation orchestrator runtime boundary and remaining deferred work.
- [x] 3.2 Update `docs/contracts/README.md`, `docs/architecture/agent-architecture.md`, `docs/architecture/technical-implementation-roadmap.md`, `docs/roadmap/ai-continuous-development-goal.md`, `docs/roadmap/autonomous-development-roadmap.md`, `README.md`, and `apps/web/README.md` to reflect the new server-only AI review generation boundary.
- [x] 3.3 Update accepted specs for `ai-review-generation-orchestrator`, `ai-review-run-contract`, `ai-review-run-persistence`, and `ai-provider-port` after implementation behavior is finalized.

## 4. Verification And Archive

- [x] 4.1 Run `openspec validate implement-ai-review-generation-orchestrator`.
- [x] 4.2 Run `pnpm ai-review:generation-check`, `pnpm ai-provider:check`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- [x] 4.3 Run `openspec validate --all`.
- [x] 4.4 Archive the completed OpenSpec change after all implementation and verification tasks pass.
