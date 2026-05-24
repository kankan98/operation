## 1. Proposal And Runtime Gates

- [x] 1.1 Validate the new OpenSpec change before implementation.
- [x] 1.2 Extend local V0 bootstrap permission override and verifier for `manage_products` and `review_knowledge` without changing global role semantics.
- [x] 1.3 Add a rollback-based local V0 reference-data workflow check covering permissions, CSRF, auth/scope, product create/list, knowledge source create/list, safe redaction, and rollback.

## 2. Shared Reference-Data Browser Helpers

- [x] 2.1 Add shared reference-data client helpers for V0 scope, CSRF headers, API errors, safe status labels, and no-store route payload handling.
- [x] 2.2 Add typed payload builders for manual racket product creation, product source metadata where supported, knowledge source registration, manual claims, team notes, review decisions, and publication attempts where supported.
- [x] 2.3 Keep product and knowledge payload builders separate so UI copy can distinguish product facts, source metadata, team experience, review decisions, and published knowledge.

## 3. Racket Product Browser Workflow

- [x] 3.1 Replace `/rackets` static workbench with a client workbench that resolves V0 context, lists scoped products, shows empty/loading/error/saved states, and creates manual racket product records.
- [x] 3.2 Preserve badminton-specific fields for model, aliases, weight class, balance, shaft stiffness, tension, player level, play style, price band, selling focus, limitations, review status, and downstream readiness.
- [x] 3.3 Surface product source/review/readiness lanes using supported accepted API/runtime behavior, and keep unsupported future source/review/publish actions visibly gated.
- [x] 3.4 Preserve dense Chinese operator UX across desktop/mobile, disabled states, duplicate/error states, and source/review labels.

## 4. Knowledge Browser Workflow

- [x] 4.1 Replace `/knowledge` static hub with a client workbench that resolves V0 context, lists scoped sources, shows empty/loading/error/saved states, and registers manual or official sources.
- [x] 4.2 Let `/knowledge` create supported manual claims and team notes while preserving source references, review state, sensitive-data boundaries, and non-authoritative status.
- [x] 4.3 Show scoped review queue items and record supported review decisions through existing protected knowledge routes.
- [x] 4.4 Show publication readiness and conflict blockers through supported protected routes without automatically publishing unreviewed content.
- [x] 4.5 Preserve dense Chinese operator UX across desktop/mobile, disabled states, duplicate/error states, and source/review/publication labels.

## 5. Documentation And Verification

- [x] 5.1 Update README, app README, roadmap, and accepted-status notes to describe the V0 reference-data browser workflow and local/HTTP preview boundary.
- [x] 5.2 Run OpenSpec validation, local auth/reference-data/product/knowledge checks, lint, typecheck, build, and diff checks.
- [x] 5.3 Run Playwright desktop/mobile verification before archive, then archive the change, commit, push, rebuild/restart Docker, and check the public preview.
