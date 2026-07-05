## Why

Playwright audit of the production Chat page found that core conversation flows work, but several user-visible interactions are incomplete or brittle: copy crashes on HTTP, new sessions can remain indistinguishable as "新对话", mobile navigation leaks desktop controls, drawer controls are hard to target, and message action buttons appear functional without behavior.

This matters now because the Chat page is the primary AI agent surface; unstable session and message controls make successful answers difficult to trust, revisit, or manage.

## What Changes

- Disable message submission when the composer is empty and keep Enter / Shift+Enter behavior consistent.
- Give automatically created streaming sessions an immediate, readable title derived from the first user message.
- Preserve in-flight streaming state when a new backend-generated session ID is synchronized into the URL.
- Replace browser-native prompt/confirm session actions with accessible in-app dialogs for rename and delete.
- Make mobile Chat use a true single-column experience: hide persistent desktop navigation, expose clear drawer controls, and keep inactive panels non-interactive.
- Make drawer overlays and close controls reliably clickable and keyboard-accessible.
- Make message actions honest: copy must work or show a graceful failure; feedback / more actions must either produce visible state or be hidden until implemented.
- Add regression coverage for the audited interaction paths and Playwright coverage for desktop/mobile Chat flows.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chat-input-control`: empty composer submission and keyboard behavior become explicit UI requirements.
- `chat-session-lifecycle`: generated session IDs, in-flight stream preservation, and initial title assignment become required lifecycle behavior.
- `chat-session-list`: rename/delete dialogs, menu accessibility, search targeting, and untitled-session handling are strengthened.
- `chat-layout`: mobile Chat must hide persistent desktop navigation and use reliable session/task drawers.
- `chat-message-rendering`: message copy must handle unavailable Clipboard APIs without crashing.
- `conversation-controls`: feedback and more actions must provide visible behavior or remain unavailable.
- `main-navigation`: mobile persistent sidebar behavior must align with the Chat single-column layout.

## Impact

- Frontend Chat page, chat store synchronization, message card actions, session list menu/dialogs, app layout/navigation responsiveness, and drawer components.
- Backend streaming session creation title defaults.
- Tests for chat API session creation, chat navigation/store races, message action failures, mobile drawer behavior, and production-like Playwright flows.
