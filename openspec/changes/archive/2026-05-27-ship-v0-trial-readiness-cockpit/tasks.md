## 1. Readiness Decision Helper

- [x] 1.1 Add a V0 trial readiness cockpit helper that composes workflow readiness and feedback evidence into deterministic stages, copy, next action, and checklist items.
- [x] 1.2 Add a local check covering collect-evidence, fix-blockers, ready-for-internal-trial, and production-gate planning cases without network or database access.
- [x] 1.3 Add package scripts for the new helper check if needed.

## 2. Cockpit UI

- [x] 2.1 Add a compact readiness cockpit component to `internal-trial-access.tsx` using the helper output and existing workspace styles.
- [x] 2.2 Render the readiness cockpit on both the overview cockpit and public trial entry after a verified session is ready.
- [x] 2.3 Ensure loading, sparse evidence, blocker, ready, and production-gate planning copy stays concise, Chinese, accessible, and explicit about internal/demo-only scope.

## 3. Documentation And Specs

- [x] 3.1 Update roadmap and goal docs so V0.9 readiness is the current usable-version gate and production completion remains a separate stage.
- [x] 3.2 Fix accepted V0 usable trial workflow purpose text while touching the related specification.
- [x] 3.3 Validate the active OpenSpec change after implementation updates.

## 4. Verification

- [x] 4.1 Run the new readiness helper check and affected local checks (`trial-feedback:check`, `trial-mvp:check`).
- [x] 4.2 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 4.3 Run Playwright before archive for desktop and mobile readiness cockpit rendering, console health, and no incoherent overflow.

## 5. Release Gate

- [x] 5.1 Archive the completed OpenSpec change after verification passes.
- [x] 5.2 Commit with Conventional Commits, push to git remote, rebuild/redeploy Docker, and run public smoke checks.
