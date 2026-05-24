## Why

The V0 loop can now capture sessions, run AI review, and create downstream talk-track/task drafts, but `/rackets` and `/knowledge` still stop at static reference screens. Operators need a browser path to maintain racket facts and reviewed knowledge sources before AI review, talk tracks, and future Q&A can be trusted with real team inputs.

Source and skill notes:

- Next.js official App Router guidance supports Server Actions for form submissions, but this wave will reuse existing protected Route Handlers because product and knowledge APIs already enforce auth, explicit tenant/team scope, CSRF, repository validation, safe JSON, and rollback checks; thin Server Action wrappers remain a later enhancement.
- W3C PROV-O supports preserving source/provenance relationships, which maps directly to product sources, knowledge claims, review decisions, and downstream readiness.
- NIST AI RMF supports traceable, human-governed inputs before AI-generated recommendations affect operator workflows.
- `opportunity-solution-tree` conclusion: the strongest opportunity for a usable V0 is closing the missing reference-data workbench gap; production login, RAG, and live AI are important, but they create less user value until product facts and reviewed knowledge can be maintained in the browser.
- `prioritization-advisor` conclusion: use value/effort for this early V0 stage with limited data; product and knowledge workbenches are high-value because existing APIs already exist, while HTTPS/provider login and RAG have higher architecture risk.
- `ui-ux-pro-max` guidance was adapted: keep the calm, dense operational dashboard; require visible labels, submit feedback, empty/error/success states, mobile card layouts instead of overflowing tables, and avoid marketing/webinar patterns.

## What Changes

- Extend the local V0 operator bootstrap permission override with `manage_products` and `review_knowledge` so internal browser workflows can exercise product and knowledge APIs without changing global role semantics.
- Upgrade `/rackets` from a static dashboard to an operator V0 workbench that enters team context, lists scoped racket products, creates product drafts with aliases/specs/selling focus, and shows duplicate, validation, loading, empty, saved, and safe error states.
- Add a product source/review lane in `/rackets` that surfaces existing review queue state and the current publication/readiness blockers exposed by accepted product APIs where available.
- Upgrade `/knowledge` from a static dashboard to an operator V0 workbench that enters team context, lists scoped sources, registers manual/official sources, creates team notes or manual claims where supported, shows review queue state, records basic review decisions, and publishes versions through existing protected knowledge routes where safe.
- Add shared reference-data browser helpers for V0 scope, CSRF headers, API errors, safe status labels, and route-safe payload builders.
- Keep public web discovery, crawling, RAG snapshot generation, Q&A answer generation, production auth/provider selection, team management, and automatic publication out of scope.
- Update README, roadmap, and accepted specs so future AI/RAG work starts from browser-maintainable product and knowledge reference data rather than static placeholders.

## Capabilities

### New Capabilities

- `operator-v0-reference-data-workflow`: Browser-usable V0 workflow that connects local V0 team context to racket product and knowledge lifecycle reference-data workbenches.

### Modified Capabilities

- `operator-v0-session-workflow`: Local V0 bootstrap membership gains reference-data permissions needed for the internal V0 workbench loop.
- `racket-product-workbench`: `/rackets` gains browser list/create/source/review/readiness behavior on top of accepted product APIs.
- `racket-product-api-runtime`: Existing product create/list runtime is exercised by browser V0 payloads and safe errors; source/review/publication browser affordances use only already-supported runtime behavior.
- `knowledge-learning-hub`: `/knowledge` gains browser list/create/review/publish behavior on top of accepted knowledge APIs.
- `knowledge-lifecycle-api-runtime`: Existing knowledge source/claim/note/review/conflict/publish runtime is exercised by browser V0 payloads and safe errors.

## Impact

- Affected UI: `/rackets`, `/knowledge`, shared reference-data client helpers, existing workspace shell patterns.
- Affected auth/runtime: local-only operator V0 permission override and verifier.
- Affected APIs: existing racket product and knowledge lifecycle Route Handlers are reused; no new database tables, migrations, external providers, SDKs, queues, object storage, or analytics are expected.
- Affected checks: OpenSpec validation, local V0 auth/reference-data workflow checks, existing `rackets:route-check`, `knowledge:route-check`, lint, typecheck, build, and Playwright desktop/mobile verification before archive.
- Deployment: after archive, commit with Conventional Commit, push, rebuild Docker, restart `operation-web-preview`, and check public preview routes.
