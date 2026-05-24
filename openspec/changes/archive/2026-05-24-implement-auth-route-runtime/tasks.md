## 1. OpenSpec And TDD Baseline

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Add the local auth route verifier first and confirm it fails before runtime support exists.

## 2. Auth Route Runtime Implementation

- [x] 2.1 Implement server-only auth route helpers for safe session views, scope parsing, status mapping, no-store JSON responses, and CSRF-checked logout.
- [x] 2.2 Add thin `GET /api/auth/session` and `POST /api/auth/logout` Route Handlers that delegate to the auth route helpers.
- [x] 2.3 Export the new auth route runtime through the auth module boundary.

## 3. Verification Scripts

- [x] 3.1 Wire `auth:route-check` scripts in the web app and root package.
- [x] 3.2 Extend the verifier to cover unauthenticated session query, authenticated scoped session query, missing-scope response, CSRF-blocked logout, successful logout, missing-cookie logout, logged-out cookie reuse, no-store headers, redaction, and rollback.

## 4. Docs And Durable Roadmap

- [x] 4.1 Update the auth contract with the implemented public auth route runtime, safe response shape, logout CSRF header, and remaining non-goals.
- [x] 4.2 Update architecture, README, app README, continuous goal, and autonomous roadmap status.
- [x] 4.3 Validate and archive the OpenSpec change after implementation and verification.
