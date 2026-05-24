## ADDED Requirements

### Requirement: Next-session task schema persists source-linked task records
The system SHALL provide local PostgreSQL schema for next-session tasks, source trails, assignees, checklist items, dependencies, review results, and feedback signals using explicit tenant/team scope, audit fields, and lifecycle enums.

#### Scenario: Schema includes scoped task entities
- **WHEN** the next-session task persistence migration is generated and applied
- **THEN** it creates task, source, assignee, checklist, dependency, review result, and feedback signal tables with tenant/team scope and appropriate foreign keys

#### Scenario: Schema preserves task provenance
- **WHEN** a task references a session, AI review section, knowledge gap, talk-track asset, Q&A feedback, or manual source
- **THEN** source workflow, source IDs, source version/section IDs, AI run metadata, related knowledge/racket/talk-track IDs, and redaction state are stored separately from the task summary

#### Scenario: Schema keeps task domain language
- **WHEN** the schema is reviewed
- **THEN** it uses next-session task domain fields such as task type, priority, owner, due policy, source workflow, checklist, dependency, review result, and feedback signal rather than a generic item/content table

### Requirement: Next-session task repository enforces authorization and validation
The system SHALL provide a server-only repository that validates inputs, checks `DataAccessContext` permissions, verifies active assignees, and scopes every read/write to the authorized tenant/team.

#### Scenario: Authorized actor creates a task
- **WHEN** an actor with `manage_next_tasks` creates a valid next-session task with title, summary, task type, priority, source trail, and optional owner/checklist
- **THEN** the repository persists the task under the actor's tenant/team and returns a task view with source trail, checklist progress, and readiness blockers

#### Scenario: Missing permission is rejected
- **WHEN** an actor without `manage_next_tasks` tries to create, assign, cancel, review, close, archive, or manage dependencies for a next-session task
- **THEN** the repository rejects the operation with a typed permission error before writing task records

#### Scenario: Owner can update own progress
- **WHEN** a task owner with `read_workspace` but without `manage_next_tasks` updates their own task from assigned to in-progress, blocked back to in-progress, or in-progress to complete
- **THEN** the repository allows the limited progress update while preserving tenant/team scope

#### Scenario: Cross-team data is isolated
- **WHEN** next-session tasks exist in another team under the same tenant
- **THEN** list and detail queries from the current team do not return those records

#### Scenario: Inactive owner is rejected
- **WHEN** task creation or assignment targets an inactive, removed, suspended, or cross-team member
- **THEN** the repository rejects the command with an assignee-related error and no task is created

### Requirement: Source readiness and sensitive data gate task creation
The system SHALL reject or block next-session task creation when the source state or redaction state is unsafe for downstream team work.

#### Scenario: AI source is not accepted
- **WHEN** a task is created from an AI review source whose source state is draft, candidate, review-ready only, rejected, failed, or otherwise not accepted
- **THEN** the repository rejects the task with a source-readiness error

#### Scenario: Manual source creates a draft or assigned task
- **WHEN** a task is created from a manual source with a manual source state and no sensitive-data blocker
- **THEN** the repository persists the task and derives readiness from owner, checklist, dependency, review, and lifecycle state

#### Scenario: Sensitive source is blocked
- **WHEN** task source metadata has `sensitiveRedactionState` of `blocked`
- **THEN** the repository rejects the command with a sensitive-data error and no task is persisted

#### Scenario: Sensitive source needs review
- **WHEN** task source metadata has `sensitiveRedactionState` of `needs_review`
- **THEN** the repository may persist only a draft task and readiness includes a sensitive-data blocker until the source is redacted or cleared by a future workflow

### Requirement: Next-session task lifecycle is state-safe
The system SHALL enforce controlled task state transitions, stale-state checks, checklist completion rules, and dependency blockers.

#### Scenario: Valid owner progress transition succeeds
- **WHEN** an assigned task owner starts the task using the current `fromStatus`
- **THEN** the task transitions to `in_progress` and records updated actor metadata

#### Scenario: Stale task status is rejected
- **WHEN** an actor updates a task with a `fromStatus` that no longer matches the persisted task status
- **THEN** the repository rejects the operation with a state conflict error

#### Scenario: Invalid transition is rejected
- **WHEN** an actor attempts a transition that is not allowed by the next-session task state machine
- **THEN** the repository rejects the operation with `STATE_TRANSITION_INVALID`

#### Scenario: Required checklist blocks completion
- **WHEN** an actor completes a task while required checklist items are still todo or blocked
- **THEN** the repository rejects completion with `CHECKLIST_REQUIRED_INCOMPLETE`

#### Scenario: Dependency blocks completion
- **WHEN** an actor completes a task while a dependency is pending or blocked
- **THEN** the repository rejects completion with `DEPENDENCY_BLOCKED`

#### Scenario: Review-required completion enters reviewing
- **WHEN** an actor completes an in-progress task that requires review
- **THEN** the repository moves the task to `reviewing` instead of directly closing it

#### Scenario: Reviewer closes a review-required task
- **WHEN** an authorized reviewer records an approve-close review decision for a task in reviewing state
- **THEN** the repository records a review result and moves the task to `closed`

### Requirement: Duplicate active tasks are rejected
The system SHALL prevent duplicate active tasks within the same tenant/team for the same source, task type, owner, target session, and related racket products.

#### Scenario: Duplicate active task is submitted
- **WHEN** an actor creates a task whose duplicate fingerprint matches an active non-terminal task in the same tenant/team
- **THEN** the repository rejects creation with a duplicate-task error and no second task is created

#### Scenario: Same source exists in another team
- **WHEN** another team has a task with the same source, task type, owner value, target session, and related racket products
- **THEN** the repository permits the current team to create its own task because tenant/team ownership scopes duplicates

### Requirement: Task feedback signals remain audit-only
The system SHALL record task feedback signals as scoped audit data without automatically changing authoritative knowledge, prompts, talk tracks, or AI behavior.

#### Scenario: Feedback signal is recorded
- **WHEN** an authorized actor records that a task was completed, blocked, duplicate, not useful, helped the next session, missed its due date, or needs a better source
- **THEN** the repository stores the feedback signal with actor, task, route, reason, tenant/team, and timestamp

#### Scenario: Feedback does not mutate upstream assets
- **WHEN** a feedback signal routes to team review, knowledge review, prompt review, workflow review, or none
- **THEN** no knowledge version, prompt, talk-track asset, or source record is modified by the feedback write

### Requirement: Next-session task verifier proves local behavior
The system SHALL provide a local rollback-style verifier for next-session task persistence.

#### Scenario: Verifier covers primary workflow and failures
- **WHEN** the next-session task check command runs against the local development PostgreSQL database
- **THEN** it verifies create, list/detail, duplicate rejection, inactive owner rejection, missing permission rejection, owner progress, checklist and dependency blockers, review-required closure, feedback recording, sensitive-source blocking, cross-team isolation, and transaction rollback

#### Scenario: Existing checks continue to pass
- **WHEN** next-session task persistence is implemented
- **THEN** existing data foundation, auth guard, racket product, session capture, knowledge lifecycle, lint, typecheck, build, and OpenSpec validations still pass
