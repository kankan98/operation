## ADDED Requirements

### Requirement: AI review execution service is server-only
The system SHALL provide a server-only AI review execution service that coordinates an existing AI review run through repository state gates, AI review generation, safe persistence handoff, and local verification without exposing provider-native payloads to UI, route-handler, or repository code.

#### Scenario: Application imports the execution service
- **WHEN** application code imports the AI review execution module
- **THEN** the module is server-only and exposes provider-neutral execution input, result, and safe error types

#### Scenario: Execution receives dependencies
- **WHEN** execution is requested
- **THEN** the service accepts an injected AI review run repository, `AiProviderPort`, `DataAccessContext`, run ID, prompt/provider policy, and optional generation controls

#### Scenario: Execution avoids provider-specific imports
- **WHEN** the execution service calls AI generation
- **THEN** it calls the existing generation orchestrator with `AiProviderPort` and does not import DeepSeek adapter request/response types

### Requirement: Execution uses persisted bounded snapshots and prompt metadata
The execution service SHALL build generation input from tenant/team-scoped persisted run detail, input snapshot, knowledge snapshot, prompt metadata, requested section types, and request ID while preserving existing repository authorization and state gates.

#### Scenario: Run is input-ready
- **WHEN** an authorized actor executes a run whose status is `input_ready`
- **THEN** the service starts the run through the repository using an active or reviewed prompt version and provider policy before invoking the provider

#### Scenario: Run is already queued
- **WHEN** an authorized actor executes a run whose status is `queued`
- **THEN** the service uses the persisted prompt version and provider policy from the run ledger without starting a duplicate run

#### Scenario: Run is not executable
- **WHEN** a run is missing snapshots, missing prompt metadata, missing provider policy, archived, provider-failed, validation-failed, review-ready, reviewing, accepted, rejected, downstream-ready, or otherwise not executable
- **THEN** execution fails before provider invocation with a safe state or validation error and does not persist output

#### Scenario: Cross-team actor executes a run
- **WHEN** an actor from another team requests execution for an existing run
- **THEN** the repository returns a safe not-found or forbidden result and the provider is not invoked

### Requirement: Successful execution persists provider metadata output and validation
The execution service SHALL persist successful generation handoff data through existing repository methods and SHALL mark a run review-ready only when validation has no blocking result.

#### Scenario: Generation succeeds with review-ready validation
- **WHEN** the provider returns structured output and generation validation results contain only passed or warning statuses
- **THEN** the service records safe provider invocation metadata, structured output sections, validation results, and marks the run `review_ready`

#### Scenario: Validation warning is recoverable
- **WHEN** generation records recoverable warnings such as source grounding, stale source warning, low-risk conflict, or long-input notice
- **THEN** the run can become `review_ready` with validation records available for human review

#### Scenario: Validation blocks review
- **WHEN** generation returns a validation result with `failed` or `blocked`
- **THEN** the service records provider metadata, output, and validation results but does not mark the run `review_ready`

#### Scenario: Affected section types are persisted
- **WHEN** generation validation identifies affected section types
- **THEN** the service maps those section types to persisted section IDs before recording validation results

### Requirement: Execution records safe failure states without persisting partial output
The execution service SHALL map input, evidence, provider, schema, partial-output, malformed-output, refusal, timeout, rate-limit, unavailable, and policy failures into safe repository records without storing partial model output as usable suggestions.

#### Scenario: Provider fails before structured output
- **WHEN** `AiProviderPort` or generation fails with timeout, rate limit, unavailable, auth, quota, refusal, partial-output, malformed-output, schema-mismatch, or policy-blocked error
- **THEN** the service records safe provider or validation failure metadata with retryability where available and does not call `recordOutput`

#### Scenario: Input or evidence gate fails
- **WHEN** generation rejects the run because input redaction, long-input policy, session readiness, weak session signal, stale knowledge, conflicting knowledge, or insufficient evidence fails
- **THEN** the service records a safe validation failure when the run is queued and does not call the provider again

#### Scenario: Failure details are returned
- **WHEN** execution fails
- **THEN** the returned or thrown error includes a safe code, retryability hint, request ID, and redacted metadata without full prompt text, Authorization headers, API keys, raw transcripts, customer personal data, or full provider request/response bodies

### Requirement: Local execution verifier uses fake provider by default
The system SHALL provide a local AI review execution verification command that uses a fake provider by default, rolls back fixtures, and does not require or call a real DeepSeek API key.

#### Scenario: Local execution check runs
- **WHEN** `pnpm ai-review:execution-check` runs
- **THEN** it verifies success, review-ready persistence, validation-blocked output, provider failure state, cross-team isolation, no prompt or secret leakage, and transaction rollback using a fake provider

#### Scenario: Real credentials are present
- **WHEN** `pnpm ai-review:execution-check` runs in an environment that contains provider credentials
- **THEN** the default verifier still uses the fake provider and does not make a live provider request

### Requirement: Execution service updates durable project records
The AI review execution service SHALL update project contracts, roadmap, README, and OpenSpec records so future work starts from the current runtime boundary.

#### Scenario: Future agent reads project status
- **WHEN** a future agent reads the AI review contract, architecture roadmap, autonomous roadmap, README, or accepted specs
- **THEN** it can identify that the local server-only AI review execution service exists while public API, Server Action, UI save flow, RAG, queue, and production AI release remain out of scope
