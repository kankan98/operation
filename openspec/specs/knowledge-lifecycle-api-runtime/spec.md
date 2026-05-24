# knowledge-lifecycle-api-runtime Specification

## Purpose
Define the local-only protected knowledge lifecycle Route Handler runtime that
exposes source registration/list/detail, claim and team-note creation, review
queue and decisions, conflict handling, and version publication through existing
app-owned auth cookie/session, explicit tenant/team scope, CSRF-protected
mutations, repository business rules, safe no-store JSON responses, and
rollback-based local verification without introducing browser save UI, source
discovery, RAG, AI calls, queues, or production persistence.
## Requirements
### Requirement: Knowledge lifecycle API runtime remains local-only and protected
The project SHALL expose the knowledge lifecycle workflow through local-only
Route Handlers that require the existing app-owned auth cookie/session runtime,
explicit tenant/team scope, server-side authorization, existing repository
business rules, safe no-store JSON responses, and rollback-based local
verification.

#### Scenario: Public workspace remains static without database config
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they SHALL continue to use static data and SHALL NOT import the
  knowledge lifecycle API runtime or repository modules

#### Scenario: No provider or RAG system is introduced
- **WHEN** the knowledge lifecycle API runtime is implemented
- **THEN** it SHALL NOT add a login provider, provider callback, middleware,
  team management UI, browser save UI, Server Actions, source discovery, source
  refresh job, RAG retrieval, Q&A generation, AI provider call, queue, object
  storage, analytics, observability provider, or production database provider

### Requirement: Knowledge source routes resolve authorized scope before repository access
The project SHALL provide `GET /api/knowledge/sources`,
`POST /api/knowledge/sources`, and `GET /api/knowledge/sources/[sourceId]` as
no-store JSON Route Handlers that resolve the auth session cookie, validate
explicit tenant/team scope, check the required permission through the existing
auth runtime, and delegate source list, registration, and detail behavior to the
existing knowledge lifecycle repository.

#### Scenario: Missing cookie is denied without database access
- **WHEN** a knowledge source route receives no auth session cookie
- **THEN** the route SHALL return a safe unauthenticated JSON response without
  opening the database or exposing repository data

#### Scenario: Authenticated scoped list succeeds
- **WHEN** `GET /api/knowledge/sources` receives a valid auth session cookie and
  explicit authorized tenant/team scope
- **THEN** the route SHALL return only source records from the actor's authorized
  tenant/team with source metadata, trust level, review state, intended use, and
  downstream readiness information from the repository view

#### Scenario: Authorized source registration succeeds
- **WHEN** `POST /api/knowledge/sources` receives a valid auth session cookie,
  explicit authorized tenant/team scope, valid mutation CSRF header, and valid
  source JSON from an actor with `review_knowledge`
- **THEN** the route SHALL register the source under the actor's authorized
  tenant/team, return the source view, and include `Cache-Control: no-store`

#### Scenario: Authenticated scoped detail succeeds
- **WHEN** `GET /api/knowledge/sources/[sourceId]` receives a valid auth session
  cookie, explicit authorized tenant/team scope, and a source ID owned by that
  team
- **THEN** the route SHALL return the repository source view and SHALL NOT expose
  sources from another team

#### Scenario: Scope is missing
- **WHEN** a knowledge source route receives an auth session cookie without
  tenant/team scope in query parameters or accepted headers
- **THEN** the route SHALL return a safe invalid-context response and SHALL NOT
  guess a default team

#### Scenario: Client-supplied ownership is ignored
- **WHEN** source registration JSON contains `tenantId`, `teamId`, `actorId`,
  `createdBy`, `updatedBy`, or audit fields that differ from the authorized
  context
- **THEN** the route SHALL NOT use those fields for ownership or audit metadata
  and SHALL rely on the repository data access context

### Requirement: Knowledge content routes create scoped claims and team notes
The project SHALL provide `POST /api/knowledge/claims` and
`POST /api/knowledge/team-notes` as no-store JSON Route Handlers that require a
valid mutation CSRF header, resolve the auth session cookie, validate explicit
tenant/team scope, check `review_knowledge`, parse JSON request bodies, and
delegate claim and team note creation to the existing knowledge lifecycle
repository.

#### Scenario: Authorized claim creation succeeds
- **WHEN** `POST /api/knowledge/claims` receives valid claim JSON for a source
  in the actor's authorized tenant/team
- **THEN** the route SHALL create a pending claim through the repository and
  return the claim view without accepting client-supplied ownership or audit
  fields

#### Scenario: Authorized team note creation succeeds
- **WHEN** `POST /api/knowledge/team-notes` receives valid team note JSON with
  source IDs in the actor's authorized tenant/team
- **THEN** the route SHALL create a draft team note through the repository and
  return the team note view without publishing it or treating it as authoritative
  knowledge

#### Scenario: Missing CSRF header blocks content mutation
- **WHEN** either knowledge content route receives no valid
  `x-operation-csrf` knowledge mutation header
- **THEN** the route SHALL return a safe forbidden JSON response and SHALL NOT
  open the database or persist claim or team note records

#### Scenario: Missing or cross-team source is safe
- **WHEN** a claim or team note references a source that is missing or belongs
  to another team
- **THEN** the route SHALL return a safe not-found or validation response without
  exposing protected cross-team source contents

### Requirement: Knowledge review routes expose review queue and decisions safely
The project SHALL provide `GET /api/knowledge/review-queue` and
`POST /api/knowledge/review-decisions` as no-store JSON Route Handlers that
resolve authorized scope, enforce server-side permissions, and delegate review
queue and review decision behavior to the existing knowledge lifecycle
repository.

#### Scenario: Review queue returns scoped pending items
- **WHEN** `GET /api/knowledge/review-queue` receives a valid auth session
  cookie and explicit authorized tenant/team scope
- **THEN** the route SHALL return only source, claim, and team note review queue
  items from the actor's authorized tenant/team

#### Scenario: Review decision updates an allowed target
- **WHEN** `POST /api/knowledge/review-decisions` receives a valid auth session
  cookie, explicit authorized tenant/team scope, valid mutation CSRF header, and
  an allowed review decision for a scoped source, claim, or team note
- **THEN** the route SHALL record the decision through the repository, return
  the updated target view, and preserve no-store response headers

#### Scenario: Invalid transition is rejected
- **WHEN** a review decision is not allowed for the target type or current state
- **THEN** the route SHALL return a safe invalid-transition response and SHALL
  NOT partially update the target

#### Scenario: Actor lacks review permission
- **WHEN** an authenticated actor without `review_knowledge` attempts to record
  a review decision
- **THEN** the route SHALL reject the mutation before writing review decisions or
  changing source, claim, or team note state

### Requirement: Knowledge conflict and publish routes gate downstream readiness
The project SHALL provide `POST /api/knowledge/conflicts`,
`PATCH /api/knowledge/conflicts/[conflictId]`, and
`POST /api/knowledge/versions` as no-store JSON Route Handlers that require a
valid mutation CSRF header, resolve authorized scope, check `review_knowledge`,
and delegate conflict recording, conflict resolution, and version publication to
the existing knowledge lifecycle repository.

#### Scenario: Authorized conflict creation blocks publication
- **WHEN** `POST /api/knowledge/conflicts` records an open conflict for a
  knowledge key in the actor's authorized tenant/team
- **THEN** later publication for that knowledge key SHALL be rejected with a
  safe conflict response until the conflict is resolved or ignored

#### Scenario: Authorized conflict resolution succeeds
- **WHEN** `PATCH /api/knowledge/conflicts/[conflictId]` receives a valid
  resolution body for a scoped open or reviewing conflict
- **THEN** the route SHALL update the conflict through the repository, record the
  resolution decision, and return the conflict view

#### Scenario: Authorized version publication succeeds after review gates pass
- **WHEN** `POST /api/knowledge/versions` receives approved claim or team note
  IDs, approved source IDs, no open conflict for the knowledge key, and valid
  publication metadata
- **THEN** the route SHALL publish the knowledge version through the repository
  and return the published version view as the downstream readiness boundary

#### Scenario: Unreviewed or sensitive content is not published
- **WHEN** publication references unapproved content, unapproved sources,
  high-sensitive team notes, missing records, or content from another team
- **THEN** the route SHALL return a safe state, sensitive-data, or not-found
  response and SHALL NOT publish a version

#### Scenario: Path conflict ID controls resolution target
- **WHEN** the conflict resolution body contains a different `conflictId`,
  `tenantId`, `teamId`, `actorId`, or audit fields
- **THEN** the route SHALL use the authorized tenant/team context and path
  `conflictId` as the mutation target

### Requirement: Knowledge lifecycle API errors are safe and cache-safe
The knowledge lifecycle API runtime SHALL map auth, scope, CSRF, validation,
long-input, duplicate source, missing source, conflict, sensitive-data,
invalid-transition, not-found, and unexpected failures to safe HTTP JSON
responses that do not expose secrets, session references, provider payloads, raw
authorization headers, database credentials, internal membership records,
unpublished cross-team knowledge, or protected source/team-note contents.

#### Scenario: Malformed JSON is safe
- **WHEN** a mutation request body is malformed JSON or not an object
- **THEN** the route SHALL return a safe validation error JSON response and SHALL
  NOT persist partial knowledge records

#### Scenario: Duplicate source is reported as conflict
- **WHEN** an authorized actor registers a source whose normalized source key
  already exists in the same tenant/team
- **THEN** the route SHALL return a safe duplicate-source conflict response and
  SHALL NOT create a second source

#### Scenario: Long input is reported safely
- **WHEN** source title, claim text, team note content, review reason, conflict
  metadata, or publication summary exceeds the current repository limit
- **THEN** the route SHALL return a safe payload-too-large response without
  echoing raw protected text

#### Scenario: API responses are not cached
- **WHEN** any knowledge lifecycle API route returns JSON
- **THEN** the response SHALL include `Cache-Control: no-store`

#### Scenario: Sensitive metadata is redacted
- **WHEN** route handling fails because of auth, cookie, provider-shaped,
  token-shaped, database, repository, or unexpected error paths
- **THEN** the response JSON SHALL avoid raw cookies, session references,
  provider tokens, authorization headers, database URLs, invitation secrets, and
  protected cross-team knowledge data

### Requirement: Knowledge lifecycle API verification is repeatable
The project SHALL include repeatable local verification for the knowledge
lifecycle API runtime that uses the local PostgreSQL database, runs inside
rollback transactions for test data, and proves Route Handler behavior without
changing public UI rendering.

#### Scenario: Route check runs against local PostgreSQL
- **WHEN** local PostgreSQL is migrated and `pnpm knowledge:route-check` runs
  with a valid `DATABASE_URL`
- **THEN** it SHALL verify missing cookie denial, missing scope, CSRF blocking,
  authorized source create/list/detail, claim creation, team note creation,
  review queue, review decisions, duplicate source rejection, validation
  failure, long-input handling, missing permission rejection, conflict blocking,
  conflict resolution, version publication, cross-team isolation, no-store
  headers, response redaction, and transaction rollback

#### Scenario: Existing checks still pass
- **WHEN** the knowledge lifecycle API runtime is completed
- **THEN** existing OpenSpec validation, knowledge repository check, auth route
  check, racket product route check, session capture route check, typecheck,
  lint, and build verification SHALL remain passing
