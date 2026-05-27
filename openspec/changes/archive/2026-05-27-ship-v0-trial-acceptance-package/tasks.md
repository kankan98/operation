## 1. Deterministic Acceptance Model

- [x] 1.1 Add failing assertions for V0 acceptance package decisions and evidence status lines in the existing readiness cockpit check.
- [x] 1.2 Extend the V0 readiness cockpit domain helper with acceptance package types, decision mapping, evidence items, blocker/gate summary, and next action.

## 2. Cockpit UI

- [x] 2.1 Render the V0 acceptance package in the shared trial readiness cockpit panel for overview and `/trial`.
- [x] 2.2 Keep the acceptance package responsive, accessible, operator-facing, and free of raw sensitive data or production-readiness claims.

## 3. Documentation and Spec Alignment

- [x] 3.1 Update roadmap or goal documentation if the V0 closeout status or next-wave sequencing changes.
- [x] 3.2 Run `openspec validate ship-v0-trial-acceptance-package` and fix spec issues before implementation is considered ready.

## 4. Verification, Archive, and Release

- [x] 4.1 Run focused V0 trial checks plus lint, typecheck, and build.
- [x] 4.2 Run Playwright desktop/mobile verification for `/trial` and the acceptance package before archive.
- [x] 4.3 Archive the OpenSpec change, commit with Conventional Commits, push, rebuild Docker preview, and smoke-check the public URL.
