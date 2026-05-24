## Context

The project already has a Next.js App Router baseline plus local-only PostgreSQL/Drizzle, `DataAccessContext`, provider-neutral authorization guard, and server-only repositories for racket products, session captures, and knowledge lifecycle records. The `next-session-task` contract is still draft/runtime-not-implemented, and `/next-actions` remains a static page.

This change belongs to technical roadmap stage 4: core operations persistence. It depends on accepted stage 2 and 3 boundaries already present locally, but it deliberately stays local-only. It does not expose browser persistence, API routes, Server Actions, AI provider calls, RAG, queues, notifications, calendar sync, exports, or production database behavior.

The operator value is a future-proof local repository boundary for follow-up work: task ownership, source provenance, due state, checklist readiness, dependencies, review closure, feedback signals, and sensitive-data gating can be verified before any public task board or AI downstream creation is exposed.

## Goals / Non-Goals

**Goals:**

- Add Drizzle/PostgreSQL schema for next-session task persistence with tenant/team ownership and explicit domain tables:
  - `next_session_tasks`
  - `next_session_task_sources`
  - `next_session_task_assignees`
  - `next_session_task_checklist_items`
  - `next_session_task_dependencies`
  - `next_session_task_review_results`
  - `next_session_task_feedback_signals`
- Add a server-only repository using the existing repository style:
  - accepts `DataAccessContext`
  - validates inputs with Zod
  - checks `manage_next_tasks`/`read_workspace` and owner-progress permissions
  - scopes all reads/writes by tenant/team
  - rejects inactive owners
  - blocks sensitive-source states
  - rejects source states that are not ready enough for the requested source workflow
  - prevents duplicate active tasks for the same source/task type/owner/target session/related products
  - derives readiness blockers for source, owner, checklist, dependency, review, and terminal states
  - supports local lifecycle operations needed by the verifier
- Add rollback-style local verification that proves create/list/detail, duplicate rejection, inactive owner rejection, missing permission rejection, owner progress, checklist/dependency blockers, review-required closure, feedback signal recording, sensitive-source blocking, cross-team isolation, and transaction rollback.
- Update docs and accepted specs after implementation so future agents understand the new local runtime boundary and remaining non-goals.

**Non-Goals:**

- No public `Route Handler`, `Server Action`, user-facing save flow, browser task CRUD, or Playwright UI verification.
- No auth provider/login runtime, middleware, cookie/session strategy, invite flow, or production tenant management.
- No AI provider, prompt execution, AI review run persistence, RAG, web discovery, or automatic downstream task generation.
- No queue, notification, calendar, recurring task generation, export, analytics, or external platform integration.
- No new npm dependencies.
- No Docker redeploy in this wave unless later work changes public preview behavior or the user asks.

## Decisions

### Decision 1: Implement Next-Session Tasks As A Local-Only Repository Slice

Use the same local repository pattern as `rackets`, `sessions`, and `knowledge`: schema, repository, check script, package scripts, OpenSpec, then archive after verification.

Alternatives considered:

- Provider/login runtime first: important, but it requires a separate provider/session decision and external operational choices. It is higher risk than this local repository slice.
- Talk-track persistence first: valuable, but next-session tasks close the "review leads to action" loop more directly for live operators and team leads.
- Public UI/API save flow now: not appropriate until real login/session and protected mutation boundaries are defined.

### Decision 2: Preserve Source Provenance In A Separate Source Table

Tasks will store an actionable title/summary on the task record and provenance metadata in `next_session_task_sources`. The source table stores workflow, source IDs, source version/section IDs, AI run/prompt metadata, related knowledge/racket/talk-track IDs, and sensitive redaction state.

Rationale:

- W3C PROV-O supports modeling entities, activities, agents, and derivation rather than flattening everything into a note.
- Sensitive customer messages, transcripts, prompts, provider payloads, and internal pricing details must remain in their source records and be referenced by ID, not copied into task summaries.

### Decision 3: Gate AI-Origin And Sensitive-Source Tasks Even Before AI Runtime Exists

The repository will accept source metadata for `ai_review`, `session_capture`, `knowledge_gap`, `talk_track`, `qa_feedback`, and `manual` sources, but it will only allow source states that are safe for a local task record:

- `manual`: requires `manual`.
- `ai_review`: requires `accepted` or `partially_accepted`.
- `session_capture`, `knowledge_gap`, `talk_track`, `qa_feedback`: require `review_ready`, `accepted`, `partially_accepted`, or `manual` depending on source workflow.
- `sensitiveRedactionState = blocked` is rejected.
- `sensitiveRedactionState = needs_review` is allowed only as draft and appears as a readiness blocker.

Rationale:

- NIST AI RMF and OWASP LLM risks make it unsafe to treat model output as an automatic team obligation.
- The current project has no AI review run persistence yet, so this is a guardrail and schema boundary, not AI integration.

### Decision 4: Keep Lifecycle Methods Focused But State-Safe

The repository will provide focused methods for:

- `createNextSessionTask`
- `getNextSessionTask`
- `listNextSessionTasks`
- `updateNextSessionTaskStatus`
- `updateTaskChecklistItem`
- `recordTaskDependency`
- `updateTaskDependencyState`
- `completeNextSessionTask`
- `recordTaskReviewResult`
- `recordTaskFeedbackSignal`

The state machine will reject unsupported transitions and stale `fromStatus` values. Completion will check required checklist items and unresolved dependencies. Review-required tasks go to `reviewing`; non-review tasks go to `done`.

Alternatives considered:

- One generic `updateTask` method: easier to write, but it hides state machine rules and raises permission risk.
- Full task management API: too large for the local-only slice and would invite UI/API scope creep.

### Decision 5: Duplicate Detection Is Repository-Enforced For Active Tasks

The repository will compute a normalized duplicate fingerprint from source workflow/source ID/source section/task type/owner/target session/related product IDs and reject duplicate active tasks in the same tenant/team.

Rationale:

- The first local slice does not need a partial unique database index across terminal/active statuses. Repository-level detection is enough for the verifier and matches existing local repository style.
- The schema will keep indexes on tenant/team, owner, status, due date, source workflow, and source IDs so a later database-level partial index can be added if production contention requires it.

### Decision 6: Owner Progress Is Allowed Without Full `manage_next_tasks`

Actors with `manage_next_tasks` can create and manage tasks. Actors with `read_workspace` who are the task `ownerId` may perform limited progress transitions on their own active task: `assigned -> in_progress`, `in_progress -> blocked`, `blocked -> in_progress`, and `in_progress -> complete`.

Rationale:

- The existing role policy gives `host` `read_workspace` but not `manage_next_tasks`; the contract expects assignees to update their own progress.
- Assignment, source changes, review closure, cancel/archive, dependency edits, and feedback routing remain controlled by `manage_next_tasks` in this local slice.

## Risks / Trade-offs

- Repository duplicate checks are not a full concurrency guarantee -> acceptable for local-only verification; a future public CRUD/production change can add partial unique indexes or transaction-level conflict handling if needed.
- Source readiness uses metadata rather than validating real AI/session/source records -> acceptable because AI review run persistence and public source integration are not implemented; future changes must add real foreign-key or service-level checks where records exist.
- Owner-progress permissions are narrower than the full future authorization model -> mitigated by documenting the boundary and testing only self-progress transitions, not assignment or closure.
- Sensitive-data detection is state-based, not content scanning -> mitigated by requiring callers to provide redaction state now; future AI/API/UI changes must add redaction/content checks before accepting raw user text.
- More schema tables increase migration surface -> mitigated by following existing Drizzle patterns, adding a rollback-style verifier, and running all existing repository checks.

## Migration Plan

1. Write the local `next-actions:check` verifier first and observe RED because schema/repository/scripts do not exist.
2. Add schema enums/tables and generate a Drizzle migration.
3. Implement `apps/web/src/server/next-actions/repository.ts`.
4. Implement `apps/web/src/server/next-actions/check.ts`.
5. Add package scripts at web and root.
6. Run migration and all relevant local checks.
7. Update contract, roadmaps, README, and accepted specs.
8. Archive the OpenSpec change after verification passes.

Rollback path:

- Before archive, remove the change files and any generated migration/schema/repository/script edits.
- After archive, revert the new migration and repository/check scripts in a follow-up OpenSpec change if the local slice proves wrong.
- Because this wave exposes no public UI/API and uses local database only, production user rollback is not applicable.

## Open Questions

- Which future public entry point should create the first real task: AI review accepted action, session follow-up, knowledge gap review, or manual task board entry?
- Should duplicate detection later support "create anyway with reason" for intentionally repeated preparation tasks?
- Should owner self-progress remain permission-only, or should future auth provider runtime also check membership activity at mutation time?
