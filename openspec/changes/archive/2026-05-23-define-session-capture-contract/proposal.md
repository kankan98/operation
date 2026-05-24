## Why

The `/sessions` route previews the live-session capture workflow, but future
draft saving, transcript import, question structuring, AI review input, and task
handoff need a contract before runtime implementation. Defining the boundary now
prevents session notes, customer questions, product order, and downstream AI
inputs from being modeled as generic content later.

## What Changes

- Add a session capture contract document under `docs/contracts/`.
- Define future runtime boundaries without implementing backend code, database
  schema, Server Actions, uploads, transcript parsing, AI calls, or persistence.
- Capture live-session entities, commands, queries, request/response shapes,
  lifecycle states, long-input rules, error cases, authorization, sensitive
  data, audit metadata, and verification requirements.
- Update the contract index and roadmap notes so the next contract candidates
  are clear after session capture is drafted.
- Keep `/sessions` as a static workbench; no user-facing behavior changes in
  this slice.

## Capabilities

### New Capabilities

- `session-capture-contract`: Defines the contract-first boundary for future
  live-session draft capture, product order, transcript import, customer
  question grouping, objection tracking, and downstream AI review readiness.

### Modified Capabilities

- `continuous-improvement-roadmap`: Records that the session capture contract
  is the next concrete contract baseline after the racket product library
  contract, and that future session persistence must follow it.

## Impact

- Affected documentation: `docs/contracts/`, `docs/roadmap/`, and OpenSpec
  accepted specs after archive.
- Affected workflow: future session-capture backend/database/API/upload/AI
  changes must use this contract as input.
- No runtime code, UI behavior, database, API route, AI provider, upload
  pipeline, package dependency, Docker image, or public preview change.
