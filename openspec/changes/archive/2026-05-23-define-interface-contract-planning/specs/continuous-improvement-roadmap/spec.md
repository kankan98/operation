## ADDED Requirements

### Requirement: Roadmap includes contract-first transition stage
The autonomous development roadmap SHALL include an interface-contract stage
between static UI exploration and real backend/database/AI implementation.

#### Scenario: Static route becomes implementation candidate
- **WHEN** a static route or workbench is selected for real persistence,
  backend behavior, AI calls, source import, or integration
- **THEN** the roadmap or active OpenSpec change identifies the required
  contract draft before implementation begins

#### Scenario: Contract draft is completed
- **WHEN** a contract draft is written for a workflow
- **THEN** it identifies current implementation status, future runtime boundary,
  domain entities, state machine, error cases, authorization scope, data
  sensitivity, and verification needs

#### Scenario: Roadmap wave is sequenced
- **WHEN** Now/Next/Later waves are updated
- **THEN** contract drafting is sequenced before database schema, API routes,
  server actions, AI provider calls, or external platform integrations for the
  same workflow
