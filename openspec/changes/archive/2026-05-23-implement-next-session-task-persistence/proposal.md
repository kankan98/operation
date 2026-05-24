## Why

Live-commerce review work currently stops at saved products, sessions, and knowledge assets; the next-session task contract exists, but there is still no local runtime boundary for turning follow-up needs into owned, source-linked, state-safe work. Implementing a local-only next-session task persistence slice now closes the smallest useful part of the operator loop without introducing public CRUD, AI provider calls, notifications, calendar sync, or production auth.

This wave helps operators and team leads preserve why a task exists, who owns it, what must happen before the next live session, and whether AI-origin or session-origin work is still blocked by review, sensitive data, or duplicate follow-up.

## Pre-Proposal Evidence

### Reliable Source Research

- RFC 5545 iCalendar VTODO is a standards-track source for to-do/action-item semantics. It confirms that task-like items need stable identity, due/completed/status metadata, and relationship support, so this proposal keeps `dueAt`, `deadlinePolicy`, lifecycle status, checklist progress, and dependency/source references explicit rather than modeling tasks as generic notes.
  Source: https://www.rfc-editor.org/rfc/rfc5545
- W3C PROV-O is a W3C Recommendation for provenance modeling. It confirms the need to connect entities, activities, agents, derivation, attribution, and primary sources, so this proposal preserves task source trails, AI run metadata, actor IDs, and downstream derivation instead of copying sensitive source payloads into task text.
  Source: https://www.w3.org/TR/prov-o/
- NIST AI RMF is an official NIST framework for AI risk management and trustworthiness considerations. It supports keeping AI-origin task suggestions auditable and review-gated rather than automatically creating team obligations from model output.
  Source: https://www.nist.gov/itl/ai-risk-management-framework
- OWASP Top 10 for LLM Applications identifies prompt injection, insecure output handling, sensitive information disclosure, excessive agency, and overreliance as LLM application risks. That reinforces the non-goal of AI provider/runtime automation in this wave and the requirement to block or review sensitive task content.
  Source: https://owasp.org/www-project-top-10-for-large-language-model-applications/

### Skill-Backed Value Exploration

- `openspec-explore`: checked current active changes, accepted specs, contracts, and technical roadmap; no active change existed, and the next useful stage-4 local slice should not repeat product, session, or knowledge repository work.
- `roadmap-planning`: compared provider/login runtime, talk-track persistence, and next-session task persistence. Provider runtime remains higher-risk because external auth/session choices need a separate provider decision gate; next-session tasks fit the current "local guard plus repository" stage and create a smaller operator-visible workflow bridge.
- `jobs-to-be-done`: target users are live operators, hosts, product owners, reviewers, and team leads. Their job is to convert live-session issues, customer questions, and review findings into concrete next-session preparation work with less manual coordination.
- `recommendation-canvas`: AI-generated task creation has high trust and security risk, so the recommended solution is not "AI creates tasks"; it is a persistence boundary that can later accept AI candidates only after source readiness, duplicate checks, sensitive-data review, and human or policy acceptance.
- `brainstorming`: considered three approaches: provider/login first, talk-track persistence first, or next-session task persistence first. The recommended approach is next-session task persistence because it completes a follow-up loop, is small enough to verify locally, and leaves public UI/API and AI automation out of scope.
- `codebase-recon`: repository history is tiny and current worktree is very active; current-file inspection is more authoritative than git history. Existing `rackets`, `sessions`, and `knowledge` repositories are the pattern to follow.

### Product Fit

- Target operator role: live operator and team lead first; host, product owner, and reviewer benefit through ownership, review, and blocker state.
- Improved workflow: after a session or future AI review, follow-up is no longer an unstructured note; it can become a scoped task with source trail, owner, checklist, blocker, and review result.
- Friction reduced: fewer lost follow-up actions, fewer duplicated assignments, clearer next-session readiness, and less risk of copying raw customer/prompt/provider data into task text.
- Restrained product highlight: a task readiness summary that explains "ready for next session" vs. blockers by source, owner, checklist, review, and sensitive-data state. It improves confidence without adding UI decoration or speculative automation.

## What Changes

- Add a new accepted capability for local-only next-session task persistence.
- Extend the Drizzle/PostgreSQL local schema with next-session task tables and enums for tasks, source trails, assignees, checklist items, dependencies, review results, and feedback signals.
- Add a server-only `NextSessionTaskRepository` following existing repository patterns:
  - `DataAccessContext` tenant/team scoping.
  - Zod input validation and typed errors.
  - permission checks using `manage_next_tasks`, with read access via `read_workspace`.
  - duplicate active-task detection based on source, task type, owner, target session, and related products.
  - source readiness and sensitive-data redaction gating for local manual/session/AI-origin task creation.
  - controlled state transitions for assign, start, block, unblock, complete, review, close, reopen, cancel, and archive where included in this slice.
  - checklist and dependency readiness derivation.
- Add a local rollback verifier and package scripts for `next-actions:check`.
- Update the `next-session-task` contract, roadmap, technical roadmap, and relevant README/spec documentation to reflect that local repository persistence is implemented while public UI/API/AI/notification/calendar/export runtime remains out of scope.

No breaking changes are intended.

## Capabilities

### New Capabilities

- `next-session-task-persistence`: local-only schema, repository, lifecycle gating, readiness derivation, and rollback verification for next-session tasks.

### Modified Capabilities

- None.

## Impact

- Affected code:
  - `apps/web/src/server/db/schema.ts`
  - `apps/web/src/server/db/migrations/**`
  - `apps/web/src/server/next-actions/**`
  - root and web package scripts
- Affected docs/specs:
  - `docs/contracts/next-session-task.md`
  - `docs/roadmap/ai-continuous-development-goal.md`
  - `docs/roadmap/autonomous-development-roadmap.md`
  - `docs/architecture/technical-implementation-roadmap.md`
  - `apps/web/README.md`
  - `openspec/specs/**`
- Dependencies:
  - No new runtime or development dependencies.
- Systems not affected:
  - No public Route Handler, Server Action, browser save flow, AI provider, RAG, queue, notification, calendar, export, Docker redeploy, or production database provider.
