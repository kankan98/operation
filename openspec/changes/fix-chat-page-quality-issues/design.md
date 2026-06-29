## Context

Chat.tsx 是聊天功能的核心页面组件，当前存在以下质量问题：

**现状：**
- 使用非受控组件 + 直接 DOM 操作管理输入框
- 类型不匹配导致 `extractToolExecutions` 返回值与 `TaskPanel` 期望类型不一致
- 会话切换、消息加载、SSE 连接缺少取消和清理机制，导致竞态条件
- 缺少错误边界保护，单条消息错误会导致整个 UI 崩溃
- useChatSSE 未正确导出 error 属性，错误信息无法显示
- 自动滚动在流式传输期间频繁触发，造成性能问题
- toolExecutions、会话标题查找等计算未使用 memoization，每次渲染都重新计算

**约束：**
- 必须保持向后兼容，不改变外部 API 和用户行为
- 不引入新的外部依赖，仅使用 React 内置能力
- 修复必须通过现有测试，部分测试可能需要调整

**影响范围：**
- 前端文件：`Chat.tsx`, `useChatSSE.ts`, `messageAdapter.ts`, `EnhancedMessageCard.tsx`
- 无后端 API 变更
- 无数据库 schema 变更

## Goals / Non-Goals

**Goals:**
- 修复 React 状态管理错误，将输入框改为受控组件
- 修复类型不匹配，统一 `extractToolExecutions` 与 `TaskPanel` 的类型契约
- 修复竞态条件，为异步操作添加取消和清理机制
- 添加错误边界保护，防止单条消息错误导致 UI 崩溃
- 确保 useChatSSE 正确导出 error 属性，错误能正常显示
- 优化自动滚动逻辑，防止流式传输时的抖动
- 使用 useMemo/useCallback 优化性能，减少不必要的重新计算和渲染

**Non-Goals:**
- 不重构整个 Chat 组件架构（如拆分为多个子组件）
- 不引入外部状态管理库（如 Redux、Zustand 已有部分除外）
- 不修改设计和视觉样式
- 不添加新功能（仅修复现有问题）
- 不重构 useScrollControl hook（虽然代码审查发现可复用，但超出本次范围）

## Decisions

### Decision 1: 输入框状态管理策略

**选择：使用 useState + useRef 混合方案**

- **useState**：管理输入框的值（受控组件）
- **useRef**：保存输入框 DOM 引用，用于聚焦操作

**理由：**
- 受控组件确保状态同步，组件重新渲染时不丢失输入
- useRef 避免不必要的查询 DOM，性能更好
- 符合 React 最佳实践

**替代方案：**
- ❌ 继续使用非受控 + DOM 操作：状态不可靠，违反 React 原则
- ❌ 使用 useReducer：过度设计，输入框状态简单不需要 reducer

### Decision 2: 类型修复策略

**选择：修改 extractToolExecutions 返回类型，移除 MessagePart 的 type 字段**

修改 `messageAdapter.ts` 中的 `extractToolExecutions`：
```typescript
// Before: 返回 MessagePart[]，包含 {type: 'tool', ...}
// After: 返回 ToolCall[]，仅包含 {id, name, input, result, ...}
```

**理由：**
- TaskPanel 期望的是 ToolCall 类型，不应包含 type 字段
- 类型转换应在数据提取层完成，而非消费层
- 符合单一职责原则

**替代方案：**
- ❌ 在 TaskPanel 中适配 MessagePart：将错误推给消费方，违反封装原则
- ❌ 修改 ToolCall 类型定义：影响范围过大，可能破坏其他代码

### Decision 3: 竞态条件解决方案

**选择：使用 AbortController + cleanup 函数**

为会话切换和消息加载添加取消机制：
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  if (sessionId) {
    loadMessages(sessionId, { signal: abortController.signal });
  }
  
  return () => abortController.abort();
}, [sessionId]);
```

**理由：**
- AbortController 是标准 Web API，无需额外依赖
- cleanup 函数确保组件卸载或依赖变化时取消请求
- 防止过时的异步结果污染新状态

**替代方案：**
- ❌ 使用状态标记判断：容易出错，不如 AbortController 可靠
- ❌ 不处理竞态：会导致用户看到错误的数据

### Decision 4: 错误边界实现

**选择：创建 MessageErrorBoundary 组件包裹消息列表**

```typescript
<MessageErrorBoundary>
  {messages.map(message => (
    <EnhancedMessageCard key={message.id} ... />
  ))}
</MessageErrorBoundary>
```

**理由：**
- React Error Boundary 是处理渲染错误的标准方式
- 包裹在列表级别，单条消息错误不影响其他消息
- 降级 UI 提供友好的错误提示

**替代方案：**
- ❌ try-catch 包裹渲染：不适用于 React 组件渲染错误
- ❌ 包裹单条消息：过度细粒度，增加组件树深度

### Decision 5: 滚动优化策略

**选择：仅在 isStreaming 结束时触发自动滚动**

```typescript
// Before: 依赖 messages.length
useEffect(() => {
  scrollToBottom();
}, [messages.length]);

// After: 依赖 isStreaming 状态
useEffect(() => {
  if (!isStreaming && messages.length > 0) {
    scrollToBottom();
  }
}, [isStreaming, messages.length]);
```

**理由：**
- 流式传输期间 messages.length 可能频繁变化，触发多次滚动
- 等待流式完成后滚动一次，避免抖动
- 用户体验更流畅

**替代方案：**
- ❌ 使用 debounce：增加复杂度，延迟不好控制
- ❌ 使用 useScrollControl hook：虽然更好，但超出本次修复范围（Non-Goal）

### Decision 6: useCallback 优化闭包陷阱

**选择：使用 useRef 存储最新的 tasks，回调中读取 ref.current**

```typescript
const tasksRef = useRef(tasks);
tasksRef.current = tasks;

const handleViewTaskDetail = useCallback((taskId: string) => {
  const task = tasksRef.current.find(t => t.id === taskId);
  // ...
}, []); // 空依赖数组，回调引用稳定
```

**理由：**
- 避免闭包捕获过时的 tasks 数组
- 回调引用稳定，子组件不会因回调变化而重新渲染
- 性能优化同时保证正确性

**替代方案：**
- ❌ 将 tasks 加入依赖数组：回调频繁重建，触发子组件渲染
- ❌ 从事件参数传递 task：需要修改 TaskPanel 接口，影响范围过大

### Decision 7: useMemo 性能优化位置

**选择：为以下计算添加 useMemo**
- `toolExecutions`（从 messages 提取）
- 活跃会话标题查找

```typescript
const toolExecutions = useMemo(
  () => messages.flatMap(extractToolExecutions),
  [messages]
);

const activeSessionTitle = useMemo(
  () => sessions.find(s => s.id === currentSessionId)?.title || '新对话',
  [sessions, currentSessionId]
);
```

**理由：**
- toolExecutions 每次渲染都遍历所有消息，成本较高
- 会话标题查找在大量会话时性能问题明显
- useMemo 缓存计算结果，仅在依赖变化时重新计算

**替代方案：**
- ❌ 不优化：在消息/会话较多时性能差
- ❌ 优化所有计算：过度优化，增加维护成本

## Risks / Trade-offs

### Risk 1: 受控组件转换可能影响现有行为
- **风险**：输入框从非受控改为受控，可能改变表单提交、重置等行为
- **缓解**：充分测试所有输入场景（普通输入、快捷按钮、提交、清空）

### Risk 2: AbortController 兼容性
- **风险**：旧浏览器可能不支持 AbortController
- **缓解**：项目已使用现代构建工具，应有 polyfill；目标用户使用现代浏览器

### Risk 3: 错误边界可能掩盖真实问题
- **风险**：错误边界捕获异常后，开发者可能不知道根本原因
- **缓解**：错误边界记录错误到 console.error，开发环境仍可看到完整堆栈

### Risk 4: 类型修复可能影响其他消费方
- **风险**：修改 extractToolExecutions 返回类型，可能影响其他使用方
- **缓解**：先 grep 搜索所有调用点，确认仅 Chat.tsx 使用；如有其他使用方，分别修复

### Risk 5: useMemo 过度优化
- **风险**：不当使用 useMemo 可能反而降低性能（依赖数组判断成本）
- **缓解**：仅为成本较高的计算添加 memoization，简单计算不加

### Risk 6: scrollIntoView 的 try-catch 可能隐藏 bug
- **风险**：静默失败可能让开发者忽略真实的 DOM 结构问题
- **缓解**：catch 中记录警告日志，方便排查

## Migration Plan

**部署步骤：**
1. 前端代码修复完成后，运行完整测试套件
2. 本地验证所有场景（输入、会话切换、流式传输、错误场景）
3. 合并到主分支，触发 CI/CD 自动部署

**回滚策略：**
- 如果部署后发现严重问题，可直接 git revert 回滚
- 前端改动无数据库变更，回滚无风险

**验证指标：**
- 用户输入不丢失
- 会话切换无数据错乱
- 错误信息正常显示
- 滚动流畅无抖动
- 无 console 错误（除预期的错误边界日志）

## Open Questions

无待解决问题。所有设计决策已明确。
