## ADDED Requirements

### Requirement: AI review generation consumes the provider port safely
The AI provider port SHALL be consumable by the AI review generation
orchestrator without leaking provider-native payloads, secrets, full prompts, or
provider SDK types into AI review domain or persistence code.

#### Scenario: Orchestrator calls the provider port
- **WHEN** AI review generation needs structured model output
- **THEN** it calls `AiProviderPort.generateJson` with provider-neutral
  messages, schema name, Zod schema, request ID, token limit, and temperature
  without importing DeepSeek request or response types

#### Scenario: Provider metadata returns to AI review generation
- **WHEN** the provider call succeeds
- **THEN** the orchestrator receives parsed structured data plus safe metadata
  such as provider, model, response ID, latency, token usage, finish reason, and
  retryability without API keys, Authorization headers, full prompts, or full
  provider payloads

#### Scenario: Provider error returns to AI review generation
- **WHEN** the provider call fails
- **THEN** the orchestrator maps the app-owned provider error code and
  retryability into an AI review generation error without exposing provider
  credentials or raw payloads
