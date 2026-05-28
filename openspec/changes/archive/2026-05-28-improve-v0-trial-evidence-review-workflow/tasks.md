## 1. Deterministic Review Model

- [x] 1.1 Add failing checks for evidence review priority order, complete-path strength, loose-feedback handling, and production-gate boundary.
- [x] 1.2 Extend the V0 trial readiness cockpit helper with typed evidence review output derived from existing scoped signals.

## 2. Cockpit UI

- [x] 2.1 Render the evidence review digest in the existing `/` and `/trial` cockpit readiness panel with bounded responsive cards and operator-facing Chinese copy.
- [x] 2.2 Preserve loading, missing evidence, blocker, internal-expansion, and production-gate states without exposing raw protected records or implementation notes.

## 3. Documentation And Verification

- [x] 3.1 Update roadmap/goal documentation with the V0 evidence review closeout and next-wave selection rule.
- [x] 3.2 Run OpenSpec validation and local trial checks.
- [x] 3.3 Run lint, typecheck, build, and Playwright desktop/mobile browser verification before archive.
- [x] 3.4 Archive the change, commit with Conventional Commits, push, rebuild/redeploy Docker, and smoke test the public preview.
