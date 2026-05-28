## 1. Gate Model

- [x] 1.1 Add a deterministic V1 production gate model and type definitions.
- [x] 1.2 Add a local verifier that first fails for the new gate behavior, then passes after implementation.
- [x] 1.3 Add root and app package scripts for the V1 production gate verifier.

## 2. Trial Cockpit UI

- [x] 2.1 Render the V1 gate panel in the existing internal trial readiness cockpit.
- [x] 2.2 Ensure gate copy is concise Chinese, status-labeled, safe, and responsive without exposing implementation secrets.

## 3. Roadmap And Specs

- [x] 3.1 Update the roadmap and goal docs to mark V0 freeze handoff and V1 production gate planning as the current next wave.
- [x] 3.2 Validate OpenSpec artifacts and keep task status current.

## 4. Verification And Release

- [x] 4.1 Run local model checks, relevant trial checks, lint, typecheck, and build.
- [x] 4.2 Run Playwright desktop and mobile browser verification before archive.
- [x] 4.3 Archive the OpenSpec change after verification.
- [x] 4.4 Commit with Conventional Commit, push, rebuild Docker preview, verify restart policy and public smoke routes.
