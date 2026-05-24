## 1. Proposal Gate

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Add the RED session persistence verifier command and observe the expected failure before production repository code.

## 2. Schema And Migration

- [x] 2.1 Add Drizzle enums, tables, record types, indexes and uniqueness constraints for live session captures, host roles, product order, notes, customer questions and customer objections.
- [x] 2.2 Generate and apply the local Drizzle migration against the development PostgreSQL database.

## 3. Repository Implementation

- [x] 3.1 Add server-only session capture repository input schemas, error mapping, safe validation errors and view/readiness mapping.
- [x] 3.2 Implement create, list and detail/readiness queries with tenant/team scope and permission checks.
- [x] 3.3 Implement autosave/update behavior with draft version increment, structured notes/questions/objections and stale draft rejection.
- [x] 3.4 Implement submit behavior with required-field checks, invalid state rejection and downstream readiness blockers.

## 4. Verification And Documentation

- [x] 4.1 Complete the rollback verifier for create, duplicate label, permissions, cross-team isolation, autosave, stale version, submit and rollback.
- [x] 4.2 Update package scripts for the session verifier.
- [x] 4.3 Update session capture contract, contract index, README/app docs and roadmap notes to reflect partial local repository runtime and remaining non-goals.
- [x] 4.4 Run required validation: OpenSpec change, Drizzle generate/migrate, session verifier, existing db/auth/racket verifiers, lint, typecheck, build and `openspec validate --all`.
- [x] 4.5 Archive the OpenSpec change after implementation and verification pass.
