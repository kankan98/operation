## Why

Recent full-project review found several release-blocking and correctness issues that are not covered by the completed `code-review-critical-fixes` change. The highest-risk issue is that a fresh backend database cannot run the configured Drizzle migration path, which blocks new environments and CI database initialization.

## What Changes

- Fix the runtime Drizzle migration chain so a fresh SQLite database creates all backend runtime tables before adding newer research decision/action columns.
- Add migration coverage that runs the configured runtime migrator against an empty database.
- Fix OpenAI-compatible streaming tool-call argument assembly so JSON argument chunks are accumulated before parsing.
- Stop exposing model `reasoning_content` as user-visible answer text.
- Remove hard-coded 1000-product truncation from opportunity scoring and bulk acquisition by processing products in batches.
- Make the missing-product scraper endpoint return a product-not-found error instead of a 500 scrape failure.
- Align local quality gates so backend staged changes are linted and root lint-staged commands do not rely on non-existent workspace filters.
- Make environment variable precedence deployment-friendly and remove API key fragments from logs.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `deployment-operations`: runtime migrations must bootstrap a fresh database; production environment variables must take precedence over local `.env` values; logs must not expose API key fragments.
- `chat-agent-backend`: OpenAI-compatible streaming must preserve tool-call arguments and must not surface reasoning-only model content to users.
- `product-opportunity-scoring`: opportunity listing must not silently omit products beyond a fixed internal fetch limit.
- `product-data-acquisition`: bulk acquisition must consider all matching monitoring products without silent truncation, and missing products must return a not-found error.
- `quality-assurance`: local and CI gates must cover fresh runtime migrations and backend staged linting.

## Impact

- Backend migration SQL, migration tests, config loading, AI provider streaming, scraper route/service, product listing helpers, opportunity scoring, and acquisition batching.
- Root and Husky lint-staged configuration.
- Tests for migration bootstrap, OpenAI streaming behavior, opportunity/acquisition batching, config precedence/log redaction, and scraper missing-product response.
