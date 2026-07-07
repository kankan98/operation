## Why

线上聊天页中，未命名会话的操作菜单按钮使用“新对话 操作菜单”作为可访问名称，导致它会被 `getByRole('button', { name: '新对话' })` 这类按名称匹配的交互同时命中。主“新对话”按钮和会话操作菜单应在辅助技术与自动化测试中保持清晰区分。

## What Changes

- 保留未命名会话在列表中的视觉占位文案“新对话”。
- 调整会话操作菜单按钮的可访问名称，使其统一以“会话操作菜单：”开头。
- 未命名会话的操作菜单使用“未命名对话”作为可访问名称中的目标描述，避免包含主按钮的完整名称。
- 增加前端回归测试，覆盖未命名会话菜单与主“新对话”按钮不会发生可访问名称冲突。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `chat-session-list`: 明确会话操作菜单按钮的可访问名称必须与主新建会话按钮区分。

## Impact

- 影响前端会话列表组件：`frontend/src/components/chat/SessionGroupList.tsx`。
- 影响前端会话列表测试：`frontend/tests/chat/SessionGroupList.test.tsx`。
- 不改变后端 API、数据库结构、会话标题数据模型或用户可见的未命名会话标题。
