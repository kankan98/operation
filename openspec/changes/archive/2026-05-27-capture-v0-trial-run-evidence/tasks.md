## 1. Data Model And Repository

- [x] 1.1 Add Drizzle enums, tables, migration, and feedback link columns for V0 trial runs and step evidence.
- [x] 1.2 Implement server-only trial run repository with validation, scope checks, safe note filtering, run summary, and rollback-friendly operations.
- [x] 1.3 Extend V0 trial feedback repository input/output so feedback can optionally link to scoped trial run evidence.
- [x] 1.4 Add focused repository verification for start/list/detail/update/complete, invalid scope, sensitive notes, and linked feedback behavior.

## 2. Protected API Runtime

- [x] 2.1 Add protected trial run Route Handlers for list/create/detail/run update/step update using existing auth cookie, tenant/team scope, CSRF, and no-store JSON.
- [x] 2.2 Verify route behavior for missing session, missing scope, missing CSRF, invalid run/step ids, safe errors, and successful scoped updates.

## 3. Trial Cockpit Workflow

- [x] 3.1 Add client trial-run helper types and fetch helpers for the new protected API.
- [x] 3.2 Add "本次试用运行" panel to the shared internal trial cockpit for `/` and `/trial`.
- [x] 3.3 Show run status in the six-step checklist and keep existing feedback/readiness behavior intact.
- [x] 3.4 Preserve mobile/desktop readability, disabled/loading/error/saved states, keyboard focus, and sensitive-data warnings.

## 4. Readiness And Documentation

- [x] 4.1 Extend V0 readiness model/checks to consume trial run evidence without claiming production readiness.
- [x] 4.2 Update roadmap/goal notes after implementation evidence is known.
- [x] 4.3 Validate OpenSpec artifacts and accepted spec deltas remain aligned.

## 5. Verification

- [x] 5.1 Run focused trial run, trial feedback, trial readiness, and affected auth/trial checks.
- [x] 5.2 Run lint, typecheck, and build.
- [x] 5.3 Run Playwright desktop/mobile verification for `/trial` and `/` before archive.
