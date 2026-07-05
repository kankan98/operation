## 1. Runtime Migration

- [x] 1.1 Update the current Drizzle runtime migration so a fresh database creates all runtime schema tables before adding opportunity research decision/action columns.
- [x] 1.2 Add a backend test that runs the configured Drizzle migrator against a temporary empty SQLite database and verifies representative runtime tables/columns exist.

## 2. AI Provider Correctness

- [x] 2.1 Fix OpenAI-compatible streaming to accumulate tool-call argument chunks per tool call before parsing.
- [x] 2.2 Stop emitting or persisting `reasoning_content` as user-visible assistant text.
- [x] 2.3 Add provider tests for chunked tool-call arguments and hidden reasoning content.

## 3. Product Batching And Pagination

- [x] 3.1 Add a stable, count-based product listing path and reusable product batch iteration helper.
- [x] 3.2 Update opportunity scoring to process all matching products in batches before applying scoring/research pagination.
- [x] 3.3 Update bulk acquisition to consider all monitoring products in batches and report correct totals.
- [x] 3.4 Add regression tests for opportunity and acquisition behavior beyond one batch.

## 4. API, Config, And Logging

- [x] 4.1 Return 404 `PRODUCT_NOT_FOUND` for manual acquisition of a missing product.
- [x] 4.2 Change backend configuration precedence so `process.env` overrides local `.env` values.
- [x] 4.3 Remove API key fragments from AI provider logs.
- [x] 4.4 Add tests for missing-product status, config precedence, and provider log redaction.

## 5. Local Quality Gates

- [x] 5.1 Replace broken root lint-staged filter commands with commands that work in the repository's independent package layout.
- [x] 5.2 Update the Husky pre-commit hook so frontend and backend staged files are both checked.

## 6. Validation

- [x] 6.1 Run backend build, lint, tests, and fresh migration validation.
- [x] 6.2 Run frontend build, lint, and tests.
- [x] 6.3 Run OpenSpec validation and whitespace checks.
