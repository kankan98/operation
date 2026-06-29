## Why

Chat 页面存在 10 个影响稳定性和用户体验的代码质量问题，包括 React 状态管理错误、类型不匹配、竞态条件、缺失的错误处理和性能瓶颈。这些问题导致：用户输入丢失、UI 崩溃、会话数据错乱、错误信息不显示、滚动卡顿等。修复这些问题将显著提升 Chat 功能的稳定性和性能。

## What Changes

- **修复 React 状态管理**：将欢迎页快捷按钮从直接 DOM 操作改为受控组件模式
- **修复类型不匹配**：统一 `extractToolExecutions` 返回类型与 `TaskPanel` 期望类型
- **修复错误处理**：确保 `useChatSSE` 正确导出 error 属性，添加消息渲染错误边界
- **修复竞态条件**：为会话切换、消息加载、SSE 连接添加取消机制和清理逻辑
- **修复滚动问题**：优化自动滚动逻辑，防止流式传输时的抖动，添加 DOM 异常保护
- **性能优化**：使用 `useMemo` 缓存计算结果，使用 `useRef` 避免不必要的重新渲染

## Capabilities

### New Capabilities
- `chat-input-control`: 聊天输入框的受控状态管理和快捷操作支持
- `chat-error-boundary`: 消息渲染错误边界和异常保护机制
- `chat-scroll-optimization`: 优化的滚动控制和自动滚动逻辑
- `chat-session-lifecycle`: 会话切换的生命周期管理和清理机制

### Modified Capabilities
- `chat-message-rendering`: 修复类型不匹配，优化消息和工具执行的渲染性能
- `chat-error-handling`: 增强错误显示和 SSE 连接错误处理

## Impact

**受影响文件**：
- `frontend/src/pages/Chat.tsx` - 主要修复目标
- `frontend/src/hooks/useChatSSE.ts` - 确保 error 导出
- `frontend/src/utils/messageAdapter.ts` - 修复 extractToolExecutions 返回类型
- `frontend/src/components/chat/EnhancedMessageCard.tsx` - 可能需要错误边界包装

**依赖变更**：
- 无新增外部依赖
- 使用 React 内置 hooks (`useMemo`, `useRef`, `useCallback`) 和 Error Boundary 模式

**向后兼容**：
- 所有修复都是内部实现优化，不影响外部 API 或用户行为
- 现有测试应继续通过，部分测试可能需要更新以匹配新的受控组件模式
