## MODIFIED Requirements

### Requirement: AI review run contract records persistence implementation boundary
The AI review run contract SHALL identify which parts of the AI review run
boundary are implemented as local persistence, provider-facing adapters,
generation/execution services, protected API runtime, and which full workflow
capabilities remain deferred.

#### Scenario: Contract is updated after local persistence
- **WHEN** the AI review run persistence slice is completed
- **THEN** `docs/contracts/ai-review-run.md` identifies local
  schema/repository/check scripts, provider port, and generation orchestrator as
  implemented while marking any not-yet-implemented public API, Server Action,
  RAG, queueing, UI save flow, or production AI release capability as deferred

#### Scenario: Future provider work starts from a gate
- **WHEN** a future change proposes using the user-selected DeepSeek provider,
  base URL, or `deepseek-v4-pro` model
- **THEN** the contract requires a separate provider OpenSpec gate covering
  official DeepSeek documentation, `AiProviderPort`, environment-variable
  secret handling, structured output validation, provider failures, redaction,
  logging, rollback, and verification

#### Scenario: Provider port gate is implemented locally
- **WHEN** the DeepSeek provider port change is completed
- **THEN** `docs/contracts/ai-review-run.md` identifies the server-only
  `AiProviderPort`, DeepSeek adapter, environment parser, and local verifier as
  implemented while marking any not-yet-implemented prompt orchestration,
  protected API, RAG, queue, Server Action, UI save flow, or production AI
  release capability as deferred

#### Scenario: Protected API runtime is implemented locally
- **WHEN** the AI review protected API runtime is completed
- **THEN** `docs/contracts/ai-review-run.md` identifies local-only protected
  prompt metadata, run preparation, list/detail, execution, human decision,
  feedback, downstream artifact reference, archive, and route-check behavior as
  implemented while still marking Server Actions, browser UI save flows, RAG,
  queue/retry workers, production AI release, and automatic downstream record
  creation as out of scope

#### Scenario: API keys are handled as secrets
- **WHEN** AI provider credentials are needed for any future runtime work
- **THEN** the project MUST configure them through secret environment variables
  and MUST NOT commit or log API keys, full prompts, full provider requests,
  full provider responses, full transcripts, or customer personal data
