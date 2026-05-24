## Why

The `/rackets` route now previews the product-library workflow, but future persistence, API, AI grounding, and RAG work would be risky without a contract that fixes the badminton-specific domain model first. A contract-first slice prevents later schema/API churn and keeps product facts, team notes, aliases, review state, and downstream AI usage separated.

## What Changes

- Add a racket product library contract document under `docs/contracts/`.
- Define the future runtime boundary without implementing backend code, database schema, AI calls, or persistence.
- Capture domain entities, commands, queries, request/response shapes, lifecycle states, errors, authorization, sensitive data, audit metadata, and verification requirements.
- Update the contract index and continuous goal notes so the next contract candidates are clear.
- Keep `/rackets` as a static workbench; no user-facing behavior changes in this slice.

## Capabilities

### New Capabilities

- `racket-product-library-contract`: Defines the contract-first boundary for future racket product persistence, alias handling, review lifecycle, source metadata, and downstream AI/RAG readiness.

### Modified Capabilities

- `continuous-improvement-roadmap`: Records that the racket product library contract is the first concrete contract baseline and that subsequent product persistence must follow it.

## Impact

- Affected documentation: `docs/contracts/`, `docs/roadmap/`, and OpenSpec accepted specs.
- Affected workflow: future product-library backend/database/API/AI changes must use this contract as input.
- No runtime code, UI behavior, database, API route, AI provider, package dependency, Docker image, or public preview change.
