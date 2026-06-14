# API 设计原则

> **TL;DR**: RESTful 风格。使用复数名词（/products）、HTTP 动词（GET/POST/PUT/DELETE）。统一响应格式。错误返回 {status, error, message}。分页用 page/limit。版本化用 URL 路径（/v1/）。幂等性设计。

---

## RESTful 设计原则

### 资源命名

#### 使用名词（不是动词）

```
✅ 正确
GET    /api/products           # 获取产品列表
POST   /api/products           # 创建产品
GET    /api/products/:id       # 获取单个产品
PUT    /api/products/:id       # 更新产品
DELETE /api/products/:id       # 删除产品

❌ 错误
GET    /api/getProducts        # 动词
POST   /api/createProduct      # 动词
GET    /api/product/:id        # 单数
```

#### 使用复数形式

```
✅ /api/products
✅ /api/alerts
✅ /api/users

❌ /api/product
❌ /api/alert
❌ /api/user
```

#### 嵌套资源

```
✅ 正确
GET /api/products/:id/snapshots       # 产品的价格快照
GET /api/alerts/rules/:id             # 特定警报规则
GET /api/chat/sessions/:id/messages   # 会话的消息

❌ 过深嵌套（避免超过 2 层）
GET /api/products/:id/snapshots/:snapshotId/details/:detailId
```

---

## HTTP 方法

### 标准方法

| 方法 | 用途 | 幂等性 | 安全性 | 示例 |
|------|------|--------|--------|------|
| **GET** | 获取资源 | ✅ 是 | ✅ 是 | `GET /api/products` |
| **POST** | 创建资源 | ❌ 否 | ❌ 否 | `POST /api/products` |
| **PUT** | 完整替换资源 | ✅ 是 | ❌ 否 | `PUT /api/products/:id` |
| **PATCH** | 部分更新资源 | ❌ 否 | ❌ 否 | `PATCH /api/products/:id` |
| **DELETE** | 删除资源 | ✅ 是 | ❌ 否 | `DELETE /api/products/:id` |

### 方法选择

```typescript
// ✅ GET - 获取资源（不修改）
GET /api/products?platform=amazon

// ✅ POST - 创建新资源
POST /api/products
Body: { platform: "amazon", asin: "B08N5W", ... }

// ✅ PUT - 完整替换（需要所有字段）
PUT /api/products/:id
Body: { platform: "amazon", asin: "B08N5W", title: "...", price: 99.99, ... }

// ✅ PATCH - 部分更新（只需要修改的字段）
PATCH /api/products/:id
Body: { price: 89.99 }

// ✅ DELETE - 删除资源
DELETE /api/products/:id
```

---

## 响应格式

### 成功响应

#### 单个资源

```json
// GET /api/products/:id
{
  "id": "123",
  "platform": "amazon",
  "title": "Product Title",
  "price": 99.99,
  "createdAt": 1234567890
}
```

#### 资源列表（带分页）

```json
// GET /api/products?page=1&limit=20
{
  "items": [
    { "id": "1", "title": "Product 1" },
    { "id": "2", "title": "Product 2" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### 创建成功

```json
// POST /api/products
// Status: 201 Created
// Location: /api/products/123
{
  "id": "123",
  "platform": "amazon",
  "title": "New Product",
  "createdAt": 1234567890
}
```

#### 更新成功

```json
// PUT /api/products/:id
// Status: 200 OK
{
  "id": "123",
  "platform": "amazon",
  "title": "Updated Product",
  "updatedAt": 1234567890
}
```

#### 删除成功

```
// DELETE /api/products/:id
// Status: 204 No Content
（无响应体）
```

### 错误响应

统一格式：

```json
{
  "status": 400,
  "error": "ValidationError",
  "message": "Invalid request data",
  "details": {
    "field": "price",
    "value": -10,
    "constraint": "Price must be positive"
  }
}
```

详见 [错误码定义](../api/error-codes.md)

---

## HTTP 状态码

### 成功响应（2xx）

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| **200 OK** | 成功 | GET、PUT、PATCH 成功 |
| **201 Created** | 已创建 | POST 创建成功 |
| **204 No Content** | 无内容 | DELETE 成功 |

### 客户端错误（4xx）

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| **400 Bad Request** | 请求错误 | 验证失败、格式错误 |
| **401 Unauthorized** | 未认证 | 缺少或无效的认证信息 |
| **403 Forbidden** | 无权限 | 认证成功但无权限 |
| **404 Not Found** | 不存在 | 资源不存在 |
| **409 Conflict** | 冲突 | 资源已存在、状态冲突 |
| **422 Unprocessable Entity** | 无法处理 | 业务逻辑验证失败 |
| **429 Too Many Requests** | 限流 | 请求过于频繁 |

### 服务器错误（5xx）

| 状态码 | 说明 | 使用场景 |
|--------|------|---------|
| **500 Internal Server Error** | 服务器错误 | 未预期的错误 |
| **502 Bad Gateway** | 网关错误 | 上游服务错误 |
| **503 Service Unavailable** | 服务不可用 | 维护、过载 |

---

## 查询参数

### 分页

```
GET /api/products?page=2&limit=20

Response:
{
  "items": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 过滤

```
GET /api/products?platform=amazon&minPrice=50&maxPrice=100
GET /api/products?isMonitoring=true
```

### 排序

```
GET /api/products?sort=price&order=asc
GET /api/products?sort=-createdAt  # - 表示降序
```

### 字段选择

```
GET /api/products?fields=id,title,price
```

### 搜索

```
GET /api/products?search=wireless+headphones
GET /api/products?q=laptop
```

---

## 幂等性设计

### 幂等方法

| 方法 | 幂等性 | 说明 |
|------|--------|------|
| GET | ✅ 是 | 多次调用结果相同 |
| PUT | ✅ 是 | 多次调用最终状态相同 |
| DELETE | ✅ 是 | 删除后再删除仍返回成功 |
| POST | ❌ 否 | 每次调用创建新资源 |
| PATCH | ❌ 否 | 可能导致不同结果 |

### 实现幂等 POST

使用幂等键：

```typescript
// 客户端发送
POST /api/products
Headers: 
  Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Body: { ... }

// 服务端实现
async function createProduct(req: Request) {
  const idempotencyKey = req.headers['idempotency-key'];
  
  // 检查是否已处理
  const existing = await findByIdempotencyKey(idempotencyKey);
  if (existing) {
    return res.status(200).json(existing); // 返回已有结果
  }
  
  // 创建新资源
  const product = await productService.create(req.body);
  await saveIdempotencyKey(idempotencyKey, product);
  
  return res.status(201).json(product);
}
```

---

## 版本化

### URL 路径版本（推荐）

```
/api/v1/products
/api/v2/products
```

优点：
- 清晰明确
- 易于路由
- 便于文档化

### Header 版本

```
GET /api/products
Headers:
  API-Version: 2
```

### 版本策略

```typescript
// 保持向后兼容
// v1
{
  "price": 99.99
}

// v2 - 添加新字段（兼容）
{
  "price": 99.99,
  "currency": "USD"
}

// v3 - 破坏性变更（新版本）
{
  "priceInCents": 9999,
  "currency": "USD"
}
```

---

## 最佳实践

### 1. 使用 HTTPS

```
✅ https://api.example.com/products
❌ http://api.example.com/products
```

### 2. 返回有用的错误消息

```typescript
// ❌ 差
{ "error": "Error" }

// ✅ 好
{
  "status": 400,
  "error": "ValidationError",
  "message": "Price must be a positive number",
  "details": {
    "field": "price",
    "value": -10
  }
}
```

### 3. 使用标准时间格式

```typescript
// ✅ Unix timestamp（毫秒）
"createdAt": 1234567890

// ✅ ISO 8601
"createdAt": "2024-06-14T13:45:30.000Z"
```

### 4. 包含相关资源链接

```json
{
  "id": "123",
  "title": "Product",
  "links": {
    "self": "/api/products/123",
    "snapshots": "/api/products/123/snapshots",
    "alerts": "/api/alerts/rules?productId=123"
  }
}
```

### 5. 支持条件请求

```typescript
// ETag
GET /api/products/123
Response:
  ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"

// 后续请求
GET /api/products/123
Headers:
  If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Response: 304 Not Modified
```

### 6. 限流和配额

```
Headers:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1234567890
```

---

## 安全考虑

### 1. 输入验证

所有输入必须验证（使用 Zod）：

```typescript
const CreateProductSchema = z.object({
  platform: z.enum(['amazon', 'walmart']),
  price: z.number().positive(),
});
```

### 2. 输出过滤

不返回敏感信息：

```typescript
// ❌ 不要返回敏感字段
{
  "id": "123",
  "email": "user@example.com",
  "password": "$2b$10$..." // 危险
}

// ✅ 过滤敏感字段
{
  "id": "123",
  "email": "user@example.com"
}
```

### 3. Rate Limiting

防止滥用：

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 最多 100 个请求
});

app.use('/api/', limiter);
```

---

## 参考资源

- [RESTful API 文档](../api/rest-api.md)
- [错误码定义](../api/error-codes.md)
- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines)
- [Google API Design Guide](https://cloud.google.com/apis/design)

