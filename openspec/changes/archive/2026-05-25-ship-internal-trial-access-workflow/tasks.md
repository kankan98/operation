## 1. Shared Trial Access Runtime

- [x] 1.1 Add shared browser-side V0 trial helpers for stored scope, scoped API URLs, bootstrap, session verification, logout, and safe user messages.
- [x] 1.2 Add a local repeatable trial access check that verifies disabled bootstrap, CSRF blocking, successful bootstrap, scoped session verification, protected racket API access, logout invalidation, no-store responses, redaction, and rollback.
- [x] 1.3 Add root and web package scripts for the new trial access check.

## 2. Workspace Trial UI

- [x] 2.1 Add a workspace-level internal trial access component for entry, ready, refreshing, leaving, disabled, and error states.
- [x] 2.2 Update the overview into a compact trial cockpit with demo team status, recommended V0 path, and direct workflow links.
- [x] 2.3 Keep copy operator-facing and responsive on desktop/mobile without implementation details or text overflow.

## 3. Documentation And Roadmap

- [x] 3.1 Update auth/team, V0 preview, and workspace docs/spec-adjacent contracts to describe the unified internal trial access boundary and non-goals.
- [x] 3.2 Update README/app README and roadmap documents to reflect the new Alpha trial entry and remaining production-auth exclusions.

## 4. Verification And Release

- [x] 4.1 Run `openspec validate ship-internal-trial-access-workflow` and `openspec validate --all`.
- [x] 4.2 Run lint, typecheck, build, auth/operator V0 checks, the new trial access check, affected V0 checks, and git diff hygiene.
- [x] 4.3 Run Playwright pre-archive browser verification for overview trial entry/ready state on desktop/mobile.
- [x] 4.4 Archive the OpenSpec change, commit with Conventional Commits, push, deploy Docker preview, and verify public preview health including database-backed V0 access.
