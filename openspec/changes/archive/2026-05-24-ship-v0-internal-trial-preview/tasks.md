## 1. OpenSpec And Scope Baseline

- [x] 1.1 Validate the OpenSpec change before implementation.
- [x] 1.2 Record source-backed and skill-backed scope decisions in proposal and design.

## 2. Preview Cookie Runtime

- [x] 2.1 Extend auth cookie helpers with typed issue/clear options while preserving secure-by-default output.
- [x] 2.2 Add an explicit internal V0 preview cookie policy gate and short session lifetime.
- [x] 2.3 Update V0 bootstrap and logout flows to use the active cookie policy for issue and clear headers.

## 3. Verification

- [x] 3.1 Extend auth cookie verification for default secure cookies and explicit preview cookie headers.
- [x] 3.2 Extend operator V0 route verification for default-disabled preview mode, explicit preview mode, short expiration, scoped session verification, logout clearing, redaction, and rollback.
- [x] 3.3 Run relevant auth, operator V0, route, lint, typecheck, build, and OpenSpec checks.

## 4. Docs And Preview Operations

- [x] 4.1 Update auth contract, architecture roadmap, continuous goal, autonomous roadmap, and app/root docs with internal V0 preview behavior and sensitive-data limits.
- [x] 4.2 Document Docker preview flags without committing secrets or making preview mode production auth.
- [x] 4.3 Run Playwright browser verification before archive when implementation is ready.
