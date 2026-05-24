## ADDED Requirements

### Requirement: AI review run local persistence exists
The system SHALL provide a local-only PostgreSQL/Drizzle persistence slice for AI review runs before implementing real provider execution or public save flows.

#### Scenario: Migration defines AI review run ledger
- **WHEN** the database migration is generated and applied locally
- **THEN** it creates tenant/team-scoped records for runs, input snapshots, knowledge snapshots, prompt versions, provider invocation metadata, outputs, sections, validation results, human decisions, feedback signals, and downstream artifact references

#### Scenario: Repository is server-only
- **WHEN** application code imports the AI review run repository
- **THEN** the repository is server-only, accepts a `DataAccessContext`, and does not create a database connection at module top level

#### Scenario: Local verifier rolls back fixtures
- **WHEN** `pnpm ai-review:check` runs against the local development database
- **THEN** it seeds fixture records inside a transaction, verifies AI review persistence behavior, and rolls back all fixture data before exiting

### Requirement: AI review run repository enforces tenant, team, permission, and state gates
The AI review run repository SHALL enforce tenant/team scope, `run_ai_review` permission, and explicit state transitions for all protected writes.

#### Scenario: Unauthorized actor writes a run
- **WHEN** an actor without `run_ai_review` permission prepares, starts, reviews, feeds back, or archives an AI review run
- **THEN** the repository rejects the write with a safe forbidden error and does not persist partial data

#### Scenario: Cross-team actor reads a run
- **WHEN** an actor from another team requests an existing AI review run
- **THEN** the repository returns a safe not-found result or error without exposing cross-team data

#### Scenario: Invalid run transition is requested
- **WHEN** a command attempts to move a run through an unsupported state transition
- **THEN** the repository rejects the command with `STATE_TRANSITION_INVALID`

### Requirement: AI review run uses bounded redacted input and knowledge snapshots
The AI review run repository SHALL persist bounded session and knowledge snapshots while blocking unsafe, stale, conflicting, or insufficient evidence.

#### Scenario: Input snapshot contains blocked sensitive data
- **WHEN** a run is prepared with an input snapshot whose redaction state is `blocked`
- **THEN** the repository rejects preparation with `SENSITIVE_DATA_NEEDS_REVIEW`

#### Scenario: Input snapshot exceeds safe long-input policy
- **WHEN** a run is prepared with a long-input policy of `blocked`
- **THEN** the repository rejects preparation with `LONG_INPUT_LIMIT_EXCEEDED`

#### Scenario: Knowledge snapshot is stale or conflicting
- **WHEN** a run is prepared with `stale_blocked`, `blocked`, or `insufficient` knowledge snapshot states
- **THEN** the repository rejects preparation with the relevant stale, conflict, or insufficient-evidence error

#### Scenario: Snapshot is accepted
- **WHEN** an authorized actor prepares a run with redacted input and current reviewed knowledge
- **THEN** the repository stores snapshot summaries, source IDs, knowledge version IDs, intended uses, and audit metadata without storing raw full transcripts

### Requirement: Prompt and provider metadata stay provider-neutral
The AI review run repository SHALL store prompt version and provider invocation metadata without binding domain code to a provider SDK or storing secrets/full payloads.

#### Scenario: Prompt version is inactive
- **WHEN** an actor starts a run with a prompt version whose status is neither `active` nor `reviewed`
- **THEN** the repository rejects the start command with `PROMPT_VERSION_INACTIVE`

#### Scenario: Provider invocation is recorded
- **WHEN** provider invocation metadata is recorded for a run
- **THEN** the repository stores provider name, API family, model, request/response IDs, timing, token summary, finish reason, error code, and redaction state without storing API keys, full prompts, or full request/response payloads

#### Scenario: Provider fails
- **WHEN** invocation metadata records timeout, rate limit, refusal, malformed output, unavailable provider, or partial output
- **THEN** the run can move to a non-success provider or validation failure state with a recoverability hint

### Requirement: Structured outputs and validation results are persisted before review
The AI review run repository SHALL persist structured AI review outputs and validation results before the run becomes review-ready.

#### Scenario: Output sections are stored
- **WHEN** an output is recorded for a validating run
- **THEN** the repository stores schema version, overall confidence, evidence summary, and sections for live recap, product diagnosis, question clusters, objection patterns, talk-track candidates, short-video topics, and next-session actions

#### Scenario: Validation blocks review
- **WHEN** validation results include failed or blocked schema, sensitive-data, source-grounding, stale-source, fact-conflict, long-input, or policy checks
- **THEN** the run cannot become `review_ready`

#### Scenario: Validation allows review
- **WHEN** validation results are passed or recoverable warnings only
- **THEN** an authorized actor can mark the run `review_ready`

### Requirement: Human review controls feedback and downstream reuse
The AI review run repository SHALL require human review decisions before AI suggestions can create downstream artifacts or quality signals for future workflows.

#### Scenario: Reviewer accepts a section
- **WHEN** an authorized actor accepts or edit-accepts an output section
- **THEN** the repository records actor, reason, edited content when present, timestamp, and updates section review state

#### Scenario: Reviewer rejects or requests regeneration
- **WHEN** an authorized actor rejects a section or requests regeneration
- **THEN** the repository records the decision and prevents that section from creating downstream artifacts

#### Scenario: Feedback signal is recorded
- **WHEN** an authorized actor records accepted, edited, rejected, regenerated, missing-knowledge, wrong-source, evidence-weak, or downstream-used feedback
- **THEN** the repository stores the signal with review priority and route without changing authoritative knowledge

#### Scenario: Downstream artifact is created
- **WHEN** an authorized actor creates a talk-track, short-video-topic, next-session-task, or knowledge-gap draft from an accepted or edited section
- **THEN** the repository links the artifact to the source run and section and marks downstream readiness without publishing the artifact as authoritative truth

#### Scenario: Downstream artifact is blocked
- **WHEN** a pending, rejected, validation-failed, provider-failed, blocked, or archived run section is used for downstream creation
- **THEN** the repository rejects the command with `REVIEW_REQUIRED` or `STATE_TRANSITION_INVALID`

### Requirement: AI review run persistence updates durable project records
The AI review run persistence slice SHALL update contracts, roadmap, README, and accepted specs so future work starts from the current runtime boundary.

#### Scenario: Future agent reads project status
- **WHEN** a future agent reads the AI review contract, roadmap, README, or accepted specs
- **THEN** it can identify that AI review run local persistence exists and that provider execution, prompt execution, RAG, queue, public API, Server Action, and UI save flows remain out of scope
