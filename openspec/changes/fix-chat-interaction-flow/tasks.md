## 1. Regression Coverage

- [x] 1.1 Add/keep a backend API regression test proving `/api/chat/sessions/new/stream` creates a session titled from the first user message.
- [x] 1.2 Add frontend tests for empty composer disabled state, Enter no-op on blank input, Shift+Enter newline, and valid Enter submission.
- [x] 1.3 Add frontend tests proving generated new-session URL sync preserves in-flight user and assistant messages.
- [x] 1.4 Add frontend tests for assistant message copy when Clipboard API is unavailable or rejects.
- [x] 1.5 Add frontend tests for session rename/delete dialogs and mobile drawer accessibility behavior.

## 2. Session Lifecycle And Composer

- [x] 2.1 Implement backend initial title generation for streaming-created sessions with trimming and length limiting.
- [x] 2.2 Preserve in-flight new-session messages while syncing generated session IDs into the URL.
- [x] 2.3 Disable the send button for empty/blank input and align Enter submission with the disabled state.
- [x] 2.4 Keep Shift+Enter newline behavior and ensure streaming/pending states prevent duplicate sends.

## 3. Message Actions

- [x] 3.1 Add a resilient copy helper that uses Clipboard API when available and a safe fallback otherwise.
- [x] 3.2 Show copy success/failure feedback without throwing uncaught JavaScript errors.
- [x] 3.3 Make thumbs up/down actions visibly toggle local feedback state or hide them if local state is not acceptable.
- [x] 3.4 Hide the "more actions" button until it opens a real command menu.

## 4. Session List Actions

- [x] 4.1 Replace native `prompt` rename with an application modal including validation, loading state, and API error display.
- [x] 4.2 Replace native `confirm` delete with an application modal including cancel/confirm, loading state, and API error display.
- [x] 4.3 Ensure deleting the current session navigates to `/chat`, clears messages, and refreshes the session list.
- [x] 4.4 Ensure hidden desktop/mobile session list controls are not interactive or ambiguously exposed to automation/accessibility.

## 5. Mobile Layout And Drawers

- [x] 5.1 Hide persistent application navigation and the "收起侧边栏" control on mobile Chat viewports.
- [x] 5.2 Keep mobile Chat single-column with visible conversation title, session drawer trigger, and task drawer trigger.
- [x] 5.3 Add reliable drawer close controls, Escape handling, and focus return for session/task drawers.
- [x] 5.4 Ensure drawer overlays close when clicking outside the drawer and do not intercept or mis-target pointer events.

## 6. Verification And Release

- [x] 6.1 Run OpenSpec validation for `fix-chat-interaction-flow`.
- [x] 6.2 Run targeted backend chat API tests.
- [x] 6.3 Run targeted frontend Chat tests, frontend lint, frontend build, and frontend test suite.
- [x] 6.4 Run Playwright desktop and mobile Chat interaction smoke tests against a production-like URL.
- [x] 6.5 Deploy the verified change to the server and re-run production health and Playwright checks.
