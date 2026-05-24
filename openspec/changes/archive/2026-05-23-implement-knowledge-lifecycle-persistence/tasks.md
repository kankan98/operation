## 1. Proposal Gate

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Add the RED knowledge lifecycle verifier command and observe the expected failure before production repository code.

## 2. Schema And Migration

- [x] 2.1 Add Drizzle enums, tables, record types, indexes and uniqueness constraints for knowledge sources, claims, team notes, review decisions, published versions and conflicts.
- [x] 2.2 Generate and apply the local Drizzle migration against the development PostgreSQL database.

## 3. Repository Implementation

- [x] 3.1 Add server-only knowledge repository input schemas, error mapping, safe validation errors and view/readiness mapping.
- [x] 3.2 Implement source registration, source list/detail and duplicate source detection with tenant/team scope and permission checks.
- [x] 3.3 Implement claim and team-note creation plus review queue queries.
- [x] 3.4 Implement review decisions for source, claim and team-note targets with valid state transitions.
- [x] 3.5 Implement publish version and conflict blocker behavior with downstream readiness.

## 4. Verification And Documentation

- [x] 4.1 Complete the rollback verifier for source registration, duplicates, claims, team notes, review, publish, conflict block, permissions, cross-team isolation and rollback.
- [x] 4.2 Update package scripts for the knowledge verifier.
- [x] 4.3 Update knowledge lifecycle contract, contract index, README/app docs and roadmap notes to reflect partial local repository runtime and remaining non-goals.
- [x] 4.4 Run required validation: OpenSpec change, Drizzle generate/migrate, knowledge verifier, existing db/auth/racket/session verifiers, lint, typecheck, build and `openspec validate --all`.
- [x] 4.5 Archive the OpenSpec change after implementation and verification pass.
