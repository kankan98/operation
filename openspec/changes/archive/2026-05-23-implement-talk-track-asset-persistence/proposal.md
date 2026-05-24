## Why

Talk-track assets are still contract-only while product, session, knowledge, and
next-session task records already have local repository slices. This blocks the
operator workflow where effective product explanations, objection replies, and
AI-review candidates need a versioned, reviewed, source-grounded place before
they can become reusable team assets.

Pre-proposal checks used W3C PROV-O for provenance/version derivation, NIST AI
RMF for governed AI review and traceability, OWASP LLM Top 10 for sensitive
information and overreliance risks, and IETF BCP 47/RFC 5646 for stable language
tag semantics. The scope is intentionally local-only persistence because those
sources reinforce source attribution, human approval, and data boundaries more
than early AI automation.

Skill-backed exploration confirmed the target users are hosts, operators,
product owners, reviewers, and team leads. The improved job is turning repeated
live-selling wording and AI/session candidates into reviewed, reusable,
team-scoped assets without treating AI output or unsupported claims as truth.

## What Changes

- Add local PostgreSQL/Drizzle schema for talk-track assets, versions,
  scenarios, segments, objection patterns, source grounding, review decisions,
  candidates, and usage signals.
- Add a server-only talk-track repository with Zod input validation,
  tenant/team filtering, permission checks, state transition guards, duplicate
  scenario checks, source-grounding publish blockers, AI-candidate review
  blockers, sensitive-data blockers, and downstream readiness output.
- Add a rollback-style local verifier and package scripts for the talk-track
  repository slice.
- Update contract and roadmap documentation to mark the local-only runtime slice
  as partially implemented and to keep UI/API/AI/RAG/public CRUD out of scope.
- Do not add UI changes, Route Handlers, Server Actions, AI provider calls,
  RAG retrieval, external source discovery, new dependencies, or production
  database/provider behavior.

## Capabilities

### New Capabilities
- `talk-track-asset-persistence`: Local-only repository persistence for
  versioned, reviewed, source-grounded talk-track assets and AI/manual
  candidates.

### Modified Capabilities
- `talk-track-asset-contract`: Record that the first runtime slice implements
  local repository persistence only, while public save, AI generation, RAG
  grounding, and UI workflows remain gated.

## Impact

- Affects `apps/web/src/server/db/schema.ts`, Drizzle migrations, a new
  `apps/web/src/server/talk-tracks/` repository/check, root and app package
  scripts, `docs/contracts/talk-track-asset.md`, roadmap docs, and OpenSpec
  specs.
- Uses existing PostgreSQL, Drizzle, Zod, server-only, auth context, and
  repository patterns. No new dependency or provider is introduced.
- Verification will cover OpenSpec validation, migration generation/application,
  local repository rollback check, existing repository checks, lint, typecheck,
  build, and all accepted specs. Playwright and Docker deployment are skipped
  because this wave does not change rendered UI or public preview behavior.
