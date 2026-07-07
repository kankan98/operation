## Why

线上 `/chat` 空会话状态下打开任务抽屉时，任务概览显示“当前会话还没有创建任务”。此时用户尚未创建或选择会话，“当前会话”语义不成立，容易让用户误以为系统仍关联了某个旧会话。

## What Changes

- 任务概览空状态根据是否存在当前会话切换辅助说明文案。
- 无当前会话时显示面向新对话的引导：“发送第一条消息后，相关任务会在这里显示”。
- 有当前会话但没有任务时保留现有文案：“当前会话还没有创建任务”。
- 增加前端回归测试，覆盖两种空态语义。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `task-overview-panel`: 空状态说明必须区分“未创建会话”和“当前会话无任务”。

## Impact

- 影响前端任务面板与任务概览空态组件：`frontend/src/components/chat/TaskPanel.tsx`、`frontend/src/components/chat/TaskOverviewCard.tsx`。
- 影响任务面板测试：`frontend/tests/chat/TaskPanelAndCards.test.tsx`。
- 不改变任务 API、SSE、会话创建逻辑、任务加载策略或面板布局。
