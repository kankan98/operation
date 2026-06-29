## 1. 修复输入框状态管理

- [x] 1.1 在 Chat.tsx 中添加 useState 管理输入框值
- [x] 1.2 创建 useRef 引用输入框 DOM 元素
- [x] 1.3 将 textarea 改为受控组件，绑定 value 和 onChange
- [x] 1.4 修改快捷按钮点击处理，使用 setState 而非直接 DOM 操作
- [x] 1.5 修改表单提交处理，使用 state 值而非从 DOM 读取
- [x] 1.6 测试：验证输入、快捷按钮填充、提交、清空等场景

## 2. 修复类型不匹配

- [x] 2.1 修改 messageAdapter.ts 中的 extractToolExecutions 函数
- [x] 2.2 确保返回类型为 ToolCall[]，移除 MessagePart 的 type 字段
- [x] 2.3 grep 搜索所有 extractToolExecutions 调用点，确认影响范围
- [x] 2.4 测试：验证 TaskPanel 正常接收和渲染工具执行信息

## 3. 修复 useChatSSE 错误导出

- [x] 3.1 检查 useChatSSE.ts，确认 error 属性在返回对象中
- [x] 3.2 如缺失，添加 error 到返回对象（从 store 或内部状态获取）
- [x] 3.3 更新 useChatSSE 的返回类型声明
- [x] 3.4 测试：模拟 SSE 连接错误，验证 Chat 页面显示错误提示

## 4. 添加错误边界保护

- [x] 4.1 创建 MessageErrorBoundary 组件（class component with componentDidCatch）
- [x] 4.2 实现降级 UI，显示"消息加载失败"友好提示
- [x] 4.3 在 Chat.tsx 中用 MessageErrorBoundary 包裹消息列表
- [x] 4.4 为 scrollIntoView 调用添加 try-catch 保护
- [x] 4.5 测试：模拟消息渲染错误，验证错误边界捕获并显示降级 UI

## 5. 修复会话切换竞态条件

- [x] 5.1 在 URL-store 同步 effect 中创建 AbortController
- [x] 5.2 为 loadMessages 调用传递 signal 参数
- [x] 5.3 添加 cleanup 函数，在 effect 清理时调用 abort()
- [x] 5.4 修改 chatApi.loadMessages 支持 AbortSignal 参数（如需要）
- [x] 5.5 测试：快速切换会话，验证不会显示错误会话的消息

## 6. 添加 SSE 连接清理机制

- [x] 6.1 检查 useChatSSE 是否已有清理逻辑（useEffect cleanup）
- [x] 6.2 如缺失，添加 cleanup 函数关闭 SSE 连接
- [x] 6.3 确保组件卸载或会话切换时正确清理
- [x] 6.4 测试：导航离开 Chat 页面，验证 SSE 连接关闭

## 7. 修复 effect 依赖数组

- [x] 7.1 移除 URL-store 同步 effect 的 eslint-disable 注释
- [x] 7.2 将 setMessages 添加到依赖数组（如不在其中）
- [x] 7.3 确认 loadMessages 在依赖数组中或使用稳定引用
- [x] 7.4 运行 eslint，验证无 exhaustive-deps 警告

## 8. 优化自动滚动逻辑

- [x] 8.1 修改自动滚动 effect 依赖从 messages.length 改为 isStreaming
- [x] 8.2 添加条件：仅在 !isStreaming && messages.length > 0 时滚动
- [x] 8.3 测试：流式传输期间不应频繁滚动，完成后滚动一次

## 9. 使用 useCallback 稳定滚动回调

- [x] 9.1 创建 tasksRef = useRef(tasks)
- [x] 9.2 在渲染中同步 tasksRef.current = tasks
- [x] 9.3 修改 handleViewTaskDetail，使用 tasksRef.current 而非闭包的 tasks
- [x] 9.4 将 handleViewTaskDetail 依赖数组改为空数组
- [x] 9.5 同样处理 handleViewToolDetail
- [x] 9.6 测试：任务状态变化时，点击查看详情能找到正确的任务

## 10. 添加性能优化 memoization

- [x] 10.1 使用 useMemo 包裹 toolExecutions 计算，依赖 [messages]
- [x] 10.2 使用 useMemo 包裹活跃会话标题查找，依赖 [sessions, currentSessionId]
- [x] 10.3 测试：使用 React DevTools Profiler 验证渲染次数减少

## 11. 集成测试与验证

- [x] 11.1 运行完整的前端测试套件，确保所有测试通过
- [x] 11.2 本地手动测试所有修复场景
- [x] 11.3 测试：输入框不丢失内容
- [x] 11.4 测试：快速切换会话无数据错乱
- [x] 11.5 测试：SSE 错误正常显示
- [x] 11.6 测试：单条消息错误不影响其他消息
- [x] 11.7 测试：滚动流畅无抖动
- [x] 11.8 检查浏览器控制台，确认无意外错误（除预期的错误日志）
