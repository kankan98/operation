## ADDED Requirements

### Requirement: Protected access uses provider-neutral auth guard boundaries
The technical architecture SHALL require protected route handlers, Server
Actions, domain services, and repositories to receive authorization only through
project-owned auth guard boundaries instead of depending directly on provider
SDK shapes or client-selected team state.

#### Scenario: Protected repository command is added
- **WHEN** a future protected repository command or query is introduced for a
  workflow record
- **THEN** it SHALL receive tenant/team/actor context only after the
  provider-neutral auth guard has resolved and authorized the actor's
  membership, role, permission, and target scope

#### Scenario: Provider SDK is introduced
- **WHEN** a future auth provider SDK is added
- **THEN** provider user, account, token, callback, and session details SHALL be
  mapped behind `AuthPort` or an equivalent project-owned adapter before domain,
  repository, AI, RAG, or integration layers can use authorization state

### Requirement: Auth guard foundation does not imply provider adoption
The technical architecture SHALL keep auth provider, login method, cookie/session
strategy, invitation delivery, step-up auth provider, production credentials,
and hosted identity decisions deferred until separate source-backed OpenSpec
changes accept them.

#### Scenario: Local guard runtime exists
- **WHEN** provider-neutral auth context, guard helpers, and local verification
  are implemented
- **THEN** the architecture still treats real login, middleware, provider
  callbacks, hosted auth, production secrets, and invitation delivery as not
  implemented until a later OpenSpec change defines them
