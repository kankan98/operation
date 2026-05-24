# next-session-task-contract Specification

## Purpose
Define the future next-session task contract for source provenance, ownership,
due state, lifecycle transitions, AI review downstream gating, authorization,
sensitive-data handling, audit metadata, and verification before task
persistence or runtime task workflows are implemented.
## Requirements
### Requirement: Next-session task contract exists
The project SHALL provide a `next-session-task` contract draft before
implementing next-session task persistence, API routes, Server Actions, AI
review downstream task creation, session follow-up workflows, reviewer closure,
feedback learning, or team task reporting.

#### Scenario: Future next-session task runtime work is proposed
- **WHEN** a future change proposes saving, assigning, completing, reviewing,
  generating, searching, exporting, or reporting next-session tasks
- **THEN** the agent starts from `docs/contracts/next-session-task.md` and
  updates it if task, source, owner, state, authorization, persistence, AI,
  feedback, reporting, or sensitive-data assumptions change

#### Scenario: Contract is read
- **WHEN** an agent opens the next-session task contract
- **THEN** it can identify current status, runtime boundary, use case, domain
  entities, commands, queries, request/response shapes, state machines, error
  cases, authorization, sensitive data, audit metadata, verification, and open
  questions

### Requirement: Tasks preserve source provenance
The next-session task contract SHALL model each task with source workflow,
source record, source readiness, supporting references, and actor metadata so
that operators can understand why the task exists.

#### Scenario: AI review creates a task candidate
- **WHEN** a future AI review run produces a next-session action candidate
- **THEN** the task candidate records AI run ID, section ID, prompt version,
  validation state, source references, and review state before it can become an
  assigned task

#### Scenario: Session follow-up creates a task
- **WHEN** a future operator creates a task from a live session, customer
  question, objection, knowledge gap, product issue, or talk-track gap
- **THEN** the task references the source record and source type instead of
  copying raw customer messages, full transcripts, prompts, or provider payloads

### Requirement: Tasks have explicit ownership and due state
The next-session task contract SHALL require owned, tenant-scoped task records
with task type, priority, owner, due date policy, status, and optional
checklist/dependency metadata.

#### Scenario: Task is assigned
- **WHEN** a future runtime assigns a next-session task
- **THEN** the task records tenant, team, owner, creator, task type, priority,
  due date or next-session deadline, and current status

#### Scenario: Task owner is inactive
- **WHEN** a future runtime assigns or transfers a task to an inactive or
  unauthorized member
- **THEN** the command fails with an assignee-related error and no assignment is
  committed

### Requirement: Task lifecycle uses a controlled state machine
The next-session task contract SHALL define valid task transitions for draft,
assigned, in-progress, blocked, done, reviewing, closed, reopened, canceled,
and archived states.

#### Scenario: Task is completed
- **WHEN** an assignee marks a task as done
- **THEN** the task moves to `done` or `reviewing` according to its review
  requirement rather than directly becoming closed in all cases

#### Scenario: Task is blocked
- **WHEN** an operator marks a task blocked
- **THEN** the task records blocker type, blocker reason, blocker owner where
  known, and the state can return to `in_progress` after the blocker is
  resolved

#### Scenario: Closed task needs more work
- **WHEN** a reviewer or authorized actor reopens a closed task
- **THEN** the task records reopen reason and transitions to `reopened` or
  `assigned` without erasing the original completion and review metadata

### Requirement: AI-generated tasks require downstream gating
The next-session task contract SHALL treat AI-generated task suggestions as
reviewable candidates that require source readiness, validation, and acceptance
before they become team work.

#### Scenario: AI source is not review-ready
- **WHEN** a future runtime tries to create a task from an AI review run or
  section that is draft, failed, rejected, blocked, or not eligible for
  downstream creation
- **THEN** the task creation is rejected with a source-readiness error

#### Scenario: Duplicate candidate exists
- **WHEN** a future runtime tries to create a task with the same source,
  task type, related product, owner, and target session as an existing active
  task
- **THEN** the command returns a duplicate-task response or links to the
  existing task rather than creating silent duplicates

### Requirement: Task authorization and sensitive data are enforced
The next-session task contract SHALL define role permissions, tenant/team
ownership, and sensitive-data handling for future task creation, assignment,
review, export, and audit.

#### Scenario: Unauthorized actor edits task
- **WHEN** an actor without the required tenant/team membership or role tries
  to create, assign, edit, close, archive, or export a next-session task
- **THEN** the operation is rejected by server-side authorization and records a
  redacted authorization failure audit event where appropriate

#### Scenario: Sensitive data appears in task body
- **WHEN** a task body, checklist item, comment, audit event, or export payload
  contains raw customer messages, private messages, order data, phone numbers,
  addresses, supplier details, full prompts, or provider payloads
- **THEN** the future runtime blocks, redacts, or routes the content for review
  according to the contract before persistence or export

### Requirement: Task verification covers follow-up quality
The next-session task contract SHALL define verification requirements for future
runtime work that prove tasks are owned, source-linked, permissioned,
state-safe, and useful for next-session preparation.

#### Scenario: Runtime implementation is proposed
- **WHEN** future code implements next-session task create, assign, update,
  block, complete, review, archive, search, AI downstream creation, feedback,
  export, or reporting
- **THEN** verification covers tenant/team isolation, role permissions, state
  transitions, duplicate detection, source readiness, inactive assignee handling,
  overdue/blocker behavior, sensitive log redaction, idempotency, and
  mobile/desktop task-list states when UI changes
