## 1. Proposal Gate And TDD Setup

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Add `talk-tracks:check` scripts and a verifier that fails because the repository does not exist yet.
- [x] 1.3 Run the verifier and observe the expected RED failure.

## 2. Data Model And Migration

- [x] 2.1 Add talk-track enums, tables, indexes, and inferred record types to the Drizzle schema.
- [x] 2.2 Generate and review the Drizzle migration for the talk-track tables.

## 3. Repository Implementation

- [x] 3.1 Implement the server-only talk-track repository with Zod input validation, typed errors, tenant/team filters, and permission checks.
- [x] 3.2 Implement asset/version/scenario/segment/source/candidate creation and detail/list mapping.
- [x] 3.3 Implement review decision, publish, deprecate/archive/restore, duplicate scenario, source blockers, AI candidate blockers, and readiness logic.
- [x] 3.4 Implement usage signal recording without mutating published talk-track versions.

## 4. Verification Coverage

- [x] 4.1 Expand the local verifier to cover creation, permission denial, publish blockers, approved publish, duplicate scenario rejection, cross-team isolation, usage signal recording, and rollback.
- [x] 4.2 Run migration and existing repository checks against the local database.
- [x] 4.3 Run lint, typecheck, build, and all OpenSpec validation.

## 5. Documentation And Archival

- [x] 5.1 Update talk-track contract, README/roadmap docs, and accepted status notes to describe the local-only partial runtime.
- [x] 5.2 Mark completed tasks as each implementation step finishes.
- [x] 5.3 Archive the change after implementation and verification complete.
