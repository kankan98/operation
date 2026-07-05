## Why

The roadmap now positions the product as a manual-first research assistant, but the API surface still makes bulk acquisition and queue operations look like a primary operating model. This keeps the project anchored to automation and queue maintenance even though the solo-user workflow needs trustworthy manual readings and explicit single-product checks.

## What Changes

- Add a manual-first acquisition mode that keeps single-product manual checks available.
- Disable bulk monitoring acquisition by default unless explicitly enabled by configuration.
- Mark queue/worker/provider operations as operational diagnostics, not a default workflow surface.
- Keep existing queue tables and job controls intact for compatibility; this change is not a destructive removal.
- Update tests and docs to reflect manual-first defaults.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `scraper-api`: default bulk `/api/scraper/all` behavior changes from enqueueing jobs to returning a disabled response unless explicitly enabled.
- `product-data-acquisition`: acquisition defaults shift to explicit manual product checks, with bulk monitoring acquisition behind configuration.
- `acquisition-queue-operations`: queue operations remain available as diagnostics and compatibility plumbing, but are deprecated as a default user workflow.

## Impact

- Backend config: add explicit feature flags for bulk monitoring acquisition and queue operations visibility.
- Backend API/service: gate bulk acquisition by default and return a clear disabled response.
- OpenAPI/tests: document and verify manual-first default behavior and explicit opt-in.
- Frontend/API clients: preserve single-product check; avoid presenting bulk acquisition as the default path.
