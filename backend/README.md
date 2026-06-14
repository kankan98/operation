# E-commerce Price Monitor Backend

电商价格监控系统后端服务 - 提供产品管理、价格跟踪和报警功能。

## 功能特性

- 📦 产品管理 - 添加、查询、更新和删除电商产品
- 💰 价格监控 - 跟踪产品价格变化
- 🔔 智能报警 - 价格变动、库存和排名变化提醒
- 🤖 AI 对话助手 - 基于 Claude 的智能问答和数据分析
- 🗄️ SQLite 数据库 - 轻量级本地存储
- 📊 RESTful API - 标准化接口设计
- ✅ 完整测试 - 单元测试和集成测试覆盖

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **数据库**: SQLite + Drizzle ORM
- **语言**: TypeScript
- **日志**: Pino
- **测试**: Vitest + Supertest
- **开发工具**: tsx (TypeScript 执行器)

## 快速开始

### 前置要求

- Node.js >= 18
- npm >= 9

### 安装

```bash
# 安装依赖
npm install

# 复制环境配置
cp .env.example .env

# 运行数据库迁移
npm run db:migrate
```

### 开发

```bash
# 启动开发服务器（热重载）
npm run dev

# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 生成数据库迁移
npm run db:generate

# 执行数据库迁移
npm run db:migrate
```

### 生产构建

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 项目结构

```
backend/
├── src/
│   ├── config/         # 配置管理
│   ├── db/             # 数据库配置和 schema
│   ├── middleware/     # Express 中间件
│   ├── routes/         # API 路由
│   ├── services/       # 业务逻辑层
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── app.ts          # Express 应用配置
│   └── index.ts        # 应用入口
├── tests/              # 测试文件
├── data/               # SQLite 数据库文件
├── drizzle/            # 数据库迁移文件
└── drizzle.config.ts   # Drizzle ORM 配置
```

## API 文档

### 产品相关

#### 创建产品
```http
POST /api/products
Content-Type: application/json

{
  "platform": "amazon",
  "productUrl": "https://amazon.com/dp/B08N5WRWNW",
  "asin": "B08N5WRWNW",
  "title": "Product Name",
  "currency": "USD",
  "isMonitoring": true,
  "checkInterval": 24
}
```

#### 查询产品列表
```http
GET /api/products?platform=amazon&monitoring=true&page=1&limit=20
```

#### 获取产品详情
```http
GET /api/products/:id
```

#### 更新产品
```http
PATCH /api/products/:id
Content-Type: application/json

{
  "title": "Updated Name",
  "currentPrice": 99.99
}
```

#### 删除产品
```http
DELETE /api/products/:id
```

### 报警相关

#### 创建报警
```http
POST /api/alerts
Content-Type: application/json

{
  "productId": "uuid",
  "alertType": "price_drop",
  "severity": "warning",
  "title": "Price dropped by 20%"
}
```

#### 查询报警列表
```http
GET /api/alerts?productId=uuid&severity=critical&unreadOnly=true
```

#### 获取报警详情
```http
GET /api/alerts/:id
```

#### 标记报警为已读
```http
PATCH /api/alerts/:id/read
```

#### 标记报警为已归档
```http
PATCH /api/alerts/:id/archive
```

#### 删除报警
```http
DELETE /api/alerts/:id
```

### 健康检查
```http
GET /health
```

### Chat API (AI 对话助手)

#### 创建会话
```http
POST /api/chat/sessions
Content-Type: application/json

{
  "title": "Product Analysis Session"  // 可选，会自动生成
}
```

#### 获取会话列表
```http
GET /api/chat/sessions?page=1&limit=20
```

#### 获取会话详情
```http
GET /api/chat/sessions/:id
```

#### 更新会话标题
```http
PATCH /api/chat/sessions/:id
Content-Type: application/json

{
  "title": "Updated Session Title"
}
```

#### 删除会话
```http
DELETE /api/chat/sessions/:id
```

#### 获取会话消息历史
```http
GET /api/chat/sessions/:id/messages?page=1&limit=50
```

#### 发送消息（流式响应）
```http
POST /api/chat/sessions/:id/stream
Content-Type: application/json

{
  "message": "Show me all Amazon products under $100"
}
```

**响应格式（Server-Sent Events）**:
```
data: {"type":"message_start","message_id":"msg_123","timestamp":1234567890}

data: {"type":"status","status":"thinking"}

data: {"type":"text_delta","text":"让我"}

data: {"type":"text_delta","text":"帮您"}

data: {"type":"status","status":"tool_calling"}

data: {"type":"tool_call_start","tool_call":{"id":"call_1","name":"searchProducts"}}

data: {"type":"tool_call_end","tool_call":{"id":"call_1","name":"searchProducts","input":{"platform":"amazon","maxPrice":100}}}

data: {"type":"tool_result","tool_result":{"toolCallId":"call_1","output":[...],"isError":false}}

data: {"type":"status","status":"writing"}

data: {"type":"text_delta","text":"找到了"}

data: {"type":"usage","usage":{"input_tokens":150,"output_tokens":80}}

data: {"type":"message_done","message_id":"msg_123"}
```

**SSE 事件类型**:
- `message_start` - 消息开始（包含 message_id 和 timestamp）
- `status` - Agent 状态变化（thinking/tool_calling/writing）
- `text_delta` - 文本增量更新
- `tool_call_start` - 工具调用开始（包含工具 ID 和名称）
- `tool_call_end` - 工具调用完成（包含完整参数）
- `tool_result` - 工具执行结果
- `usage` - Token 使用统计
- `message_done` - 消息完成
- `error` - 错误信息

#### 删除消息
```http
DELETE /api/chat/sessions/:id/messages/:messageId
```

#### 重新生成回复
```http
POST /api/chat/sessions/:id/messages/:messageId/regenerate
```

**响应**:
```json
{
  "stream_url": "/api/chat/sessions/:id/stream?content=..."
}
```

前端需要使用返回的 `stream_url` 重新建立 SSE 连接来接收新的流式响应。

**AI Agent 可用工具**:
- `searchProducts` - 搜索产品（支持关键词、平台、价格范围筛选）
- `getProductDetails` - 获取产品详情（含价格历史）
- `analyzePriceTrend` - 分析价格趋势（最高/最低/平均价格）
- `createAlert` - 创建价格警报规则
- `getAlertsList` - 获取警报列表
- `addProductMonitoring` - 添加产品监控
- `getCompetitorAnalysis` - 获取竞品分析
- `getMarketInsights` - 获取市场洞察
- `queryDatabase` - 执行安全的数据库查询
- `generateReport` - 生成每日或产品报告

## 环境变量

查看 `.env.example` 了解所有可配置项：

- `NODE_ENV` - 运行环境 (development/production)
- `PORT` - 服务器端口 (默认: 3001)
- `DATABASE_PATH` - SQLite 数据库文件路径
- `LOG_LEVEL` - 日志级别 (info/debug/warn/error)
- `CORS_ORIGIN` - CORS 允许的源
- `AI_PROVIDER` - AI 提供商 (anthropic/openai)
- `ANTHROPIC_API_KEY` - Anthropic API 密钥（使用 Claude 时必需）
- `ANTHROPIC_MODEL` - Claude 模型名称（默认: claude-opus-4-8）
- `ANTHROPIC_BASE_URL` - Anthropic API 基础 URL（可选）
- `OPENAI_API_KEY` - OpenAI API 密钥（使用 OpenAI 时必需）
- `OPENAI_MODEL` - OpenAI 模型名称（默认: gpt-4）
- `OPENAI_BASE_URL` - OpenAI API 基础 URL（可选）

## 测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test productService.test.ts

# 监听模式
npm run test:watch
```

## 开发指南

### 添加新功能

1. 在 `src/types/index.ts` 定义类型
2. 在 `src/db/schema.ts` 定义数据库表
3. 运行 `npm run db:generate` 生成迁移
4. 在 `src/services/` 实现业务逻辑
5. 在 `src/routes/` 实现 API 端点
6. 编写测试文件
7. 运行测试验证

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 RESTful API 设计原则
- 所有公开 API 必须有对应测试
- 使用 Pino 记录日志
- 错误使用 AppError 类统一处理

## 许可证

MIT

## 作者

AI 运营团队
