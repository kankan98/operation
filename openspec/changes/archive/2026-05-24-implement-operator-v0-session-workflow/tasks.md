## 1. Verification-First Setup

- [x] 1.1 Add a local operator V0 workflow verifier that initially fails because the bootstrap route and browser workflow helpers do not exist.
- [x] 1.2 Add package scripts for the V0 workflow verifier without changing existing check scripts.

## 2. Local Operator Bootstrap

- [x] 2.1 Implement a server-only V0 bootstrap helper that gates local/internal enablement, requires a custom CSRF header, seeds deterministic tenant/team/operator membership records, creates a fresh app-owned auth session, and returns safe context.
- [x] 2.2 Add the `/api/auth/operator-v0-session` Route Handler using existing database, auth session, and auth cookie primitives.
- [x] 2.3 Extend local route verification to cover disabled bootstrap, CSRF block, successful bootstrap, safe session view, no-store/secret redaction, and idempotent seed behavior.

## 3. Browser Session Workflow

- [x] 3.1 Replace the static `/sessions` workbench with a client workflow that can enter V0 context, verify auth session, load scoped session captures, and show loading/empty/error states.
- [x] 3.2 Add create-draft behavior that posts required session facts, host role, product order, note/question/objection seed data through the protected session capture API.
- [x] 3.3 Add draft-save behavior for summary, notes, customer questions, and objections with draft-version conflict handling and saved/error status messages.
- [x] 3.4 Add submit behavior that calls the protected submit endpoint, renders review-ready status, and shows downstream readiness.
- [x] 3.5 Ensure the workflow remains responsive and accessible on desktop/mobile with stable controls, visible focus, safe errors, and no internal architecture copy in normal UI.

## 4. Documentation And Roadmap

- [x] 4.1 Update `apps/web/README.md`, root `README.md` if relevant, and roadmap docs to reflect `/sessions` as the first browser-usable V0 workflow and document the secure-cookie/HTTP preview caveat.
- [x] 4.2 Update the active OpenSpec artifacts if implementation evidence changes scope, risk, or verification requirements.

## 5. Verification

- [x] 5.1 Run `openspec validate implement-operator-v0-session-workflow` and `openspec validate --all`.
- [x] 5.2 Run the V0 workflow verifier plus existing auth/session route checks.
- [x] 5.3 Run `pnpm lint`, `pnpm typecheck`, and `pnpm build`.
- [x] 5.4 Run Playwright desktop/mobile verification for `/sessions` before archive, including context entry, create/save/submit where the local environment allows it, console check, and text overflow/overlap check.
