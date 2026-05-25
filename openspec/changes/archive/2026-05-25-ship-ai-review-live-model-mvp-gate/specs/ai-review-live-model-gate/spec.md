## ADDED Requirements

### Requirement: Live AI review release gate is explicit and server-side
The system SHALL require an explicit server-side live AI review release gate
before any browser or API workflow can call the real DeepSeek provider for AI
review execution.

#### Scenario: Live gate is disabled
- **WHEN** an authenticated operator attempts live AI review execution while
  `OPERATION_ENABLE_LIVE_AI_REVIEW` is not enabled
- **THEN** the system SHALL return a safe disabled response before creating a
  live provider and SHALL NOT call DeepSeek

#### Scenario: DeepSeek key exists but live gate is disabled
- **WHEN** DeepSeek credentials are present in the environment but the live AI
  review release gate is disabled
- **THEN** the system SHALL keep live execution unavailable and SHALL NOT treat
  key presence as release approval

#### Scenario: Live gate is enabled with valid provider config
- **WHEN** `OPERATION_ENABLE_LIVE_AI_REVIEW=1` and valid DeepSeek provider
  configuration are present
- **THEN** the system SHALL mark live AI review as ready using only safe provider
  metadata such as provider, provider API, and model

### Requirement: Live AI review readiness status is safe
The system SHALL expose live AI review readiness to authenticated scoped browser
workflows without exposing secrets, prompts, provider payloads, cookies, or
database connection data.

#### Scenario: Authenticated operator reads readiness
- **WHEN** an authenticated operator with explicit tenant/team scope reads live
  AI review readiness
- **THEN** the system SHALL return safe fields describing whether live mode is
  enabled, configured, ready, the provider name, provider API, model, and an
  operator-facing message

#### Scenario: Unauthenticated readiness request
- **WHEN** a client reads live AI review readiness without a valid auth session
  cookie or explicit tenant/team scope
- **THEN** the system SHALL return a safe auth or scope error and SHALL NOT
  expose live provider configuration state

#### Scenario: Provider config is invalid
- **WHEN** the live release gate is enabled but DeepSeek configuration is
  missing or invalid
- **THEN** readiness SHALL report that live generation is not ready without
  returning environment values, API keys, or raw validation payloads

### Requirement: Browser workflow distinguishes fake and live generation
The `/ai-review` browser workflow SHALL distinguish local V0 fake generation
from gated live DeepSeek generation while keeping fake generation available as
the default path.

#### Scenario: Live mode unavailable
- **WHEN** an operator opens `/ai-review` and live readiness is disabled,
  missing, or invalid
- **THEN** the page SHALL keep local V0 generation available, show live mode as
  unavailable with a concise reason, and avoid prompting the operator to enter
  secrets

#### Scenario: Live mode ready
- **WHEN** an operator opens `/ai-review` and live readiness is ready
- **THEN** the page SHALL let the operator choose real-model generation and SHALL
  call the protected live execute route only for prepared input-ready runs

#### Scenario: Live generation fails safely
- **WHEN** live generation returns timeout, rate-limit, auth, quota, malformed
  output, partial output, schema mismatch, refusal, or unavailable errors
- **THEN** the page SHALL show an actionable operator-facing error and SHALL NOT
  expose full prompts, raw provider responses, authorization headers, API keys,
  cookies, raw transcripts, or database URLs

### Requirement: Live AI review verification is opt-in for provider calls
The project SHALL verify live AI review gate behavior locally without calling a
real provider by default, and SHALL require explicit opt-in for live smoke.

#### Scenario: Default verification runs
- **WHEN** local AI review live-gate verification runs without live smoke flags
- **THEN** it SHALL cover disabled gate, missing config, safe readiness,
  fake-provider regression, safe route errors, and no sensitive leakage without
  calling DeepSeek

#### Scenario: Optional live smoke runs
- **WHEN** DeepSeek credentials are present and an explicit live smoke flag is
  enabled
- **THEN** verification MAY send a minimal structured JSON request through the
  existing provider port and SHALL report only safe metadata or safe error codes

