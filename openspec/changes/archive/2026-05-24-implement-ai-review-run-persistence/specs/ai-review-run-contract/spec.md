## ADDED Requirements

### Requirement: AI review run contract records persistence implementation boundary
The AI review run contract SHALL identify which parts of the AI review run boundary are implemented as local persistence and which provider-facing capabilities remain deferred.

#### Scenario: Contract is updated after local persistence
- **WHEN** the AI review run persistence slice is completed
- **THEN** `docs/contracts/ai-review-run.md` identifies local schema/repository/check scripts as implemented and still marks public APIs, Server Actions, provider calls, prompt execution, RAG, queueing, and UI save flows as not implemented

#### Scenario: Future provider work starts from a gate
- **WHEN** a future change proposes using the user-selected DeepSeek provider, base URL, or `deepseek-v4-pro` model
- **THEN** the contract requires a separate provider OpenSpec gate covering official DeepSeek documentation, `AiProviderPort`, environment-variable secret handling, structured output validation, provider failures, redaction, logging, rollback, and verification

#### Scenario: API keys are handled as secrets
- **WHEN** AI provider credentials are needed for any future runtime work
- **THEN** the project MUST configure them through secret environment variables and MUST NOT commit or log API keys, full prompts, full provider requests, full provider responses, full transcripts, or customer personal data
