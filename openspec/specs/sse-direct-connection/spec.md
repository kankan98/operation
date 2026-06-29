# sse-direct-connection Specification

## Purpose
TBD - created by archiving change sse-nonblocking-architecture. Update Purpose after archive.
## Requirements
### Requirement: Single-step SSE connection endpoint
系统 SHALL 提供单步 GET 端点用于直接建立 SSE 连接并开始流式传输。

#### Scenario: Direct SSE connection with content
- **WHEN** 客户端发送 GET /api/chat/sessions/:sessionId/stream?content=<url_encoded_message>
- **THEN** 系统 SHALL 立即返回 200 OK，Content-Type: text/event-stream，并开始推送 SSE 事件

#### Scenario: Connection establishes immediately
- **WHEN** 前端调用 new EventSource(url)
- **THEN** EventSource 构造函数 SHALL 立即返回（非阻塞），连接在后台建立

#### Scenario: Backend processes asynchronously
- **WHEN** SSE 连接建立后
- **THEN** 后端 SHALL 异步执行 chatService.streamMessage()，在工具执行期间持续推送事件

#### Scenario: Session creation if not exists
- **WHEN** sessionId 为特殊值 "new" 或不存在
- **THEN** 系统 SHALL 自动创建新会话，并在 message_start 事件中返回新 sessionId

#### Scenario: URL length validation
- **WHEN** content 参数经过 URL 编码后
- **THEN** 完整 URL 长度 SHALL 不超过 2048 字符（符合 HTTP GET 标准）

### Requirement: SSE response headers
系统 SHALL 设置正确的 SSE 响应头以保持连接和禁用缓冲。

#### Scenario: Content-Type header
- **WHEN** 建立 SSE 连接
- **THEN** 响应 SHALL 包含 Content-Type: text/event-stream; charset=utf-8

#### Scenario: Cache-Control header
- **WHEN** 建立 SSE 连接
- **THEN** 响应 SHALL 包含 Cache-Control: no-cache, no-transform

#### Scenario: Connection header
- **WHEN** 建立 SSE 连接
- **THEN** 响应 SHALL 包含 Connection: keep-alive

#### Scenario: Disable buffering header
- **WHEN** 建立 SSE 连接
- **THEN** 响应 SHALL 包含 X-Accel-Buffering: no（禁用 Nginx 缓冲）

#### Scenario: Keepalive comment
- **WHEN** SSE 连接建立
- **THEN** 系统 SHALL 立即写入 ":ok\n\n" 作为心跳注释，确保连接活跃

### Requirement: Frontend EventSource integration
前端 SHALL 直接使用 EventSource API 连接，无需 POST 预请求。

#### Scenario: Remove axios POST call
- **WHEN** 前端发送消息
- **THEN** chatApi.streamMessage() SHALL 直接创建 EventSource，移除 await client.post() 调用

#### Scenario: Immediate return to caller
- **WHEN** chatApi.streamMessage() 被调用
- **THEN** 函数 SHALL 在注册事件监听器后立即返回 cleanup 函数（非阻塞）

#### Scenario: Event handlers registration
- **WHEN** EventSource 创建后
- **THEN** 系统 SHALL 立即注册所有事件监听器（message_start, text_delta, tool_start, 等）

#### Scenario: Error handling
- **WHEN** SSE 连接失败（网络错误、404等）
- **THEN** EventSource onerror 回调 SHALL 触发，调用 handlers.onError()

### Requirement: Query parameter encoding
系统 SHALL 正确处理 URL 查询参数的编码和解码。

#### Scenario: Frontend URL encoding
- **WHEN** 前端构造 SSE URL
- **THEN** content 参数 SHALL 使用 encodeURIComponent() 编码，保留特殊字符

#### Scenario: Backend URL decoding
- **WHEN** 后端接收 GET 请求
- **THEN** Express SHALL 自动解码 req.query.content，无需手动 decodeURIComponent()

#### Scenario: Preserve line breaks and special chars
- **WHEN** 消息内容包含换行符、引号、特殊字符
- **THEN** 编码和解码后 SHALL 保持内容完全一致

### Requirement: Backward compatibility removal
系统 SHALL 完全移除旧的两步流式模式端点和相关代码。

#### Scenario: Remove POST stream endpoint
- **WHEN** 部署新架构后
- **THEN** POST /api/chat/sessions/:id/stream 端点 SHALL 被移除

#### Scenario: Remove GET SSE endpoint
- **WHEN** 部署新架构后
- **THEN** GET /api/chat/sse/:streamId 端点 SHALL 被移除

#### Scenario: Remove StreamManager
- **WHEN** 新架构部署后
- **THEN** backend/src/services/streamManager.ts 文件 SHALL 被删除

#### Scenario: Remove streamManager imports
- **WHEN** StreamManager 被移除后
- **THEN** 所有引用 streamManager 的文件 SHALL 移除相关 import 和调用

### Requirement: Session ID management
系统 SHALL 支持新会话创建和已有会话继续的灵活机制。

#### Scenario: Continue existing session
- **WHEN** sessionId 参数为已存在的会话 ID
- **THEN** 系统 SHALL 追加消息到该会话的历史记录

#### Scenario: Create new session
- **WHEN** sessionId 参数为 "new"
- **THEN** 系统 SHALL 创建新会话并在 message_start 事件中返回新 sessionId

#### Scenario: Session validation
- **WHEN** sessionId 参数为无效的 UUID
- **THEN** 系统 SHALL 发送 error_occurred 事件，code 为 SESSION_NOT_FOUND

