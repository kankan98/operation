## ADDED Requirements

### Requirement: Live provider use requires release approval
The AI provider port SHALL remain callable by server-side AI review code only
after the AI review live-model release gate and provider configuration checks
have both passed.

#### Scenario: Release gate is disabled
- **WHEN** AI review live execution is requested while the live-model release
  gate is disabled
- **THEN** the system SHALL fail before creating the DeepSeek provider and SHALL
  NOT read or send provider credentials

#### Scenario: Release gate is enabled but config is missing
- **WHEN** AI review live execution is requested with the live-model release
  gate enabled but DeepSeek configuration missing or invalid
- **THEN** the system SHALL return a safe provider configuration error without
  exposing environment values

#### Scenario: Local provider checks run
- **WHEN** `pnpm ai-provider:check` runs in an environment with or without
  DeepSeek credentials
- **THEN** it SHALL keep using fake fetch by default and SHALL NOT make a live
  provider request unless an explicit live smoke flag is set

