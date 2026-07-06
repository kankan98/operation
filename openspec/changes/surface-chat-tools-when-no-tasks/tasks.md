## 1. Regression Coverage

- [x] 1.1 Add TaskPanel test coverage for sessions with no tasks but existing tool executions.
- [x] 1.2 Add TaskPanel test coverage for tool executions arriving after initial empty render.
- [x] 1.3 Add TaskPanel test coverage proving manual tab selection is preserved.
- [x] 1.4 Add TaskPanel test coverage proving session changes recompute the default tab.

## 2. Component Behavior

- [x] 2.1 Implement derived initial tab selection in `TaskPanel`.
- [x] 2.2 Implement one-time automatic switch to "工具执行" for tool-only sessions without overriding manual tab choices.
- [x] 2.3 Reset manual tab selection when the Chat session changes.

## 3. Verification

- [x] 3.1 Run focused frontend TaskPanel tests.
- [x] 3.2 Run OpenSpec strict validation.
- [x] 3.3 Run frontend lint/build checks.
- [ ] 3.4 Verify the deployed chat page with Playwright after release.
