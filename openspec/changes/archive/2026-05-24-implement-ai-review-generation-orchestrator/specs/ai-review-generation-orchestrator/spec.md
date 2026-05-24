## ADDED Requirements

### Requirement: AI review generation orchestrator is server-only
The system SHALL provide a server-only AI review generation orchestrator that
uses app-owned input, output, validation, and error types without exposing
DeepSeek-native request or response payloads to UI, repository, or route-handler
code.

#### Scenario: Application imports the orchestrator
- **WHEN** application code imports the AI review generation module
- **THEN** the module is server-only and exposes provider-neutral generation
  inputs, review output data, validation results, safe metadata, and safe error
  types

#### Scenario: Orchestrator receives an AI provider
- **WHEN** the orchestrator is called
- **THEN** it accepts an injected `AiProviderPort` and does not directly import
  DeepSeek adapter code or provider SDK objects

### Requirement: Generation uses bounded reviewed snapshots
The system SHALL validate AI review generation input before provider invocation
and MUST only send bounded, redacted session and reviewed knowledge snapshots to
the provider.

#### Scenario: Redaction is blocked
- **WHEN** the input snapshot redaction state is `needs_review` or `blocked`
- **THEN** generation fails before provider invocation with a safe sensitive-data
  error and does not return prompt content

#### Scenario: Long input is blocked
- **WHEN** the input snapshot long-input policy is `blocked`
- **THEN** generation fails before provider invocation with a safe long-input
  error and does not send the snapshot to the provider

#### Scenario: Reviewed evidence is insufficient
- **WHEN** the knowledge snapshot is stale-blocked, conflict-blocked,
  insufficient, blocked, or lacks reviewed source and knowledge references
- **THEN** generation fails before provider invocation with an insufficient or
  blocked evidence error

#### Scenario: Snapshot is accepted
- **WHEN** redacted session input and current reviewed knowledge are present
- **THEN** the orchestrator builds a provider request from summaries, product
  order, question summaries, objection summaries, note highlights, reviewed
  source IDs, knowledge version IDs, trust summary, and requested section types
  without raw transcripts, customer PII, orders, private messages, or secrets

### Requirement: Prompt metadata is traceable without leaking full prompts
The system SHALL keep prompt version and schema metadata traceable while
preventing full prompts, provider payloads, raw input, and secrets from being
logged, persisted, or returned by default.

#### Scenario: Prompt request is built
- **WHEN** the orchestrator builds the AI review prompt messages
- **THEN** it includes safe prompt version metadata, input schema version,
  output schema version, requested sections, and an output JSON shape
  instruction suitable for JSON output

#### Scenario: Generation succeeds
- **WHEN** the provider returns valid structured output
- **THEN** the generation result includes a prompt fingerprint, prompt version,
  schema versions, provider metadata, and validation results without full prompt
  text, API keys, Authorization headers, or full provider request/response bodies

#### Scenario: Generation fails
- **WHEN** input validation, provider invocation, schema parsing, or output
  validation fails
- **THEN** the thrown error includes only a safe code, retryability hint, request
  ID, prompt metadata, and redacted issue summaries

### Requirement: Structured AI review output is validated
The system SHALL require provider JSON output to match a local structured AI
review output schema and MUST run AI-review-specific validation before returning
usable suggestions.

#### Scenario: Provider output matches schema
- **WHEN** the provider returns valid JSON with review sections, evidence
  summary, confidence, source references, and output schema version
- **THEN** the orchestrator returns normalized review output sections and
  validation results

#### Scenario: Provider output is malformed or mismatched
- **WHEN** the provider returns malformed JSON or JSON that fails the requested
  schema
- **THEN** generation fails with a safe schema or malformed-output error and no
  partial review output is returned as usable data

#### Scenario: Output section is empty
- **WHEN** a returned section has an empty title, empty summary, or no useful
  items for a requested section
- **THEN** validation records an `empty_section` failure or warning and prevents
  review-ready handoff when the issue is blocking

#### Scenario: Output lacks source grounding
- **WHEN** an operational recommendation section lacks source references
- **THEN** validation records a `source_grounding` warning or failure so a
  reviewer can see that the suggestion needs evidence review

#### Scenario: Output contains sensitive markers
- **WHEN** generated titles, summaries, or items contain obvious phone, address,
  order, private-message, credential, or raw transcript markers
- **THEN** validation records a `sensitive_data` blocked result and generation
  output cannot be treated as review-ready

### Requirement: Provider failures map to AI review generation failures
The system SHALL map `AiProviderPort` failures to AI review generation error
codes with retryability hints and safe diagnostics.

#### Scenario: Provider times out
- **WHEN** `AiProviderPort` fails with a timeout
- **THEN** generation fails with an AI review provider timeout code that is
  retryable and contains no full prompt or secret

#### Scenario: Provider rate-limits
- **WHEN** `AiProviderPort` fails with a rate-limit error
- **THEN** generation fails with an AI review provider rate-limited code that is
  retryable

#### Scenario: Provider refuses or filters output
- **WHEN** `AiProviderPort` reports a model refusal or content filter
- **THEN** generation fails with an AI review model-refusal code that is not
  retryable for the same input without human action

#### Scenario: Provider returns partial output
- **WHEN** `AiProviderPort` reports partial model output
- **THEN** generation fails with a partial-output code and marks the failure as
  recoverable when retrying could produce complete output

### Requirement: Local generation verifier uses a fake provider by default
The system SHALL provide a local AI review generation verification command that
does not require or call a real DeepSeek API key by default.

#### Scenario: Local generation check runs
- **WHEN** `pnpm ai-review:generation-check` runs without provider credentials
- **THEN** it verifies success, blocked redaction, blocked long input,
  insufficient evidence, weak session input, provider timeout, rate limit,
  refusal, partial output, malformed output, schema mismatch, sensitive output,
  source-grounding warnings, prompt fingerprint metadata, and no prompt or
  secret leakage using a fake provider

#### Scenario: Real credentials are present in the shell
- **WHEN** `pnpm ai-review:generation-check` runs in an environment that also
  contains provider credentials
- **THEN** the default verifier still uses the fake provider and does not make a
  live provider request
