## ADDED Requirements

### Requirement: AI provider port is server-only and provider-neutral
The system SHALL expose a server-only `AiProviderPort` for structured model
generation so UI, domain, data, and repository code do not depend on DeepSeek
request or response objects.

#### Scenario: Application code imports the provider port
- **WHEN** application code imports the AI provider module
- **THEN** the module is server-only and exposes app-owned input, output,
  metadata, and error types rather than provider-native payloads

#### Scenario: Provider response is returned
- **WHEN** the provider call succeeds
- **THEN** the caller receives parsed structured data plus safe metadata such as
  provider, model, response ID, latency, token usage, finish reason, and
  retryability without API keys, Authorization headers, full prompts, or full
  provider payloads

### Requirement: DeepSeek adapter reads configuration from environment variables
The system SHALL provide a DeepSeek adapter that reads credentials and runtime
settings from environment variables and never commits, logs, or returns
secrets.

#### Scenario: DeepSeek key is missing
- **WHEN** a DeepSeek adapter is created from an environment without
  `DEEPSEEK_API_KEY`
- **THEN** configuration parsing fails with a safe
  `AI_PROVIDER_CONFIG_MISSING` error that does not include any secret value

#### Scenario: DeepSeek request is created
- **WHEN** the adapter sends a JSON generation request
- **THEN** it targets the configured base URL, defaults to
  `https://api.deepseek.com`, defaults to model `deepseek-v4-pro`, and sends the
  API key only as an Authorization bearer header

#### Scenario: Environment example is read
- **WHEN** a future developer reads `.env.example`
- **THEN** it documents placeholder DeepSeek environment variable names without
  containing a real API key

### Requirement: Structured JSON output is validated before use
The system SHALL treat provider JSON mode as an aid and MUST parse and validate
model output against a caller-provided schema before returning it as usable
data.

#### Scenario: Provider returns valid JSON matching schema
- **WHEN** DeepSeek returns non-empty JSON content that matches the requested
  schema
- **THEN** the adapter returns the parsed value and safe provider metadata

#### Scenario: Provider returns malformed JSON
- **WHEN** DeepSeek returns content that cannot be parsed as JSON
- **THEN** the adapter fails with `AI_PROVIDER_MALFORMED_JSON` and does not
  return parsed data

#### Scenario: Provider returns schema mismatch
- **WHEN** DeepSeek returns valid JSON that fails the caller's schema
- **THEN** the adapter fails with `AI_PROVIDER_SCHEMA_MISMATCH` and returns only
  safe issue summaries

#### Scenario: Provider returns partial output
- **WHEN** DeepSeek reports a length-limited finish reason or otherwise returns
  a truncated response
- **THEN** the adapter fails with `PARTIAL_MODEL_OUTPUT` and marks the failure
  recoverable when retrying could produce a complete response

### Requirement: Provider failures are normalized and safe
The system SHALL map DeepSeek and network failures into app-owned error codes
with retryability hints and redacted diagnostic details.

#### Scenario: Provider rate limits a request
- **WHEN** DeepSeek returns HTTP 429
- **THEN** the adapter fails with `AI_PROVIDER_RATE_LIMITED`, marks it
  retryable, and does not expose the raw provider response body

#### Scenario: Provider rejects authentication
- **WHEN** DeepSeek returns HTTP 401
- **THEN** the adapter fails with `AI_PROVIDER_AUTH_FAILED`, marks it
  non-retryable for the same credentials, and does not expose the API key

#### Scenario: Provider is unavailable
- **WHEN** DeepSeek returns HTTP 500, HTTP 503, or a network failure
- **THEN** the adapter fails with `AI_PROVIDER_UNAVAILABLE`, includes a safe
  status or request ID when available, and does not expose raw payloads

#### Scenario: Provider request times out
- **WHEN** the configured timeout elapses before DeepSeek responds
- **THEN** the adapter aborts the request and fails with
  `AI_PROVIDER_TIMEOUT`

### Requirement: AI provider verifier covers local and optional live checks
The system SHALL provide a local verification command for the provider port that
does not require a real DeepSeek API key by default.

#### Scenario: Local fake provider check runs
- **WHEN** `pnpm ai-provider:check` runs without `DEEPSEEK_API_KEY`
- **THEN** it verifies success, missing config, timeout, rate limit, auth
  failure, provider unavailable, empty output, malformed JSON, partial output,
  and schema mismatch using fake fetch and exits successfully

#### Scenario: Optional live smoke check is enabled
- **WHEN** `DEEPSEEK_API_KEY` is present and `DEEPSEEK_LIVE_SMOKE=1`
- **THEN** the verifier may send a minimal JSON request to DeepSeek, reports
  only safe metadata or safe error codes, and never prints the key or full
  prompt/provider payload
