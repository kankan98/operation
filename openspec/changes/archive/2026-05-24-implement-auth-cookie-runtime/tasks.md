## 1. OpenSpec And TDD Baseline

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Add the local auth cookie verifier first and confirm it fails before runtime support exists.

## 2. Cookie Runtime Implementation

- [x] 2.1 Implement server-only auth cookie helpers for issue, clear, parse, request resolution, and logout invalidation.
- [x] 2.2 Extend the auth session repository with safe invalidation-by-reference behavior.
- [x] 2.3 Export the new auth cookie runtime through the auth module boundary.

## 3. Verification Scripts

- [x] 3.1 Wire `auth:cookie-check` scripts in the web app and root package.
- [x] 3.2 Extend the verifier to cover issue attributes, request resolution, missing cookie, unusable sessions, logout invalidation, clear-cookie behavior, redaction, and rollback.

## 4. Docs And Durable Roadmap

- [x] 4.1 Update the auth contract with the implemented local-only cookie/request runtime and remaining provider/login non-goals.
- [x] 4.2 Update architecture, README, app README, continuous goal, and autonomous roadmap status.
- [x] 4.3 Validate and archive the OpenSpec change after implementation and verification.
