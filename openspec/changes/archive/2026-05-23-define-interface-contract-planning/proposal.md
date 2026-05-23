## Why

Static frontend workbenches are useful for shaping operator workflows, but if
they do not preserve future data and API contracts, the project will pay for the
gap later when PostgreSQL, backend routes, AI runs, and team permissions are
introduced.

This change adds a contract-first planning layer and fixes the future Agent
architecture baseline: no real backend, database, RAG, or LLM integration is
implemented now, but future-facing interface and Agent contracts must be
documented early enough to prevent UI-only slices from drifting away from real
implementation.

## What Changes

- Add an interface contract planning standard for future backend/API/database
  work without introducing runtime APIs.
- Require static workbench slices that will later persist or call AI/backend
  behavior to document future domain entities, request/response shapes, states,
  errors, authorization, and verification assumptions.
- Add a `docs/contracts/` entry point for contract drafts.
- Add an Agent architecture planning document covering LLM provider boundary,
  RAG storage/retrieval, orchestration, tool use, feedback learning, evaluation,
  and safety gates.
- Update the autonomous development roadmap so interface contracts become a
  required "between static UI and backend/Agent implementation" stage.
- Keep no new dependencies, no API routes, no database schema, no vector index,
  no model calls, no mock server, and no fake persistence.

## Capabilities

### New Capabilities

- `agent-architecture-foundation`: Defines the planned Agent architecture,
  including LLM adapter selection, RAG baseline, orchestration, feedback,
  evaluation, and provider replacement boundaries.

### Modified Capabilities

- `technical-architecture-foundation`: Adds contract-first API/data planning
  requirements before backend, database, AI, RAG, or integration implementation.
- `continuous-improvement-roadmap`: Adds interface-contract planning to the
  autonomous iteration route and Now/Next sequencing.

## Impact

- Affected docs: `docs/contracts/README.md`,
  `docs/architecture/agent-architecture.md`,
  `docs/roadmap/autonomous-development-roadmap.md`.
- Affected specs: `agent-architecture-foundation`,
  `technical-architecture-foundation`,
  `continuous-improvement-roadmap`.
- Affected code: none.
- APIs/dependencies/data: none introduced.
