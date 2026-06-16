## 1. 共享类型系统

- [x] 1.1 创建 shared/types/sse-protocol.ts 文件
- [x] 1.2 定义基础类型（AgentStatus, ToolParams, ToolResult, ToolTiming, TokenUsage, StreamError）
- [x] 1.3 定义 8 种 SSE 事件接口（MessageStartEvent, StatusChangeEvent, ContentDeltaEvent, ToolStartEvent, ToolCompleteEvent, UsageCompleteEvent, MessageCompleteEvent, ErrorOccurredEvent）
- [x] 1.4 定义 SSEEvent 联合类型
- [x] 1.5 定义 API 请求/响应类型（StartStreamRequest, StartStreamResponse）
- [x] 1.6 定义 StreamErrorCode 枚举
- [x] 1.7 为所有类型添加 JSDoc 注释

## 2. 后端 - StreamManager 服务

- [x] 2.1 创建 backend/src/services/streamManager.ts 文件
- [x] 2.2 实现 StreamManager 类（内存 Map 存储）
- [x] 2.3 实现 create 方法（生成 streamId, messageId, 创建 generator）
- [x] 2.4 实现 get 方法（根据 streamId 获取 generator）
- [x] 2.5 实现 delete 方法（清理 stream）
- [x] 2.6 实现 5 分钟自动过期机制（setTimeout）
- [x] 2.7 实现 createGenerator 私有方法（创建 AsyncGenerator）

## 3. 后端 - 重写 ChatService

- [x] 3.1 更新 backend/src/services/chatService.ts 导入共享类型
- [x] 3.2 重写 streamMessage 方法以生成新的 SSEEvent 类型
- [x] 3.3 实现 message_start 事件生成（包含 messageId, sessionId, timestamp, model, streamId）
- [x] 3.4 实现 status_change 事件生成（thinking/tool_calling/writing）
- [x] 3.5 实现 content_delta 事件生成（替代原有的 text）
- [x] 3.6 实现 tool_start 事件生成（包含完整参数和 timestamp）
- [x] 3.7 实现 tool_complete 事件生成（包含 result 和完整 timing）
- [x] 3.8 实现 usage_complete 事件生成
- [x] 3.9 实现 message_complete 事件生成（包含 metadata）
- [x] 3.10 实现 error_occurred 事件生成（使用 StreamErrorCode）
- [x] 3.11 确保 executeTools 方法返回完整的时序信息

## 4. 后端 - 新增 API 端点

- [x] 4.1 在 backend/src/routes/chat.ts 添加 POST /api/chat/stream 端点
- [x] 4.2 实现 session 自动创建逻辑（sessionId 为空时）
- [x] 4.3 实现 StreamManager.create 调用并返回 202 响应
- [x] 4.4 在 backend/src/routes/chat.ts 添加 GET /api/chat/streams/:streamId 端点
- [x] 4.5 实现 SSE 响应头设置（Content-Type, Cache-Control, Connection, X-Accel-Buffering）
- [x] 4.6 实现从 StreamManager 获取 generator 并迭代发送事件
- [x] 4.7 实现心跳机制（每 15 秒发送 ": heartbeat"）
- [x] 4.8 实现错误处理（stream 不存在返回 404）
- [x] 4.9 标记旧端点 GET /sessions/:id/stream 为 deprecated（添加注释）

## 5. 后端 - 移除旧类型

- [x] 5.1 删除 backend/src/types/chat.ts 中已迁移到 shared 的类型
- [x] 5.2 更新所有后端文件中的类型导入（从 shared 导入）
- [x] 5.3 删除 shared/schemas/chat-events.ts（已被 sse-protocol.ts 替代）

## 6. 前端 - 重写 chatApi.streamMessage

- [x] 6.1 更新 frontend/src/services/chatApi.ts 导入共享类型
- [x] 6.2 实现两步流程：先 POST /api/chat/stream 获取 streamId
- [x] 6.3 使用 streamId 建立 EventSource 连接到 GET /api/chat/streams/:streamId
- [x] 6.4 实现事件处理器映射（message_start, status_change, content_delta, tool_start, tool_complete, usage_complete, message_complete, error_occurred）
- [x] 6.5 移除超时计时器逻辑（后端心跳处理）
- [x] 6.6 移除旧的 streamMessageLegacy 方法

## 7. 前端 - 简化 useChatSSE

- [x] 7.1 更新 frontend/src/hooks/useChatSSE.ts 导入共享类型
- [x] 7.2 移除临时 ID 生成逻辑（assistant-${Date.now()}）
- [x] 7.3 更新 onMessageStart 处理器（使用后端返回的 messageId 创建消息）
- [x] 7.4 简化 onStatus 处理器（直接使用 status，无需推断）
- [x] 7.5 移除 setToolStartTime 调用（时序由后端管理）
- [x] 7.6 简化 onToolResult 处理器（直接使用 timing.durationMs）
- [x] 7.7 移除 toolStartTimes 和 toolEndTimes 的 ref 状态管理

## 8. 前端 - 移除旧类型

- [x] 8.1 删除 frontend/src/types/chat.ts 中已迁移到 shared 的类型
- [x] 8.2 更新所有前端文件中的类型导入（从 shared 导入）
- [x] 8.3 确保 ChatStore 中的类型引用正确

## 9. 测试和文档

- [x] 9.1 移除 backend/tests/fixtures/openapi.json 中旧的 SSE 接口定义
- [x] 9.2 在 backend/tests/fixtures/openapi.json 中添加新的 SSE 接口定义
- [x] 9.3 更新 docs/api/sse-streaming.md 为新协议文档
- [x] 9.4 更新 docs/api/rest-api.md 添加新端点说明
- [x] 9.5 编写单元测试：StreamManager 类
- [x] 9.6 编写单元测试：POST /api/chat/stream 端点
- [x] 9.7 编写单元测试：GET /api/chat/streams/:streamId 端点
- [x] 9.8 编写集成测试：完整流式对话流程
- [x] 9.9 编写集成测试：工具调用场景
- [x] 9.10 编写集成测试：错误处理场景

## 10. 前端集成测试

- [x] 10.1 测试简单对话（无工具）
- [x] 10.2 测试带工具调用的对话
- [x] 10.3 测试多轮工具调用（Agent Loop）
- [x] 10.4 测试错误场景（网络断开、API 错误）
- [x] 10.5 测试重连场景（连接断开后重新发送）
- [x] 10.6 测试 session 自动创建
- [x] 10.7 测试状态指示器正确显示
- [x] 10.8 测试工具卡片时序显示

## 11. 清理旧端点

- [x] 11.1 删除 backend/src/routes/chat.ts 中的 GET /sessions/:id/stream 端点
- [x] 11.2 验证所有测试仍然通过
- [x] 11.3 验证前端应用正常工作
- [x] 11.4 清理所有 deprecated 注释

## 12. 验证和部署

- [x] 12.1 运行完整的测试套件（前后端）
- [x] 12.2 执行 E2E 测试
- [x] 12.3 手动测试所有聊天场景
- [x] 12.4 检查 TypeScript 编译无错误
- [x] 12.5 检查 ESLint 无警告
- [x] 12.6 构建生产版本
- [x] 12.7 更新 CHANGELOG.md
- [x] 12.8 准备发布说明（Breaking Changes）
