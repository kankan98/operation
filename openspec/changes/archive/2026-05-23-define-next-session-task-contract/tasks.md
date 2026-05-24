## 1. OpenSpec Baseline

- [x] 1.1 Create `next-session-task-contract` requirements covering source provenance, ownership, due state, state transitions, AI gating, authorization, sensitive data, and verification.
- [x] 1.2 Update `continuous-improvement-roadmap` requirements so next-session task runtime starts from the contract.
- [x] 1.3 Update `technical-architecture-foundation` requirements so next-session task architecture is contract-gated.

## 2. Contract Documentation

- [x] 2.1 Create `docs/contracts/next-session-task.md` with use case, stage gates, domain entities, commands, queries, request/response shapes, state machines, errors, authorization, sensitive data, audit metadata, verification, and open questions.
- [x] 2.2 Update `docs/contracts/README.md` so `next-session-task` is listed as draft and remains runtime-not-implemented.

## 3. Roadmap And Technical Alignment

- [x] 3.1 Update `docs/architecture/technical-implementation-roadmap.md` so `next-session-task` is marked as a contract prerequisite before task persistence and AI downstream task creation.
- [x] 3.2 Update `docs/roadmap/ai-continuous-development-goal.md` so future next-session task runtime starts from the contract.
- [x] 3.3 Update `docs/roadmap/autonomous-development-roadmap.md` so `next-session-task` moves from next contract work into the current contract baseline.

## 4. Verification And Archival

- [x] 4.1 Validate the change with `openspec validate define-next-session-task-contract`.
- [x] 4.2 Check changed markdown for placeholders, formatting issues, and obvious broken references.
- [x] 4.3 Archive the completed change and re-run `openspec validate --all`.
