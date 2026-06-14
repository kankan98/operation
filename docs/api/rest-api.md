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
  "title": "Price Analysis"
}
```

### 流式聊天

```http
POST /chat/sessions/:id/stream
Content-Type: application/json

{
  "content": "What's the price trend?"
}
```

参见 [SSE 流式 API](./sse-streaming.md)

## 错误响应

详见 [错误码定义](./error-codes.md)
