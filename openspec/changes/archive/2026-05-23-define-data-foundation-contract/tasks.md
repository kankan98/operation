## 1. OpenSpec Baseline

- [x] 1.1 Create `data-foundation-contract` requirements covering runtime boundary, tenant/team ownership, repository access, migrations, validation, sensitive data, and verification.
- [x] 1.2 Update `continuous-improvement-roadmap` requirements so data foundation gates database-backed workflows.
- [x] 1.3 Update `technical-architecture-foundation` requirements so database architecture starts from the data foundation contract.
- [x] 1.4 Update `technical-blueprint` requirements so stage 3 follows the data foundation contract gate.

## 2. Contract Documentation

- [x] 2.1 Create `docs/contracts/data-foundation.md` with use case, stage gates, domain entities, commands, queries, request/response shapes, state machines, errors, authorization, sensitive data, audit metadata, verification, and open questions.
- [x] 2.2 Update `docs/contracts/README.md` so `data-foundation` is listed as draft and remains runtime-not-implemented.

## 3. Roadmap And Technical Alignment

- [x] 3.1 Update `docs/architecture/technical-implementation-roadmap.md` so data foundation is marked as the stage 3 contract gate before schema, migrations, repositories, and persistent protected records.
- [x] 3.2 Update `docs/roadmap/ai-continuous-development-goal.md` so future persistence and AI/RAG runtime work starts from the data foundation contract.
- [x] 3.3 Update `docs/roadmap/autonomous-development-roadmap.md` so data foundation moves from next contract work into the current contract baseline.

## 4. Verification And Archival

- [x] 4.1 Validate the change with `openspec validate define-data-foundation-contract`.
- [x] 4.2 Check changed markdown for placeholders, formatting issues, and obvious broken references.
- [x] 4.3 Archive the completed change and re-run `openspec validate --all`.
