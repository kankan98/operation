## Why

The `/knowledge` route previews source registration, review, refresh, and
feedback learning, but future source ingestion, versioning, conflict handling,
AI grounding, and Q&A feedback need a contract before runtime implementation.
Defining this boundary now prevents public sources, team experience, AI findings,
and reviewed knowledge from being collapsed into one untrustworthy content pool.

## What Changes

- Add a knowledge lifecycle contract document under `docs/contracts/`.
- Define future runtime boundaries without implementing backend code, database
  schema, Server Actions, source discovery, web fetch, RAG indexing, AI calls,
  scheduled refresh, or persistence.
- Capture source registry entities, extracted claims, review decisions,
  knowledge versions, conflict records, refresh jobs, feedback signals,
  request/response shapes, lifecycle states, errors, authorization, sensitive
  data, audit metadata, and verification requirements.
- Update the contract index and roadmap notes so the next contract candidates
  are clear after knowledge lifecycle is drafted.
- Keep `/knowledge` as a static workbench; no user-facing behavior changes in
  this slice.

## Capabilities

### New Capabilities

- `knowledge-lifecycle-contract`: Defines the contract-first boundary for
  future source registration, claim extraction, review, versioning, conflict
  resolution, refresh scheduling, feedback learning, and AI/RAG-ready knowledge
  snapshots.

### Modified Capabilities

- `continuous-improvement-roadmap`: Records that the knowledge lifecycle
  contract is the next concrete contract baseline after product and session
  contracts, and that future knowledge persistence, source import, refresh, or
  AI grounding must follow it.

## Impact

- Affected documentation: `docs/contracts/`, `docs/roadmap/`, and OpenSpec
  accepted specs after archive.
- Affected workflow: future knowledge-source, review, refresh, RAG, Q&A, and AI
  grounding changes must use this contract as input.
- No runtime code, UI behavior, database, API route, AI provider, crawler,
  scheduler, queue, embedding store, package dependency, Docker image, or public
  preview change.
