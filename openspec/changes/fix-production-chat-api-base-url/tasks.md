## 1. Regression Coverage

- [x] 1.1 Add failing tests for resolving a localhost API env value to same-origin `/api` on a public browser origin.
- [x] 1.2 Add failing tests proving local browser origins keep loopback API env values and public API env values are preserved.
- [x] 1.3 Add failing coverage that chat SSE `EventSource` URLs use the resolved API base URL.

## 2. Implementation

- [x] 2.1 Add a shared frontend API base URL resolver for chat/task clients.
- [x] 2.2 Update `chatApi.ts` REST and SSE paths to use the shared resolver.
- [x] 2.3 Update `taskApi.ts` to use the shared resolver.

## 3. Validation

- [x] 3.1 Run targeted frontend tests for API base URL resolution and chat/task API behavior.
- [x] 3.2 Run strict OpenSpec validation, frontend lint, frontend tests, and frontend build.
- [ ] 3.3 Deploy, run production Playwright chat smoke coverage, and verify no browser requests target localhost API URLs.
