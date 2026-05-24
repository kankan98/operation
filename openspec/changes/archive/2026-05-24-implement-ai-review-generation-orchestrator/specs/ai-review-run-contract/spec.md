## ADDED Requirements

### Requirement: AI review run contract records generation orchestrator boundary
The AI review run contract SHALL identify the local server-only AI review
generation orchestrator as the approved boundary for prompt construction,
provider invocation, structured output validation, and safe provider failure
mapping before any public API, Server Action, UI save flow, queue, RAG, or
production AI release is implemented.

#### Scenario: Contract is updated after generation orchestrator
- **WHEN** the AI review generation orchestrator slice is completed
- **THEN** `docs/contracts/ai-review-run.md` identifies the local generation
  module and verifier as implemented while still marking public APIs, Server
  Actions, UI save flows, RAG, queues, production AI release, and automatic
  downstream publication as not implemented

#### Scenario: Future AI review runtime work starts
- **WHEN** a future change proposes a route handler, server action, browser
  save flow, queued AI run, RAG snapshot, or production provider release
- **THEN** it starts from the generation orchestrator boundary instead of
  rebuilding prompt construction or calling `AiProviderPort` directly from UI,
  route, repository, or persistence code

#### Scenario: Prompt content is handled
- **WHEN** the contract describes prompt versions and provider calls
- **THEN** it requires prompt fingerprints, version metadata, and schema
  versions for traceability while continuing to forbid committed or logged full
  prompts, provider payloads, raw transcripts, customer personal data, orders,
  and secrets
