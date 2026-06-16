# Chat UI Redesign API Documentation

## 概述

本文档定义Chat UI重构所需的所有后端API接口，包括会话管理扩展和新增的任务管理API。

## 基础信息

- **Base URL**: `/api`
- **认证方式**: Bearer Token（可选，根据现有系统）
- **Content-Type**: `application/json`
- **响应格式**: JSON

## API端点总览

### 会话管理API（扩展现有）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /chat/sessions | 获取会话列表（已有，保持不变） |
| POST | /chat/sessions | 创建新会话（已有，保持不变） |
| GET | /chat/sessions/:id/messages | 获取会话消息（已有，保持不变） |
| PATCH | /chat/sessions/:id | **新增** 更新会话属性（置顶、标签） |
| POST | /chat/send | SSE流式发送消息（已有，保持不变） |

### 任务管理API（新增）

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /tasks/:sessionId | 获取会话任务列表 |
| POST | /tasks | 创建新任务 |
| PATCH | /tasks/:id | 更新任务状态 |

---

## 详细API规范

### 1. 会话管理API扩展

#### 1.1 更新会话属性

更新会话的置顶状态、标签、标题等属性。

**请求**

```http
PATCH /api/chat/sessions/:id
Content-Type: application/json
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 会话ID |

**请求体**

```json
{
  "isPinned": true,
  "title": "广告ASIN监控系统优化方案",
  "tags": ["重要", "待办"],
  "lastMessagePreview": "已完成产品搜索，找到1个相关产品"
}
```

**请求体Schema**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| isPinned | boolean | 否 | 是否置顶 |
| title | string | 否 | 会话标题，最大200字符 |
| tags | string[] | 否 | 标签数组，最多10个 |
| lastMessagePreview | string | 否 | 最后消息预览，最大100字符 |

**成功响应 (200 OK)**

```json
{
  "id": "sess_abc123",
  "title": "广告ASIN监控系统优化方案",
  "userId": "user_123",
  "isPinned": true,
  "tags": ["重要", "待办"],
  "lastMessagePreview": "已完成产品搜索，找到1个相关产品",
  "messageCount": 15,
  "createdAt": 1704067200000,
  "updatedAt": 1704153600000
}
```

**错误响应**

- **400 Bad Request**: 请求参数验证失败
  ```json
  {
    "error": {
      "message": "Validation failed",
      "code": "VALIDATION_ERROR",
      "details": {
        "title": "Title must be less than 200 characters"
      }
    }
  }
  ```

- **404 Not Found**: 会话不存在
  ```json
  {
    "error": {
      "message": "Session not found",
      "code": "SESSION_NOT_FOUND"
    }
  }
  ```

- **403 Forbidden**: 无权限访问该会话
  ```json
  {
    "error": {
      "message": "Forbidden",
      "code": "FORBIDDEN"
    }
  }
  ```

---

### 2. 任务管理API

#### 2.1 获取会话任务列表

获取指定会话的所有任务，按创建时间降序排列。

**请求**

```http
GET /api/tasks/:sessionId?limit=10&offset=0&status=in_progress
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| sessionId | string | 是 | 会话ID |

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 描述 |
|------|------|------|--------|------|
| limit | number | 否 | 50 | 返回数量限制，最大100 |
| offset | number | 否 | 0 | 偏移量，用于分页 |
| status | string | 否 | - | 过滤状态: pending/in_progress/completed/failed/cancelled |

**成功响应 (200 OK)**

```json
{
  "tasks": [
    {
      "id": "task_xyz789",
      "sessionId": "sess_abc123",
      "taskName": "分析销售趋势",
      "status": "in_progress",
      "startTime": 1704067200000,
      "endTime": null,
      "relatedProducts": ["B0D1234567", "B0D7654321"],
      "platform": "amazon",
      "metadata": {
        "progress": 65,
        "currentStep": "数据收集"
      },
      "createdAt": 1704067200000,
      "updatedAt": 1704067800000
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**响应Schema**

| 字段 | 类型 | 描述 |
|------|------|------|
| tasks | Task[] | 任务数组 |
| total | number | 总任务数 |
| limit | number | 当前限制数 |
| offset | number | 当前偏移量 |

**Task对象**

| 字段 | 类型 | 描述 |
|------|------|------|
| id | string | 任务ID |
| sessionId | string | 所属会话ID |
| taskName | string | 任务名称 |
| status | TaskStatus | 任务状态 |
| startTime | number | 开始时间戳（毫秒） |
| endTime | number \| null | 结束时间戳（毫秒），进行中时为null |
| relatedProducts | string[] | 关联产品ASIN列表 |
| platform | string | 平台标识：amazon/shopify/ebay |
| metadata | object | 扩展元数据（JSON） |
| createdAt | number | 创建时间戳 |
| updatedAt | number | 更新时间戳 |

**TaskStatus枚举**

- `pending`: 等待执行
- `in_progress`: 执行中
- `completed`: 已完成
- `failed`: 失败
- `cancelled`: 已取消

**错误响应**

- **404 Not Found**: 会话不存在
  ```json
  {
    "error": {
      "message": "Session not found",
      "code": "SESSION_NOT_FOUND"
    }
  }
  ```

- **403 Forbidden**: 无权限访问
  ```json
  {
    "error": {
      "message": "Forbidden",
      "code": "FORBIDDEN"
    }
  }
  ```

---

#### 2.2 创建新任务

创建一个新的任务记录。

**请求**

```http
POST /api/tasks
Content-Type: application/json
Authorization: Bearer {token}
```

**请求体**

```json
{
  "sessionId": "sess_abc123",
  "taskName": "分析销售趋势",
  "status": "pending",
  "relatedProducts": ["B0D1234567"],
  "platform": "amazon",
  "metadata": {
    "source": "user_request",
    "priority": "high"
  }
}
```

**请求体Schema**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| sessionId | string | 是 | 会话ID |
| taskName | string | 是 | 任务名称，最大200字符 |
| status | TaskStatus | 否 | 初始状态，默认pending |
| startTime | number | 否 | 开始时间，默认当前时间 |
| relatedProducts | string[] | 否 | 关联产品ASIN |
| platform | string | 否 | 平台标识 |
| metadata | object | 否 | 扩展元数据 |

**成功响应 (201 Created)**

```json
{
  "id": "task_xyz789",
  "sessionId": "sess_abc123",
  "taskName": "分析销售趋势",
  "status": "pending",
  "startTime": 1704067200000,
  "endTime": null,
  "relatedProducts": ["B0D1234567"],
  "platform": "amazon",
  "metadata": {
    "source": "user_request",
    "priority": "high"
  },
  "createdAt": 1704067200000,
  "updatedAt": 1704067200000
}
```

**错误响应**

- **400 Bad Request**: 请求参数验证失败
  ```json
  {
    "error": {
      "message": "Validation failed",
      "code": "VALIDATION_ERROR",
      "details": {
        "sessionId": "Session ID is required",
        "taskName": "Task name cannot be empty"
      }
    }
  }
  ```

- **404 Not Found**: 会话不存在
  ```json
  {
    "error": {
      "message": "Session not found",
      "code": "SESSION_NOT_FOUND"
    }
  }
  ```

---

#### 2.3 更新任务状态

更新任务的状态、进度等信息。

**请求**

```http
PATCH /api/tasks/:id
Content-Type: application/json
Authorization: Bearer {token}
```

**路径参数**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 任务ID |

**请求体**

```json
{
  "status": "completed",
  "endTime": 1704070800000,
  "metadata": {
    "progress": 100,
    "currentStep": "完成",
    "result": "分析完成，发现3个关键趋势"
  }
}
```

**请求体Schema**

| 字段 | 类型 | 必填 | 描述 |
|------|------|------|------|
| status | TaskStatus | 否 | 更新后的状态 |
| endTime | number | 否 | 结束时间戳，状态为completed/failed时自动设置 |
| taskName | string | 否 | 任务名称 |
| relatedProducts | string[] | 否 | 关联产品 |
| platform | string | 否 | 平台标识 |
| metadata | object | 否 | 扩展元数据（合并更新） |

**成功响应 (200 OK)**

```json
{
  "id": "task_xyz789",
  "sessionId": "sess_abc123",
  "taskName": "分析销售趋势",
  "status": "completed",
  "startTime": 1704067200000,
  "endTime": 1704070800000,
  "relatedProducts": ["B0D1234567"],
  "platform": "amazon",
  "metadata": {
    "progress": 100,
    "currentStep": "完成",
    "result": "分析完成，发现3个关键趋势"
  },
  "createdAt": 1704067200000,
  "updatedAt": 1704070800000
}
```

**错误响应**

- **400 Bad Request**: 非法状态转换
  ```json
  {
    "error": {
      "message": "Invalid status value",
      "code": "INVALID_STATUS",
      "details": {
        "status": "Status must be one of: pending, in_progress, completed, failed, cancelled"
      }
    }
  }
  ```

- **404 Not Found**: 任务不存在
  ```json
  {
    "error": {
      "message": "Task not found",
      "code": "TASK_NOT_FOUND"
    }
  }
  ```

---

## SSE事件扩展

为支持任务面板的实时更新，需要在SSE协议中新增以下事件类型：

### task_created

任务创建事件

```json
{
  "type": "task_created",
  "data": {
    "taskId": "task_xyz789",
    "sessionId": "sess_abc123",
    "taskName": "分析销售趋势",
    "status": "pending",
    "startTime": 1704067200000
  }
}
```

### task_update

任务状态更新事件

```json
{
  "type": "task_update",
  "data": {
    "taskId": "task_xyz789",
    "status": "in_progress",
    "metadata": {
      "progress": 45,
      "currentStep": "数据分析中"
    }
  }
}
```

### task_progress

任务进度更新事件（可选，高频事件）

```json
{
  "type": "task_progress",
  "data": {
    "taskId": "task_xyz789",
    "progress": 65
  }
}
```

### tool_execution_detail

工具执行详情事件（用于右侧面板同步）

```json
{
  "type": "tool_execution_detail",
  "data": {
    "toolCallId": "call_123",
    "status": "success",
    "durationMs": 2345,
    "inputSummary": "搜索ASIN: B0D1234567",
    "outputSummary": "找到1个相关产品"
  }
}
```

---

## 数据库Schema变更

### chat_sessions表扩展

```sql
ALTER TABLE chat_sessions ADD COLUMN is_pinned INTEGER DEFAULT 0;
ALTER TABLE chat_sessions ADD COLUMN tags TEXT; -- JSON array
ALTER TABLE chat_sessions ADD COLUMN last_message_preview TEXT;
ALTER TABLE chat_sessions ADD COLUMN unread_count INTEGER DEFAULT 0;

CREATE INDEX idx_sessions_pinned_updated ON chat_sessions(is_pinned DESC, updated_at DESC);
```

### task_overviews表（新建）

```sql
CREATE TABLE task_overviews (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  start_time INTEGER NOT NULL,
  end_time INTEGER,
  related_products TEXT, -- JSON array
  platform TEXT,
  metadata TEXT, -- JSON
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);

CREATE INDEX idx_tasks_session ON task_overviews(session_id, created_at DESC);
CREATE INDEX idx_tasks_status ON task_overviews(status, created_at DESC);
```

### chat_messages表扩展（可选）

```sql
ALTER TABLE chat_messages ADD COLUMN task_summary TEXT; -- JSON
ALTER TABLE chat_messages ADD COLUMN tool_execution_details TEXT; -- JSON
```

---

## Zod Schema定义

### UpdateSessionRequest

```typescript
import { z } from 'zod';

export const UpdateSessionRequestSchema = z.object({
  isPinned: z.boolean().optional(),
  title: z.string().max(200).optional(),
  tags: z.array(z.string()).max(10).optional(),
  lastMessagePreview: z.string().max(100).optional(),
});

export type UpdateSessionRequest = z.infer<typeof UpdateSessionRequestSchema>;
```

### CreateTaskRequest

```typescript
import { z } from 'zod';

const TaskStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);

export const CreateTaskRequestSchema = z.object({
  sessionId: z.string().min(1),
  taskName: z.string().min(1).max(200),
  status: TaskStatusSchema.optional().default('pending'),
  startTime: z.number().int().positive().optional(),
  relatedProducts: z.array(z.string()).optional(),
  platform: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
```

### UpdateTaskRequest

```typescript
export const UpdateTaskRequestSchema = z.object({
  status: TaskStatusSchema.optional(),
  endTime: z.number().int().positive().optional(),
  taskName: z.string().min(1).max(200).optional(),
  relatedProducts: z.array(z.string()).optional(),
  platform: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateTaskRequest = z.infer<typeof UpdateTaskRequestSchema>;
```

### TaskResponse

```typescript
export const TaskResponseSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  taskName: z.string(),
  status: TaskStatusSchema,
  startTime: z.number().int(),
  endTime: z.number().int().nullable(),
  relatedProducts: z.array(z.string()).optional(),
  platform: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export type TaskResponse = z.infer<typeof TaskResponseSchema>;
```

---

## 错误码参考

| 错误码 | HTTP状态码 | 描述 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| SESSION_NOT_FOUND | 404 | 会话不存在 |
| TASK_NOT_FOUND | 404 | 任务不存在 |
| FORBIDDEN | 403 | 无权限访问资源 |
| UNAUTHORIZED | 401 | 未认证 |
| INVALID_STATUS | 400 | 非法的状态值 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 测试用例示例

### 会话置顶场景

```typescript
describe('PATCH /api/chat/sessions/:id', () => {
  it('should pin a session successfully', async () => {
    const response = await request(app)
      .patch('/api/chat/sessions/sess_123')
      .send({ isPinned: true })
      .expect(200);

    expect(response.body.isPinned).toBe(true);
  });

  it('should return 404 for non-existent session', async () => {
    const response = await request(app)
      .patch('/api/chat/sessions/invalid_id')
      .send({ isPinned: true })
      .expect(404);

    expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
  });
});
```

### 任务创建场景

```typescript
describe('POST /api/tasks', () => {
  it('should create a new task', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({
        sessionId: 'sess_123',
        taskName: '分析销售趋势',
        platform: 'amazon',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.taskName).toBe('分析销售趋势');
    expect(response.body.status).toBe('pending');
  });

  it('should validate required fields', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({})
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

---

## 性能考虑

### 缓存策略

- **会话列表**: Redis缓存60秒，key: `sessions:user:{userId}`
- **任务列表**: Redis缓存30秒，key: `tasks:session:{sessionId}`

### 索引优化

确保以下查询使用索引：
- 会话列表按置顶+更新时间排序：`idx_sessions_pinned_updated`
- 任务列表按会话ID+创建时间排序：`idx_tasks_session`
- 任务按状态过滤：`idx_tasks_status`

### 分页建议

- 会话列表：默认50条，最大100条
- 任务列表：默认50条，最大100条
- 消息列表：保持现有分页策略

---

## 版本兼容性

### 向后兼容保证

1. **现有API保持不变**: GET /chat/sessions, POST /chat/sessions, GET /chat/sessions/:id/messages 不做任何修改
2. **新增字段可选**: isPinned, tags等新字段默认为null，旧客户端可忽略
3. **SSE事件向后兼容**: 新增的task_*事件类型，旧客户端会忽略未知事件

### 迁移策略

1. 数据库迁移脚本提供回滚功能
2. API端点逐步上线，新旧版本共存期间保持兼容
3. 前端通过feature flag控制新功能显示

---

## 安全考虑

### 权限验证

- 所有API需验证用户身份
- 用户只能访问自己的会话和任务
- 会话和任务的级联删除需事务保护

### 输入验证

- 使用Zod Schema严格验证所有输入
- 字符串长度限制防止溢出
- JSON字段验证防止注入

### 速率限制

- 创建任务: 10次/分钟/用户
- 更新任务: 30次/分钟/用户
- 查询任务: 60次/分钟/用户
