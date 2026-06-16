# RESTful API 文档

> **TL;DR**: Base URL: http://localhost:3001/api。所有响应 JSON 格式。错误返回统一格式 {status, error, message}。当前无需认证。

## Base URL

```
http://localhost:3001/api
```

## 产品管理

### 获取所有产品

```http
GET /products
```

**响应**:
```json
[
  {
    "id": "uuid",
    "platform": "amazon",
    "asin": "B08N5WRWNW",
    "title": "Product Title",
    "price": 99.99,
    "currency": "USD",
    "isMonitoring": true,
    "createdAt": 1234567890
  }
]
```

### 创建产品

```http
POST /products
Content-Type: application/json

{
  "platform": "amazon",
  "productUrl": "https://amazon.com/...",
  "asin": "B08N5WRWNW",
  "title": "Product Title",
  "price": 99.99,
  "currency": "USD"
}
```

## 警报管理

### 获取警报规则

```http
GET /alerts/rules
```

### 创建警报规则

```http
POST /alerts/rules
Content-Type: application/json

{
  "productId": "uuid",
  "type": "price_threshold",
  "threshold": 80,
  "priority": "high"
}
```

## 聊天

### 创建聊天会话

```http
POST /chat/sessions
Content-Type: application/json

{
  "title": "Price Analysis",
  "userId": "optional-user-id"
}
```

**响应**:
```json
{
  "id": "uuid",
  "title": "Price Analysis",
  "userId": null,
  "createdAt": 1234567890
}
```

### 获取所有会话

```http
GET /chat/sessions?page=1&limit=20
```

**响应**:
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Price Analysis",
      "userId": null,
      "messageCount": 5,
      "createdAt": 1234567890,
      "updatedAt": 1234567900
    }
  ],
  "page": 1,
  "limit": 20
}
```

### 获取会话详情

```http
GET /chat/sessions/:id
```

**响应**:
```json
{
  "id": "uuid",
  "title": "Price Analysis",
  "userId": null,
  "contextSummary": null,
  "messageCount": 5,
  "createdAt": 1234567890,
  "updatedAt": 1234567900
}
```

### 更新会话

```http
PATCH /chat/sessions/:id
Content-Type: application/json

{
  "title": "New Title"
}
```

### 删除会话

```http
DELETE /chat/sessions/:id
```

**响应**: 204 No Content

### 获取会话消息

```http
GET /chat/sessions/:id/messages?limit=100
```

**响应**:
```json
{
  "messages": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "role": "user" | "assistant",
      "content": "消息内容",
      "toolCalls": [...],
      "toolResults": [...],
      "tokensUsed": 123,
      "timestamp": 1234567890
    }
  ]
}
```

### 发送消息（非流式）

```http
POST /chat/sessions/:id/messages
Content-Type: application/json

{
  "content": "What's the price trend?",
  "stream": false
}
```

**响应**:
```json
{
  "id": "uuid",
  "sessionId": "uuid",
  "role": "assistant",
  "content": "完整的回复内容...",
  "toolCalls": [...],
  "toolResults": [...],
  "tokensUsed": 123,
  "timestamp": 1234567890
}
```

### 流式聊天（SSE v2.0）

#### 步骤 1: 创建流式会话

```http
POST /chat/stream
Content-Type: application/json

{
  "sessionId": "uuid",  // 可选：不提供则自动创建新会话
  "content": "What's the price trend?"
}
```

**响应** (202 Accepted):
```json
{
  "streamId": "stream-abc123",
  "messageId": "msg-def456",
  "sessionId": "uuid"  // 可能是新创建的
}
```

#### 步骤 2: 建立 SSE 连接

```http
GET /chat/streams/:streamId
Accept: text/event-stream
```

**响应头**:
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**SSE 事件流**:
```
: heartbeat

event: message
data: {"type":"message_start","messageId":"msg-def456",...}

event: message
data: {"type":"status_change","status":"thinking",...}

event: message
data: {"type":"content_delta","delta":"根据...",...}

: heartbeat

event: message
data: {"type":"message_complete","messageId":"msg-def456",...}
```

详细事件类型和格式请参考 [SSE 流式协议文档](./sse-streaming.md)。

### SSE 流式响应

```http
GET /chat/sessions/:id/stream?content=用户消息&t=时间戳
```

**重要**: 使用 EventSource 连接此端点进行流式对话。

详见 [SSE 流式 API](./sse-streaming.md)

### 删除消息

```http
DELETE /chat/sessions/:id/messages/:messageId
```

**响应**: 204 No Content

### 重新生成消息

```http
POST /chat/sessions/:id/messages/:messageId/regenerate
```

**响应**:
```json
{
  "stream_url": "/api/chat/sessions/:id/stream?content=...",
  "user_message_content": "原始用户消息"
}
```

客户端应使用返回的 `stream_url` 建立新的 SSE 连接。

## 错误响应

详见 [错误码定义](./error-codes.md)
