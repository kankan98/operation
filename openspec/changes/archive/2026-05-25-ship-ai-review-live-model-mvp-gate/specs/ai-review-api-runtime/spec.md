## ADDED Requirements

### Requirement: AI review API exposes safe live readiness
The AI review API runtime SHALL expose a protected live-model readiness endpoint
for the AI review workbench.

#### Scenario: Readiness request succeeds
- **WHEN** an authenticated scoped operator reads live-model readiness
- **THEN** the API SHALL return no-store JSON with safe readiness fields and no
  secrets, cookies, prompts, provider payloads, raw transcripts, or database
  connection data

#### Scenario: Readiness request lacks auth
- **WHEN** a client reads live-model readiness without an auth session cookie
- **THEN** the API SHALL return 401 without exposing provider configuration
  state

#### Scenario: Readiness request lacks scope
- **WHEN** a client reads live-model readiness without explicit tenant/team
  scope
- **THEN** the API SHALL return a safe scope error without exposing provider
  configuration state

### Requirement: AI review live execute route honors release gate
The existing AI review live execute route SHALL honor the live-model release
gate before creating or invoking a DeepSeek provider.

#### Scenario: Live execute gate disabled
- **WHEN** a correctly scoped authenticated mutation calls the live execute
  route while live mode is disabled
- **THEN** the API SHALL return a safe disabled response and SHALL NOT create a
  provider or call DeepSeek

#### Scenario: Live execute gate ready
- **WHEN** a correctly scoped authenticated mutation calls the live execute
  route while live mode is enabled and configured
- **THEN** the API SHALL execute through the existing execution service,
  persist safe provider metadata and validation results, and return review
  detail without exposing raw provider payloads

