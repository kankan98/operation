## Why

Production chat sessions can contain completed tool executions without any task records. In that state, the right-side task panel opens on "任务概览" and shows "暂无任务", even though the adjacent tab contains the relevant tool execution history.

This makes the chat answer look incomplete or broken because the panel hides the evidence behind a manual tab switch.

## What Changes

- Default the chat task panel to "工具执行" when a session has tool executions but no tasks.
- Automatically switch from "任务概览" to "工具执行" when tool executions arrive later and there are still no tasks.
- Preserve user intent after manual tab selection so the panel does not keep overriding a chosen tab.
- Apply the same behavior to the responsive task drawer because it reuses the same panel component.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `task-overview-panel`: Clarifies the empty task state when tool executions are available.
- `tool-execution-card`: Clarifies when compact tool execution cards should be surfaced in the task panel.

## Impact

- Affected frontend component: `frontend/src/components/chat/TaskPanel.tsx`
- Affected tests: `frontend/tests/chat/TaskPanelAndCards.test.tsx`
- No backend API, database, or SSE protocol changes.
