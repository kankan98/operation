## Why

Production Playwright evidence from `http://203.195.161.93/chat/11734881-282e-4817-96f9-5e33d47fe800` shows the chat page requesting `http://localhost:3001/api/...` from the end user's browser. Modern browsers block those requests from the public origin as private-network loopback access, leaving the chat session list, message history, and task panel in `Network Error`.

## What Changes

- Resolve chat and task frontend API clients to same-origin `/api` when the app is running on a non-local browser origin and the configured API base URL points to `localhost`, `127.0.0.1`, or `[::1]`.
- Preserve explicit non-local `VITE_API_BASE_URL` values for deployments that intentionally use a separate public API origin.
- Use the same resolver for chat REST calls, task REST calls, and direct SSE `EventSource` URLs.
- Add regression tests that simulate a public production origin with a localhost env value.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `chat-ui-production`: production chat UI API clients must avoid browser-visible loopback API origins from non-local deployments.

## Impact

- Frontend chat and task API client configuration.
- Frontend tests for API base URL resolution and SSE URL construction.
- No backend route, SSE protocol, chat storage, or task API contract changes.
