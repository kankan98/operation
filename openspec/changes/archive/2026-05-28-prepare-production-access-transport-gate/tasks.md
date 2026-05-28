## 1. Gate Model And TDD

- [x] 1.1 Add a failing local verifier for production access and HTTPS gate behavior.
- [x] 1.2 Implement the deterministic production access transport gate model and exported types.
- [x] 1.3 Add root and app package scripts for the new provider-free verifier.

## 2. V1 Gate Integration And UI

- [x] 2.1 Update the top-level V1 production gate workflow to link production access and HTTPS planning to the detailed gate without marking real trial ready.
- [x] 2.2 Render the detailed access/transport gate in the existing overview and `/trial` cockpit with compact Chinese copy and safe status labels.
- [x] 2.3 Ensure no secrets, provider payloads, raw runtime config, raw prompts, raw protected records, or stack traces are rendered.

## 3. Contracts And Roadmap

- [x] 3.1 Update `docs/contracts/auth-team-tenant.md` with production provider-selection, team access, CSRF/origin, secure-cookie, and HTTPS transport prerequisites.
- [x] 3.2 Update roadmap and goal docs so the next wave moves from generic gate planning to production auth and HTTPS implementation.
- [x] 3.3 Validate OpenSpec artifacts and keep tasks current.

## 4. Verification And Release

- [x] 4.1 Run the new local verifier plus relevant V1/trial readiness checks.
- [x] 4.2 Run lint, typecheck, and production build.
- [x] 4.3 Run Playwright desktop and mobile browser verification before archive.
- [x] 4.4 Archive the OpenSpec change, commit with a Conventional Commit, push, rebuild Docker preview, verify restart policy, and smoke public routes.
