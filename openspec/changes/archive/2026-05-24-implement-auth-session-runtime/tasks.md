## 1. OpenSpec And TDD Baseline

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Add the local auth session verifier first and confirm it fails before runtime support exists.

## 2. Schema And Runtime

- [x] 2.1 Add Drizzle schema, exported record types, and migration for the auth session ledger.
- [x] 2.2 Implement server-only auth session reference helpers, input schemas, safe session summary types, and redaction behavior.
- [x] 2.3 Implement the auth session repository/resolver that validates session lifecycle and delegates authorization to the existing guard.
- [x] 2.4 Export the new auth session runtime through the auth module boundary.

## 3. Verification Scripts

- [x] 3.1 Wire `auth:session-check` scripts in the web app and root package.
- [x] 3.2 Extend the verifier to cover active, expired, revoked, invalidated, inactive membership, cross-team, missing permission, redaction, and rollback paths.

## 4. Docs And Durable Roadmap

- [x] 4.1 Update the auth contract with the implemented local-only session runtime and remaining provider/login non-goals.
- [x] 4.2 Update architecture, README, app README, continuous goal, and autonomous roadmap status.
- [x] 4.3 Validate and archive the OpenSpec change after implementation and verification.
